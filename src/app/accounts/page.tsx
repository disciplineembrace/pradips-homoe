'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function AccountsPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/session').then(r => r.json()).then(d => {
      setSession(d);
      if (!d.authenticated) {
        router.push('/login');
        return;
      }
      // Load own profile via admin endpoint? No — admin-only.
      // We use the session data + a new /api/me endpoint
      fetch('/api/me').then(r => r.json()).then(p => {
        if (p.error) router.push('/login');
        else setProfile(p);
        setLoading(false);
      });
    });
  }, [router]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  if (!session || !profile) return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Navbar />
      <div className="flex-1 flex items-center justify-center text-stone-500">{loading ? 'Loading...' : 'Redirecting...'}</div>
      <Footer />
    </div>
  );

  const isLocked = profile.pinLockedUntil && new Date(profile.pinLockedUntil) > new Date();
  const isExpired = profile.accessExpiresAt && new Date(profile.accessExpiresAt) < new Date();

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-8 w-full">
        <h1 className="font-serif text-3xl text-emerald-900 mb-2">My Account</h1>
        <p className="text-stone-600 mb-6">Your account details and login activity.</p>

        {/* Account summary card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="font-serif text-2xl text-emerald-900">{profile.name}</h2>
              <p className="text-sm text-stone-500">{profile.email}</p>
            </div>
            <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
              profile.role === 'admin' ? 'bg-amber-100 text-amber-800' :
              profile.role === 'staff' ? 'bg-blue-100 text-blue-800' :
              'bg-stone-200 text-stone-700'
            }`}>{profile.role}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-stone-50 rounded p-3">
              <div className="text-xs text-stone-500 uppercase tracking-wider">Status</div>
              <div className={`font-semibold ${profile.status === 'active' ? 'text-emerald-700' : 'text-red-700'}`}>
                {profile.status === 'active' ? '● Active' : '● Disabled'}
              </div>
            </div>
            <div className="bg-stone-50 rounded p-3">
              <div className="text-xs text-stone-500 uppercase tracking-wider">PIN Status</div>
              {isLocked ? (
                <div className="font-semibold text-red-700">🔒 Locked ({profile.pinFailCount}/3 fails)</div>
              ) : profile.pinFailCount > 0 ? (
                <div className="font-semibold text-amber-700">{profile.pinFailCount}/3 fails</div>
              ) : (
                <div className="font-semibold text-emerald-700">✓ OK</div>
              )}
            </div>
            <div className="bg-stone-50 rounded p-3">
              <div className="text-xs text-stone-500 uppercase tracking-wider">Last Login</div>
              <div className="text-stone-700">{profile.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleString() : 'Never'}</div>
            </div>
            <div className="bg-stone-50 rounded p-3">
              <div className="text-xs text-stone-500 uppercase tracking-wider">Last PIN Used</div>
              <div className="text-stone-700">{profile.lastPinAt ? new Date(profile.lastPinAt).toLocaleString() : 'Never'}</div>
            </div>
            <div className="bg-stone-50 rounded p-3">
              <div className="text-xs text-stone-500 uppercase tracking-wider">Account Created</div>
              <div className="text-stone-700">{new Date(profile.createdAt).toLocaleString()}</div>
            </div>
            <div className="bg-stone-50 rounded p-3">
              <div className="text-xs text-stone-500 uppercase tracking-wider">Access Expires</div>
              {profile.accessExpiresAt ? (
                <div className={`font-semibold ${isExpired ? 'text-red-700' : 'text-stone-700'}`}>
                  {new Date(profile.accessExpiresAt).toLocaleDateString()} {isExpired && '(expired)'}
                </div>
              ) : (
                <div className="text-stone-500">No expiry</div>
              )}
            </div>
          </div>
        </div>

        {/* Role-specific info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="font-serif text-lg text-emerald-900 mb-3">Your Access Level</h3>
          {profile.role === 'admin' && (
            <div className="text-sm text-stone-700 space-y-2">
              <p className="font-semibold text-amber-700">👑 Administrator Access</p>
              <ul className="list-disc list-inside space-y-1 text-stone-600 ml-2">
                <li>Full access to all library data (remedies, rubrics, therapeutics, predictive)</li>
                <li>Create, edit, disable, delete user accounts</li>
                <li>Reset user passwords and PINs</li>
                <li>Unlock locked PIN attempts</li>
                <li>View audit logs (login, PIN, admin actions)</li>
                <li>Set account expiry dates</li>
              </ul>
              <a href="/admin" className="inline-block mt-3 bg-amber-700 hover:bg-amber-600 text-white text-sm px-4 py-2 rounded font-semibold">Go to Admin Panel →</a>
            </div>
          )}
          {profile.role === 'staff' && (
            <div className="text-sm text-stone-700 space-y-2">
              <p className="font-semibold text-blue-700">🔧 Staff Access</p>
              <ul className="list-disc list-inside space-y-1 text-stone-600 ml-2">
                <li>Full access to library data (remedies, rubrics, therapeutics, predictive)</li>
                <li>Browse, search, and read all content</li>
                <li>Cannot manage users or access admin panel</li>
                <li>Cannot change own PIN (admin only)</li>
              </ul>
            </div>
          )}
          {profile.role === 'user' && (
            <div className="text-sm text-stone-700 space-y-2">
              <p className="font-semibold text-stone-700">👤 User Access</p>
              <ul className="list-disc list-inside space-y-1 text-stone-600 ml-2">
                <li>Access to library data (remedies, rubrics, therapeutics, predictive)</li>
                <li>Browse, search, and read all content</li>
                <li>Cannot manage users or access admin panel</li>
                <li>Cannot change own PIN (admin only)</li>
              </ul>
            </div>
          )}
        </div>

        {/* Account actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-serif text-lg text-emerald-900 mb-3">Account Actions</h3>
          <div className="flex flex-wrap gap-2">
            <a href="/dashboard" className="bg-emerald-900 hover:bg-emerald-800 text-white text-sm px-4 py-2 rounded">📊 Go to Dashboard</a>
            <a href="/data" className="bg-emerald-900 hover:bg-emerald-800 text-white text-sm px-4 py-2 rounded">📚 Browse Data</a>
            <button onClick={logout} className="bg-red-800 hover:bg-red-700 text-white text-sm px-4 py-2 rounded">🚪 Logout</button>
          </div>
          <p className="text-xs text-stone-500 mt-4">
            Need to change your PIN or password? Contact the administrator — users cannot change their own credentials.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
