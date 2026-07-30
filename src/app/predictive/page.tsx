'use client';
/**
 * Predictive Homeopathy — Coming Soon
 *
 * The existing data for this section has been removed pending verified content.
 * This page displays a professional "Coming Soon" placeholder.
 *
 * Navigation, layout, theme, and all other sections remain unchanged.
 */
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function PredictivePage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);

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
      <main className="flex-1 max-w-2xl mx-auto px-4 py-6 w-full flex items-center justify-center">
        <div className="text-center">
          {/* Icon */}
          <div className="text-6xl mb-6">🚧</div>

          {/* Title */}
          <h1 className="font-serif text-3xl text-[#173B2D] mb-3">Coming Soon</h1>
          <div className="w-16 h-0.5 bg-[#C8A24A] mx-auto mb-6"></div>

          {/* Message */}
          <p className="text-sm text-[#7C8F6E] mb-2">
            This section is currently under development.
          </p>
          <p className="text-sm text-[#7C8F6E] mb-2">
            Verified content for this section will be available in a future update.
          </p>
          <p className="text-sm text-[#7C8F6E] mb-8">
            Thank you for your patience.
          </p>

          {/* Back button — uses browser history to preserve navigation state */}
          <button
            onClick={() => router.back()}
            className="inline-block bg-[#173B2D] text-[#C8A24A] px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#1f4a3a] transition-colors"
          >
            ← Back
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
