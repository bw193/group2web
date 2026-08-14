export const INQUIRY_RECIPIENT_USER_IDS_KEY = 'inquiry_recipient_user_ids';

export interface InquiryRoutingState {
  recipientUserIds: number[];
  lastRecipientUserId: number | null;
}

export function normalizeRecipientUserIds(value: unknown): number[] {
  if (!Array.isArray(value)) return [];

  return [...new Set(
    value.filter(
      (item): item is number => typeof item === 'number' && Number.isInteger(item) && item > 0,
    ),
  )].sort((a, b) => a - b);
}

export function parseRecipientUserIds(value: string | null | undefined): number[] {
  return parseInquiryRoutingState(value).recipientUserIds;
}

export function parseInquiryRoutingState(
  value: string | null | undefined,
): InquiryRoutingState {
  const emptyState: InquiryRoutingState = {
    recipientUserIds: [],
    lastRecipientUserId: null,
  };

  if (!value) return emptyState;

  try {
    const parsed: unknown = JSON.parse(value);

    // Backward compatibility: the original setting was stored as a plain ID array.
    if (Array.isArray(parsed)) {
      return {
        recipientUserIds: normalizeRecipientUserIds(parsed),
        lastRecipientUserId: null,
      };
    }

    if (!parsed || typeof parsed !== 'object') return emptyState;

    const candidate = parsed as Record<string, unknown>;
    const recipientUserIds = normalizeRecipientUserIds(candidate.recipientUserIds);
    const lastRecipientUserId = candidate.lastRecipientUserId;

    return {
      recipientUserIds,
      lastRecipientUserId:
        typeof lastRecipientUserId === 'number' &&
        Number.isInteger(lastRecipientUserId) &&
        recipientUserIds.includes(lastRecipientUserId)
          ? lastRecipientUserId
          : null,
    };
  } catch {
    return emptyState;
  }
}

export function serializeInquiryRoutingState(state: InquiryRoutingState): string {
  return JSON.stringify({
    recipientUserIds: normalizeRecipientUserIds(state.recipientUserIds),
    lastRecipientUserId: state.lastRecipientUserId,
  });
}

export function selectNextRecipientId(
  orderedRecipientIds: number[],
  lastRecipientUserId: number | null,
  eligibleRecipientIds: ReadonlySet<number> = new Set(orderedRecipientIds),
): number | null {
  if (orderedRecipientIds.length === 0) return null;

  const lastIndex = lastRecipientUserId === null
    ? -1
    : orderedRecipientIds.indexOf(lastRecipientUserId);
  const startIndex = lastIndex < 0 ? 0 : lastIndex + 1;

  for (let offset = 0; offset < orderedRecipientIds.length; offset += 1) {
    const recipientId = orderedRecipientIds[
      (startIndex + offset) % orderedRecipientIds.length
    ];
    if (eligibleRecipientIds.has(recipientId)) return recipientId;
  }

  return null;
}
