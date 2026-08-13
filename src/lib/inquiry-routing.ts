export const INQUIRY_RECIPIENT_USER_IDS_KEY = 'inquiry_recipient_user_ids';

export function normalizeRecipientUserIds(value: unknown): number[] {
  if (!Array.isArray(value)) return [];

  return [...new Set(
    value.filter(
      (item): item is number => typeof item === 'number' && Number.isInteger(item) && item > 0,
    ),
  )].sort((a, b) => a - b);
}

export function parseRecipientUserIds(value: string | null | undefined): number[] {
  if (!value) return [];

  try {
    return normalizeRecipientUserIds(JSON.parse(value));
  } catch {
    return [];
  }
}
