// Local smoke test of the CMS article APIs as an authenticated user: mints a
// session token with the app's own JWT_SECRET (from .env.local) and calls the
// read-only GET endpoints on the locally running server. Run:
//   npx tsx tests/smoke-cms-articles-api.ts [baseUrl]
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });
import { SignJWT } from 'jose';

const BASE = process.argv[2] || 'http://localhost:3000';

async function main() {
  const secret = new TextEncoder().encode(
    process.env.JWT_SECRET || 'chengtai-jwt-secret-change-in-production-2025',
  );
  const token = await new SignJWT({
    userId: 1,
    username: 'smoke-test',
    role: 'admin',
    mustChangePassword: false,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('10m')
    .setIssuedAt()
    .sign(secret);

  const headers = { Cookie: `auth-token=${token}` };

  for (const path of ['/api/auth/me', '/api/articles', '/api/article-categories']) {
    const t0 = Date.now();
    try {
      const res = await fetch(`${BASE}${path}`, { headers });
      const body = await res.text();
      console.log(
        `${path} -> ${res.status} in ${Date.now() - t0}ms :: ${body.slice(0, 300)}${body.length > 300 ? '…' : ''}`,
      );
    } catch (e) {
      console.log(`${path} -> FETCH ERROR in ${Date.now() - t0}ms :: ${(e as Error).message}`);
    }
  }
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error('FAILED:', e);
    process.exit(1);
  },
);
