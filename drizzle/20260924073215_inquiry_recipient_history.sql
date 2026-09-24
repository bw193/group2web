-- Apply before deploying the inquiry distribution code that reads this column.
-- Recover historical owners with scripts/backfill-inquiry-recipients.ts using
-- verified Resend delivery metadata. New assignments are persisted before
-- contacting the mail API.
ALTER TABLE public.inquiries
  ADD COLUMN IF NOT EXISTS recipient_user_id integer
  REFERENCES public.users (id) ON DELETE SET NULL;

-- Match the exact normalization and ordering used by the 30-day lookup.
CREATE INDEX IF NOT EXISTS inquiries_email_recipient_history_idx
  ON public.inquiries (lower(btrim(email)), created_at DESC, id DESC)
  WHERE recipient_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS inquiries_recipient_user_idx
  ON public.inquiries (recipient_user_id);
