'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

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
    <header className="bg-emerald-950 text-stone-100 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="font-serif italic text-xl text-amber-200">Pradip&apos;s Homoe</span>
            <span className="text-xs text-stone-400 hidden sm:inline">Personal Digital Library</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {publicItems.map(it => navLink(it.href, it.label))}
            {session?.authenticated && protectedItems.map(it => navLink(it.href, it.label))}
            {session?.authenticated && session?.role === 'admin' && adminItems.map(it => navLink(it.href, it.label))}
          </nav>

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
