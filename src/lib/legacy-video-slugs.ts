/**
 * Old video addresses, each mapped to the video it belonged to.
 *
 * A video has one slug for every language (/<locale>/videos/<slug>). Renaming
 * a video in the CMS replaces that slug and keeps no record of the old one, so
 * the old address returned 404. Google still knew 62 of these on 24 Nov 2026
 * (Search Console's 404 and crawled lists, and Vercel's Googlebot log). The old
 * slugs come from the 24 Sep and 9 Oct 2026 public-data snapshots, checked
 * against each video's YouTube id; the "fram" entry is a one-letter typo of the
 * current slug that was live in between.
 *
 * Values are video ids, not slugs, so a later rename still lands on the live
 * page. Never list a slug that a video uses today: the live page wins anyway.
 */
export const LEGACY_VIDEO_SLUGS: Readonly<Record<string, string>> = {
  'black-frame-decorative-mirror-supplier-for-wholesale-orders': '2a9442d9-0675-44b7-b592-62dd5265eceb',
  'cloud-shape-walnut-wood-fram-led-bathroom-mirror-demo': 'a7541084-8d91-4459-a478-d50b68af4e7c',
  'custom-irregular-led-full-length-mirror-manufacturer': '3554e1c5-ed5d-4090-9997-6f29a3d96282',
  'custom-irregular-wood-frame-led-bathroom-mirror-manufacturer': '908671c5-2156-4fb0-b08a-f83eafb9a654',
  'custom-leaf-shaped-led-bathroom-mirror-with-sensor-switch': 'f3d423db-fdf4-4d9f-b767-8aab182a790d',
  'custom-wood-frame-led-bathroom-mirror-for-wholesale': 'dfe5de7d-a302-4a12-9777-a5a43de8c027',
  'frameless-capsule-led-bathroom-mirror-manufacturer-for-wholesale': '32475780-3c2f-4914-ae3c-2feefd6d400b',
  'gold-frame-lighted-mirror-manufacturer-for-wholesale-orders': '163dc4d0-23c8-4456-bfa4-721d33c99e6f',
  'irregular-wood-frame-led-bathroom-mirror-supplier': 'a7541084-8d91-4459-a478-d50b68af4e7c',
  'led-bathroom-mirror-manufacturer-showcase-at-china-international-furniture-fair': 'a4c1d9c8-7488-4afb-a644-9ac260f39d69',
  'mirror-packaging-drop-test-by-a-reliable-mirror-manufacturer': '8e08ac65-1111-4561-b4cb-843aad36fc58',
  'oem-frameless-capsule-led-bathroom-mirror-manufacturer': '916698b8-d80d-4338-9033-6497faba1811',
  'oem-irregular-frame-led-mirror-manufacturer-with-memory-function': 'f9adbd41-d08b-43d4-b7da-9f72a1e46eaa',
  'professional-led-mirror-manufacturer-in-china-chengtai-mirror-factory-tour': 'fcc88d89-dd8f-46b0-937f-8a3f64b47775',
  'upgraded-edge-finishing-process-for-smoother-rounded-corners-in-mirror-manufacturing': 'ddbc09a9-e88a-4ede-b215-18ea8c3291e5',
  'wholesale-capsule-led-bathroom-mirror-with-white-frame': 'edea0960-5754-49fc-b612-a7b48b49efd5',
  'wholesale-round-led-bathroom-mirror-with-memory-function': 'a26e29c9-54a7-4951-9bc2-43e601489666',
};

type VideoSlugRow = { id: string; slug: string; status: string };

/**
 * The slug a request for an old video address should be sent to: the current
 * slug of the published video it belonged to, or null to 404 as before.
 */
export function movedVideoSlug(slug: string, videos: ReadonlyArray<VideoSlugRow>): string | null {
  if (!Object.prototype.hasOwnProperty.call(LEGACY_VIDEO_SLUGS, slug)) return null;
  const id = LEGACY_VIDEO_SLUGS[slug];
  const video = videos.find((v) => v.id === id);
  if (!video || video.status !== 'published' || !video.slug || video.slug === slug) return null;
  return video.slug;
}
