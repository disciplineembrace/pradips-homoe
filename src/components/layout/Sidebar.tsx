'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image';
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
  Target,
  UserCog,
  LogOut,
  X,
  Menu,
  type LucideIcon,
} from 'lucide-react';

interface MenuItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<any>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/session').then(r => r.json()).then(d => setSession(d)).catch(() => setSession({ authenticated: false }));
  }, [pathname]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setSession({ authenticated: false });
    router.push('/');
    setMobileOpen(false);
  }

  // 17 menu items — exact order per spec
  const menuItems: MenuItem[] = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/materia-medica', label: 'Materia Medica', icon: BookOpen },
    { href: '/repertory', label: 'Repertory', icon: Library },
    { href: '/single-rubrics-single-remedy', label: 'Single Rubrics Single Remedy', icon: Target },
    { href: '/therapeutics', label: 'Therapeutics', icon: Pill },
    { href: '/clinical', label: 'Clinical', icon: Stethoscope },
    { href: '/quick-clinical-search', label: 'Quick Clinical Search', icon: Search },
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

  const adminItem: MenuItem = { href: '/admin', label: 'Admin Panel', icon: UserCog };

  function isActive(href: string): boolean {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  }

  // Render a single menu item
  function renderNavItem(item: MenuItem) {
    const Icon = item.icon;
    const active = isActive(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setMobileOpen(false)}
        className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
          active
            ? 'bg-[#C8A24A] text-[#173B2D] shadow-sm'
            : 'text-stone-200 hover:bg-[#2a5443] hover:text-[#C8A24A]'
        }`}
      >
        <Icon
          size={18}
          strokeWidth={2}
          className={`flex-shrink-0 transition-colors ${active ? 'text-[#173B2D]' : 'text-stone-400 group-hover:text-[#C8A24A]'}`}
        />
        <span className="truncate">{item.label}</span>
      </Link>
    );
  }

  // Sidebar content (shared between desktop and mobile)
  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo / Brand header */}
      <div className="px-4 py-4 border-b border-[#C8A24A]/20">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative w-10 h-10 flex-shrink-0 rounded-full overflow-hidden ring-2 ring-[#C8A24A]/60 shadow-md group-hover:scale-105 transition-transform">
            <Image
              src="/logo.png"
              alt="Pradip's Homoe logo"
              fill
              priority
              sizes="40px"
              className="object-cover"
            />
          </div>
          <div className="min-w-0">
            <div className="font-serif italic text-lg text-[#C8A24A] leading-tight truncate">Pradip&apos;s Homoe</div>
            <div className="text-[0.6rem] uppercase tracking-[0.12em] text-stone-400 truncate">Personal Digital Library</div>
          </div>
        </Link>
      </div>

      {/* Navigation menu — scrollable */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5 scrollbar-thin">
        {menuItems.map(renderNavItem)}
        {session?.authenticated && session?.role === 'admin' && renderNavItem(adminItem)}
      </nav>

      {/* User section + Logout */}
      <div className="px-2 py-3 border-t border-[#C8A24A]/20 space-y-1">
        {session?.authenticated ? (
          <>
            <Link
              href="/account"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-stone-300 hover:bg-[#2a5443] hover:text-[#C8A24A] transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-[#C8A24A]/30 border border-[#C8A24A]/50 flex items-center justify-center flex-shrink-0">
                <span className="text-[#C8A24A] text-xs font-bold">
                  {session?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="min-w-0">
                <div className="text-sm text-stone-200 truncate">{session?.name || 'User'}</div>
                <div className="text-[0.65rem] text-stone-500 uppercase tracking-wider">{session?.role || 'user'}</div>
              </div>
            </Link>
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-300 hover:bg-red-900/40 hover:text-red-200 transition-colors"
            >
              <LogOut size={18} strokeWidth={2} className="flex-shrink-0" />
              <span>Logout</span>
            </button>
          </>
        ) : (
          <Link
            href="/login"
            onClick={() => setMobileOpen(false)}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-bold bg-[#C8A24A] text-[#173B2D] hover:bg-[#d4b560] transition-colors"
          >
            <LogOut size={18} strokeWidth={2} className="rotate-180 flex-shrink-0" />
            <span>Login</span>
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger button — fixed top-left */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-50 p-2 rounded-lg bg-[#173B2D] text-[#C8A24A] border border-[#C8A24A]/40 shadow-lg"
        aria-label="Open menu"
      >
        <Menu size={22} strokeWidth={2} />
      </button>

      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer — slides from left */}
      <aside
        className={`lg:hidden fixed top-0 left-0 h-full w-72 bg-[#173B2D] z-50 shadow-2xl transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-lg text-stone-400 hover:bg-[#2a5443] hover:text-[#C8A24A] transition-colors"
          aria-label="Close menu"
        >
          <X size={20} strokeWidth={2} />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop fixed sidebar */}
      <aside className="hidden lg:flex fixed top-0 left-0 h-full w-64 bg-[#173B2D] border-r border-[#C8A24A]/20 flex-col z-30">
        {sidebarContent}
      </aside>
    </>
  );
}
