# IndexNow

The public verification file is `public/e022cad706181d99f3442022430dd047.txt`.
Vercel serves it at https://chengtaimirror.com/e022cad706181d99f3442022430dd047.txt.
This is a public ownership key, not a private credential or a Vercel token.

The IndexNow GitHub Actions workflow runs after successful Vercel production
deployments and hourly. It reads the **live production sitemap**, comparing it
with the previous successful run. Added URLs, changed `lastmod` values and
removed URLs are sent to https://api.indexnow.org/indexnow in batches of up to
10,000. One participating endpoint shares notifications with other IndexNow
search engines. Preview and noindex URLs are excluded by the sitemap and by
host/locale validation in the submission script.

The first run records a baseline without submitting historical URLs. Subsequent
runs persist their sitemap state as a GitHub Actions artifact for seven days;
hourly checks renew that state. HTTP 200/202 receipts advance the state; failures
leave it unchanged so the next run can retry. HTTP 202 means key verification
is pending. Submission does not guarantee crawling or indexing.
The script also stops if over 25% of the inventory (and more than 20 URLs)
disappears in one check, so a database or sitemap failure cannot trigger mass
removal notifications. Inspect the sitemap before establishing a new baseline.

CMS edits that need a catalog deployment are submitted when that content becomes
visible in the production sitemap. Keep sitemap `lastmod` accurate, including
bumping `STATIC_LAST_MODIFIED` in `src/app/sitemap.ts` when static pages change.
If Actions is disabled for more than seven days, the next run creates a fresh
baseline; explicitly submit any known changes from the gap with `--url`.

Manual use (Node.js 22+; no npm install or extra secrets required):

```sh
node scripts/indexnow.mjs --dry-run
node scripts/indexnow.mjs --url https://chengtaimirror.com/en/products/example
node scripts/indexnow.mjs --url /en/insight/sourcing/example --url /en/videos/example
node --test tests/indexnow.test.mjs
```

The script's local state is `.indexnow/state.json`. To retry a workflow run,
use the Actions tab's IndexNow workflow, or `gh workflow run indexnow.yml`.

Protocol: https://www.indexnow.org/documentation
