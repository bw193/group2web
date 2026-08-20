import assert from 'node:assert/strict';
import test from 'node:test';
import { triggerProductCatalogDeploy } from '../src/lib/product-catalog-deploy-core';

const secretHookUrl = 'https://api.vercel.com/v1/integrations/deploy/example-secret';

test('product catalog deploy hook reports not configured when env is missing', async () => {
  let didFetch = false;

  const result = await triggerProductCatalogDeploy({
    env: {},
    fetchImpl: async () => {
      didFetch = true;
      return { ok: true, status: 200 };
    },
  });

  assert.deepEqual(result, { status: 'not_configured' });
  assert.equal(didFetch, false);
});

test('product catalog deploy hook POSTs and reports triggered on 2xx', async () => {
  let calledWith: { input: string; method: string } | null = null;

  const result = await triggerProductCatalogDeploy({
    env: { VERCEL_PRODUCT_CATALOG_DEPLOY_HOOK_URL: ` ${secretHookUrl} ` },
    fetchImpl: async (input, init) => {
      calledWith = { input, method: init.method };
      return { ok: true, status: 201 };
    },
  });

  assert.deepEqual(result, { status: 'triggered', statusCode: 201 });
  assert.deepEqual(calledWith, { input: secretHookUrl, method: 'POST' });
});

test('product catalog deploy hook reports non-2xx failures without leaking the URL', async () => {
  const result = await triggerProductCatalogDeploy({
    env: { VERCEL_PRODUCT_CATALOG_DEPLOY_HOOK_URL: secretHookUrl },
    fetchImpl: async () => ({ ok: false, status: 500 }),
  });

  assert.equal(result.status, 'failed');
  assert.equal(result.status === 'failed' ? result.statusCode : undefined, 500);
  assert.equal(result.status === 'failed' ? result.error.includes(secretHookUrl) : true, false);
  assert.equal(result.status === 'failed' ? result.error.includes('example-secret') : true, false);
});

test('product catalog deploy hook reports request errors without leaking the URL', async () => {
  const result = await triggerProductCatalogDeploy({
    env: { VERCEL_PRODUCT_CATALOG_DEPLOY_HOOK_URL: secretHookUrl },
    fetchImpl: async () => {
      throw new Error(`network failed for ${secretHookUrl}`);
    },
  });

  assert.deepEqual(result, { status: 'failed', error: 'Deploy hook request failed' });
});
