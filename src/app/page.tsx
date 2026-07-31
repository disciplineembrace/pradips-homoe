'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

// Animated counter hook
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

// Fade-in on scroll hook
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => { if (ref.current) observer.disconnect(); };
  }, []);
  return { ref, visible };
}

function StatCard({ value, label, suffix, delay }: { value: number; label: string; suffix?: string; delay: number }) {
  const { ref, visible } = useScrollReveal();
  const count = useCountUp(value, 2000, visible);
  return (
    <div ref={ref} className={`text-center transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: `${delay}ms` }}>
      <div className="font-serif text-3xl md:text-4xl font-bold text-[#D4AF37]">{count.toLocaleString()}{suffix}</div>
      <div className="text-xs md:text-sm text-stone-400 mt-1 uppercase tracking-wider">{label}</div>
    </div>
  );
}

function FeatureCard({ icon, title, desc, delay }: { icon: string; title: string; desc: string; delay: number }) {
  const { ref, visible } = useScrollReveal();
  return (
    <div ref={ref} className={`bg-[#12392C]/80 backdrop-blur-sm border border-[#D4AF37]/20 rounded-xl p-5 transition-all duration-500 hover:border-[#D4AF37]/50 hover:shadow-lg hover:shadow-[#D4AF37]/5 hover:-translate-y-1 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: `${delay}ms` }}>
      <div className="text-2xl mb-3">{icon}</div>
      <h3 className="font-serif text-base text-[#D4AF37] mb-1.5 font-semibold">{title}</h3>
      <p className="text-xs text-stone-400 leading-relaxed">{desc}</p>
    </div>
  );
}

function CollectionCard({ icon, title, desc, stat, delay }: { icon: string; title: string; desc: string; stat: string; delay: number }) {
  const { ref, visible } = useScrollReveal();
  return (
    <div ref={ref} className={`bg-gradient-to-br from-[#12392C] to-[#0B2E22] border border-[#D4AF37]/25 rounded-2xl p-6 transition-all duration-500 hover:border-[#D4AF37]/60 hover:shadow-xl hover:shadow-[#D4AF37]/10 hover:-translate-y-1.5 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: `${delay}ms` }}>
      <div className="flex items-center gap-3 mb-3">
        <div className="text-3xl">{icon}</div>
        <h3 className="font-serif text-lg text-[#D4AF37] font-bold">{title}</h3>
      </div>
      <p className="text-xs text-stone-400 leading-relaxed mb-3">{desc}</p>
      <div className="text-xs text-[#C9A23A] font-semibold border-t border-[#D4AF37]/15 pt-2">{stat}</div>
    </div>
  );
}

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState('Preparing Digital Library...');
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const texts = ['Preparing Digital Library...', 'Authenticating Resources...', 'Loading Verified Database...'];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % texts.length;
      setLoadingText(texts[idx]);
    }, 800);
    const timer = setTimeout(() => {
      setLoading(false);
      clearInterval(interval);
    }, 2400);
    return () => { clearTimeout(timer); clearInterval(interval); };
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#0B2E22] flex flex-col items-center justify-center z-[9999]">
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-full border-4 border-[#D4AF37]/20"></div>
          <div className="absolute inset-0 w-24 h-24 rounded-full border-4 border-t-[#D4AF37] animate-spin"></div>
          <img src="/logo-v2-92.png" alt="Pradip's Homoeo" width="48" height="48" className="absolute inset-0 m-auto h-12 w-auto" />
        </div>
        <h1 className="font-serif text-2xl text-[#D4AF37] mb-2 tracking-wide">Pradip&apos;s Homoeo</h1>
        <p className="text-xs text-stone-500 uppercase tracking-[0.2em] mb-4">Personal Digital Library</p>
        <p className="text-sm text-stone-400 animate-pulse">{loadingText}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B2E22] text-[#F8F7F4]">
      <Navbar />
      <main className="flex-1">

        {/* HERO SECTION */}
        <section ref={heroRef} className="relative overflow-hidden bg-gradient-to-br from-[#0B2E22] via-[#12392C] to-[#0B2E22] py-16 md:py-24 px-4 border-b border-[#D4AF37]/20">
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #D4AF37 0%, transparent 50%)' }}></div>
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              {/* Left */}
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 mb-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse"></span>
                  <span className="text-xs text-[#D4AF37] font-semibold tracking-wider uppercase">Verified · Accurate · Comprehensive</span>
                </div>
                <img src="/logo-v2-120.png" alt="Pradip's Homoeo" width="80" height="80" className="h-16 md:h-20 w-auto mx-auto lg:mx-0 mb-4" />
                <h1 className="font-serif text-4xl md:text-6xl font-bold text-[#D4AF37] mb-2 tracking-tight">Pradip&apos;s Homoeo</h1>
                <p className="text-sm md:text-base text-[#C9A23A] uppercase tracking-[0.25em] mb-4 font-semibold">Personal Digital Library</p>
                <p className="text-sm md:text-base text-stone-300 max-w-xl mx-auto lg:mx-0 leading-relaxed mb-8">
                  A secure and comprehensive digital homeopathy knowledge platform providing authenticated Materia Medica, Repertories, Therapeutics, Organon, Books and Clinical References for students and practitioners.
                </p>
                <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                  <Link href="/login" className="bg-[#D4AF37] hover:bg-[#C9A23A] text-[#0B2E22] font-bold px-6 py-3 rounded-lg text-sm transition-all shadow-lg hover:shadow-[#D4AF37]/30 hover:-translate-y-0.5">Login to Access Library →</Link>
                  <Link href="/about" className="border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10 px-6 py-3 rounded-lg text-sm font-semibold transition-all">Explore Features</Link>
                </div>
                {/* Animated stats */}
                <div className="grid grid-cols-4 gap-4 mt-10">
                  <StatCard value={4493} label="Remedies" delay={0} />
                  <StatCard value={81463} label="Rubrics" delay={100} />
                  <StatCard value={408} label="Formulas" delay={200} />
                  <StatCard value={23} label="Chapters" delay={300} />
                </div>
              </div>
              {/* Right — luxury composition */}
              <div className="hidden lg:flex justify-center">
                <div className="relative w-full max-w-md aspect-square">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#D4AF37]/10 to-transparent blur-3xl"></div>
                  <div className="relative grid grid-cols-2 gap-4 p-8">
                    <div className="bg-[#12392C] border border-[#D4AF37]/20 rounded-2xl p-6 flex flex-col items-center justify-center shadow-xl">
                      <span className="text-4xl mb-2">📖</span>
                      <span className="text-xs text-[#D4AF37] font-semibold uppercase tracking-wider">Materia Medica</span>
                    </div>
                    <div className="bg-[#12392C] border border-[#D4AF37]/20 rounded-2xl p-6 flex flex-col items-center justify-center shadow-xl mt-8">
                      <span className="text-4xl mb-2">🔬</span>
                      <span className="text-xs text-[#D4AF37] font-semibold uppercase tracking-wider">Repertory</span>
                    </div>
                    <div className="bg-[#12392C] border border-[#D4AF37]/20 rounded-2xl p-6 flex flex-col items-center justify-center shadow-xl">
                      <span className="text-4xl mb-2">🌿</span>
                      <span className="text-xs text-[#D4AF37] font-semibold uppercase tracking-wider">Therapeutics</span>
                    </div>
                    <div className="bg-[#12392C] border border-[#D4AF37]/20 rounded-2xl p-6 flex flex-col items-center justify-center shadow-xl mt-8">
                      <span className="text-4xl mb-2">⚗️</span>
                      <span className="text-xs text-[#D4AF37] font-semibold uppercase tracking-wider">Organon</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* VERIFIED SOURCES BAR */}
        <section className="bg-[#12392C] border-b border-[#D4AF37]/15 py-6 px-4">
          <div className="max-w-7xl mx-auto">
            <p className="text-center text-xs text-[#D4AF37]/70 uppercase tracking-[0.2em] mb-4 font-semibold">Trusted &amp; Verified Sources</p>
            <div className="flex flex-wrap justify-center gap-2 md:gap-3">
              {['Boericke', 'Kent', 'Allen', 'Murphy', 'Phatak', 'Boger', 'Sankaran', 'Synthesis', 'Biochemic', 'Therapeutics', 'Organon', 'Predictive'].map(src => (
                <div key={src} className="px-3 py-1.5 bg-[#0B2E22]/60 border border-[#D4AF37]/20 rounded-full text-xs text-stone-300 font-medium hover:border-[#D4AF37]/50 transition-colors">{src}</div>
              ))}
            </div>
          </div>
        </section>

        {/* LIBRARY COLLECTION */}
        <section className="py-16 md:py-20 px-4 bg-[#0B2E22]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="font-serif text-3xl md:text-4xl text-[#D4AF37] font-bold mb-2">Library Collection</h2>
              <div className="w-16 h-0.5 bg-[#D4AF37] mx-auto mb-3"></div>
              <p className="text-sm text-stone-400 max-w-xl mx-auto">Explore our comprehensive collection of verified homeopathic knowledge resources</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <CollectionCard icon="📖" title="Materia Medica" desc="4,493 remedies from 10 renowned authors including Boericke, Kent, Allen, Phatak, Dubey and more." stat="4,493 Remedies · 10 Authors" delay={0} />
              <CollectionCard icon="🔬" title="Repertory" desc="81,463 rubrics with Synthesis Repertory engine, cross-references, and repertorization." stat="81,463 Rubrics · 180K+ Nodes" delay={100} />
              <CollectionCard icon="🌿" title="Therapeutics" desc="408 disease categories with remedy formulas and potencies from Dr. Saif-ud-Din Saif." stat="408 Disease Categories" delay={200} />
              <CollectionCard icon="⚗️" title="Predictive Homeopathy" desc="Theory of Suppression and Theory of Acutes by Dr. Prafull Vijayakar with 23 chapters." stat="23 Chapters · 2 Books" delay={300} />
              <CollectionCard icon="📜" title="Organon" desc="Hahnemann's Organon of Medicine — the foundational text of homeopathic philosophy." stat="Under Development" delay={400} />
              <CollectionCard icon="📚" title="Books Section" desc="A curated collection of reference books and clinical literature for deep study." stat="Under Development" delay={500} />
            </div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section className="py-16 md:py-20 px-4 bg-[#12392C]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="font-serif text-3xl md:text-4xl text-[#D4AF37] font-bold mb-2">Features</h2>
              <div className="w-16 h-0.5 bg-[#D4AF37] mx-auto mb-3"></div>
              <p className="text-sm text-stone-400">Powerful tools designed for serious homeopathic practice</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <FeatureCard icon="🔍" title="Universal Search" desc="Search across all remedies and rubrics instantly." delay={0} />
              <FeatureCard icon="⚕️" title="Quick Clinical Search" desc="Fast clinical remedy lookup with source filters." delay={50} />
              <FeatureCard icon="↔️" title="Cross References" desc="Verified cross-references between rubrics." delay={100} />
              <FeatureCard icon="📖" title="Reading Experience" desc="Reader-friendly layout with bookmark support." delay={150} />
              <FeatureCard icon="📋" title="Case Management" desc="Repertorization, case saving and patient records." delay={200} />
              <FeatureCard icon="📝" title="MCQ Practice" desc="Intelligent question bank with spaced revision." delay={250} />
              <FeatureCard icon="📊" title="Analytics" desc="Track usage, performance and progress." delay={300} />
              <FeatureCard icon="🔒" title="Secure Access" desc="PIN authentication with encrypted sessions." delay={350} />
            </div>
          </div>
        </section>

        {/* WHY CHOOSE US */}
        <section className="py-16 md:py-20 px-4 bg-[#0B2E22]">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="font-serif text-3xl md:text-4xl text-[#D4AF37] font-bold mb-2">Why Choose Us</h2>
              <div className="w-16 h-0.5 bg-[#D4AF37] mx-auto mb-3"></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {[
                { icon: '✅', title: '100% Verified Database', desc: 'Every remedy verified against original source' },
                { icon: '📋', title: 'OCR Clean Data', desc: 'Structured, clean OCR with no artifacts' },
                { icon: '🛡️', title: 'No Data Loss', desc: 'Complete preservation of source content' },
                { icon: '🎨', title: 'Professional UI', desc: 'Premium design for medical professionals' },
                { icon: '⚕️', title: 'Clinical Focus', desc: 'Built for real-world homeopathic practice' },
                { icon: '©️', title: 'Copyright Protected', desc: 'All content is protected and authenticated' },
                { icon: '🔄', title: 'Continuous Updates', desc: 'Regularly updated with new verified content' },
                { icon: '⚡', title: 'Fast Performance', desc: 'Optimized for quick loading and search' },
              ].map((item, i) => {
                const { ref, visible } = useScrollReveal();
                return (
                  <div key={i} ref={ref} className={`text-center transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: `${i * 50}ms` }}>
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 mb-3">
                      <span className="text-xl">{item.icon}</span>
                    </div>
                    <h3 className="text-xs md:text-sm font-semibold text-[#D4AF37] mb-1">{item.title}</h3>
                    <p className="text-[0.65rem] text-stone-500 leading-relaxed">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ABOUT SECTION */}
        <section className="py-16 md:py-20 px-4 bg-[#12392C]">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-[#0B2E22] to-[#12392C] border border-[#D4AF37]/25 rounded-2xl p-8 md:p-12 shadow-2xl">
              <div className="text-center mb-6">
                <h2 className="font-serif text-3xl text-[#D4AF37] font-bold mb-2">About the Library</h2>
                <div className="w-16 h-0.5 bg-[#D4AF37] mx-auto"></div>
              </div>
              <p className="text-sm text-stone-300 leading-relaxed text-center mb-6 max-w-2xl mx-auto">
                Pradip&apos;s Homoeo is a private digital library dedicated to preserving and providing secure access to classical homoeopathic literature. The platform brings together Materia Medica, Repertories, Therapeutics, and Predictive Homeopathy teachings from renowned authors — all in one searchable, readable interface.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                <div className="bg-[#0B2E22]/60 rounded-xl p-4 border border-[#D4AF37]/15">
                  <h4 className="font-serif text-sm text-[#D4AF37] mb-2 font-semibold">🎯 Mission</h4>
                  <p className="text-xs text-stone-400 leading-relaxed">To provide accurate, verified, and accessible homeopathic knowledge for students and practitioners worldwide.</p>
                </div>
                <div className="bg-[#0B2E22]/60 rounded-xl p-4 border border-[#D4AF37]/15">
                  <h4 className="font-serif text-sm text-[#D4AF37] mb-2 font-semibold">👁️ Vision</h4>
                  <p className="text-xs text-stone-400 leading-relaxed">To be the most trusted digital homeopathy library, preserving classical knowledge with modern technology.</p>
                </div>
              </div>
              <div className="text-center mt-8">
                <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30">
                  <img src="/logo-v2-92.png" alt="Dr. Pradip" width="32" height="32" className="h-8 w-auto rounded-full" />
                  <div className="text-left">
                    <div className="text-xs text-[#D4AF37] font-semibold">Dr. Pradip</div>
                    <div className="text-[0.6rem] text-stone-500">Founder & Curator</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECURITY SECTION */}
        <section className="py-16 px-4 bg-[#0B2E22]">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="font-serif text-3xl text-[#D4AF37] font-bold mb-2">Security & Access Control</h2>
              <div className="w-16 h-0.5 bg-[#D4AF37] mx-auto"></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { icon: '🔐', title: 'Password Protection' },
                { icon: '🔢', title: 'PIN Authentication' },
                { icon: '🗄️', title: 'Encrypted Database' },
                { icon: '🍪', title: 'Secure Sessions' },
                { icon: '🛡️', title: 'Protected Content' },
                { icon: '👤', title: 'Admin Controlled Access' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-[#12392C]/60 border border-[#D4AF37]/15 rounded-xl p-4">
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-xs text-stone-300 font-medium">{item.title}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* COPYRIGHT SECTION */}
        <section className="py-12 px-4 bg-[#12392C] border-t border-[#D4AF37]/15">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="text-2xl">©️</span>
              <h2 className="font-serif text-xl text-[#D4AF37] font-bold">Intellectual Property &amp; Copyright</h2>
              <span className="text-2xl">🛡️</span>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed max-w-2xl mx-auto mb-4">
              All software, database architecture, OCR processing, indexing, UI design, source compilation, search system, translations and digital assets are protected by copyright. Unauthorized copying, redistribution, scraping or commercial use is strictly prohibited.
            </p>
            <div className="flex justify-center gap-4">
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
