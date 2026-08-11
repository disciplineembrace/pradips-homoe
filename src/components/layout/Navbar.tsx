'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image';

/**
 * Slim top utility bar.
 *
 * The primary navigation (logo + all 15 sections + login) is rendered globally
 * by <Sidebar /> in layout.tsx. This Navbar is now a slim secondary bar that:
 *   • leaves room for the Sidebar's mobile hamburger (top-left, pl-14 on mobile)
 *   • shows the public/protected/admin quick-links inline on desktop
 *   • shows the login / logout state button on the right
 *
 * It intentionally does NOT render its own logo to avoid duplication with the
 * Sidebar header.
 */
export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/session').then(r => r.json()).then(d => setSession(d)).catch(() => setSession({ authenticated: false }));
  }, [pathname]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setSession({ authenticated: false });
    router.push('/');
  }

  // Public menu items
  const publicItems = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ];
  // Protected items (require login) — show but redirect to /login if clicked without auth
  const protectedItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/data', label: 'Data' },
    { href: '/accounts', label: 'My Account' },
  ];
  // Admin-only item
  const adminItems = [
    { href: '/admin', label: 'Admin Panel' },
  ];

  function navLink(href: string, label: string) {
    const isActive = pathname === href;
    return (
      <Link
        key={href}
        href={href}
        className={`px-3 py-2 text-sm rounded-md transition-colors ${isActive ? 'bg-emerald-800 text-amber-200 font-semibold' : 'text-stone-200 hover:bg-emerald-800 hover:text-white'}`}
      >{label}</Link>
    );
  }

  return (
    <header className="bg-emerald-950 text-stone-100 shadow-lg sticky top-0 z-40 border-b-2 border-amber-700/60">
      {/* pl-14 on mobile leaves room for the Sidebar's hamburger button (top-left) */}
      <div className="max-w-7xl mx-auto px-4 pl-14 lg:pl-4">
        <div className="flex items-center justify-between h-14">
          {/* Desktop quick-links (logo lives in the global Sidebar) */}
          <nav className="hidden md:flex items-center gap-1">
            {publicItems.map(it => navLink(it.href, it.label))}
            {session?.authenticated && protectedItems.map(it => navLink(it.href, it.label))}
            {session?.authenticated && session?.role === 'admin' && adminItems.map(it => navLink(it.href, it.label))}
          </nav>

          {/* Mobile: small brand mark with real logo (Sidebar drawer has full version) */}
          <div className="md:hidden flex items-center gap-2 pl-10">
            <div className="relative w-7 h-7 rounded-full overflow-hidden ring-1 ring-[#C8A24A]/60 flex-shrink-0">
              <Image
                src="/logo.png"
                alt="Pradip's Homoe"
                fill
                priority
                sizes="28px"
                className="object-cover"
              />
            </div>
            <span className="font-serif italic text-base text-amber-200 tracking-wide">
              Pradip&apos;s Homoe
            </span>
          </div>

          {/* Auth button */}
          <div className="hidden md:flex items-center gap-2">
            {session?.authenticated ? (
              <>
                <span className="text-xs text-stone-400 hidden lg:inline">
                  {session?.name}
                  <span className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold ${
                    session.role === 'admin' ? 'bg-amber-700' :
                    session.role === 'staff' ? 'bg-blue-700' : 'bg-stone-600'
                  }`}>{session.role}</span>
                </span>
                <button onClick={logout} className="text-xs bg-red-800 hover:bg-red-700 px-3 py-1.5 rounded">Logout</button>
              </>
            ) : (
              <Link href="/login" className="text-xs bg-amber-700 hover:bg-amber-600 px-4 py-1.5 rounded font-semibold">Login →</Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded hover:bg-emerald-800"
            aria-label="Toggle menu"
          >{menuOpen ? '✕' : '☰'}</button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-3 space-y-1">
            {publicItems.map(it => (
              <Link key={it.href} href={it.href} onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm rounded hover:bg-emerald-800">{it.label}</Link>
            ))}
            {session?.authenticated && (
              <>
                <div className="border-t border-emerald-800 my-2" />
                {protectedItems.map(it => (
                  <Link key={it.href} href={it.href} onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm rounded hover:bg-emerald-800">{it.label}</Link>
                ))}
                {session?.role === 'admin' && adminItems.map(it => (
                  <Link key={it.href} href={it.href} onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm rounded hover:bg-emerald-800 text-amber-200">{it.label}</Link>
                ))}
              </>
            )}
            <div className="border-t border-emerald-800 my-2" />
            {session?.authenticated ? (
              <>
                <div className="px-3 py-1 text-xs text-stone-400">
                  {session?.name}
                  <span className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold ${
                    session.role === 'admin' ? 'bg-amber-700' :
                    session.role === 'staff' ? 'bg-blue-700' : 'bg-stone-600'
                  }`}>{session.role}</span>
                </div>
                <button onClick={() => { logout(); setMenuOpen(false); }} className="block w-full text-left px-3 py-2 text-sm rounded hover:bg-red-900 text-red-200">Logout</button>
              </>
            ) : (
              <Link href="/login" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm rounded bg-amber-700 text-white text-center font-semibold">Login →</Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
