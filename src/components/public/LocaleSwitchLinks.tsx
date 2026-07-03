import {
  LOCALE_SWITCH_LINKS_SCRIPT_ID,
  type LocaleSwitchLinksMap,
} from '@/lib/locale-switch-links';

export function LocaleSwitchLinks({ links }: { links: LocaleSwitchLinksMap }) {
  const payload = JSON.stringify(links).replace(/</g, '\\u003c');

  return (
    <script
      id={LOCALE_SWITCH_LINKS_SCRIPT_ID}
      type="application/json"
      dangerouslySetInnerHTML={{ __html: payload }}
    />
  );
}
