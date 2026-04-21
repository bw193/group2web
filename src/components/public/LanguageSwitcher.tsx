'use client';

import { useState, useRef, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { locales, localeNames, type Locale } from '@/i18n/config';

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
    const segments = pathname.split('/');
    if (locales.includes(segments[1] as Locale)) {
      segments[1] = newLocale;
    } else {
      segments.splice(1, 0, newLocale);
    }
    router.push(segments.join('/') || '/');
    setOpen(false);
  }

  const currentLabel = localeNames[locale as Locale];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1.5 text-[10px] font-body font-medium tracking-[0.24em] uppercase text-ink-mid hover:text-ink transition-colors"
      >
        <span>{(locale as string).toUpperCase()}</span>
        <span className="text-ink-light font-normal normal-case tracking-normal hidden xl:inline-block">
          — {currentLabel}
        </span>
        <ChevronDown
          size={11}
          strokeWidth={1.75}
          className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <div
        className={`absolute right-0 top-full mt-3 bg-cream border border-warm-border py-1 min-w-[180px] z-50 transition-all duration-300 origin-top-right ${
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
              <span className="font-light">{localeNames[l]}</span>
              <span className={`text-[9px] font-medium tracking-[0.22em] uppercase ${active ? 'text-bronze' : 'text-ink-light'}`}>
                {(l as string).toUpperCase()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
