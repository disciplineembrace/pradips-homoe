'use client';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-emerald-950 text-stone-300 mt-auto border-t-2 border-amber-700/60">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <img src="/logo-v2-92.png" alt="Logo" width="32" height="32" className="h-8 w-8 rounded-full object-cover" />
              <h3 className="font-serif italic text-lg text-amber-200 tracking-wide">Pradip&apos;s Homeo</h3>
            </div>
            <p className="text-xs text-stone-400">Personal Digital Homeopathy Library — secure access to remedies, rubrics, therapeutics, and predictive homeopathy books.</p>
          </div>
          <div>
            <h4 className="font-serif font-semibold text-sm mb-2 text-amber-200">Quick Links</h4>
            <ul className="space-y-1 text-sm">
              <li><Link href="/" className="hover:text-amber-200 transition-colors">Home</Link></li>
              <li><Link href="/about" className="hover:text-amber-200 transition-colors">About</Link></li>
              <li><Link href="/contact" className="hover:text-amber-200 transition-colors">Contact</Link></li>
              <li><Link href="/login" className="hover:text-amber-200 transition-colors">Login</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-serif font-semibold text-sm mb-2 text-amber-200">Library Stats</h4>
            <ul className="space-y-1 text-xs text-stone-400">
              <li>4,493 remedies</li>
              <li>81,463 rubrics</li>
              <li>408 therapeutic formulas</li>
              <li>23 predictive chapters</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-emerald-800 mt-6 pt-4 text-center text-xs text-stone-500">
          © 2026 Pradip&apos;s Homeo · All access is logged · Unauthorized access prohibited
        </div>
      </div>
    </footer>
  );
}
