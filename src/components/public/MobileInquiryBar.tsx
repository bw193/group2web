'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { MessageCircle } from 'lucide-react';
import { sendGAEvent } from '@next/third-parties/google';
import { track } from '@vercel/analytics';
import TrackedContactLink from './TrackedContactLink';
import { localizedPath } from '@/lib/public-paths';
import { WHATSAPP_URL } from '@/lib/contact-links';

/**
 * Phone-only bar pinned to the bottom of every public page except the contact
 * flow. 79% of visitors arrive on a phone and ad clicks land on the homepage,
 * where the first "Send inquiry" button used to sit two screens down. The bar
 * puts both ways to ask for a price within reach at all times.
 *
 * It hides itself on the contact page and the thank-you page (they already are
 * the inquiry) and sits under the open mobile menu (z-30 vs the menu's z-40).
 */
const QUOTE_LABEL: Record<string, string> = {
  en: 'Get a quote',
  de: 'Angebot anfragen',
  es: 'Pedir presupuesto',
  fr: 'Demander un devis',
  it: 'Richiedi un preventivo',
  pt: 'Pedir orçamento',
  he: 'בקשת הצעת מחיר',
};

export default function MobileInquiryBar() {
  const locale = useLocale();
  const pathname = usePathname();

  // /en/contact, /en/contact/thank-you and the Hebrew /he/israel-contact/...
  if (/\/(israel-)?contact(\/|$)/.test(pathname)) return null;

  function trackQuoteClick() {
    const payload = { method: 'quote_button', location: 'mobile_bar', locale };
    sendGAEvent('event', 'contact_quote_click', payload);
    track('contact_quote_click', payload);
  }

  const itemClass =
    'flex h-[52px] items-center justify-center gap-2 text-[12px] font-body font-medium uppercase tracking-[0.18em] text-cream';

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-cream/10 bg-ink pb-[env(safe-area-inset-bottom)] md:hidden print:hidden">
      <div className="grid grid-cols-2">
        <Link href={localizedPath(locale, '/contact')} onClick={trackQuoteClick} className={itemClass}>
          {QUOTE_LABEL[locale] ?? QUOTE_LABEL.en}
        </Link>
        <TrackedContactLink
          href={WHATSAPP_URL}
          method="whatsapp"
          location="mobile_bar"
          target="_blank"
          rel="noopener noreferrer"
          className={`${itemClass} border-s border-cream/15`}
        >
          <MessageCircle size={16} strokeWidth={1.75} aria-hidden />
          WhatsApp
        </TrackedContactLink>
      </div>
    </div>
  );
}
