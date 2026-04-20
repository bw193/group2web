'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Image, Package, FolderTree, Info, MessageSquare,
  Users, Settings, LogOut, Menu, X, ChevronRight, KeyRound, HelpCircle, Home
} from 'lucide-react';

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  mustChangePassword: boolean;
}

const AuthContext = createContext<{ user: User | null; loading: boolean }>({ user: null, loading: true });
export const useAuth = () => useContext(AuthContext);

type SidebarItem = {
  href: string;
  icon: typeof LayoutDashboard;
  label: string;
  adminOnly?: boolean;
  group: 'overview' | 'home' | 'catalog' | 'company' | 'admin';
};

const sidebarItems: SidebarItem[] = [
  // Overview
  { href: '/cms/dashboard', icon: LayoutDashboard, label: 'Dashboard', group: 'overview' },

  // Home page surfaces — all of these render on the public homepage
  { href: '/cms/banners', icon: Image, label: 'Hero Banners', group: 'home' },
  { href: '/cms/faqs', icon: HelpCircle, label: 'FAQ', group: 'home' },

  // Catalog
  { href: '/cms/products', icon: Package, label: 'Products', group: 'catalog' },
  { href: '/cms/categories', icon: FolderTree, label: 'Categories', group: 'catalog' },

  // Company / About — facility & certification galleries live here too
  { href: '/cms/about', icon: Info, label: 'About & Galleries', group: 'company' },
  { href: '/cms/inquiries', icon: MessageSquare, label: 'Inquiries', group: 'company' },

  // Admin
  { href: '/cms/users', icon: Users, label: 'Users', adminOnly: true, group: 'admin' },
  { href: '/cms/settings', icon: Settings, label: 'Settings', adminOnly: true, group: 'admin' },
];

const groupLabels: Record<SidebarItem['group'], string> = {
  overview: 'Overview',
  home: 'Home Page',
  catalog: 'Catalog',
  company: 'Company',
  admin: 'Administration',
};

const groupOrder: SidebarItem['group'][] = ['overview', 'home', 'catalog', 'company', 'admin'];

