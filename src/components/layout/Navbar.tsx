'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/auth/session').then(r => r.json()).then(d => setSession(d)).catch(() => setSession({ authenticated: false }));
  }, [pathname]);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
      // Auto-focus search after animation
      setTimeout(() => searchInputRef.current?.focus(), 350);
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  // Close menu on route change
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  async function logout() {
    setShowLogoutConfirm(false);
    await fetch('/api/auth/logout', { method: 'POST' });
    setSession({ authenticated: false });
    setMenuOpen(false);
    router.push('/');
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQ.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQ.trim())}`);
      setMenuOpen(false);
    }
  }

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/materia-medica', label: 'Library' },
    { href: '/contact', label: 'Contact' },
  ];

  const mobileMenuItems = [
    { href: '/', label: 'Home', icon: '🏠' },
    { href: '/materia-medica', label: 'Materia Medica', icon: '📚' },
    { href: '/repertory', label: 'Repertory', icon: '📖' },
    { href: '/therapeutics', label: 'Therapeutics', icon: '💊' },
    { href: '/clinical', label: 'Clinical', icon: '🩺' },
    { href: '/quick-clinical-search', label: 'Quick Search', icon: '⚡' },
    { href: '/organon', label: 'Organon', icon: '📘' },
    { href: '/analysis', label: 'Analysis', icon: '🧠' },
    { href: '/predictive', label: 'Predictive', icon: '🔬' },
    { href: '/books', label: 'Books', icon: '📚' },
    { href: '/question-bank', label: 'Question Bank', icon: '❓' },
    { href: '/about', label: 'About', icon: 'ℹ' },
    { href: '/contact', label: 'Contact', icon: '📞' },
    { href: '/dashboard', label: 'Dashboard', icon: '⚙', auth: true },
  ];

  function isActive(href: string): boolean {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  }

  return (
    <>
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

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map(it => (
                <Link key={it.href} href={it.href} className={`px-3 py-2 text-[0.7rem] font-semibold uppercase tracking-wider rounded-md transition-colors ${isActive(it.href) ? 'text-[#D4AF37] bg-[#D4AF37]/10' : 'text-stone-300 hover:text-[#D4AF37] hover:bg-[#D4AF37]/5'}`}>{it.label}</Link>
              ))}
              {session?.authenticated && (
                <Link href="/dashboard" className={`px-3 py-2 text-[0.7rem] font-semibold uppercase tracking-wider rounded-md transition-colors ${isActive('/dashboard') ? 'text-[#D4AF37] bg-[#D4AF37]/10' : 'text-stone-300 hover:text-[#D4AF37] hover:bg-[#D4AF37]/5'}`}>Dashboard</Link>
              )}
            </nav>

            {/* Desktop right */}
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

            {/* Mobile menu trigger */}
            <button onClick={() => setMenuOpen(true)} className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-semibold uppercase tracking-wider hover:bg-[#D4AF37]/10 transition-colors" aria-label="Open menu">
              <span className="text-base">☰</span> Menu
            </button>
          </div>
        </div>
      </header>

      {/* PREMIUM FULL-SCREEN MOBILE MENU */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-[100] flex flex-col" style={{ animation: 'slideInRight 0.35s ease-out' }}>
          <style>{`
            @keyframes slideInRight {
              from { transform: translateX(100%); opacity: 0.5; }
              to { transform: translateX(0); opacity: 1; }
            }
            @keyframes fadeInUp {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>

          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0B2E22] via-[#0F2B1E] to-[#061A12]"></div>
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 30% 20%, #D4AF37 0%, transparent 60%)' }}></div>

          {/* Content */}
          <div className="relative z-10 flex flex-col h-full overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[#D4AF37]/15">
              <div className="flex items-center gap-3">
                <img src="/logo-v2-92.png" alt="Pradip's Homoeo" width="44" height="44" className="h-11 w-11 rounded-full object-cover border border-[#D4AF37]/30" />
                <div>
                  <div className="font-serif italic text-lg text-[#D4AF37] leading-none">Pradip&apos;s Homoeo</div>
                  <div className="text-[0.5rem] uppercase tracking-[0.2em] text-stone-400 mt-1">Personal Digital Library</div>
                </div>
              </div>
              <button onClick={() => setMenuOpen(false)} className="w-11 h-11 flex items-center justify-center rounded-full border border-[#D4AF37]/30 text-[#D4AF37] text-xl hover:bg-[#D4AF37]/10 active:scale-90 transition-all" aria-label="Close menu">
                ✕
              </button>
            </div>

            {/* Search Bar */}
            <div className="px-5 py-4">
              <form onSubmit={handleSearch} className="relative">
                <input ref={searchInputRef} type="text" value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search remedies, rubrics, diseases..." className="w-full pl-10 pr-4 py-3 text-sm bg-[#12392C] border border-[#D4AF37]/20 rounded-xl text-stone-200 placeholder-stone-500 focus:outline-none focus:border-[#D4AF37]/50 transition-colors" />
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500 text-sm">🔍</span>
              </form>
            </div>

            {/* Menu Grid */}
            <div className="flex-1 px-5 pb-4">
              <div className="grid grid-cols-2 gap-2.5">
                {mobileMenuItems.filter(it => !it.auth || session?.authenticated).map((item, i) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all active:scale-95 ${isActive(item.href) ? 'border-[#D4AF37] bg-[#D4AF37]/10' : 'border-[#D4AF37]/15 bg-[#12392C]/60 hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/5'}`}
                    style={{ animation: `fadeInUp 0.3s ease-out ${i * 30}ms both` }}
                  >
                    <span className="text-lg flex-shrink-0">{item.icon}</span>
                    <span className={`text-xs font-semibold uppercase tracking-wide ${isActive(item.href) ? 'text-[#D4AF37]' : 'text-stone-300'}`}>{item.label}</span>
                  </Link>
                ))}
                {/* Admin Panel — admin only */}
                {session?.role === 'admin' && (
                  <Link href="/admin" onClick={() => setMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border border-[#D4AF37]/15 bg-[#12392C]/60 hover:border-[#D4AF37]/40 transition-all active:scale-95`} style={{ animation: 'fadeInUp 0.3s ease-out 0.4s both' }}>
                    <span className="text-lg">👤</span>
                    <span className="text-xs font-semibold uppercase tracking-wide text-[#D4AF37]">Admin Panel</span>
                  </Link>
                )}
              </div>
            </div>

            {/* User Section + Actions */}
            {session?.authenticated ? (
              <div className="px-5 py-4 border-t border-[#D4AF37]/15 bg-[#0B2E22]/80">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] font-bold text-sm">
                      {session.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <div className="text-sm font-serif text-[#D4AF37] font-semibold">{session.name || 'User'}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-[0.6rem] text-stone-400 capitalize">{session.role || 'user'}</span>
                        <span className="text-[0.55rem] px-1.5 py-0.5 rounded bg-[#D4AF37]/15 text-[#D4AF37] font-semibold uppercase">Premium</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href="/account" onClick={() => setMenuOpen(false)} className="flex-1 text-center py-2.5 rounded-lg border border-[#D4AF37]/20 text-xs text-stone-300 hover:bg-[#D4AF37]/5 transition-colors font-semibold uppercase tracking-wide">👤 Profile</Link>
                  <Link href="/settings" onClick={() => setMenuOpen(false)} className="flex-1 text-center py-2.5 rounded-lg border border-[#D4AF37]/20 text-xs text-stone-300 hover:bg-[#D4AF37]/5 transition-colors font-semibold uppercase tracking-wide">⚙ Settings</Link>
                  <button onClick={() => setShowLogoutConfirm(true)} className="flex-1 py-2.5 rounded-lg bg-[#8B3A3A] hover:bg-[#a04545] text-white text-xs font-bold uppercase tracking-wide transition-colors">Logout</button>
                </div>
              </div>
            ) : (
              <div className="px-5 py-4 border-t border-[#D4AF37]/15 bg-[#0B2E22]/80">
                <Link href="/login" onClick={() => setMenuOpen(false)} className="block w-full py-3 rounded-xl bg-[#D4AF37] hover:bg-[#C9A23A] text-[#0B2E22] text-center font-bold text-sm uppercase tracking-wider transition-colors">
                  Login to Access Library →
                </Link>
              </div>
            )}

            {/* Footer */}
            <div className="px-5 py-3 border-t border-[#D4AF37]/10 bg-[#061A12]">
              <div className="flex items-center justify-between text-[0.6rem] text-stone-500">
                <span>Version 3.0 · Database Updated July 2026</span>
                <span>© 2026 Pradip&apos;s Homoeo</span>
              </div>
            </div>
          </div>

          {/* Logout Confirmation Dialog */}
          {showLogoutConfirm && (
            <div className="absolute inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="bg-[#12392C] border border-[#D4AF37]/30 rounded-2xl p-6 mx-6 max-w-xs text-center">
                <div className="text-3xl mb-3">🚪</div>
                <h3 className="font-serif text-lg text-[#D4AF37] mb-2">Confirm Logout</h3>
                <p className="text-xs text-stone-400 mb-5">Are you sure you want to log out of your account?</p>
                <div className="flex gap-3">
                  <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-2.5 rounded-lg border border-[#D4AF37]/20 text-xs text-stone-300 hover:bg-[#D4AF37]/5 font-semibold uppercase tracking-wide transition-colors">Cancel</button>
                  <button onClick={logout} className="flex-1 py-2.5 rounded-lg bg-[#8B3A3A] hover:bg-[#a04545] text-white text-xs font-bold uppercase tracking-wide transition-colors">Logout</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
