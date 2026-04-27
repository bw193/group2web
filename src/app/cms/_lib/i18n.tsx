'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { translations, type CmsLang, type CmsKey } from './translations';

const STORAGE_KEY = 'cms-lang';

type Ctx = {
  lang: CmsLang;
  setLang: (l: CmsLang) => void;
  t: (key: CmsKey, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<Ctx | null>(null);

function interpolate(str: string, vars?: Record<string, string | number>) {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? String(vars[k]) : `{${k}}`));
}

export function CmsI18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<CmsLang>('en');

  // Hydrate from localStorage after mount to avoid SSR mismatch.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'zh') {
      setLangState(saved);
    }
  }, []);

  const setLang = useCallback((l: CmsLang) => {
    setLangState(l);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, l);
    }
  }, []);

  const t = useCallback(
    (key: CmsKey, vars?: Record<string, string | number>) => {
      const dict = translations[lang] || translations.en;
      const value = dict[key] ?? translations.en[key] ?? key;
      return interpolate(value, vars);
    },
    [lang],
  );

  const value = useMemo<Ctx>(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Safe fallback so pages don't crash if rendered outside the provider during dev.
    return {
      lang: 'en' as CmsLang,
      setLang: (_: CmsLang) => {},
      t: (key: CmsKey, vars?: Record<string, string | number>) =>
        interpolate(translations.en[key] ?? key, vars),
    };
  }
  return ctx;
}
