'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Menu, X, Search } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';

export default function Header() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    router.push(`/${locale}/products${q ? `?q=${encodeURIComponent(q)}` : ''}`);
    setMobileOpen(false);
    setSearchOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 16);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: `/${locale}`, label: t('home') },
    { href: `/${locale}/products`, label: t('products') },
    { href: `/${locale}/about`, label: t('about') },
    { href: `/${locale}/contact`, label: t('contact') },
  ];

  const isActive = (href: string) => {
    if (href === `/${locale}`) return pathname === href || pathname === `/${locale}/`;
    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-cream/92 backdrop-blur-md border-b border-warm-border'
          : 'bg-cream/80 backdrop-blur-sm border-b border-transparent'
      }`}
    >
      <div className="container-wide">
        <div className="flex items-center justify-between h-[72px] md:h-20">
          {/* Logo */}
          <Link href={`/${locale}`} className="group flex items-baseline gap-3">
            <span className="font-display text-[22px] md:text-[26px] font-normal text-ink tracking-[0.01em] leading-none">
              Chengtai
            </span>
            <span className="hidden md:inline-block text-[11px] font-body font-semibold text-ink-mid tracking-[0.16em] uppercase border-l border-warm-border pl-3">
              Mirror Co., Ltd
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-10">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`nav-link text-[13px] font-body font-semibold tracking-[0.14em] uppercase transition-colors duration-300 ${
                    active ? 'text-ink is-active' : 'text-ink-mid hover:text-ink'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right actions */}
          <div className="hidden lg:flex items-center gap-6">
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Search"
              className="p-1 text-ink-mid hover:text-ink transition-colors"
            >
              <Search size={16} strokeWidth={1.75} />
            </button>
            <span className="h-3 w-px bg-warm-border" aria-hidden />
            <LanguageSwitcher />
            <span className="h-3 w-px bg-warm-border" aria-hidden />
            <Link
              href={`/${locale}/contact`}
              className="btn-primary h-10 px-6 text-[12px]"
            >
              {t('inquiry')}
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button
            className="lg:hidden p-2 text-ink"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} strokeWidth={1.5} /> : <Menu size={22} strokeWidth={1.5} />}
          </button>
        </div>

        {/* Desktop search drawer */}
        <div
          className={`hidden lg:block overflow-hidden transition-[max-height,opacity] duration-500 ease-out ${
            searchOpen ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <form onSubmit={handleSearch} className="pb-6 pt-1 flex items-center gap-4 border-t border-warm-border">
            <Search size={16} strokeWidth={1.75} className="text-ink-mid" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, models, categories…"
              autoFocus={searchOpen}
              aria-label="Search products"
              className="flex-1 h-10 bg-transparent border-0 text-[15px] font-body text-ink placeholder:text-ink-mid focus:outline-none"
            />
            <button
              type="submit"
              className="text-[12px] font-body font-semibold tracking-[0.14em] uppercase text-ink hover:text-bronze transition-colors"
            >
              Search →
            </button>
          </form>
        </div>
      </div>

      {/* Mobile Nav */}
      <div
        className={`lg:hidden fixed inset-0 top-[72px] bg-cream transition-all duration-500 ease-out-expo ${
          mobileOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}
      >
        <div className="container-wide pt-10 pb-14">
          <form onSubmit={handleSearch} className="relative mb-10 pb-4 border-b border-warm-border flex items-center gap-3">
            <Search size={16} strokeWidth={1.5} className="text-ink-mid" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products…"
              aria-label="Search products"
              className="flex-1 h-10 bg-transparent border-0 text-base font-body font-light text-ink placeholder:text-ink-light focus:outline-none"
            />
          </form>

          <nav className="flex flex-col">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-baseline justify-between py-5 border-b border-warm-border group"
                >
                  <span className={`font-display text-3xl font-normal leading-none ${active ? 'text-ink' : 'text-ink'}`}>
                    {link.label}
                  </span>
                  <span className="text-bronze transition-transform duration-300 group-hover:translate-x-1">→</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-10 flex items-center justify-between">
            <LanguageSwitcher />
            <Link
              href={`/${locale}/contact`}
              className="btn-primary"
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
