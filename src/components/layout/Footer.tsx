'use client';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-[#0B2E22] text-stone-300 mt-auto border-t border-[#D4AF37]/20">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-3">
              <img src="/logo-v2-92.png" alt="Pradip's Homoeo" width="36" height="36" className="h-9 w-9 rounded-full object-cover" />
              <div>
                <div className="font-serif italic text-lg text-[#D4AF37] leading-none">Pradip&apos;s Homoeo</div>
                <div className="text-[0.55rem] uppercase tracking-[0.15em] text-stone-500 mt-0.5">Personal Digital Library</div>
              </div>
            </div>
            <p className="text-xs text-stone-500 leading-relaxed mb-4">Building the most comprehensive digital homeopathy library for students and practitioners.</p>
            <div className="flex gap-2">
              <span className="px-2 py-1 text-[0.6rem] bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded text-[#D4AF37] font-semibold">🔒 Secure</span>
              <span className="px-2 py-1 text-[0.6rem] bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded text-[#D4AF37] font-semibold">🛡️ Private</span>
              <span className="px-2 py-1 text-[0.6rem] bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded text-[#D4AF37] font-semibold">✓ Trusted</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-serif font-semibold text-sm mb-3 text-[#D4AF37]">Quick Links</h4>
            <ul className="space-y-1.5 text-xs">
              <li><Link href="/" className="text-stone-400 hover:text-[#D4AF37] transition-colors">→ Home</Link></li>
              <li><Link href="/about" className="text-stone-400 hover:text-[#D4AF37] transition-colors">→ About</Link></li>
              <li><Link href="/materia-medica" className="text-stone-400 hover:text-[#D4AF37] transition-colors">→ Library</Link></li>
              <li><Link href="/contact" className="text-stone-400 hover:text-[#D4AF37] transition-colors">→ Contact</Link></li>
              <li><Link href="/login" className="text-stone-400 hover:text-[#D4AF37] transition-colors">→ Login</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-serif font-semibold text-sm mb-3 text-[#D4AF37]">Legal & Database</h4>
            <ul className="space-y-1.5 text-xs">
              <li className="text-stone-500">📚 4,493 Remedies</li>
              <li className="text-stone-500">🔬 81,463 Rubrics</li>
              <li className="text-stone-500">🌿 408 Formulas</li>
              <li className="text-stone-500">📖 10 Authors</li>
              <li className="text-stone-500 pt-1">© Copyright Protected</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-serif font-semibold text-sm mb-3 text-[#D4AF37]">Contact</h4>
            <p className="text-xs text-stone-500 mb-3">Administrator access only. Contact admin for credentials.</p>
            <div className="flex gap-3 mb-3">
              <a href="#" className="w-8 h-8 rounded-full bg-[#12392C] border border-[#D4AF37]/20 flex items-center justify-center text-sm hover:border-[#D4AF37]/50 transition-colors" title="Instagram">📷</a>
              <a href="#" className="w-8 h-8 rounded-full bg-[#12392C] border border-[#D4AF37]/20 flex items-center justify-center text-sm hover:border-[#D4AF37]/50 transition-colors" title="YouTube">▶️</a>
              <a href="#" className="w-8 h-8 rounded-full bg-[#12392C] border border-[#D4AF37]/20 flex items-center justify-center text-sm hover:border-[#D4AF37]/50 transition-colors" title="Facebook">f</a>
              <a href="#" className="w-8 h-8 rounded-full bg-[#12392C] border border-[#D4AF37]/20 flex items-center justify-center text-sm hover:border-[#D4AF37]/50 transition-colors" title="X">✕</a>
            </div>
            <div className="inline-block px-3 py-1 text-[0.6rem] bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded text-[#D4AF37] font-semibold">Version 3.0</div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[#D4AF37]/10 mt-8 pt-5 flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-[0.7rem] text-stone-500">© 2026 Pradip&apos;s Homoeo · All Rights Reserved · Unauthorized access prohibited.</p>
          <p className="text-[0.65rem] text-stone-600">All access is logged. Database last updated: July 2026</p>
        </div>
      </div>
    </footer>
  );
}
