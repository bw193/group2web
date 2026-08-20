export const PRODUCT_CATALOG_DEPLOY_HOOK_ENV = 'VERCEL_PRODUCT_CATALOG_DEPLOY_HOOK_URL';

export type ProductCatalogDeployResult =
  | { status: 'not_configured' }
  | { status: 'triggered'; statusCode: number }
  | { status: 'failed'; statusCode?: number; error: string };

type ProductCatalogDeployEnv = Partial<Record<typeof PRODUCT_CATALOG_DEPLOY_HOOK_ENV, string>>;
type DeployHookFetch = (
  input: string,
  init: { method: 'POST' },
) => Promise<{ ok: boolean; status: number }>;

export async function triggerProductCatalogDeploy(
  options: {
    env?: ProductCatalogDeployEnv;
    fetchImpl?: DeployHookFetch;
  } = {},
): Promise<ProductCatalogDeployResult> {
  const env = options.env ?? process.env;
  const hookUrl = env[PRODUCT_CATALOG_DEPLOY_HOOK_ENV]?.trim();

  if (!hookUrl) {
    return { status: 'not_configured' };
  }

  const fetchImpl = options.fetchImpl ?? fetch;

  try {
    const response = await fetchImpl(hookUrl, { method: 'POST' });

    if (response.ok) {
      return { status: 'triggered', statusCode: response.status };
    }

    return {
      status: 'failed',
      statusCode: response.status,
      error: `Deploy hook returned HTTP ${response.status}`,
    };
  } catch {
    return {
      status: 'failed',
      error: 'Deploy hook request failed',
    };
  }
}