export default function CMSClientLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const isAuthPage = pathname === '/cms/login' || pathname === '/cms/register';

  useEffect(() => {
    if (isAuthPage) {
      setLoading(false);
      return;
    }

    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) throw new Error('Not authenticated');
        return res.json();
      })
      .then((data) => {
        setUser(data);
        if (data.mustChangePassword && pathname !== '/cms/change-password') {
          router.push('/cms/change-password');
        }
      })
      .catch(() => {
        router.push('/cms/login');
      })
      .finally(() => setLoading(false));
  }, [pathname, isAuthPage, router]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/cms/login');
  }

  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AuthContext.Provider value={{ user, loading }}>
          {children}
        </AuthContext.Provider>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-text-secondary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AuthContext.Provider value={{ user, loading }}>
        <div className="flex h-screen">
          {/* Sidebar */}
          <aside
            className={`fixed lg:static inset-y-0 left-0 z-40 w-72 bg-[#1a1612] text-white transform transition-transform lg:translate-x-0 flex flex-col ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            {/* Brand */}
            <div className="flex items-center justify-between h-20 px-6 border-b border-white/[0.06]">
              <Link href="/cms/dashboard" className="block">
                <span className="block text-[9px] tracking-[0.35em] text-[#C4AD8F] font-medium uppercase mb-1">
                  Chengtai · Internal
                </span>
                <span className="block font-serif text-xl text-white tracking-wide" style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
                  Staff Portal
                </span>
              </Link>
              <button className="lg:hidden text-white/60 hover:text-white" onClick={() => setSidebarOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {/* Nav, grouped */}
            <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-7">
              {groupOrder.map((groupKey) => {
                const items = sidebarItems
                  .filter((i) => i.group === groupKey)
                  .filter((item) => !item.adminOnly || user?.role === 'admin');
                if (items.length === 0) return null;
                return (
                  <div key={groupKey}>
                    <div className="flex items-center gap-3 px-3 mb-2.5">
                      <span className="text-[9px] tracking-[0.3em] text-white/35 uppercase font-medium">
                        {groupLabels[groupKey]}
                      </span>
                      <span className="flex-1 h-px bg-white/[0.06]" />
                    </div>
                    <div className="space-y-0.5">
                      {items.map((item) => {
                        const active = pathname === item.href || pathname.startsWith(item.href + '/');
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setSidebarOpen(false)}
                            className={`group relative flex items-center gap-3 px-3 py-2.5 text-[13px] transition-all duration-200 ${
                              active
                                ? 'text-white bg-white/[0.04]'
                                : 'text-white/55 hover:text-white hover:bg-white/[0.025]'
                            }`}
                          >
                            {/* Active indicator — bronze hairline */}
                            <span
                              className={`absolute left-0 top-1.5 bottom-1.5 w-px transition-all duration-300 ${
                                active ? 'bg-[#C4AD8F]' : 'bg-transparent group-hover:bg-white/20'
                              }`}
                            />
                            <item.icon size={15} strokeWidth={1.5} className={active ? 'text-[#C4AD8F]' : ''} />
                            <span className="font-body tracking-wide">{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </nav>

            {/* Footer — user + utilities */}
            <div className="border-t border-white/[0.06] p-4 space-y-3">
              {/* View site link */}
              <Link
                href="/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-3 px-3 py-2.5 text-[12px] text-white/55 hover:text-white border border-white/[0.06] hover:border-[#C4AD8F]/40 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Home size={13} strokeWidth={1.5} />
                  <span className="tracking-wide">View Public Site</span>
                </span>
                <span className="text-[#C4AD8F]">↗</span>
              </Link>

              {/* User card */}
              <div className="px-3 py-2.5 bg-white/[0.025] border-l-2 border-[#C4AD8F]/60">
                <p className="text-[10px] tracking-[0.25em] text-white/35 uppercase mb-1">Signed in</p>
                <p className="text-sm text-white font-medium truncate">{user?.fullName}</p>
                <p className="text-[11px] text-[#C4AD8F]/80 capitalize tracking-wider">{user?.role}</p>
              </div>

              <div className="grid grid-cols-2 gap-1">
                <Link
                  href="/cms/change-password"
                  className="flex items-center justify-center gap-2 px-3 py-2 text-[11px] text-white/45 hover:text-white hover:bg-white/[0.04] transition-colors tracking-wide"
                >
                  <KeyRound size={12} strokeWidth={1.5} />
                  Password
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 px-3 py-2 text-[11px] text-white/45 hover:text-white hover:bg-white/[0.04] transition-colors tracking-wide"
                >
                  <LogOut size={12} strokeWidth={1.5} />
                  Sign out
                </button>
              </div>
            </div>
          </aside>

          {/* Overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-30 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 gap-4">
              <button className="lg:hidden text-gray-700" onClick={() => setSidebarOpen(true)}>
                <Menu size={22} />
              </button>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-[10px] tracking-[0.3em] text-[#9A8266] uppercase font-medium">
                  Portal
                </span>
                <ChevronRight size={12} className="text-gray-300" />
                <span className="capitalize text-gray-700 font-medium">
                  {pathname.split('/').pop()?.replace(/-/g, ' ')}
                </span>
              </div>
              <div className="ml-auto flex items-center gap-3 text-[11px] text-gray-500">
                <span className="hidden sm:inline tracking-wider">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </span>
                <span className="hidden sm:inline-block w-px h-3 bg-gray-200" />
                <span className="flex items-center gap-1.5 text-gray-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Live
                </span>
              </div>
            </header>

            <main className="flex-1 overflow-y-auto p-6">
              {children}
            </main>
          </div>
        </div>
      </AuthContext.Provider>
    </div>
  );
}
