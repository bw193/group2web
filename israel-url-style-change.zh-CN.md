# Hebrew Israel URL 风格变更说明

## 目标

为了让 Hebrew (`he`) 页面和其他语言 URL 明显区分，所有公开 Hebrew 页面现在统一使用 `israel-` 风格路径。非 Hebrew 语言保持原来的英文路径结构。

## 新 URL 规则

- 首页：`/he/israel-home`
- About：`/he/israel-about`
- Contact：`/he/israel-contact`
- Contact thank-you：`/he/israel-contact/israel-thank-you`
- 产品列表：`/he/israel-products`
- 产品详情：`/he/israel-products/israel-<english-slug>`
- Insight 列表：`/he/israel-insight`
- Insight 详情：`/he/israel-insight/israel-<english-slug>`

## 兼容旧 URL

旧 Hebrew 静态路径会 308 永久跳转到新路径：

- `/he` -> `/he/israel-home`
- `/he/about` -> `/he/israel-about`
- `/he/contact` -> `/he/israel-contact`
- `/he/contact/thank-you` -> `/he/israel-contact/israel-thank-you`
- `/he/products` -> `/he/israel-products`
- `/he/insight` -> `/he/israel-insight`

旧 Hebrew 产品和 Insight 详情路径会先按当前 slug / slug history 解析到实体，再一步跳转到新的 canonical URL，避免跳转链和重复内容。

## 实现位置

- `src/lib/public-paths.ts`：集中定义 Hebrew 路径映射和语言切换反向映射。
- `src/lib/seo.ts`：`localizedPath()` / `localizedUrl()` 统一使用新映射。
- `next.config.ts`：旧 Hebrew 静态页面 308 redirect。
- `src/app/[locale]/israel-*`：新增 Hebrew 专用 alias routes。
- 产品和 Insight 详情页：旧 `/he/products/...`、`/he/insight/...` 只负责 redirect；新 `/he/israel-products/...`、`/he/israel-insight/...` 渲染 canonical 内容。
- Header、Footer、ProductCard、首页 CTA、表单成功页、Insight 列表等内部链接都改为使用统一路径 helper。

## SEO 行为

canonical、hreflang、sitemap、JSON-LD 和内部链接都会输出 Hebrew 的 `israel-` 路径。非 Hebrew URL 不改变。

## 验证

- `npm test`
- `npm run typecheck`
- `npm run build`
