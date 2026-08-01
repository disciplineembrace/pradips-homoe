'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [lockedMinutes, setLockedMinutes] = useState<number | null>(null);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    fetch('/api/auth/session').then(r => r.json()).then(d => {
      if (d.authenticated) {
        if (d.role === 'admin') router.push('/admin');
        else router.push('/dashboard');
      }
    }).catch(() => {});
  }, [router]);

  function handlePinChange(i: number, v: string) {
    if (lockedMinutes !== null) return;
    const digit = v.replace(/\D/g, '').slice(-1);
    const next = [...pin];
    next[i] = digit;
    setPin(next);
    setError('');
    if (digit && i < 5) inputs.current[i + 1]?.focus();
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !pin[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) {
      setPin(text.split(''));
      inputs.current[5]?.focus();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fullPin = pin.join('');
    if (!email || !email.includes('@')) {
      setError('Valid email required');
      return;
    }
    if (fullPin.length !== 6) {
      setError('PIN must be 6 digits');
      return;
    }
    setLoading(true);
    setError('');
    setAttemptsRemaining(null);
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, pin: fullPin }),
      });
      const d = await r.json();
      if (!r.ok) {
        setPin(['', '', '', '', '', '']);
        inputs.current[0]?.focus();
        if (d.locked) {
          setLockedMinutes(d.minutesRemaining || 15);
          setError(d.error);
        } else if (d.attemptsRemaining !== undefined) {
          setAttemptsRemaining(d.attemptsRemaining);
          setError(d.error);
        } else {
          setError(d.error || 'Login failed');
        }
        return;
      }
      router.push(d.redirect || '/dashboard');
    } catch {
      setError('Network error');
      setPin(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-[#E8DCC3] border-t-4 border-t-amber-700">
            <div className="text-center mb-8">
              <img src="/logo-v2-120.png" alt="Pradip's Homeo" width="64" height="64" className="h-16 w-16 mx-auto mb-3 rounded-full" />
              <h1 className="font-serif italic text-3xl text-[#173B2D] mb-1">Pradip&apos;s Homeo</h1>
              <p className="text-xs uppercase tracking-widest text-[#7C8F6E] mt-2">Sign In</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-[#5a6b50] uppercase tracking-wider mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  autoFocus
                  className="w-full px-4 py-3 border-2 border-[#E8DCC3] rounded-lg text-stone-900 focus:outline-none focus:border-[#173B2D]"
                  placeholder="your.email@example.com"
                />
              </div>

              {/* 6-digit PIN */}
              <div>
                <label className="block text-xs font-semibold text-[#5a6b50] uppercase tracking-wider mb-1.5">6-digit PIN</label>
                <div className="flex justify-center gap-2" onPaste={handlePaste}>
                  {pin.map((d, i) => (
                    <input
                      key={i}
                      ref={el => { inputs.current[i] = el; }}
                      type="password"
                      inputMode="numeric"
                      maxLength={1}
                      value={d}
                      onChange={e => handlePinChange(i, e.target.value)}
                      onKeyDown={e => handleKeyDown(i, e)}
                      disabled={loading || lockedMinutes !== null}
                      className="w-12 h-14 text-center text-2xl font-mono border-2 border-[#E8DCC3] rounded-lg text-stone-900 focus:outline-none focus:border-[#173B2D] disabled:opacity-50"
                    />
                  ))}
                </div>
              </div>

              {error && (
                <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded p-3 text-center">
                  {error}
                  {attemptsRemaining !== null && attemptsRemaining > 0 && (
                    <div className="text-xs mt-1 text-red-500">{attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining before 15-min lockout</div>
                  )}
                </div>
              )}

              {lockedMinutes !== null && (
                <div className="text-amber-700 text-sm bg-amber-50 border border-amber-200 rounded p-3 text-center">
                  <div className="font-semibold">PIN locked</div>
                  <div className="text-xs mt-1">Try again in {lockedMinutes} minute{lockedMinutes !== 1 ? 's' : ''}, or contact admin to unlock.</div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || lockedMinutes !== null || !email || pin.join('').length !== 6}
                className="w-full bg-[#173B2D] hover:bg-[#2a5443] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
              >
                {loading ? 'Signing in...' : 'Sign In →'}
              </button>
            </form>

            <p className="text-center text-xs text-[#7C8F6E] mt-6 font-mono">
              5 wrong attempts → 15-min lock · Paste PIN supported
            </p>
            <div className="text-center mt-3">
              <a href="/contact" className="text-xs text-[#C8A24A] underline">Forgot PIN? Contact admin</a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
