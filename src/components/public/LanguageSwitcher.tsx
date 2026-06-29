'use client';

import { useState, useRef, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { locales, localeNames, type Locale } from '@/i18n/config';
import { localizedPathFromPathname } from '@/lib/public-paths';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function switchLocale(newLocale: Locale) {
    const alternate = document.querySelector<HTMLLinkElement>(
      `link[rel="alternate"][hrefLang="${newLocale}"],link[rel="alternate"][hreflang="${newLocale}"]`,
    );
    if (alternate?.href) {
      const url = new URL(alternate.href);
      router.push(`${url.pathname}${url.search}${url.hash}`);
      setOpen(false);
      return;
    }

    router.push(localizedPathFromPathname(pathname || '/', newLocale));
    setOpen(false);
  }

  const currentLabel = localeNames[locale as Locale];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1.5 whitespace-nowrap text-[13px] font-body font-semibold tracking-[0.12em] uppercase text-ink-mid hover:text-ink transition-colors"
      >
        <span>{(locale as string).toUpperCase()}</span>
        {/* Long language name only at 2xl — at xl it competes with the five
            nav items in long-label locales (FR/DE) and used to wrap. */}
        <span className="text-ink-mid font-normal normal-case tracking-normal whitespace-nowrap hidden 2xl:inline-block">
          — {currentLabel}
        </span>
        <ChevronDown
          size={13}
          strokeWidth={1.75}
          className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <div
        className={`absolute end-0 top-full mt-3 bg-cream border border-warm-border py-1 min-w-[180px] z-50 transition-all duration-300 origin-top-right rtl:origin-top-left ${
          open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        {locales.map((l) => {
          const active = l === locale;
          return (
            <button
              key={l}
              onClick={() => switchLocale(l)}
              className={`w-full flex items-center justify-between px-5 py-2.5 text-[13px] font-body transition-colors duration-200 ${
                active ? 'text-ink bg-sand' : 'text-ink-mid hover:bg-sand hover:text-ink'
              }`}
            >
              <span className="font-normal">{localeNames[l]}</span>
              <span className={`text-[12px] font-semibold tracking-[0.12em] uppercase ${active ? 'text-bronze' : 'text-ink-mid'}`}>
                {(l as string).toUpperCase()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
