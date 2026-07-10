'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function VerifyPinPage() {
  const router = useRouter();
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [lockedMinutes, setLockedMinutes] = useState<number | null>(null);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  
  useEffect(() => {
    // Check we have a partial session (password verified)
    fetch('/api/auth/session').then(r => r.json()).then(d => {
      if (!d.authenticated) {
        router.push('/login');
      } else if (d.pinVerified) {
        router.push(d.user.role === 'admin' ? '/admin' : '/dashboard');
      } else {
        // Focus first PIN input
        setTimeout(() => inputs.current[0]?.focus(), 100);
      }
    }).catch(() => router.push('/login'));
  }, [router]);
  
  function handleChange(i: number, v: string) {
    if (lockedMinutes !== null) return;
    const digit = v.replace(/\D/g, '').slice(-1);
    const next = [...pin];
    next[i] = digit;
    setPin(next);
    setError('');
    if (digit && i < 5) inputs.current[i + 1]?.focus();
    // Auto-submit when all 6 filled
    if (digit && i === 5) {
      setTimeout(() => submitPin(next.join('')), 100);
    } else if (next.every(x => x) && next.join('').length === 6) {
      setTimeout(() => submitPin(next.join('')), 100);
    }
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
      const next = text.split('');
      setPin(next);
      submitPin(text);
    }
  }
  
  async function submitPin(fullPin: string) {
    if (fullPin.length !== 6) return;
    setLoading(true);
    setError('');
    setAttemptsRemaining(null);
    try {
      const r = await fetch('/api/auth/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: fullPin }),
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
          setError(d.error || 'Verification failed');
        }
        return;
      }
      // Success — redirect
      router.push(d.redirect || '/dashboard');
    } catch {
      setError('Network error');
      setPin(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }
  
  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-950 via-stone-900 to-amber-950 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-serif italic text-3xl text-amber-200">Pradip&apos;s Homoe</h1>
          <p className="text-xs uppercase tracking-widest text-stone-400 mt-1">Access PIN Required</p>
        </div>
        <div className="bg-stone-50 rounded-2xl p-8 shadow-2xl">
          <h2 className="font-serif text-2xl text-emerald-900 mb-1">Enter PIN</h2>
          <p className="text-xs text-stone-500 mb-6">Enter your 6-digit Access PIN. This is a fixed PIN set by the admin — not an OTP.</p>
          
          <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
            {pin.map((d, i) => (
              <input
                key={i}
                ref={el => { inputs.current[i] = el; }}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                disabled={loading || lockedMinutes !== null}
                className="w-12 h-14 text-center text-2xl font-mono border-2 border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:border-emerald-700 disabled:opacity-50"
              />
            ))}
          </div>
          
          {error && (
            <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded p-3 text-center mb-4">
              {error}
              {attemptsRemaining !== null && attemptsRemaining > 0 && (
                <div className="text-xs mt-1 text-red-500">{attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining before 15-min lockout</div>
              )}
            </div>
          )}
          
          {lockedMinutes !== null && (
            <div className="text-amber-700 text-sm bg-amber-50 border border-amber-200 rounded p-3 text-center mb-4">
              <div className="font-semibold">PIN locked</div>
              <div className="text-xs mt-1">Try again in {lockedMinutes} minute{lockedMinutes !== 1 ? 's' : ''}, or contact admin to unlock.</div>
            </div>
          )}
          
          <div className="text-center text-xs text-stone-500">
            {loading ? 'Verifying...' : 'Auto-submits when all 6 digits entered'}
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full mt-6 text-xs text-stone-500 hover:text-stone-700 underline"
          >
            Cancel and sign out
          </button>
        </div>
        <p className="text-center text-xs text-stone-500 mt-6 font-mono">
          3 wrong attempts → 15-min lock · PIN changes via admin only
        </p>
      </div>
    </div>
  );
}
