import assert from 'node:assert/strict';
import test from 'node:test';
import {
  articleSlugFromInput,
  resolveArticleTranslationSlug,
} from '../src/lib/articles';

test('articleSlugFromInput prefers explicit English slug input', () => {
  assert.equal(
    articleSlugFromInput({ slug: '  Bathroom Mirror Guide!  ', title: 'Ignored Title' }),
    'bathroom-mirror-guide',
  );
});

test('articleSlugFromInput falls back to English title', () => {
  assert.equal(
    articleSlugFromInput({ title: 'How to Choose the Right Mirror' }),
    'how-to-choose-the-right-mirror',
  );
});

test('resolveArticleTranslationSlug copies English slug to every locale', () => {
  assert.equal(
    resolveArticleTranslationSlug({
      locale: 'de',
      englishSlug: 'how-to-choose-the-right-bathroom-mirror',
    }),
    'how-to-choose-the-right-bathroom-mirror',
  );
});
