'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Menu, X, Search } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import { localizedPath } from '@/lib/public-paths';

export default function Header() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const subBrand = locale === 'he' ? 'מראות בע״מ' : 'Mirror Co., Ltd';
  // Gate the portal until after mount so the server and the client's first
  // render agree (createPortal needs `document`, which is absent during SSR).
  const [mounted, setMounted] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    router.push(localizedPath(locale, `/products${q ? `?q=${encodeURIComponent(q)}` : ''}`));
    // If already on /products, ProductsFilter won't remount — notify it so the
    // grid stays in sync with this search.
    window.dispatchEvent(new CustomEvent('products:search', { detail: q }));
    setMobileOpen(false);
    setSearchOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 16);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => setMounted(true), []);

  // Lock background scroll while the full-screen mobile overlay is open.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const navLinks = [
    { href: localizedPath(locale, ''), label: t('home') },
    { href: localizedPath(locale, '/products'), label: t('products') },
    { href: localizedPath(locale, '/insight'), label: t('insight') },
    { href: localizedPath(locale, '/about'), label: t('about') },
    { href: localizedPath(locale, '/contact'), label: t('contact') },
  ];

  const isActive = (href: string) => {
    if (href === localizedPath(locale, '')) return pathname === href || pathname === `${href}/`;
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
        {/* gap-x guarantees the three clusters can never touch even if a
            locale's labels outgrow the viewport (they overflow instead). */}
        <div className="flex items-center justify-between gap-x-5 h-[72px] md:h-20">
          {/* Logo */}
          <Link href={localizedPath(locale, '')} className="group flex items-baseline gap-3">
            <span className="font-display text-[22px] md:text-[26px] font-normal text-ink tracking-[0.01em] leading-none">
              Chengtai
            </span>
            {/* The sub-brand never sits beside the desktop nav: five localized
                items + search/language/CTA already fill long-label locales
                (FR/DE), so it shows only on the roomy mobile/tablet header. */}
            <span className="hidden md:inline-block xl:hidden whitespace-nowrap text-[11px] font-body font-semibold text-ink-mid tracking-[0.16em] uppercase border-s border-warm-border ps-3">
              {subBrand}
            </span>
          </Link>

          {/* Desktop Nav */}
          {/* Desktop nav lives at xl+: five localized items (longest in German)
              don't fit beside the search/language/CTA cluster at lg widths, so
              1024–1279px uses the full-screen menu instead of a squeezed bar. */}
          <nav className="hidden xl:flex items-center gap-7 2xl:gap-9">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`nav-link whitespace-nowrap text-[13px] font-body font-semibold tracking-[0.14em] uppercase transition-colors duration-300 ${
                    active ? 'text-ink is-active' : 'text-ink-mid hover:text-ink'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right actions */}
          <div className="hidden xl:flex items-center gap-5 2xl:gap-6">
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
              href={localizedPath(locale, '/contact')}
              className="btn-primary h-10 px-5 2xl:px-6 text-[12px] whitespace-nowrap"
            >
              {t('inquiry')}
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button
            className="xl:hidden p-2 text-ink"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} strokeWidth={1.5} /> : <Menu size={22} strokeWidth={1.5} />}
          </button>
        </div>

        {/* Desktop search drawer */}
        <div
          className={`hidden xl:block overflow-hidden transition-[max-height,opacity] duration-500 ease-out ${
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

      {/* Mobile Nav — portaled to <body> so the fixed overlay escapes the
          backdrop-blurred header's containing block; otherwise it resolves
          against the 72px header box, collapses to 0 height, and its bg-cream
          background disappears (the page shows through the menu). */}
      {mounted &&
        createPortal(
          <div
            className={`xl:hidden fixed inset-0 top-[72px] md:top-20 z-40 overflow-y-auto bg-cream transition-all duration-500 ease-out-expo ${
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
                  <span className="text-bronze transition-transform duration-300 group-hover:translate-x-1 rtl:-scale-x-100">→</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-10 flex items-center justify-between">
            <LanguageSwitcher />
            <Link
              href={localizedPath(locale, '/contact')}
              className="btn-primary"
              onClick={() => setMobileOpen(false)}
            >
              {t('inquiry')}
            </Link>
          </div>
        </div>
          </div>,
          document.body,
        )}
    </header>
  );
}
