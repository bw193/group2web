/**
 * Site-setting keys that public pages are allowed to read. Only these keys are
 * copied into the public data snapshot, so private settings (inquiry routing,
 * internal config) never leave the database.
 */

/** Slug of the CMS video embedded on the public About page ('' / missing = automatic factory-tour pick). */
export const ABOUT_VIDEO_SETTING_KEY = 'about_video_slug';

export const PUBLIC_SITE_SETTING_KEYS: readonly string[] = [ABOUT_VIDEO_SETTING_KEY];
