'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Menu, X, Search } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';

export default function Header() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    router.push(`/${locale}/products${q ? `?q=${encodeURIComponent(q)}` : ''}`);
    setMobileOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: `/${locale}`, label: t('home') },
    { href: `/${locale}/products`, label: t('products') },
    { href: `/${locale}/about`, label: t('about') },
    { href: `/${locale}/contact`, label: t('contact') },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 bg-cream/95 backdrop-blur-md border-b transition-all duration-500 ${
        scrolled
          ? 'border-warm-border shadow-[0_10px_30px_-20px_rgba(42,38,32,0.25)]'
          : 'border-warm-border/60'
      }`}
    >
      <div className="container-wide">
        <div className="flex items-center justify-between h-20 md:h-24">
          {/* Logo */}
          <Link href={`/${locale}`} className="group">
            <div className="flex flex-col">
              <span className="text-xl md:text-2xl font-display font-medium text-ink tracking-[0.04em]">
                CHENGTAI
              </span>
              <span className="text-[9px] font-body font-light text-ink-light tracking-[0.25em] uppercase">
                Mirror Co., Ltd
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-10">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="nav-link text-[13px] font-body font-medium text-ink-mid hover:text-ink transition-colors tracking-[0.08em] uppercase"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="hidden lg:flex items-center gap-5">
            <form onSubmit={handleSearch} className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-light" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                aria-label="Search products"
                className="h-9 w-44 pl-9 pr-3 text-xs tracking-wide bg-transparent border border-warm-border/60 text-ink placeholder:text-ink-light focus:border-ink rounded-full transition-all duration-300 focus:w-56 focus:outline-none"
              />
            </form>
            <LanguageSwitcher />
            <Link href={`/${locale}/contact`} className="btn-primary text-xs uppercase tracking-[0.1em]">
              {t('inquiry')}
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button
            className="lg:hidden p-2 text-ink"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <div
        className={`lg:hidden fixed inset-0 top-20 bg-cream/98 backdrop-blur-lg transition-all duration-500 ease-out-expo ${
          mobileOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}
      >
        <div className="container-wide pt-8">
          <form onSubmit={handleSearch} className="relative mb-6">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-light" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              aria-label="Search products"
              className="h-11 w-full pl-10 pr-3 text-sm bg-transparent border border-warm-border/60 text-ink placeholder:text-ink-light focus:border-ink focus:outline-none"
            />
          </form>
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="py-4 text-lg font-display font-medium text-ink border-b border-warm-border/50 transition-colors hover:text-bronze"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-8 flex items-center justify-between">
            <LanguageSwitcher />
            <Link
              href={`/${locale}/contact`}
              className="btn-primary text-xs uppercase tracking-[0.1em]"
              onClick={() => setMobileOpen(false)}
            >
              {t('inquiry')}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
