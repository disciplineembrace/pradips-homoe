import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Navbar />
      <main className="flex-1">
        {/* Hero section */}
        <section className="relative bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 text-stone-100 py-20 px-4 border-b-2 border-amber-700/60">
          <div className="max-w-5xl mx-auto text-center">
            <img src="/logo-v2-120.png" alt="Pradip's Homeo" width="120" height="120" className="h-[60px] w-[60px] sm:h-[72px] sm:w-[72px] lg:h-[80px] lg:w-[80px] mx-auto mb-4 rounded-full object-cover" />
            <h1 className="font-serif italic text-4xl md:text-6xl text-amber-200 mb-4 tracking-wide">
              Pradip&apos;s Homeo
            </h1>
            <p className="text-lg md:text-xl text-stone-300 mb-2 font-serif">
              Personal Digital Homeopathy Library
            </p>
            <p className="text-sm text-stone-400 max-w-2xl mx-auto mb-8">
              A secure, private collection of homoeopathic materia medica, repertories, therapeutics, and predictive homeopathy — accessible only to authorized users.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/login" className="bg-amber-700 hover:bg-amber-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors shadow-md">
                Login to Access Library →
              </Link>
              <Link href="/about" className="bg-emerald-800 hover:bg-emerald-700 text-stone-100 font-semibold px-6 py-3 rounded-lg transition-colors border border-amber-700/40">
                Learn More
              </Link>
            </div>
          </div>
        </section>

        {/* Stats section */}
        <section className="py-12 px-4 bg-white">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-serif text-2xl text-emerald-900 text-center mb-2">Library Collection</h2>
            <div className="w-16 h-0.5 bg-amber-700 mx-auto mb-8" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { num: '4,416', label: 'Remedies', desc: 'From 9 authors' },
                { num: '81,463', label: 'Rubrics', desc: 'Kent, Phatak, Murphy, Boericke + Biochemic' },
                { num: '408', label: 'Therapeutic Formulas', desc: 'Disease-wise' },
                { num: '23', label: 'Predictive Chapters', desc: 'Dr. Prafull Vijayakar' },
              ].map((s, i) => (
                <div key={i} className="bg-white border border-stone-200 rounded-lg p-4 text-center shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-3xl font-bold text-amber-700 font-serif">{s.num}</div>
                  <div className="text-sm font-semibold text-emerald-900 mt-1">{s.label}</div>
                  <div className="text-xs text-stone-500 mt-1">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features section */}
        <section className="py-12 px-4 bg-stone-100">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-serif text-2xl text-emerald-900 text-center mb-2">Features</h2>
            <div className="w-16 h-0.5 bg-amber-700 mx-auto mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: '🔒', title: 'Secure Access', desc: 'Password + 6-digit PIN authentication. All access is logged. Only admin-created accounts can login.' },
                { icon: '📚', title: 'Comprehensive Library', desc: 'Materia Medica from Boericke, Phatak, Murphy, Kent, Allen, Sankaran, and more. Repertory, Therapeutics, Predictive — all in one place.' },
                { icon: '🔍', title: 'Universal Search', desc: 'Search across all remedies and rubrics. A-Z browse by letter, filter by author or chapter.' },
                { icon: '📖', title: 'Reading Experience', desc: 'Reader-friendly layout with theme options, font controls, and bookmark support.' },
                { icon: '🧪', title: 'Therapeutic Formulas', desc: '408 disease categories with remedy formulas and potencies from Dr. Saif-ud-Din Saif\'s encyclopedia.' },
                { icon: '⚛️', title: 'Predictive Homeopathy', desc: 'Theory of Suppression and Theory of Acutes by Dr. Prafull Vijayakar, with 23 chapters of full text.' },
              ].map((f, i) => (
                <div key={i} className="bg-emerald-900 rounded-lg shadow-md p-6 border-t-2 border-amber-700/70">
                  <div className="text-3xl mb-3">{f.icon}</div>
                  <h3 className="font-serif text-lg text-amber-200 mb-2">{f.title}</h3>
                  <p className="text-sm text-stone-200 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA section */}
        <section className="py-16 px-4 bg-emerald-950 text-stone-100 border-t-2 border-amber-700/60">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-serif text-3xl text-amber-200 mb-4">Ready to explore?</h2>
            <p className="text-stone-300 mb-6">
              Login with your credentials to access the full library. Don&apos;t have an account? Contact the administrator.
            </p>
            <Link href="/login" className="inline-block bg-amber-700 hover:bg-amber-600 text-white font-semibold px-8 py-3 rounded-lg transition-colors shadow-md">
              Login Now →
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
