'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

function useCountUp(target: number, duration: number = 2000, start: boolean = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number;
    const animate = (t: number) => {
      if (!startTime) startTime = t;
      const progress = Math.min((t - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, duration, start]);
  return count;
}

function RevealCard({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setVisible(true); }, { threshold: 0.1 });
    const el = ref.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.disconnect(); };
  }, []);
  return <div ref={ref} className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</div>;
}

function StatCard({ value, label, icon, delay }: { value: number; label: string; icon: string; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const count = useCountUp(value, 2000, visible);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setVisible(true); }, { threshold: 0.1 });
    const el = ref.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.disconnect(); };
  }, []);
  return (
    <div ref={ref} className={`bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-3 text-center transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: `${delay}ms` }}>
      <div className="text-xl mb-1">{icon}</div>
      <div className="font-serif text-xl md:text-2xl font-bold text-[#D4AF37]">{count.toLocaleString()}+</div>
      <div className="text-[0.6rem] text-stone-400 uppercase tracking-wider">{label}</div>
    </div>
  );
}

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState('Preparing Digital Library...');

  useEffect(() => {
    const texts = ['Preparing Digital Library...', 'Authenticating Resources...', 'Loading Verified Database...'];
    let idx = 0;
    const interval = setInterval(() => { idx = (idx + 1) % texts.length; setLoadingText(texts[idx]); }, 700);
    const timer = setTimeout(() => { setLoading(false); clearInterval(interval); }, 2000);
    return () => { clearTimeout(timer); clearInterval(interval); };
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#0B2E22] flex flex-col items-center justify-center z-[9999]">
        <div className="relative mb-6 w-20 h-20">
          <div className="absolute inset-0 rounded-full border-4 border-[#D4AF37]/20"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-[#D4AF37] animate-spin"></div>
          <img src="/logo-v2-92.png" alt="Pradip's Homoeo" width="40" height="40" className="absolute inset-0 m-auto h-10 w-10 rounded-full object-cover" />
        </div>
        <h1 className="font-serif text-2xl text-[#D4AF37] mb-1 tracking-wide">Pradip&apos;s Homoeo</h1>
        <p className="text-[0.6rem] text-stone-500 uppercase tracking-[0.2em] mb-4">Personal Digital Library</p>
        <p className="text-sm text-stone-400 animate-pulse">{loadingText}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B2E22] text-[#F8F7F4]">
      <Navbar />
      <main className="flex-1">

        {/* HERO SECTION */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#061A12] via-[#0B2E22] to-[#0F2B1E] py-12 md:py-20 px-4 border-b border-[#D4AF37]/20">
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 70% 30%, #D4AF37 0%, transparent 50%)' }}></div>
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              {/* Left */}
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1A3A28] border border-[#D4AF37]/30 mb-5">
                  <span className="text-[#D4AF37] text-xs">✓</span>
                  <span className="text-[0.65rem] text-stone-200 font-semibold tracking-wider uppercase">Verified · Accurate · Comprehensive</span>
                </div>
                <img src="/logo-v2-120.png" alt="Pradip's Homoeo" width="64" height="64" className="h-14 w-14 mb-3 rounded-full object-cover" />
                <h1 className="font-serif text-4xl md:text-6xl font-bold text-[#D4AF37] mb-1 tracking-tight" style={{ textShadow: '0 2px 20px rgba(212,175,55,0.2)' }}>Pradip&apos;s Homoeo</h1>
                <p className="text-xs md:text-sm text-[#C9A23A] uppercase tracking-[0.25em] mb-3 font-semibold">Personal Digital Library</p>
                <div className="text-[#D4AF37] text-sm mb-3">⚜</div>
                <p className="text-sm md:text-base text-stone-300 max-w-lg leading-relaxed mb-6">
                  A secure, professional and comprehensive digital Homoeopathy library for serious learners and practitioners. Authenticated Materia Medica, Repertories, Therapeutics, Organon, Books and Clinical References.
                </p>
                <div className="flex flex-wrap gap-3 mb-8">
                  <Link href="/login" className="bg-gradient-to-r from-[#D4AF37] to-[#B8960F] text-[#0F2B1E] font-bold px-6 py-3 rounded-full text-sm transition-all shadow-lg" style={{ boxShadow: '0 4px 20px rgba(212,175,55,0.3)' }}>🔒 Login to Access Library →</Link>
                  <Link href="#features" className="border border-white/30 text-white hover:bg-white/10 px-6 py-3 rounded-full text-sm font-semibold transition-all">Explore Features</Link>
                </div>
                {/* Stats */}
                <div className="grid grid-cols-4 gap-2 md:gap-3 max-w-lg">
                  <StatCard value={4493} label="Remedies" icon="🛡️" delay={0} />
                  <StatCard value={81463} label="Rubrics" icon="📋" delay={100} />
                  <StatCard value={408} label="Formulae" icon="✏️" delay={200} />
                  <StatCard value={23} label="Chapters" icon="📖" delay={300} />
                </div>
              </div>
              {/* Right — Hero composition */}
              <div className="hidden lg:block relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#D4AF37]/10 to-transparent blur-3xl"></div>
                <div className="relative">
                  <img src="/hero-composition.png" alt="Homeopathy Library" width="500" height="500" className="rounded-2xl shadow-2xl w-full max-w-md mx-auto" />
                  {/* Hahnemann portrait overlay */}
                  <div className="absolute top-0 right-0 w-28 h-28 rounded-full overflow-hidden border-2 border-[#D4AF37]/30 shadow-xl opacity-80">
                    <img src="/hahnemann-portrait.png" alt="Dr. Samuel Hahnemann" className="w-full h-full object-cover" />
                  </div>
                  {/* Quote */}
                  <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md rounded-xl p-4 border border-[#D4AF37]/20">
                    <p className="font-serif italic text-[#D4AF37] text-sm text-center">"Similia Similibus Curentur"</p>
                    <p className="text-[0.6rem] text-stone-400 text-center mt-1">— S. Hahnemann</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TRUSTED SOURCES BAR */}
        <section className="bg-[#0A2318] border-b border-[#D4AF37]/15 py-5 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-[#D4AF37] text-sm">✓</span>
              <p className="text-xs text-stone-300 uppercase tracking-[0.15em] font-semibold">Trusted &amp; Verified Sources</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {['Boericke', 'Kent', 'Allen', 'Murphy', 'Phatak', 'Boger', 'Sankaran', 'Synthesis', 'Biochemic', 'Therapeutics', 'Organon'].map(src => (
                <div key={src} className="px-3 py-1.5 bg-[#163B29] rounded-full text-xs text-stone-200 font-medium hover:bg-[#244d3a] transition-colors">{src}</div>
              ))}
            </div>
          </div>
        </section>

        {/* LIBRARY COLLECTION */}
        <section className="py-16 md:py-20 px-4 bg-[#FAFAF8]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10">
              <p className="text-sm text-stone-400 mb-1">Explore Our</p>
              <h2 className="font-serif text-3xl md:text-4xl text-[#0B2E22] font-bold mb-2">Library Collection</h2>
              <div className="text-[#D4AF37] text-sm">⚜</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: '📖', title: 'Materia Medica', desc: 'Authorwise, A-Z Complete & Verified', stat: '4,493 Remedies · 9+ Authors →', bg: 'bg-emerald-50' },
                { icon: '🔬', title: 'Repertory', desc: 'Synthesis, Biochemical Complete Rubrics', stat: '81,463 Rubrics →', bg: 'bg-blue-50' },
                { icon: '🌿', title: 'Therapeutics', desc: 'Disease-wise Formulas with Potencies', stat: '408 Formulas →', bg: 'bg-teal-50' },
                { icon: '⚗️', title: 'Predictive Homeopathy', desc: 'Dr. Prafull Vijayakar', stat: '23 Chapters →', bg: 'bg-purple-50' },
                { icon: '📜', title: 'Organon', desc: 'Organon of Medicine by Hahnemann', stat: 'Complete Text →', bg: 'bg-amber-50' },
                { icon: '📚', title: 'Books Section', desc: 'Reference & Advanced Reading', stat: 'Growing... →', bg: 'bg-indigo-50' },
              ].map((card, i) => (
                <RevealCard key={i} delay={i * 100} className="bg-white rounded-2xl p-8 shadow-md border border-black/5 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 text-center">
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-full ${card.bg} mb-4`}>
                    <span className="text-2xl">{card.icon}</span>
                  </div>
                  <h3 className="font-serif text-lg text-[#0B2E22] font-bold mb-2">{card.title}</h3>
                  <p className="text-xs text-stone-500 leading-relaxed mb-3">{card.desc}</p>
                  <div className="text-xs text-[#0B2E22] font-semibold border-t border-stone-100 pt-3">{card.stat}</div>
                </RevealCard>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section id="features" className="py-16 md:py-20 px-4 bg-[#F0F7FF]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="font-serif text-3xl md:text-4xl text-[#0B2E22] font-bold mb-2">Powerful Features</h2>
              <p className="text-sm text-stone-500">For Better Learning &amp; Practice</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                { icon: '🔍', title: 'Universal Search', desc: 'Search across all books and rubrics', color: 'bg-blue-500' },
                { icon: '🩺', title: 'Quick Clinical Search', desc: 'Disease based clinical indications', color: 'bg-teal-500' },
                { icon: '🔗', title: 'Cross References', desc: 'Smart linking across sources', color: 'bg-green-500' },
                { icon: '🌐', title: 'Multi-Language', desc: 'Gujarati · Hindi · English', color: 'bg-blue-600' },
                { icon: '📖', title: 'Reading Experience', desc: 'Theme, Font & Bookmark support', color: 'bg-purple-500' },
                { icon: '📋', title: 'Case Management', desc: 'Select rubrics, analyze, export', color: 'bg-blue-500' },
                { icon: '🎓', title: 'MCQ Practice', desc: 'Daily practice for students', color: 'bg-blue-700' },
                { icon: '📊', title: 'Analytics', desc: 'Track visitors & usage', color: 'bg-purple-600' },
                { icon: '🔒', title: 'Secure Access', desc: 'Password + 6-digit PIN', color: 'bg-green-600' },
                { icon: '⚡', title: 'Fast Performance', desc: 'Optimized for smooth working', color: 'bg-blue-500' },
              ].map((f, i) => (
                <RevealCard key={i} delay={i * 40} className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all">
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${f.color} text-white text-lg mb-3`}>{f.icon}</div>
                  <h3 className="font-semibold text-sm text-[#0B2E22] mb-1">{f.title}</h3>
                  <p className="text-[0.7rem] text-stone-500 leading-relaxed">{f.desc}</p>
                </RevealCard>
              ))}
            </div>
          </div>
        </section>

        {/* WHY CHOOSE US */}
        <section className="py-16 md:py-20 px-4 bg-[#FFFBEB]">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="font-serif text-3xl md:text-4xl text-[#0B2E22] font-bold mb-2">Why Choose Pradip&apos;s Homoeo?</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { icon: '✅', title: '100% Verified Database', desc: 'Every remedy verified against source' },
                { icon: '📋', title: 'OCR Clean Data', desc: 'Structured, clean OCR with no artifacts' },
                { icon: '🗄️', title: 'No Data Loss', desc: 'Complete preservation of content' },
                { icon: '🎨', title: 'Professional UI', desc: 'Premium design for professionals' },
                { icon: '⚕️', title: 'Clinical Focus', desc: 'Built for real-world practice' },
                { icon: '©️', title: 'Copyright Protected', desc: 'All content is protected' },
                { icon: '🔄', title: 'Continuous Updates', desc: 'Regularly updated with new content' },
                { icon: '⚡', title: 'Fast Performance', desc: 'Optimized for quick loading' },
              ].map((item, i) => (
                <RevealCard key={i} delay={i * 50}>
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border-2 border-[#D4AF37] bg-[#D4AF37]/5 mb-3">
                      <span className="text-xl">{item.icon}</span>
                    </div>
                    <h3 className="text-xs md:text-sm font-semibold text-[#0B2E22] mb-1">{item.title}</h3>
                    <p className="text-[0.65rem] text-stone-500 leading-relaxed">{item.desc}</p>
                  </div>
                </RevealCard>
              ))}
            </div>
          </div>
        </section>

        {/* TESTIMONIAL */}
        <section className="py-12 px-4 bg-[#E8F5E9]">
          <div className="max-w-2xl mx-auto text-center bg-[#D1E7DD] rounded-2xl p-8 shadow-sm">
            <div className="text-4xl text-[#D4AF37] mb-2 font-serif">"</div>
            <p className="font-serif italic text-base md:text-lg text-[#1B4332] leading-relaxed mb-3">
              A digital library made with passion, accuracy and dedication for the Homeopathic community.
            </p>
            <p className="text-sm font-bold text-[#1B4332]">— Dr. Pradip</p>
          </div>
        </section>

        {/* ABOUT + SECURITY */}
        <section className="py-16 px-4 bg-[#0B2E22]">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* About */}
              <RevealCard className="bg-[#12392C] border border-[#D4AF37]/25 rounded-2xl p-8">
                <h2 className="font-serif text-2xl text-[#D4AF37] font-bold mb-4">About the Library</h2>
                <p className="text-xs text-stone-400 leading-relaxed mb-4">
                  Pradip&apos;s Homoeo is a private digital library dedicated to preserving and providing secure access to classical homoeopathic literature from renowned authors.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2"><span className="text-[#D4AF37]">🎯</span><span className="text-xs text-stone-300"><b>Mission:</b> Provide accurate, verified homeopathic knowledge worldwide.</span></div>
                  <div className="flex items-center gap-2"><span className="text-[#D4AF37]">👁️</span><span className="text-xs text-stone-300"><b>Vision:</b> Be the most trusted digital homeopathy library.</span></div>
                </div>
                <div className="flex items-center gap-3 mt-5 pt-4 border-t border-[#D4AF37]/15">
                  <img src="/logo-v2-92.png" alt="Dr. Pradip" width="32" height="32" className="h-8 w-8 rounded-full object-cover" />
                  <div><div className="text-xs text-[#D4AF37] font-semibold">Dr. Pradip</div><div className="text-[0.6rem] text-stone-500">Founder &amp; Curator</div></div>
                </div>
              </RevealCard>
              {/* Security */}
              <RevealCard delay={100} className="bg-[#12392C] border border-[#D4AF37]/25 rounded-2xl p-8">
                <h2 className="font-serif text-2xl text-[#D4AF37] font-bold mb-4">Security &amp; Access</h2>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: '🔐', title: 'Password Protection' },
                    { icon: '🔢', title: 'PIN Authentication' },
                    { icon: '🗄️', title: 'Encrypted Database' },
                    { icon: '🍪', title: 'Secure Sessions' },
                    { icon: '🛡️', title: 'Protected Content' },
                    { icon: '👤', title: 'Admin Controlled' },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center gap-2 bg-[#0B2E22]/60 rounded-lg p-3 border border-[#D4AF37]/10">
                      <span className="text-base">{s.icon}</span>
                      <span className="text-[0.7rem] text-stone-300 font-medium">{s.title}</span>
                    </div>
                  ))}
                </div>
              </RevealCard>
            </div>
          </div>
        </section>

        {/* COPYRIGHT */}
        <section className="py-10 px-4 bg-[#12392C] border-t border-[#D4AF37]/15">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="text-xl">©️</span>
              <h2 className="font-serif text-lg text-[#D4AF37] font-bold">Intellectual Property &amp; Copyright</h2>
              <span className="text-xl">🛡️</span>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed max-w-xl mx-auto mb-4">
              All software, database architecture, OCR processing, indexing, UI design, source compilation, search system, translations and digital assets are protected by copyright. Unauthorized copying, redistribution, scraping or commercial use is strictly prohibited.
            </p>
            <div className="flex justify-center gap-3">
              <div className="px-4 py-2 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-xs text-[#D4AF37] font-semibold">© Copyright Protected</div>
              <div className="px-4 py-2 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-xs text-[#D4AF37] font-semibold">🛡️ Verified Seal</div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
