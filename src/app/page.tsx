import { permanentRedirect } from 'next/navigation';

// The middleware routes `/` via next-intl language detection; this only
// runs if middleware is ever bypassed. Fall back to the x-default locale.
export default function RootPage() {
  permanentRedirect('/en');
}
