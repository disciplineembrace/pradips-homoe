// Sync endpoints — single endpoint that gets/puts the entire user state.
//
//   GET  /api/state        (Bearer token) → full state { notes, favorites, bookmarks, history, readerMarks, settings, readingStats, searchHistory }
//   POST /api/state        (Bearer token, body=full state) → { ok: true }
//
// We use a "full state replace" model for simplicity. The client sends its entire
// state and we overwrite the server's. For notes (which have user-created ids),
// we do a smarter merge (insert or update).

const { query } = require('./_lib/db');
const { getUserFromRequest, sendJSON, sendError } = require('./_lib/auth');

async function getFullState(userId) {
  const [notes, favorites, bookmarks, history, readerMarks, settings, readingStats, searchHistory] = await Promise.all([
    query('SELECT id, ref_id, ref_title, ref_type, category, text, created_at, updated_at FROM notes WHERE user_id = $1 ORDER BY created_at DESC', [userId]),
    query('SELECT ref_id, ref_type FROM favorites WHERE user_id = $1', [userId]),
    query('SELECT ref_id FROM bookmarks WHERE user_id = $1', [userId]),
    query('SELECT ref_id, ref_type, viewed_at FROM history WHERE user_id = $1 ORDER BY viewed_at DESC LIMIT 100', [userId]),
    query('SELECT ref_id, marks, updated_at FROM reader_marks WHERE user_id = $1', [userId]),
    query('SELECT settings FROM settings WHERE user_id = $1', [userId]),
    query('SELECT ref_id, stat_date, seconds FROM reading_stats WHERE user_id = $1', [userId]),
    query('SELECT query, search_type, search_field, searched_at FROM search_history WHERE user_id = $1 ORDER BY searched_at DESC LIMIT 50', [userId]),
  ]);

  return {
    notes: notes.rows.map(r => ({
      id: r.id, refId: r.ref_id, refTitle: r.ref_title, refType: r.ref_type,
      category: r.category, text: r.text,
      date: new Date(r.created_at).toLocaleDateString()
    })),
    favorites: favorites.rows.map(r => ({ refId: r.ref_id, refType: r.ref_type })),
    bookmarks: bookmarks.rows.map(r => r.ref_id),
    history: history.rows.map(r => ({
      id: r.ref_id, type: r.ref_type, ts: new Date(r.viewed_at).getTime()
    })),
    readerMarks: Object.fromEntries(readerMarks.rows.map(r => [r.ref_id, r.marks])),
    settings: settings.rows.length ? settings.rows[0].settings : null,
    readingStats: readingStats.rows.map(r => ({
      refId: r.ref_id, date: r.stat_date, seconds: r.seconds
    })),
    searchHistory: searchHistory.rows.map(r => ({
      q: r.query, type: r.search_type, field: r.search_field, ts: new Date(r.searched_at).getTime()
    })),
  };
}

