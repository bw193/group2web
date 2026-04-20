'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Image, Package, FolderTree, Info, MessageSquare,
  Users, Settings, LogOut, Menu, X, ChevronRight, KeyRound
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

const sidebarItems = [
  { href: '/cms/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/cms/banners', icon: Image, label: 'Banners' },
  { href: '/cms/products', icon: Package, label: 'Products' },
  { href: '/cms/categories', icon: FolderTree, label: 'Categories' },
  { href: '/cms/about', icon: Info, label: 'About Page' },
  { href: '/cms/inquiries', icon: MessageSquare, label: 'Inquiries' },
  { href: '/cms/users', icon: Users, label: 'Users', adminOnly: true },
  { href: '/cms/settings', icon: Settings, label: 'Settings', adminOnly: true },
];

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
            className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-text-primary text-white transform transition-transform lg:translate-x-0 ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <div className="flex items-center justify-between h-16 px-6 border-b border-gray-700">
              <Link href="/cms/dashboard" className="font-heading font-bold tracking-wider">
                CHENGTAI CMS
              </Link>
              <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <nav className="p-4 space-y-1">
              {sidebarItems
                .filter((item) => !item.adminOnly || user?.role === 'admin')
                .map((item) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
                        active
                          ? 'bg-white/10 text-white'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <item.icon size={18} />
                      {item.label}
                    </Link>
                  );
                })}
            </nav>

            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
              <div className="px-4 py-2 mb-2">
                <p className="text-sm font-medium">{user?.fullName}</p>
                <p className="text-xs text-gray-400">{user?.role}</p>
              </div>
              <Link
                href="/cms/change-password"
                className="flex items-center gap-3 px-4 py-2.5 w-full rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors mb-1"
              >
                <KeyRound size={18} />
                Change Password
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-2.5 w-full rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <LogOut size={18} />
                Logout
              </button>
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
              <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu size={24} />
              </button>
              <div className="flex items-center gap-1 text-sm text-text-secondary">
                <span>CMS</span>
                <ChevronRight size={14} />
                <span className="capitalize">
                  {pathname.split('/').pop()?.replace(/-/g, ' ')}
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
