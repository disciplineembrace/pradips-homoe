// Auth endpoints:
//   POST /api/auth/register  { passcode, name? } → { token, userId, name }
//   POST /api/auth/login     { passcode } → { token, userId, name }  (logs into existing user)
//   GET  /api/auth/me        (Bearer token) → { userId, name, createdAt }

const { query } = require('./_lib/db');
const { hashPasscode, generateUserId, generateToken, getUserFromRequest, sendJSON, sendError } = require('./_lib/auth');

module.exports = async (req, res) => {
  // CORS — allow the static site to call us
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const action = req.query.action || '';
  const path = (req.url || '').split('?')[0].split('/').pop();

  try {
    // POST /api/auth/register
    if (req.method === 'POST' && (action === 'register' || path === 'register')) {
      const { passcode, name } = req.body || {};
      if (!passcode || passcode.length < 4) {
        return sendError(res, 400, 'Passcode must be at least 4 characters');
      }
      // Check if any user already exists with this passcode
      const passcodeHash = hashPasscode(passcode);
      const existing = await query('SELECT id, name FROM users WHERE passcode_hash = $1', [passcodeHash]);
      if (existing.rows.length > 0) {
        const user = existing.rows[0];
        return sendJSON(res, 200, { token: generateToken(user.id), userId: user.id, name: user.name });
      }
      // Create new user
      const userId = generateUserId();
      await query('INSERT INTO users (id, passcode_hash, name) VALUES ($1, $2, $3)',
                  [userId, passcodeHash, name || 'Pradip']);
      return sendJSON(res, 201, { token: generateToken(userId), userId, name: name || 'Pradip' });
    }

    // POST /api/auth/login
    if (req.method === 'POST' && (action === 'login' || path === 'login')) {
      const { passcode } = req.body || {};
      if (!passcode) return sendError(res, 400, 'Passcode required');
      const passcodeHash = hashPasscode(passcode);
      const result = await query('SELECT id, name FROM users WHERE passcode_hash = $1', [passcodeHash]);
      if (result.rows.length === 0) {
        return sendError(res, 401, 'Invalid passcode');
      }
      const user = result.rows[0];
      await query('UPDATE users SET last_seen = NOW() WHERE id = $1', [user.id]);
      return sendJSON(res, 200, { token: generateToken(user.id), userId: user.id, name: user.name });
    }

    // GET /api/auth/me
    if (req.method === 'GET' && (action === 'me' || path === 'me')) {
      const user = await getUserFromRequest(req);
      if (!user) return sendError(res, 401, 'Not authenticated');
      return sendJSON(res, 200, { userId: user.id, name: user.name });
    }

    return sendError(res, 404, 'Unknown auth action. Use ?action=register|login|me');
  } catch (e) {
    console.error('Auth error:', e);
    return sendError(res, 500, 'Server error: ' + e.message);
  }
};
