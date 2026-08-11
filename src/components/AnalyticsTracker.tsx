'use client';
/**
 * AnalyticsTracker — invisible component that tracks page views on every page.
 *
 * Place in the root layout to automatically track all page navigations.
 * Runs in the background with minimal performance impact.
 * Does NOT modify any UI — renders nothing.
 */
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Skip tracking for API routes
    if (pathname.startsWith('/api/')) return;

    // Get or create visitor ID
    let visitorId = '';
    if (typeof window !== 'undefined') {
      visitorId = localStorage.getItem('ph_visitor_id') || '';
      if (!visitorId) {
        visitorId = 'visitor_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        localStorage.setItem('ph_visitor_id', visitorId);
      }
    }

    // Track page view (fire and forget)
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'pageview',
        pagePath: pathname,
        referrer: document.referrer || '',
        visitorId,
      }),
    }).catch(() => {});

    // Track session start on first page load
    if (!sessionStorage.getItem('ph_session_tracked')) {
      sessionStorage.setItem('ph_session_tracked', '1');
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'session',
          action: 'start',
          visitorId,
          referrer: document.referrer || '',
        }),
      }).catch(() => {});
    }
  }, [pathname]);

  return null; // renders nothing
}