async function putFullState(userId, state) {
  // Replace all data for this user. We use a transaction.
  const client = await require('./_lib/db').getPool().connect();
  try {
    await client.query('BEGIN');

    // Notes — upsert by id
    if (Array.isArray(state.notes)) {
      for (const n of state.notes) {
        if (!n.id || !n.refId || !n.text) continue;
        await client.query(
          `INSERT INTO notes (id, user_id, ref_id, ref_title, ref_type, category, text, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
           ON CONFLICT (id) DO UPDATE SET
             ref_id = EXCLUDED.ref_id,
             ref_title = EXCLUDED.ref_title,
             ref_type = EXCLUDED.ref_type,
             category = EXCLUDED.category,
             text = EXCLUDED.text,
             updated_at = NOW()`,
          [n.id, userId, n.refId, n.refTitle || '', n.refType || 'remedy', n.category || 'Clinical', n.text]
        );
      }
      // Delete notes that are no longer in the state (client-side delete)
      const clientNoteIds = state.notes.map(n => n.id).filter(Boolean);
      if (clientNoteIds.length > 0) {
        await client.query(
          `DELETE FROM notes WHERE user_id = $1 AND id <> ALL($2::text[])`,
          [userId, clientNoteIds]
        );
      } else {
        await client.query(`DELETE FROM notes WHERE user_id = $1`, [userId]);
      }
    }

    // Favorites — replace all
    await client.query('DELETE FROM favorites WHERE user_id = $1', [userId]);
    if (Array.isArray(state.favorites)) {
      for (const f of state.favorites) {
        if (!f.refId) continue;
        await client.query(
          `INSERT INTO favorites (user_id, ref_id, ref_type) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
          [userId, f.refId, f.refType || 'remedy']
        );
      }
    }

    // Bookmarks — replace all
    await client.query('DELETE FROM bookmarks WHERE user_id = $1', [userId]);
    if (Array.isArray(state.bookmarks)) {
      for (const refId of state.bookmarks) {
        if (!refId) continue;
        await client.query(
          `INSERT INTO bookmarks (user_id, ref_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [userId, refId]
        );
      }
    }

    // History — replace all (keep latest 100)
    await client.query('DELETE FROM history WHERE user_id = $1', [userId]);
    if (Array.isArray(state.history)) {
      for (const h of state.history.slice(0, 100)) {
        if (!h.id) continue;
        const viewedAt = h.ts ? new Date(h.ts) : new Date();
        await client.query(
          `INSERT INTO history (user_id, ref_id, ref_type, viewed_at) VALUES ($1, $2, $3, $4)`,
          [userId, h.id, h.type || 'remedy', viewedAt]
        );
      }
    }

    // Reader marks — replace all (as JSON blobs)
    await client.query('DELETE FROM reader_marks WHERE user_id = $1', [userId]);
    if (state.readerMarks && typeof state.readerMarks === 'object') {
      for (const [refId, marks] of Object.entries(state.readerMarks)) {
        if (!refId) continue;
        await client.query(
          `INSERT INTO reader_marks (user_id, ref_id, marks, updated_at) VALUES ($1, $2, $3::jsonb, NOW())
           ON CONFLICT (user_id, ref_id) DO UPDATE SET marks = EXCLUDED.marks, updated_at = NOW()`,
          [userId, refId, JSON.stringify(marks || [])]
        );
      }
    }

    // Settings — upsert
    if (state.settings && typeof state.settings === 'object') {
      await client.query(
        `INSERT INTO settings (user_id, settings, updated_at) VALUES ($1, $2::jsonb, NOW())
         ON CONFLICT (user_id) DO UPDATE SET settings = EXCLUDED.settings, updated_at = NOW()`,
        [userId, JSON.stringify(state.settings)]
      );
    }

    // Reading stats — upsert (sum if exists)
    if (Array.isArray(state.readingStats)) {
      for (const s of state.readingStats) {
        if (!s.refId || !s.date) continue;
        await client.query(
          `INSERT INTO reading_stats (user_id, ref_id, stat_date, seconds) VALUES ($1, $2, $3, $4)
           ON CONFLICT (user_id, ref_id, stat_date) DO UPDATE SET seconds = EXCLUDED.seconds`,
          [userId, s.refId, s.date, s.seconds || 0]
        );
      }
    }

    // Search history — replace all (keep latest 50)
    await client.query('DELETE FROM search_history WHERE user_id = $1', [userId]);
    if (Array.isArray(state.searchHistory)) {
      for (const s of state.searchHistory.slice(0, 50)) {
        if (!s.q) continue;
        const searchedAt = s.ts ? new Date(s.ts) : new Date();
        await client.query(
          `INSERT INTO search_history (user_id, query, search_type, search_field, searched_at) VALUES ($1, $2, $3, $4, $5)`,
          [userId, s.q, s.type || 'any', s.field || 'all', searchedAt]
        );
      }
    }

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const user = await getUserFromRequest(req);
  if (!user) return sendError(res, 401, 'Not authenticated');

  try {
    if (req.method === 'GET') {
      const state = await getFullState(user.id);
      return sendJSON(res, 200, { ok: true, state });
    }
    if (req.method === 'POST') {
      const body = req.body || {};
      if (!body || typeof body !== 'object') {
        return sendError(res, 400, 'Request body must be a state object');
      }
      await putFullState(user.id, body);
      return sendJSON(res, 200, { ok: true, syncedAt: new Date().toISOString() });
    }
    return sendError(res, 405, 'Method not allowed');
  } catch (e) {
    console.error('State error:', e);
    return sendError(res, 500, 'Server error: ' + e.message);
  }
};
