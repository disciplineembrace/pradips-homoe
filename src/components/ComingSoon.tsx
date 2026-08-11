'use client';
/**
 * ComingSoon — reusable placeholder page for sections under development.
 *
 * Design matches the existing website theme:
 *   - Dark green (#173B2D), cream (#F5EFE0), gold (#C8A24A), muted green (#7C8F6E)
 *   - Serif headings (font-serif), subtle fade-in animation
 *   - Fully responsive (desktop, tablet, mobile)
 *   - Back button uses router.back() to preserve navigation state
 *
 * Usage:
 *   <ComingSoon title="Segal Homeopathy" />
 *
 * When verified content is ready, simply replace the page's default export
 * with the real content — the Coming Soon page will disappear automatically.
 */
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

type ComingSoonProps = {
  /** Section name shown in the header (e.g., "Segal Homeopathy") */
  title?: string;
};

export function ComingSoon({ title = 'This Section' }: ComingSoonProps) {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [visible, setVisible] = useState(false);

  // Auth check — same pattern as every other protected page
  useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(d => {
        if (!d.authenticated) { router.push('/login'); return; }
        setSession(d);
      })
      .catch(() => router.push('/login'));
  }, [router]);

  // Fade-in animation after mount
  useEffect(() => {
    if (session) {
      const t = setTimeout(() => setVisible(true), 50);
      return () => clearTimeout(t);
    }
  }, [session]);

  // Loading state (before auth resolves)
  if (!session) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block w-10 h-10 border-4 border-[#E8DCC3] border-t-[#173B2D] rounded-full animate-spin mb-4"></div>
            <p className="text-sm text-[#7C8F6E]">Loading...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
      <Navbar />
      <main className="flex-1 max-w-2xl mx-auto px-4 py-8 w-full flex items-center justify-center">
        <div
          className={`text-center transition-all duration-700 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {/* Rocket icon */}
          <div className="text-6xl mb-6" role="img" aria-label="Coming Soon">🚀</div>

          {/* Header */}
          <h1 className="font-serif text-3xl md:text-4xl text-[#173B2D] mb-3">
            Coming Soon
          </h1>
          <div className="w-16 h-0.5 bg-[#C8A24A] mx-auto mb-6"></div>

          {/* Message */}
          <div className="space-y-3 mb-8">
            <p className="text-sm md:text-base text-[#173B2D] font-medium">
              We&rsquo;re building something valuable for you.
            </p>
            <p className="text-sm text-[#7C8F6E] leading-relaxed max-w-md mx-auto">
              This section is currently under development and is being carefully prepared
              with verified, high-quality homeopathic content.
            </p>
            <p className="text-sm text-[#7C8F6E] leading-relaxed max-w-md mx-auto">
              Our goal is to provide an accurate, reliable, and easy-to-use learning experience.
            </p>
            <p className="text-sm text-[#7C8F6E] leading-relaxed max-w-md mx-auto">
              Thank you for your patience and continued support.
            </p>
          </div>

          {/* Status badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#E8DCC3] rounded-full text-xs text-[#7C8F6E] uppercase tracking-widest mb-8 shadow-sm">
            <span className="w-2 h-2 bg-[#C8A24A] rounded-full animate-pulse"></span>
            Status: Under Development
          </div>

          {/* Back button — preserves navigation state via browser history */}
          <div>
            <button
              onClick={() => router.back()}
              className="inline-block bg-[#173B2D] text-[#C8A24A] px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#1f4a3a] transition-colors shadow-sm"
            >
              ← Back
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
