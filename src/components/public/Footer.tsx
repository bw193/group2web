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
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-10 pb-14 border-b border-cream/15">
          <div>
            <p className="font-body text-[13px] font-semibold tracking-[0.16em] uppercase text-bronze-light mb-4">
              Jiaxing Chengtai Mirror Co., Ltd
            </p>
            <h2 className="font-display text-4xl md:text-5xl font-normal leading-[1.05] text-cream tracking-[-0.01em]">
              Crafting light, reflected
            </h2>
          </div>
          <Link
            href={`/${locale}/contact`}
            className="group inline-flex items-center gap-3 self-start md:self-end bg-cream text-ink px-8 h-12 text-[12px] font-body font-semibold tracking-[0.16em] uppercase hover:bg-bronze-light transition-colors"
          >
            Start an inquiry
            <span className="transition-transform duration-500 group-hover:translate-x-1">→</span>
          </Link>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 pt-14">
          {/* Since — first column */}
          <div className="md:text-left">
            <p className="text-[13px] font-body font-semibold tracking-[0.16em] uppercase text-bronze-light mb-5">
              Since
            </p>
            <p className="font-display text-5xl md:text-6xl font-normal text-cream leading-none">2005</p>
            <p className="mt-4 text-[14px] font-body font-normal text-cream/80 leading-[1.55] max-w-xs">
              Two decades of mirror craftsmanship — LED, bathroom, cabinet, and bespoke manufacturing from Jiaxing, China.
            </p>
          </div>

          {/* Quick Links — middle column, centered */}
          <div className="md:text-center md:flex md:flex-col md:items-center">
            <p className="text-[13px] font-body font-semibold tracking-[0.16em] uppercase text-bronze-light mb-5">
              {t('quickLinks')}
            </p>
            <nav className="flex flex-col gap-3 text-[15px] font-body font-normal md:items-center">
              <Link href={`/${locale}`} className="text-cream hover:text-bronze-light transition-colors">
                {nav('home')}
              </Link>
              <Link href={`/${locale}/products`} className="text-cream hover:text-bronze-light transition-colors">
                {nav('products')}
              </Link>
              <Link href={`/${locale}/about`} className="text-cream hover:text-bronze-light transition-colors">
                {nav('about')}
              </Link>
              <Link href={`/${locale}/contact`} className="text-cream hover:text-bronze-light transition-colors">
                {nav('contact')}
              </Link>
            </nav>
          </div>

          {/* Contact — third column */}
          <div className="md:text-left">
            <p className="text-[13px] font-body font-semibold tracking-[0.16em] uppercase text-bronze-light mb-5">
              {t('contactUs')}
            </p>
            <div className="space-y-4 text-[15px] font-body font-normal leading-[1.55]">
              <a
                href="mailto:bolen5@cnjxctm.com"
                className="block text-cream hover:text-bronze-light transition-colors"
              >
                bolen5@cnjxctm.com
              </a>
              <a
                href="https://wa.me/8617860567239"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-cream hover:text-bronze-light transition-colors"
              >
                +86 178 6056 7239
              </a>
              <p className="text-cream/80 max-w-sm">
                No. 768 Xinda Road, Xinfeng Town,<br />
                Nanhu District, Jiaxing, Zhejiang, China
              </p>
            </div>
          </div>
        </div>

        {/* Bottom rule */}
        <div className="border-t border-cream/15 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[13px] font-body font-normal text-cream/70">
            © {year} Chengtai Mirror — {t('copyright')}
          </p>
          <Link
            href="/cms/login"
            aria-label="Staff portal login"
            className="group inline-flex items-center gap-2 text-[12px] font-body font-semibold tracking-[0.14em] uppercase text-cream/60 transition-colors duration-300 hover:text-bronze-light focus-visible:text-bronze-light focus-visible:outline-none"
          >
            Staff Portal
            <span aria-hidden className="inline-block transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-px">
              ↗
            </span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
