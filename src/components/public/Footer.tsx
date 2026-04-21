'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';

export default function Footer() {
  const t = useTranslations('footer');
  const nav = useTranslations('nav');
  const locale = useLocale();

  const year = new Date().getFullYear();

  return (
    <footer className="bg-ink text-cream/85">
      <div className="container-wide pt-24 pb-10">
        {/* Wordmark row */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-10 pb-16 border-b border-cream/10">
          <div>
            <p className="font-body text-[10px] font-medium tracking-[0.32em] uppercase text-cream/45 mb-4">
              Jiaxing Chengtai Mirror Co., Ltd
            </p>
            <h2 className="font-display text-5xl md:text-6xl font-light leading-[0.95] text-cream tracking-[-0.01em]">
              Crafting light,<br />
              <span className="italic text-bronze-light">reflected.</span>
            </h2>
          </div>
          <Link
            href={`/${locale}/contact`}
            className="group inline-flex items-center gap-4 self-start md:self-end text-[11px] font-body font-medium tracking-[0.24em] uppercase text-cream"
          >
            <span className="relative pb-1">
              Start an inquiry
              <span className="absolute left-0 bottom-0 h-px w-full bg-cream/40 transition-all duration-500 group-hover:bg-bronze-light" />
            </span>
            <span className="text-bronze-light transition-transform duration-500 group-hover:translate-x-1">→</span>
          </Link>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 pt-16">
          {/* Contact */}
          <div className="md:col-span-5">
            <p className="text-[10px] font-body font-medium tracking-[0.32em] uppercase text-cream/40 mb-6">
              {t('contactUs')}
            </p>
            <div className="space-y-5 text-[15px] font-body font-light leading-relaxed">
              <a
                href="mailto:bolen5@cnjxctm.com"
                className="block text-cream/80 hover:text-cream transition-colors"
              >
                bolen5@cnjxctm.com
              </a>
              <a
                href="https://wa.me/8617860567239"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-cream/80 hover:text-cream transition-colors"
              >
                +86 178 6056 7239
              </a>
              <p className="text-cream/55 max-w-sm">
                No. 768 Xinda Road, Xinfeng Town,<br />
                Nanhu District, Jiaxing, Zhejiang, China
              </p>
            </div>
          </div>

          {/* Nav */}
          <div className="md:col-span-3 md:col-start-7">
            <p className="text-[10px] font-body font-medium tracking-[0.32em] uppercase text-cream/40 mb-6">
              {t('quickLinks')}
            </p>
            <nav className="flex flex-col gap-3.5 text-[14px] font-body font-light">
              <Link href={`/${locale}`} className="text-cream/70 hover:text-cream transition-colors">
                {nav('home')}
              </Link>
              <Link href={`/${locale}/products`} className="text-cream/70 hover:text-cream transition-colors">
                {nav('products')}
              </Link>
              <Link href={`/${locale}/about`} className="text-cream/70 hover:text-cream transition-colors">
                {nav('about')}
              </Link>
              <Link href={`/${locale}/contact`} className="text-cream/70 hover:text-cream transition-colors">
                {nav('contact')}
              </Link>
            </nav>
          </div>

          {/* Since */}
          <div className="md:col-span-3 md:col-start-10">
            <p className="text-[10px] font-body font-medium tracking-[0.32em] uppercase text-cream/40 mb-6">
              Since
            </p>
            <p className="font-display text-6xl font-light text-cream leading-none">2005</p>
            <p className="mt-4 text-[13px] font-body font-light text-cream/55 leading-relaxed max-w-xs">
              Two decades of mirror craftsmanship — LED, bathroom, cabinet, and bespoke manufacturing from Jiaxing, China.
            </p>
          </div>
        </div>

        {/* Bottom rule */}
        <div className="border-t border-cream/10 mt-20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] font-body text-cream/35 tracking-[0.24em] uppercase">
            © {year} Chengtai Mirror — {t('copyright')}
          </p>
          <Link
            href="/cms/login"
            aria-label="Staff portal login"
            className="group relative inline-flex items-center gap-2 text-[10px] font-body tracking-[0.26em] uppercase text-cream/30 transition-colors duration-300 hover:text-bronze-light focus-visible:text-bronze-light focus-visible:outline-none"
          >
            <span className="relative pb-0.5">
              Staff Portal
              <span
                aria-hidden
                className="pointer-events-none absolute -bottom-0.5 left-0 h-px w-full origin-right scale-x-0 bg-bronze-light transition-transform duration-500 ease-out group-hover:origin-left group-hover:scale-x-100 group-focus-visible:origin-left group-focus-visible:scale-x-100"
              />
            </span>
            <span aria-hidden className="inline-block transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-px">
              ↗
            </span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
