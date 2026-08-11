'use client';
/**
 * VisitorCounter — displays total website visits + today's visits.
 *
 * Tracks page views automatically via /api/analytics/track.
 * Shows a small stats badge on the homepage.
 */
import { useState, useEffect } from 'react';

export function VisitorCounter() {
  const [stats, setStats] = useState<any>(null);
  const [tracked, setTracked] = useState(false);

  // Track page view on mount
  useEffect(() => {
    if (tracked) return;
    setTracked(true);

    // Generate or get visitor ID from localStorage
    let visitorId = '';
    if (typeof window !== 'undefined') {
      visitorId = localStorage.getItem('ph_visitor_id') || '';
      if (!visitorId) {
        visitorId = 'visitor_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        localStorage.setItem('ph_visitor_id', visitorId);
      }
    }

    // Track the page view
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pagePath: window.location.pathname,
        referrer: document.referrer || '',
        visitorId,
      }),
    }).catch(() => {});

    // Fetch stats
    fetch('/api/analytics/stats')
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(() => {});
  }, [tracked]);

  if (!stats) return null;

  return (
    <div className="bg-[#173B2D] rounded-lg p-4 text-center">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-3xl font-bold font-serif text-[#C8A24A]">
            {(stats.totalViews || 0).toLocaleString()}
          </div>
          <div className="text-[0.6rem] uppercase tracking-wider text-stone-400 mt-1">
            Total Visits
          </div>
          <div className="text-[0.6rem] text-stone-500 mt-0.5">
            {stats.totalUniqueVisitors || 0} unique visitors
          </div>
        </div>
        <div>
          <div className="text-3xl font-bold font-serif text-[#C8A24A]">
            {stats.todayViews || 0}
          </div>
          <div className="text-[0.6rem] uppercase tracking-wider text-stone-400 mt-1">
            Today's Visits
          </div>
          <div className="text-[0.6rem] text-stone-500 mt-0.5">
            {stats.todayUniqueVisitors || 0} unique today
          </div>
        </div>
      </div>
    </div>
  );
}
