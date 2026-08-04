'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Search, ChevronDown } from 'lucide-react';

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/session').then(r => r.json()).then(d => setSession(d)).catch(() => setSession({ authenticated: false }));
  }, [pathname]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setSession({ authenticated: false });
    setProfileOpen(false);
    router.push('/');
  }

  // Get page title from path
  function getPageTitle(): string {
    if (pathname === '/') return 'Home';
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length === 0) return 'Home';
    const title = parts[0].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    return title;
  }

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-stone-200 shadow-sm">
      <div className="px-4 lg:px-6 py-3 flex items-center justify-between gap-4">
        {/* Left: page title (with spacer for mobile hamburger) */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Spacer for mobile hamburger button (which is fixed) */}
          <div className="lg:hidden w-10"></div>
          <h1 className="text-lg font-serif font-semibold text-[#173B2D] truncate">
            {getPageTitle()}
          </h1>
        </div>

        {/* Center: search bar (desktop) */}
        <div className="hidden md:flex flex-1 max-w-md">
          <form onSubmit={handleSearch} className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search anything..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-stone-100 border border-stone-200 rounded-lg text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#C8A24A] focus:bg-white transition-colors"
            />
            <Search
              size={16}
              strokeWidth={2}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
            />
          </form>
        </div>

        {/* Right: user profile / login */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {session?.authenticated ? (
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-stone-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-[#173B2D] flex items-center justify-center flex-shrink-0">
                  <span className="text-[#C8A24A] text-sm font-bold">
                    {session?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium text-stone-800 leading-tight">
                    {session?.name?.split(' ')[0] || 'User'}
                  </div>
                  <div className="text-[0.65rem] text-stone-500 uppercase tracking-wider leading-tight">
                    {session?.role || 'user'}
                  </div>
                </div>
                <ChevronDown
                  size={16}
                  strokeWidth={2}
                  className={`text-stone-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Dropdown */}
              {profileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setProfileOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-xl border border-stone-200 py-1 z-20">
                    <div className="px-4 py-2 border-b border-stone-100">
                      <div className="text-sm font-medium text-stone-800">{session?.name}</div>
                      <div className="text-xs text-stone-500">{session?.email || ''}</div>
                    </div>
                    <Link
                      href="/account"
                      onClick={() => setProfileOpen(false)}
                      className="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
                    >
                      My Account
                    </Link>
                    {session?.role === 'admin' && (
                      <Link
                        href="/admin"
                        onClick={() => setProfileOpen(false)}
                        className="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
                      >
                        Admin Panel
                      </Link>
                    )}
                    <Link
                      href="/settings"
                      onClick={() => setProfileOpen(false)}
                      className="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
                    >
                      Settings
                    </Link>
                    <div className="border-t border-stone-100 mt-1 pt-1">
                      <button
                        onClick={logout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-[#C8A24A] text-[#173B2D] rounded-lg hover:bg-[#d4b560] transition-colors"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
