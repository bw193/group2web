import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canonicalPathAfterLocale,
  genericPathAfterLocale,
  inquiryProductFromUrl,
  localizedPath,
  localizedPathFromPathname,
  productInquiryPath,
} from '../src/lib/public-paths';

test('productInquiryPath keeps the product in the fragment, so every Send Inquiry link is the one contact URL', () => {
  assert.equal(
    productInquiryPath('en', 'Round Backlit LED Mirror', 'CTL202'),
    '/en/contact#product=Round+Backlit+LED+Mirror&model=CTL202',
  );
  assert.equal(productInquiryPath('de', 'Spiegel & Schrank', null), '/de/contact#product=Spiegel+%26+Schrank');
  assert.equal(productInquiryPath('fr', 'Miroir', ''), '/fr/contact#product=Miroir');
  assert.equal(productInquiryPath('he', 'מראה', 'X1'), '/he/israel-contact#product=%D7%9E%D7%A8%D7%90%D7%94&model=X1');
  for (const locale of ['en', 'de', 'es', 'fr', 'it', 'pt', 'he']) {
    const href = productInquiryPath(locale, 'Any Mirror?', 'M-1');
    assert.equal(href.split('#')[0], localizedPath(locale, '/contact'));
    assert.ok(!href.includes('?'), href);
  }
});

test('inquiryProductFromUrl reads the fragment, and still reads the query of older links', () => {
  assert.deepEqual(
    inquiryProductFromUrl('', '#product=Round+Backlit+LED+Mirror&model=CTL202'),
    { product: 'Round Backlit LED Mirror', model: 'CTL202' },
  );
  assert.deepEqual(
    inquiryProductFromUrl('?product=Miroir%20D%C3%A9coratif%20Ovale&model=209', ''),
    { product: 'Miroir Décoratif Ovale', model: '209' },
  );
  assert.deepEqual(
    inquiryProductFromUrl('?product=Old&model=1', '#product=New&model=2'),
    { product: 'New', model: '2' },
  );
  assert.deepEqual(inquiryProductFromUrl('?utm_source=chatgpt.com', ''), { product: '', model: '' });
  assert.deepEqual(inquiryProductFromUrl('', '#write-review'), { product: '', model: '' });
  assert.deepEqual(inquiryProductFromUrl('', ''), { product: '', model: '' });

  const names: Array<[string, string | null]> = [
    ['Miroir Décoratif Ovale', '209'],
    ['Mirror + Cabinet 100% "custom" <hotel> #2 & more', 'G2011-CTL406'],
    ['מראת איפור יוקרתית', null],
  ];
  for (const [name, model] of names) {
    const href = productInquiryPath('en', name, model);
    assert.deepEqual(inquiryProductFromUrl('', href.slice(href.indexOf('#'))), { product: name, model: model ?? '' });
  }
});

test('localizedPath maps Hebrew static pages to Israel-specific paths', () => {
  assert.equal(localizedPath('he', ''), '/he/israel-home');
  assert.equal(localizedPath('he', '/about'), '/he/israel-about');
  assert.equal(localizedPath('he', '/contact'), '/he/israel-contact');
  assert.equal(localizedPath('he', '/contact/thank-you'), '/he/israel-contact/israel-thank-you');
  assert.equal(localizedPath('he', '/privacy'), '/he/israel-privacy');
  assert.equal(localizedPath('he', '/legal-notice'), '/he/israel-legal-notice');
});

test('localizedPath maps Hebrew product and Insight sections while preserving slugs and queries', () => {
  assert.equal(
    localizedPath('he', '/products/israel-round-backlit-led-mirror'),
    '/he/israel-products/israel-round-backlit-led-mirror',
  );
  assert.equal(
    localizedPath('he', '/insight/israel-the-quiet-science-of-a-flattering-mirror-light'),
    '/he/israel-insight/israel-the-quiet-science-of-a-flattering-mirror-light',
  );
  assert.equal(
    localizedPath('he', '/contact?product=Round%20Mirror'),
    '/he/israel-contact?product=Round%20Mirror',
  );
});

test('localizedPath leaves non-Hebrew paths unchanged', () => {
  assert.equal(localizedPath('en', ''), '/en');
  assert.equal(localizedPath('de', '/about'), '/de/about');
  assert.equal(localizedPath('es', '/products/round-backlit-led-mirror'), '/es/products/round-backlit-led-mirror');
});

test('genericPathAfterLocale reverses Hebrew public paths for locale switching', () => {
  assert.equal(genericPathAfterLocale('he', '/israel-home'), '');
  assert.equal(genericPathAfterLocale('he', '/israel-about'), '/about');
  assert.equal(genericPathAfterLocale('he', '/israel-privacy'), '/privacy');
  assert.equal(genericPathAfterLocale('he', '/israel-legal-notice'), '/legal-notice');
  assert.equal(
    genericPathAfterLocale('he', '/israel-products/israel-led-mirrors/israel-round-backlit-led-mirror'),
    '/products/led-mirrors/israel-round-backlit-led-mirror',
  );
  assert.equal(canonicalPathAfterLocale('he', genericPathAfterLocale('he', '/israel-insight/israel-story')), '/israel-insight/israel-story');
});

test('localizedPathFromPathname switches static Hebrew paths through generic routes', () => {
  assert.equal(localizedPathFromPathname('/he/israel-about', 'en'), '/en/about');
  assert.equal(localizedPathFromPathname('/en/about', 'he'), '/he/israel-about');
});
