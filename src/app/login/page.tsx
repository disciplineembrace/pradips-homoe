'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'password' | 'pin'>('password');
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/auth/session').then(r => r.json()).then(d => {
      if (d.authenticated && d.pinVerified) {
        router.push(d.user.role === 'admin' ? '/admin' : '/dashboard');
      }
    }).catch(() => {});
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const body: any = { loginId };
      if (mode === 'password') {
        body.password = password;
      } else {
        body.pin = pin;
        body.mode = 'pin';
      }
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) {
        setError(d.error || 'Login failed');
        return;
      }
      if (mode === 'password' && d.requiresPin) {
        router.push('/verify-pin');
      } else if (mode === 'pin' && d.redirect) {
        router.push(d.redirect);
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-950 via-stone-900 to-amber-950 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-serif italic text-3xl text-amber-200">Pradip&apos;s Homoe</h1>
          <p className="text-xs uppercase tracking-widest text-stone-400 mt-1">Personal Digital Library</p>
        </div>
        <div className="bg-stone-50 rounded-2xl p-8 shadow-2xl">
          <h2 className="font-serif text-2xl text-emerald-900 mb-1">Sign In</h2>
          <p className="text-xs text-stone-500 mb-6">Authorized users only. All access is logged.</p>

          {/* Mode toggle */}
          <div className="flex gap-1 mb-6 bg-stone-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => { setMode('password'); setError(''); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${mode === 'password' ? 'bg-emerald-900 text-white' : 'text-stone-600 hover:text-stone-900'}`}
            >
              Password + PIN
            </button>
            <button
              type="button"
              onClick={() => { setMode('pin'); setError(''); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${mode === 'pin' ? 'bg-emerald-900 text-white' : 'text-stone-600 hover:text-stone-900'}`}
            >
              PIN Only
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1.5">Email or Login ID</label>
              <input
                type="text"
                value={loginId}
                onChange={e => setLoginId(e.target.value)}
                autoComplete="username"
                required
                autoFocus
                className="w-full px-4 py-3 border-2 border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:border-emerald-700"
                placeholder="your.email@example.com"
              />
            </div>

            {mode === 'password' ? (
              <div>
                <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  className="w-full px-4 py-3 border-2 border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:border-emerald-700"
                  placeholder="••••••••"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1.5">6-Digit PIN</label>
                <input
                  type="password"
                  value={pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputMode="numeric"
                  required
                  pattern="\d{6}"
                  maxLength={6}
                  className="w-full px-4 py-3 border-2 border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:border-emerald-700 font-mono text-2xl text-center tracking-widest"
                  placeholder="------"
                />
              </div>
            )}

            {error && <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded p-2">{error}</div>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-900 hover:bg-emerald-800 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {loading ? 'Signing in...' : mode === 'password' ? 'Continue →' : 'Sign In →'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-stone-200 text-center">
            {mode === 'password' ? (
              <p className="text-xs text-stone-500">After password, you&apos;ll enter your 6-digit PIN.</p>
            ) : (
              <p className="text-xs text-stone-500">Quick login with PIN only. 3 wrong attempts = 15-min lock.</p>
            )}
          </div>
        </div>
        <p className="text-center text-xs text-stone-500 mt-6 font-mono">HTTPS · CSRF Protected · Audit Logged</p>
      </div>
    </div>
  );
}
