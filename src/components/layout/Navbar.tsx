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

  // Close menu on route change
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  // Lock body scroll when menu open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setSession({ authenticated: false });
    setMenuOpen(false);
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
    { href: '/', label: 'Home', icon: '🏠' },
    { href: '/materia-medica', label: 'Materia Medica', icon: '📚' },
    { href: '/repertory', label: 'Repertory', icon: '📖' },
    { href: '/therapeutics', label: 'Therapeutics', icon: '💊' },
    { href: '/clinical', label: 'Clinical', icon: '🩺' },
    { href: '/quick-clinical-search', label: 'Quick Search', icon: '⚡' },
    { href: '/organon', label: 'Organon', icon: '📘' },
    { href: '/segal', label: 'Segal', icon: '🧠' },
    { href: '/predictive', label: 'Predictive', icon: '🔬' },
    { href: '/synthesis', label: 'Synthesis', icon: '🔬' },
    { href: '/analysis', label: 'Analysis', icon: '📊' },
    { href: '/books', label: 'Books', icon: '📚' },
    { href: '/question-bank', label: 'Question Bank', icon: '❓' },
    { href: '/about', label: 'About', icon: 'ℹ' },
    { href: '/contact', label: 'Contact', icon: '📞' },
  ];

  function isActive(href: string): boolean {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  }

  return (
    <>
      <header className="bg-[#173B2D] text-stone-100 shadow-lg sticky top-0 z-50 border-b-2 border-[#C8A24A]/40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16 gap-3">
            {/* Logo + Brand — subtitle BELOW name */}
            <Link href="/" className="flex-shrink-0 flex items-center gap-2">
              <img src="/logo-v2-92.png" alt="Pradip's Homoeo" width="36" height="36" className="h-9 w-9 rounded-full object-cover flex-shrink-0" />
              <div className="flex flex-col">
                <span className="font-serif italic text-xl text-[#C8A24A] leading-none">Pradip&apos;s Homoe</span>
                <span className="text-[0.55rem] uppercase tracking-[0.15em] text-stone-400 mt-0.5">Personal Digital Library</span>
              </div>
            </Link>

            {/* Desktop nav */}
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

            {/* Desktop right */}
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

            {/* Mobile hamburger button */}
            <button
              onClick={() => setMenuOpen(true)}
              className="lg:hidden flex items-center gap-1.5 px-3 py-2 rounded border border-[#C8A24A]/40 text-[#C8A24A] hover:bg-[#C8A24A]/10 transition-colors"
              aria-label="Open menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span className="text-xs font-semibold uppercase tracking-wider">Menu</span>
            </button>
          </div>
        </div>
      </header>

      {/* SIDE DRAWER MOBILE MENU */}
      {menuOpen && (
        <>
          {/* Overlay */}
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-[99]"
            onClick={() => setMenuOpen(false)}
          />

          {/* Drawer — slides from right */}
          <div
            className="lg:hidden fixed top-0 right-0 bottom-0 w-[85%] max-w-sm bg-[#173B2D] z-[100] flex flex-col overflow-y-auto"
            style={{ animation: 'slideIn 0.3s ease-out' }}
          >
            <style>{`
              @keyframes slideIn {
                from { transform: translateX(100%); }
                to { transform: translateX(0); }
              }
            `}</style>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-[#C8A24A]/30 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <img src="/logo-v2-92.png" alt="Pradip's Homoeo" width="36" height="36" className="h-9 w-9 rounded-full object-cover" />
                <div className="flex flex-col">
                  <span className="font-serif italic text-lg text-[#C8A24A] leading-none">Pradip&apos;s Homoe</span>
                  <span className="text-[0.5rem] uppercase tracking-[0.15em] text-stone-400 mt-0.5">Personal Digital Library</span>
                </div>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full border border-[#C8A24A]/30 text-[#C8A24A] hover:bg-[#C8A24A]/10 transition-colors text-xl"
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            {/* Search */}
            <div className="px-4 py-3 flex-shrink-0">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search remedies, rubrics..."
                  className="w-full px-4 py-2.5 pr-10 text-sm bg-[#0f2a20] border border-[#C8A24A]/30 rounded-lg text-stone-100 placeholder-stone-500 focus:outline-none focus:border-[#C8A24A]"
                />
                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#C8A24A]">🔍</button>
              </form>
            </div>

            {/* Menu items */}
            <div className="flex-1 px-3 pb-2">
              <div className="grid grid-cols-2 gap-1.5">
                {menuItems.map(it => (
                  <Link
                    key={it.label}
                    href={it.href}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wide transition-colors ${
                      isActive(it.href)
                        ? 'bg-[#C8A24A] text-[#173B2D]'
                        : 'text-stone-200 hover:bg-[#2a5443]'
                    }`}
                  >
                    <span className="text-sm">{it.icon}</span>
                    <span>{it.label}</span>
                  </Link>
                ))}
              </div>

              {/* Admin link */}
              {session?.authenticated && session?.role === 'admin' && (
                <Link
                  href="/admin"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 mt-2 rounded-lg text-xs font-semibold uppercase tracking-wide bg-[#C8A24A]/20 text-[#C8A24A] w-full"
                >
                  <span className="text-sm">👤</span>
                  <span>Admin Panel</span>
                </Link>
              )}
            </div>

            {/* User section */}
            <div className="px-4 py-3 border-t border-[#C8A24A]/20 flex-shrink-0">
              {session?.authenticated ? (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#C8A24A]/20 border border-[#C8A24A]/30 flex items-center justify-center text-[#C8A24A] font-bold text-xs flex-shrink-0">
                      {session.name?.charAt(0) || 'U'}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs text-[#C8A24A] font-semibold truncate">{session.name || 'User'}</div>
                      <div className="text-[0.6rem] text-stone-400 capitalize">{session.role || 'user'}</div>
                    </div>
                  </div>
                  <button onClick={logout} className="text-xs bg-[#6E2A3A] hover:bg-[#8a3548] text-white px-3 py-1.5 rounded font-semibold flex-shrink-0">
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block w-full py-2.5 text-center bg-[#C8A24A] hover:bg-[#d4b560] text-[#173B2D] rounded-lg font-bold text-sm uppercase tracking-wider transition-colors"
                >
                  Login →
                </Link>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
