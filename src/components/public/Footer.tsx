'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  const t = useTranslations('footer');
  const nav = useTranslations('nav');
  const locale = useLocale();

  return (
    <footer className="bg-espresso text-cream/90">
      <div className="container-wide pt-20 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8">
          {/* Brand */}
          <div className="md:col-span-4">
            <h3 className="text-2xl font-display font-medium tracking-[0.04em] text-cream mb-3">
              CHENGTAI
            </h3>
            <div className="w-8 h-px bg-bronze mb-5" />
            <p className="text-sm font-body font-light text-cream/50 leading-relaxed mb-4">
              {t('slogan')}
            </p>
            <p className="text-xs font-body text-cream/30">{t('company')}</p>
          </div>

          {/* Nav */}
          <div className="md:col-span-2 md:col-start-6">
            <h4 className="text-[11px] font-body font-medium tracking-[0.2em] uppercase text-cream/40 mb-6">
              {t('quickLinks')}
            </h4>
            <nav className="flex flex-col gap-3">
              <Link href={`/${locale}`} className="text-sm font-body font-light text-cream/60 hover:text-cream transition-colors duration-300">
                {nav('home')}
              </Link>
              <Link href={`/${locale}/products`} className="text-sm font-body font-light text-cream/60 hover:text-cream transition-colors duration-300">
                {nav('products')}
              </Link>
              <Link href={`/${locale}/about`} className="text-sm font-body font-light text-cream/60 hover:text-cream transition-colors duration-300">
                {nav('about')}
              </Link>
              <Link href={`/${locale}/contact`} className="text-sm font-body font-light text-cream/60 hover:text-cream transition-colors duration-300">
                {nav('contact')}
              </Link>
            </nav>
          </div>

          {/* Contact */}
          <div className="md:col-span-4 md:col-start-9">
            <h4 className="text-[11px] font-body font-medium tracking-[0.2em] uppercase text-cream/40 mb-6">
              {t('contactUs')}
            </h4>
            <div className="flex flex-col gap-4">
              <a
                href="mailto:bolen5@cnjxctm.com"
                className="flex items-center gap-3 text-sm font-body font-light text-cream/60 hover:text-cream transition-colors duration-300"
              >
                <Mail size={15} className="text-bronze flex-shrink-0" />
                bolen5@cnjxctm.com
              </a>
              <a
                href="https://wa.me/8617860567239"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm font-body font-light text-cream/60 hover:text-cream transition-colors duration-300"
              >
                <Phone size={15} className="text-bronze flex-shrink-0" />
                +86 17860567239
              </a>
              <div className="flex items-start gap-3 text-sm font-body font-light text-cream/60">
                <MapPin size={15} className="text-bronze flex-shrink-0 mt-0.5" />
                <span>No.768, Xinda Road, Xinfeng Town, Nanhu District, Jiaxing, Zhejiang, China</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-cream/10 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[11px] font-body text-cream/25 tracking-wide">{t('copyright')}</p>
          <Link
            href="/cms/login"
            aria-label="Staff portal login"
            className="group relative inline-flex items-center gap-2 text-[11px] font-body tracking-[0.2em] uppercase text-cream/25 transition-colors duration-300 hover:text-bronze focus-visible:text-bronze focus-visible:outline-none"
          >
            <span className="relative">
              Staff Portal
              <span
                aria-hidden
                className="pointer-events-none absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-bronze transition-transform duration-500 ease-out group-hover:scale-x-100 group-focus-visible:scale-x-100"
              />
            </span>
            <span
              aria-hidden
              className="inline-block translate-y-[-1px] transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-[2px]"
            >
              ↗
            </span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
