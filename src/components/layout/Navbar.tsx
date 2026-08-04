'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  Home,
  BookOpen,
  Library,
  Pill,
  Stethoscope,
  Search,
  ScrollText,
  Brain,
  Microscope,
  Puzzle,
  BarChart3,
  GraduationCap,
  BookMarked,
  IdCard,
  Phone,
  UserCog,
  LogOut,
  type LucideIcon,
} from 'lucide-react';

interface MenuItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

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

  // Full menu with Lucide icons — order preserved per spec
  const menuItems: MenuItem[] = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/materia-medica', label: 'Materia Medica', icon: BookOpen },
    { href: '/repertory', label: 'Repertory', icon: Library },
    { href: '/therapeutics', label: 'Therapeutics', icon: Pill },
    { href: '/clinical', label: 'Clinical', icon: Stethoscope },
    { href: '/search', label: 'Quick Search', icon: Search },
    { href: '/organon', label: 'Organon', icon: ScrollText },
    { href: '/segal', label: 'Segal Homeopathy', icon: Brain },
    { href: '/predictive', label: 'Predictive Homeopathy', icon: Microscope },
    { href: '/synthesis', label: 'Synthesis Updated', icon: Puzzle },
    { href: '/analysis', label: 'Analysis Tools', icon: BarChart3 },
    { href: '/question-bank', label: 'Exam Hub', icon: GraduationCap },
    { href: '/books', label: 'Books', icon: BookMarked },
    { href: '/about', label: 'About', icon: IdCard },
    { href: '/contact', label: 'Contact', icon: Phone },
  ];

  // Admin-only item
  const adminItem: MenuItem = { href: '/admin', label: 'Admin Panel', icon: UserCog };

  function isActive(href: string): boolean {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  }

  return (
    <header className="bg-[#173B2D] text-stone-100 shadow-lg sticky top-0 z-50 border-b-2 border-[#C8A24A]/40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <div className="font-serif italic text-2xl text-[#C8A24A] leading-none">Pradip&apos;s Homoe</div>
            <div className="text-[0.6rem] uppercase tracking-[0.15em] text-stone-400 mt-0.5">Personal Digital Library</div>
          </Link>

          {/* Desktop nav — scrollable horizontal menu with icons */}
          <nav className="hidden lg:flex items-center gap-0.5 flex-1 overflow-x-auto scrollbar-thin">
            {menuItems.map(it => {
              const Icon = it.icon;
              return (
                <Link
                  key={it.label}
                  href={it.href}
                  className={`flex items-center gap-1.5 px-2.5 py-2 text-[0.7rem] font-semibold uppercase tracking-wider rounded transition-colors whitespace-nowrap ${
                    isActive(it.href)
                      ? 'bg-[#C8A24A] text-[#173B2D]'
                      : 'text-stone-200 hover:bg-[#2a5443] hover:text-[#C8A24A]'
                  }`}
                >
                  <Icon size={14} strokeWidth={2} className="flex-shrink-0" />
                  <span>{it.label}</span>
                </Link>
              );
            })}
            {session?.authenticated && session?.role === 'admin' && (
              <Link
                href={adminItem.href}
                className={`flex items-center gap-1.5 px-2.5 py-2 text-[0.7rem] font-semibold uppercase tracking-wider rounded transition-colors whitespace-nowrap ${
                  isActive(adminItem.href)
                    ? 'bg-[#C8A24A] text-[#173B2D]'
                    : 'text-stone-200 hover:bg-[#2a5443] hover:text-[#C8A24A]'
                }`}
              >
                <adminItem.icon size={14} strokeWidth={2} className="flex-shrink-0" />
                <span>{adminItem.label}</span>
              </Link>
            )}
          </nav>

          {/* Right side: search + auth */}
          <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Quick search..."
                className="w-40 px-3 py-1.5 pr-8 text-xs bg-[#0f2a20] border border-[#C8A24A]/30 rounded text-stone-100 placeholder-stone-500 focus:outline-none focus:border-[#C8A24A]"
              />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-[#C8A24A]">
                <Search size={14} strokeWidth={2} />
              </button>
            </form>
            {session?.authenticated ? (
              <>
                <Link href="/account" className="text-xs text-stone-300 hover:text-[#C8A24A] px-2">
                  {session?.name?.split(' ')[0] || 'Account'}
                </Link>
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 text-xs bg-[#6E2A3A] hover:bg-[#8a3548] px-3 py-1.5 rounded font-semibold transition-colors"
                >
                  <LogOut size={14} strokeWidth={2} />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <Link href="/login" className="text-xs bg-[#C8A24A] hover:bg-[#d4b560] text-[#173B2D] px-4 py-1.5 rounded font-bold uppercase tracking-wider transition-colors">
                Login
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden p-2 rounded hover:bg-[#2a5443] border border-[#C8A24A]/40"
            aria-label="Toggle menu"
          >
            <span className="text-[#C8A24A] font-semibold text-sm">≡ Menu</span>
          </button>
        </div>
      </div>

      {/* Mobile menu — sidebar drawer style with icons */}
      {menuOpen && (
        <div className="lg:hidden bg-[#173B2D] border-t border-[#C8A24A]/30">
          <div className="max-w-7xl mx-auto px-4 py-3 space-y-2">
            {/* Search */}
            <form onSubmit={handleSearch} className="relative mb-3">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Quick search remedies, rubrics..."
                className="w-full px-3 py-2 pr-10 text-sm bg-[#0f2a20] border border-[#C8A24A]/30 rounded text-stone-100 placeholder-stone-500 focus:outline-none focus:border-[#C8A24A]"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#C8A24A]">
                <Search size={16} strokeWidth={2} />
              </button>
            </form>

            {/* Menu items grid with icons */}
            <div className="grid grid-cols-2 gap-1">
              {menuItems.map(it => {
                const Icon = it.icon;
                return (
                  <Link
                    key={it.label}
                    href={it.href}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider rounded transition-colors ${
                      isActive(it.href) ? 'bg-[#C8A24A] text-[#173B2D]' : 'text-stone-200 hover:bg-[#2a5443]'
                    }`}
                  >
                    <Icon size={16} strokeWidth={2} className="flex-shrink-0" />
                    <span className="truncate">{it.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Admin + Auth section */}
            <div className="border-t border-[#C8A24A]/20 pt-2 mt-2 space-y-1">
              {session?.authenticated && session?.role === 'admin' && (
                <Link
                  href={adminItem.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider rounded transition-colors ${
                    isActive(adminItem.href) ? 'bg-[#C8A24A] text-[#173B2D]' : 'text-[#C8A24A] hover:bg-[#2a5443]'
                  }`}
                >
                  <adminItem.icon size={16} strokeWidth={2} className="flex-shrink-0" />
                  <span>{adminItem.label}</span>
                </Link>
              )}
              {session?.authenticated ? (
                <div className="flex items-center justify-between gap-2">
                  <Link href="/account" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 text-sm text-[#C8A24A]">
                    <IdCard size={16} strokeWidth={2} />
                    <span>{session?.name}</span>
                  </Link>
                  <button
                    onClick={() => { logout(); setMenuOpen(false); }}
                    className="flex items-center gap-1.5 text-xs bg-[#6E2A3A] text-white px-3 py-2 rounded hover:bg-[#8a3548] transition-colors"
                  >
                    <LogOut size={14} strokeWidth={2} />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-bold text-center bg-[#C8A24A] text-[#173B2D] rounded uppercase transition-colors hover:bg-[#d4b560]"
                >
                  <LogOut size={16} strokeWidth={2} className="rotate-180" />
                  <span>Login →</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
