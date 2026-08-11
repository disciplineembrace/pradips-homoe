'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useReaderFeatures } from '@/hooks/use-reader-features';

/**
 * Activity page — houses the user-feature stats moved from the Home Dashboard.
 *
 * Moved here:
 *   - Favorites (⭐) — full list with remove option
 *   - Notes (📝) — full list with edit/delete
 *   - Read Time (⏱️) — reading time stat
 *   - Streak (🔥) — day streak stat
 *
 * All functionality from the dashboard's useReaderFeatures hook remains intact.
 * Styling matches the dashboard (forest green #173B2D, gold #C8A24A, ivory #F5EFE0).
 */
export default function ActivityPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const rf = useReaderFeatures();
  const [activeTab, setActiveTab] = useState<'favorites' | 'notes'>('favorites');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(d => {
        if (!d.authenticated) { router.push('/login'); return; }
        setSession(d);
      })
      .catch(() => router.push('/login'));
  }, [router]);

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block w-10 h-10 border-4 border-[#E8DCC3] border-t-[#173B2D] rounded-full animate-spin mb-4"></div>
            <p className="text-sm text-[#7C8F6E]">Loading activity...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  // The 4 stat cards moved from the Home Dashboard — identical style
  const statCards = [
    { num: rf.favorites.length, label: 'Favorites', icon: '⭐' },
    { num: rf.notes.length, label: 'Notes', icon: '📝' },
    { num: '0m', label: 'Read Time', icon: '⏱️' },
    { num: '0', label: 'Streak', icon: '🔥' },
  ];

  // Group favorites by type for display
  const favRemedies = rf.favorites.filter(f => f.type === 'remedy');
  const favRubrics = rf.favorites.filter(f => f.type === 'rubric');
  const favOther = rf.favorites.filter(f => f.type !== 'remedy' && f.type !== 'rubric');

  function startEdit(noteId: string, currentText: string) {
    setEditingNoteId(noteId);
    setEditText(currentText);
  }

  function saveEdit() {
    if (editingNoteId) {
      rf.updateNote(editingNoteId, editText);
      setEditingNoteId(null);
      setEditText('');
    }
  }

  function cancelEdit() {
    setEditingNoteId(null);
    setEditText('');
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto px-4 py-6 w-full">
        {/* Page header */}
        <div className="mb-4">
          <div className="flex items-baseline justify-between">
            <h1 className="font-serif text-3xl text-[#173B2D]">My Activity</h1>
            <Link href="/dashboard" className="text-xs text-[#7C8F6E] hover:text-[#173B2D]">← Back to Dashboard</Link>
          </div>
          <p className="text-xs uppercase tracking-widest text-[#7C8F6E] mt-1">{today}</p>
          <div className="w-16 h-0.5 bg-[#C8A24A] mt-3"></div>
        </div>

        {/* Stats cards — same 2×2 / single-row grid as dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {statCards.map((s, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-lg mb-1">{s.icon}</div>
              <div className="text-xl font-bold text-[#173B2D] font-serif">{s.num}</div>
              <div className="text-[0.6rem] uppercase tracking-wider text-[#7C8F6E] mt-1 font-semibold">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs: Favorites / Notes */}
        <div className="flex gap-1 mb-4 border-b border-[#E8DCC3]">
          <button
            onClick={() => setActiveTab('favorites')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${activeTab === 'favorites' ? 'border-[#173B2D] text-[#173B2D]' : 'border-transparent text-[#7C8F6E] hover:text-[#173B2D]'}`}
          >
            ⭐ Favorites ({rf.favorites.length})
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${activeTab === 'notes' ? 'border-[#173B2D] text-[#173B2D]' : 'border-transparent text-[#7C8F6E] hover:text-[#173B2D]'}`}
          >
            📝 Notes ({rf.notes.length})
          </button>
        </div>

        {/* Favorites tab */}
        {activeTab === 'favorites' && (
          <div className="space-y-4">
            {rf.favorites.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className="text-4xl mb-3 opacity-30">⭐</div>
                <p className="text-sm text-[#7C8F6E] italic">No favorites yet.</p>
                <p className="text-xs text-[#7C8F6E] mt-2">
                  Browse the{' '}
                  <Link href="/materia-medica" className="text-[#C8A24A] hover:underline">Materia Medica</Link>
                  {' '}or{' '}
                  <Link href="/repertory" className="text-[#C8A24A] hover:underline">Repertory</Link>
                  {' '}and tap the ★ icon to add favorites.
                </p>
              </div>
            ) : (
              <>
                {favRemedies.length > 0 && (
                  <div className="bg-white rounded-lg shadow p-5">
                    <h3 className="text-xs uppercase tracking-widest text-[#7C8F6E] mb-3 font-semibold">Favorite Remedies ({favRemedies.length})</h3>
                    <div className="space-y-2">
                      {favRemedies.map((f, i) => (
                        <div key={i} className="flex items-center justify-between group">
                          <Link href={`/remedy/${f.id}`} className="text-sm text-[#173B2D] hover:text-[#C8A24A] flex-1 truncate">
                            {f.title}
                          </Link>
                          <button
                            onClick={() => rf.removeFavorite(f.id)}
                            className="text-xs text-[#7C8F6E] hover:text-[#6E2A3A] opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {favRubrics.length > 0 && (
                  <div className="bg-white rounded-lg shadow p-5">
                    <h3 className="text-xs uppercase tracking-widest text-[#7C8F6E] mb-3 font-semibold">Favorite Rubrics ({favRubrics.length})</h3>
                    <div className="space-y-2">
                      {favRubrics.map((f, i) => (
                        <div key={i} className="flex items-center justify-between group">
                          <Link href="/repertory" className="text-sm text-[#173B2D] hover:text-[#C8A24A] flex-1 truncate">
                            {f.title}
                          </Link>
                          <button
                            onClick={() => rf.removeFavorite(f.id)}
                            className="text-xs text-[#7C8F6E] hover:text-[#6E2A3A] opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {favOther.length > 0 && (
                  <div className="bg-white rounded-lg shadow p-5">
                    <h3 className="text-xs uppercase tracking-widest text-[#7C8F6E] mb-3 font-semibold">Other Favorites ({favOther.length})</h3>
                    <div className="space-y-2">
                      {favOther.map((f, i) => (
                        <div key={i} className="flex items-center justify-between group">
                          <span className="text-sm text-[#173B2D] flex-1 truncate">
                            {f.title}
                            <span className="text-xs text-[#7C8F6E] ml-2">({f.type})</span>
                          </span>
                          <button
                            onClick={() => rf.removeFavorite(f.id)}
                            className="text-xs text-[#7C8F6E] hover:text-[#6E2A3A] opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Notes tab */}
        {activeTab === 'notes' && (
          <div className="space-y-3">
            {rf.notes.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className="text-4xl mb-3 opacity-30">📝</div>
                <p className="text-sm text-[#7C8F6E] italic">No notes yet.</p>
                <p className="text-xs text-[#7C8F6E] mt-2">
                  Open any remedy, rubric, or book chapter and use the note feature to jot down observations.
                </p>
              </div>
            ) : (
              rf.notes.map((n) => (
                <div key={n.id} className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[0.6rem] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-[#F5EFE0] text-[#173B2D]">
                        {n.type}
                      </span>
                      <span className="text-xs text-[#7C8F6E]">
                        {new Date(n.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {editingNoteId === n.id ? (
                        <>
                          <button onClick={saveEdit} className="text-xs text-[#173B2D] hover:underline">Save</button>
                          <button onClick={cancelEdit} className="text-xs text-[#7C8F6E] hover:underline">Cancel</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(n.id, n.text)} className="text-xs text-[#7C8F6E] hover:text-[#173B2D]">Edit</button>
                          <button onClick={() => rf.removeNote(n.id)} className="text-xs text-[#7C8F6E] hover:text-[#6E2A3A]">Delete</button>
                        </>
                      )}
                    </div>
                  </div>
                  {editingNoteId === n.id ? (
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full px-3 py-2 border border-[#E8DCC3] rounded text-sm text-[#173B2D] focus:outline-none focus:border-[#173B2D] resize-none"
                      rows={3}
                      autoFocus
                    />
                  ) : (
                    <p className="text-sm text-[#173B2D] whitespace-pre-wrap">{n.text}</p>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Reading stats footer (moved from dashboard's bottom section for completeness) */}
        <div className="mt-8 bg-white rounded-lg shadow p-5">
          <h3 className="text-xs uppercase tracking-widest text-[#7C8F6E] mb-4 font-semibold">Reading Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#173B2D] font-serif">0</div>
              <div className="text-xs text-[#7C8F6E] uppercase">Reading Time (min)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#173B2D] font-serif">0</div>
              <div className="text-xs text-[#7C8F6E] uppercase">Day Streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#173B2D] font-serif">{rf.history.length}</div>
              <div className="text-xs text-[#7C8F6E] uppercase">Items Viewed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#173B2D] font-serif">{rf.favorites.length}</div>
              <div className="text-xs text-[#7C8F6E] uppercase">Favorites</div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
