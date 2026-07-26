'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setMenuOpen(false);
    }
  }

  const menuItems = [
    { href: '/', label: 'Home' },
    { href: '/materia-medica', label: 'Materia Medica' },
    { href: '/repertory', label: 'Repertory' },
    { href: '/therapeutics', label: 'Therapeutics' },
    { href: '/clinical', label: 'Clinical' },
    { href: '/quick-clinical-search', label: 'Quick Search' },
    { href: '/organon', label: 'Organon' },
    { href: '/segal', label: 'Segal' },
    { href: '/predictive', label: 'Predictive' },
    { href: '/synthesis', label: 'Synthesis' },
    { href: '/analysis', label: 'Analysis' },
    { href: '/books', label: 'Books' },
    { href: '/question-bank', label: 'Question Bank' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ];

  function isActive(href: string): boolean {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  }

  return (
    <header className="bg-[#173B2D] text-stone-100 shadow-lg sticky top-0 z-50 border-b-2 border-[#C8A24A]/40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          <Link href="/" className="flex-shrink-0">
            <div className="font-serif italic text-2xl text-[#C8A24A] leading-none">Pradip&apos;s Homoe</div>
            <div className="text-[0.6rem] uppercase tracking-[0.15em] text-stone-400 mt-0.5">Personal Digital Library</div>
          </Link>

          <nav className="hidden lg:flex items-center gap-0.5 flex-1 overflow-x-auto">
            {menuItems.map(it => (
              <Link
                key={it.label}
                href={it.href}
                className={`px-2.5 py-2 text-[0.7rem] font-semibold uppercase tracking-wider rounded transition-colors whitespace-nowrap ${
                  isActive(it.href)
                    ? 'bg-[#C8A24A] text-[#173B2D]'
                    : 'text-stone-200 hover:bg-[#2a5443] hover:text-[#C8A24A]'
                }`}
              >{it.label}</Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Quick search..."
                className="w-40 px-3 py-1.5 pr-8 text-xs bg-[#0f2a20] border border-[#C8A24A]/30 rounded text-stone-100 placeholder-stone-500 focus:outline-none focus:border-[#C8A24A]"
              />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-[#C8A24A]">🔍</button>
            </form>
            {session?.authenticated ? (
              <>
                <Link href="/account" className="text-xs text-stone-300 hover:text-[#C8A24A] px-2">
                  {session?.name?.split(' ')[0] || 'Account'}
                </Link>
                {session?.role === 'admin' && (
                  <Link href="/admin" className="text-xs bg-[#C8A24A]/20 text-[#C8A24A] px-2 py-1 rounded font-semibold hover:bg-[#C8A24A]/30">Admin</Link>
                )}
                <button onClick={logout} className="text-xs bg-[#6E2A3A] hover:bg-[#8a3548] px-3 py-1.5 rounded font-semibold">Logout</button>
              </>
            ) : (
              <Link href="/login" className="text-xs bg-[#C8A24A] hover:bg-[#d4b560] text-[#173B2D] px-4 py-1.5 rounded font-bold uppercase tracking-wider">Login</Link>
            )}
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden p-2 rounded hover:bg-[#2a5443] border border-[#C8A24A]/40"
            aria-label="Toggle menu"
          >
            <span className="text-[#C8A24A] font-semibold text-sm">≡ Menu</span>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="lg:hidden bg-[#173B2D] border-t border-[#C8A24A]/30">
          <div className="max-w-7xl mx-auto px-4 py-3 space-y-2">
            <form onSubmit={handleSearch} className="relative mb-3">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Quick search remedies, rubrics..."
                className="w-full px-3 py-2 pr-8 text-sm bg-[#0f2a20] border border-[#C8A24A]/30 rounded text-stone-100 placeholder-stone-500 focus:outline-none focus:border-[#C8A24A]"
              />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-[#C8A24A]">🔍</button>
            </form>
            <div className="grid grid-cols-2 gap-1">
              {menuItems.map(it => (
                <Link
                  key={it.label}
                  href={it.href}
                  onClick={() => setMenuOpen(false)}
                  className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded ${
                    isActive(it.href) ? 'bg-[#C8A24A] text-[#173B2D]' : 'text-stone-200 hover:bg-[#2a5443]'
                  }`}
                >{it.label}</Link>
              ))}
            </div>
            <div className="border-t border-[#C8A24A]/20 pt-2 mt-2">
              {session?.authenticated ? (
                <div className="flex items-center justify-between">
                  <Link href="/account" onClick={() => setMenuOpen(false)} className="text-sm text-[#C8A24A]">{session?.name}</Link>
                  <button onClick={() => { logout(); setMenuOpen(false); }} className="text-xs bg-[#6E2A3A] text-white px-3 py-1.5 rounded">Logout</button>
                </div>
              ) : (
                <Link href="/login" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm font-bold text-center bg-[#C8A24A] text-[#173B2D] rounded uppercase">Login →</Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
