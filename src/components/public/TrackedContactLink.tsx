'use client';

import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { useLocale } from 'next-intl';
import { sendGAEvent } from '@next/third-parties/google';
import { track } from '@vercel/analytics';

export type DirectContactMethod = 'email' | 'whatsapp';

const eventByMethod: Record<DirectContactMethod, string> = {
  email: 'contact_email_click',
  whatsapp: 'contact_whatsapp_click',
};

type TrackedContactLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'onClick'> & {
  href: string;
  method: DirectContactMethod;
  location: string;
  children: ReactNode;
};

export default function TrackedContactLink({
  href,
  method,
  location,
  children,
  ...anchorProps
}: TrackedContactLinkProps) {
  const locale = useLocale();

  function handleClick() {
    const eventName = eventByMethod[method];
    const payload = { method, location, locale, href };

    sendGAEvent('event', eventName, payload);
    track(eventName, payload);
  }

  return (
    <a {...anchorProps} href={href} onClick={handleClick}>
      {children}
    </a>
  );
}
