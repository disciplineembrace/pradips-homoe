'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');

  useEffect(() => {
    fetch('/api/auth/session').then(r => r.json()).then(d => setSession(d)).catch(() => setSession({ authenticated: false }));
  }, [pathname]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setSession({ authenticated: false });
    router.push('/');
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQ.trim()) router.push(`/search?q=${encodeURIComponent(searchQ.trim())}`);
  }

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/materia-medica', label: 'Library' },
    { href: '/contact', label: 'Contact' },
  ];

  function isActive(href: string): boolean {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  }

  return (
    <header className="bg-[#0B2E22]/95 backdrop-blur-md text-stone-100 shadow-lg sticky top-0 z-50 border-b border-[#D4AF37]/25">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo + Brand */}
          <Link href="/" className="flex-shrink-0 flex items-center gap-2.5">
            <img src="/logo-v2-92.png" alt="Pradip's Homoeo" width="40" height="40" className="h-9 w-9 md:h-10 md:w-10 rounded-full object-cover flex-shrink-0" />
            <div className="hidden sm:block">
              <div className="font-serif italic text-lg text-[#D4AF37] leading-none tracking-wide">Pradip&apos;s Homoeo</div>
              <div className="text-[0.55rem] uppercase tracking-[0.18em] text-stone-400 mt-0.5">Personal Digital Library</div>
            </div>
          </Link>

          {/* Center Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map(it => (
              <Link key={it.href} href={it.href} className={`px-3 py-2 text-[0.7rem] font-semibold uppercase tracking-wider rounded-md transition-colors ${isActive(it.href) ? 'text-[#D4AF37] bg-[#D4AF37]/10' : 'text-stone-300 hover:text-[#D4AF37] hover:bg-[#D4AF37]/5'}`}>{it.label}</Link>
            ))}
            {session?.authenticated && (
              <Link href="/dashboard" className={`px-3 py-2 text-[0.7rem] font-semibold uppercase tracking-wider rounded-md transition-colors ${isActive('/dashboard') ? 'text-[#D4AF37] bg-[#D4AF37]/10' : 'text-stone-300 hover:text-[#D4AF37] hover:bg-[#D4AF37]/5'}`}>Dashboard</Link>
            )}
          </nav>

          {/* Right: Search + Auth */}
          <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
            <form onSubmit={handleSearch} className="relative">
              <input type="text" value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search..." className="w-32 xl:w-40 pl-8 pr-3 py-1.5 text-xs bg-[#12392C] border border-[#D4AF37]/20 rounded-full text-stone-200 placeholder-stone-500 focus:outline-none focus:border-[#D4AF37]/50 focus:w-44 xl:focus:w-52 transition-all" />
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-500 text-xs">🔍</span>
            </form>
            {session?.authenticated ? (
              <div className="flex items-center gap-2">
                {session?.role === 'admin' && <Link href="/admin" className="text-xs bg-[#D4AF37]/20 text-[#D4AF37] px-2 py-1 rounded font-semibold hover:bg-[#D4AF37]/30">Admin</Link>}
                <button onClick={logout} className="text-xs bg-[#6E2A3A]/80 hover:bg-[#6E2A3A] text-white px-3 py-1.5 rounded font-semibold">Logout</button>
              </div>
            ) : (
              <Link href="/login" className="text-xs bg-[#D4AF37] hover:bg-[#C9A23A] text-[#0B2E22] px-4 py-1.5 rounded-full font-bold uppercase tracking-wider transition-colors">Login</Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden p-2 rounded hover:bg-[#D4AF37]/10 text-[#D4AF37]" aria-label="Toggle menu">
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden border-t border-[#D4AF37]/15 bg-[#0B2E22]/98 backdrop-blur-md">
          <div className="px-4 py-3 space-y-1">
            <form onSubmit={handleSearch} className="relative mb-3">
              <input type="text" value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search remedies, rubrics..." className="w-full pl-8 pr-3 py-2 text-sm bg-[#12392C] border border-[#D4AF37]/20 rounded-full text-stone-200 placeholder-stone-500 focus:outline-none focus:border-[#D4AF37]/50" />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500">🔍</span>
            </form>
            {navItems.map(it => (
              <Link key={it.href} href={it.href} onClick={() => setMenuOpen(false)} className={`block px-3 py-2 text-sm rounded ${isActive(it.href) ? 'bg-[#D4AF37]/10 text-[#D4AF37] font-semibold' : 'text-stone-300 hover:bg-[#D4AF37]/5'}`}>{it.label}</Link>
            ))}
            {session?.authenticated && (
              <>
                <div className="border-t border-[#D4AF37]/10 my-2" />
                <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm rounded text-stone-300 hover:bg-[#D4AF37]/5">Dashboard</Link>
                <Link href="/materia-medica" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm rounded text-stone-300 hover:bg-[#D4AF37]/5">Materia Medica</Link>
                <Link href="/synthesis" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm rounded text-stone-300 hover:bg-[#D4AF37]/5">Synthesis Repertory</Link>
                <Link href="/question-bank" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm rounded text-stone-300 hover:bg-[#D4AF37]/5">MCQ Practice</Link>
                {session?.role === 'admin' && <Link href="/admin" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm rounded text-[#D4AF37] font-semibold">Admin Panel</Link>}
                <button onClick={() => { logout(); setMenuOpen(false); }} className="block w-full text-left px-3 py-2 text-sm rounded text-red-300 hover:bg-red-900/20">Logout</button>
              </>
            )}
            {!session?.authenticated && (
              <Link href="/login" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm rounded bg-[#D4AF37] text-[#0B2E22] text-center font-bold">Login →</Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
