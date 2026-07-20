'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

/**
 * Admin Analytics Dashboard — PRIVATE (admin only)
 *
 * Shows comprehensive website analytics:
 *   - Visitor stats (total, today, weekly, monthly, new vs returning)
 *   - Page analytics (most/least visited)
 *   - Device/OS/browser breakdown
 *   - Traffic sources
 *   - Search analytics
 *   - Reading analytics
 *   - Real-time active users
 *   - Daily trends
 *   - API performance
 *
 * Auto-refreshes every 30 seconds.
 */
export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/auth/session').then(r => r.json()).then(d => {
      if (!d.authenticated) { router.push('/login'); return; }
      if (d.role !== 'admin') { router.push('/dashboard'); return; }
      setSession(d);
    });
  }, [router]);

  const loadData = () => {
    fetch('/api/analytics/admin')
      .then(r => {
        if (!r.ok) throw new Error('Failed to load analytics');
        return r.json();
      })
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  };

  useEffect(() => {
    if (session) {
      loadData();
      // Auto-refresh every 30 seconds
      const interval = setInterval(loadData, 30000);
      return () => clearInterval(interval);
    }
  }, [session]);

  function exportCSV() {
    if (!data) return;
    const rows = [
      ['Metric', 'Value'],
      ['Total Views', data.visitors.totalViews],
      ['Unique Visitors', data.visitors.uniqueVisitors],
      ['Today Views', data.visitors.todayViews],
      ['Today Unique', data.visitors.todayUnique],
      ['Weekly Views', data.visitors.weeklyViews],
      ['Monthly Views', data.visitors.monthlyViews],
      ['New Visitors', data.visitors.newVisitors],
      ['Returning Visitors', data.visitors.returningVisitors],
      ['Real-time Active', data.realTime.activeUsers],
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="inline-block w-10 h-10 border-4 border-[#E8DCC3] border-t-[#173B2D] rounded-full animate-spin"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block w-10 h-10 border-4 border-[#E8DCC3] border-t-[#173B2D] rounded-full animate-spin mb-4"></div>
            <p className="text-sm text-[#7C8F6E]">Loading Analytics...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-[#6E2A3A]">Error: {error}</p>
        </div>
        <Footer />
      </div>
    );
  }

  const v = data.visitors || {};
  const rt = data.realTime || {};
  const maxDailyViews = Math.max(...(data.dailyTrends || []).map((d: any) => d.views), 1);

  return (
    <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-serif text-3xl text-[#173B2D]">📊 Analytics Dashboard</h1>
            <p className="text-xs uppercase tracking-widest text-[#7C8F6E] mt-1">
              Private admin analytics · Auto-refreshes every 30s
            </p>
            <div className="w-16 h-0.5 bg-[#C8A24A] mt-3"></div>
          </div>
          <button onClick={exportCSV} className="bg-[#173B2D] text-[#F5EFE0] px-4 py-2 rounded text-sm font-semibold hover:bg-[#2a5443]">
            📥 Export CSV
          </button>
        </div>

        {/* Real-time banner */}
        <div className="bg-[#173B2D] rounded-lg p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-[#C8A24A] font-semibold">LIVE</span>
            <span className="text-sm text-stone-300">{rt.activeUsers || 0} active user{rt.activeUsers !== 1 ? 's' : ''} right now</span>
            <span className="text-xs text-stone-500">· {rt.liveViews || 0} views in last 5 min</span>
          </div>
          <span className="text-xs text-stone-500">Updated: {new Date(data.generatedAt).toLocaleTimeString()}</span>
        </div>

        {/* Visitor Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
          {[
            { num: v.totalViews || 0, label: 'Total Views', color: 'text-[#173B2D]' },
            { num: v.uniqueVisitors || 0, label: 'Unique Visitors', color: 'text-[#C8A24A]' },
            { num: v.todayViews || 0, label: 'Today', color: 'text-green-700' },
            { num: v.todayUnique || 0, label: 'Today Unique', color: 'text-green-700' },
            { num: v.weeklyViews || 0, label: 'This Week', color: 'text-blue-700' },
            { num: v.monthlyViews || 0, label: 'This Month', color: 'text-purple-700' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-4 text-center">
              <div className={`text-2xl font-bold font-serif ${s.color}`}>{s.num.toLocaleString()}</div>
              <div className="text-[0.6rem] uppercase tracking-wider text-[#7C8F6E] mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* New vs Returning + Yesterday */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-xs uppercase tracking-wider text-[#7C8F6E] mb-2">New vs Returning</h3>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-700 font-serif">{v.newVisitors || 0}</div>
                <div className="text-[0.6rem] text-[#7C8F6E]">New</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-700 font-serif">{v.returningVisitors || 0}</div>
                <div className="text-[0.6rem] text-[#7C8F6E]">Returning</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <h3 className="text-xs uppercase tracking-wider text-[#7C8F6E] mb-2">Yesterday</h3>
            <div className="text-2xl font-bold text-[#173B2D] font-serif">{(v.yesterdayViews || 0).toLocaleString()}</div>
            <div className="text-[0.6rem] text-[#7C8F6E]">views</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <h3 className="text-xs uppercase tracking-wider text-[#7C8F6E] mb-2">This Year</h3>
            <div className="text-2xl font-bold text-[#173B2D] font-serif">{(v.yearlyViews || 0).toLocaleString()}</div>
            <div className="text-[0.6rem] text-[#7C8F6E]">views</div>
          </div>
        </div>

        {/* Daily Trends Chart */}
        <div className="bg-white rounded-lg shadow p-5 mb-6">
          <h3 className="font-serif text-lg text-[#173B2D] mb-4">📈 Daily Visitors (Last 30 Days)</h3>
          {(data.dailyTrends || []).length > 0 ? (
            <div className="flex items-end gap-1 h-40 overflow-x-auto">
              {data.dailyTrends.map((d: any, i: number) => {
                const height = Math.max(2, (d.views / maxDailyViews) * 100);
                return (
                  <div key={i} className="flex-shrink-0 flex flex-col items-center" style={{ width: '20px' }}>
                    <div className="text-[0.5rem] text-[#7C8F6E] mb-1">{d.uniqueVisitors}</div>
                    <div
                      className="w-full bg-[#C8A24A] rounded-t hover:bg-[#173B2D] transition-colors"
                      style={{ height: `${height}%` }}
                      title={`${d.date}: ${d.views} views, ${d.uniqueVisitors} unique`}
                    ></div>
                    <div className="text-[0.5rem] text-[#7C8F6E] mt-1 rotate-45">{d.date.slice(5)}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-[#7C8F6E] italic">No data yet</p>
          )}
        </div>

        {/* Two columns: Top Pages + Traffic Sources */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Top Pages */}
          <div className="bg-white rounded-lg shadow p-5">
            <h3 className="font-serif text-lg text-[#173B2D] mb-3">📄 Most Visited Pages</h3>
            {(data.pages?.topPages || []).length > 0 ? (
              <div className="space-y-2">
                {data.pages.topPages.map((p: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-[#173B2D] flex-1 truncate">{p.path}</span>
                    <span className="text-[#C8A24A] font-semibold ml-2">{p.views}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#7C8F6E] italic">No page data yet</p>
            )}
          </div>

          {/* Traffic Sources */}
          <div className="bg-white rounded-lg shadow p-5">
            <h3 className="font-serif text-lg text-[#173B2D] mb-3">🔗 Traffic Sources</h3>
            {(data.trafficSources || []).length > 0 ? (
              <div className="space-y-2">
                {data.trafficSources.map((s: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-[#173B2D]">{s.source}</span>
                    <span className="text-[#C8A24A] font-semibold">{s.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#7C8F6E] italic">No source data yet</p>
            )}
          </div>
        </div>

        {/* Device + OS + Browser */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-5">
            <h3 className="font-serif text-base text-[#173B2D] mb-3">📱 Devices</h3>
            {(data.devices?.distribution || []).length > 0 ? (
              <div className="space-y-1">
                {data.devices.distribution.map((d: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-[#173B2D]">{d.type}</span>
                    <span className="text-[#7C8F6E]">{d.count}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-xs text-[#7C8F6E] italic">No data</p>}
          </div>
          <div className="bg-white rounded-lg shadow p-5">
            <h3 className="font-serif text-base text-[#173B2D] mb-3">💻 OS</h3>
            {(data.devices?.os || []).length > 0 ? (
              <div className="space-y-1">
                {data.devices.os.map((d: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-[#173B2D]">{d.os}</span>
                    <span className="text-[#7C8F6E]">{d.count}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-xs text-[#7C8F6E] italic">No data</p>}
          </div>
          <div className="bg-white rounded-lg shadow p-5">
            <h3 className="font-serif text-base text-[#173B2D] mb-3">🌐 Browsers</h3>
            {(data.devices?.browsers || []).length > 0 ? (
              <div className="space-y-1">
                {data.devices.browsers.map((d: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-[#173B2D]">{d.browser}</span>
                    <span className="text-[#7C8F6E]">{d.count}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-xs text-[#7C8F6E] italic">No data</p>}
          </div>
        </div>

        {/* Search Analytics + Reading Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-5">
            <h3 className="font-serif text-lg text-[#173B2D] mb-3">🔍 Popular Searches</h3>
            {(data.searches?.popular || []).length > 0 ? (
              <div className="space-y-2">
                {data.searches.popular.map((s: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-[#173B2D] flex-1 truncate">"{s.query}"</span>
                    <span className="text-[#C8A24A] font-semibold ml-2">{s.count}x</span>
                    {s.failed > 0 && <span className="text-[#6E2A3A] text-xs ml-2">({s.failed} failed)</span>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#7C8F6E] italic">No searches yet</p>
            )}
          </div>
          <div className="bg-white rounded-lg shadow p-5">
            <h3 className="font-serif text-lg text-[#173B2D] mb-3">📖 Most Read</h3>
            {(data.reading || []).length > 0 ? (
              <div className="space-y-2">
                {data.reading.map((r: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-[#173B2D] flex-1 truncate">{r.title}</span>
                    <span className="text-[#C8A24A] font-semibold ml-2">{r.views} reads</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#7C8F6E] italic">No reading data yet</p>
            )}
          </div>
        </div>

        {/* Live Pages */}
        <div className="bg-white rounded-lg shadow p-5 mb-6">
          <h3 className="font-serif text-lg text-[#173B2D] mb-3">🔴 Pages Being Viewed Now</h3>
          {(rt.livePages || []).length > 0 ? (
            <div className="space-y-2">
              {rt.livePages.map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-[#173B2D]">{p.path}</span>
                  <span className="text-green-700 font-semibold">{p.count} viewing</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#7C8F6E] italic">No active page views right now</p>
          )}
        </div>

        {/* API Performance */}
        {(data.apiPerformance || []).length > 0 && (
          <div className="bg-white rounded-lg shadow p-5 mb-6">
            <h3 className="font-serif text-lg text-[#173B2D] mb-3">⚡ API Performance (Last 7 Days)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E8DCC3]">
                    <th className="text-left py-2 text-[#7C8F6E] text-xs uppercase">Endpoint</th>
                    <th className="text-right py-2 text-[#7C8F6E] text-xs uppercase">Requests</th>
                    <th className="text-right py-2 text-[#7C8F6E] text-xs uppercase">Avg Time</th>
                    <th className="text-right py-2 text-[#7C8F6E] text-xs uppercase">Errors</th>
                  </tr>
                </thead>
                <tbody>
                  {data.apiPerformance.map((api: any, i: number) => (
                    <tr key={i} className="border-b border-[#E8DCC3]/50">
                      <td className="py-2 text-[#173B2D]">{api.endpoint}</td>
                      <td className="py-2 text-right text-[#7C8F6E]">{api.requestCount}</td>
                      <td className="py-2 text-right text-[#7C8F6E]">{api.avgResponseTime}ms</td>
                      <td className="py-2 text-right">
                        {api.errorCount > 0 ? <span className="text-[#6E2A3A]">{api.errorCount}</span> : <span className="text-green-700">0</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
