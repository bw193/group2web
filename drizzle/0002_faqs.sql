-- FAQ tables (PostgreSQL / Supabase)

CREATE TABLE IF NOT EXISTS faqs (
  id SERIAL PRIMARY KEY,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS faq_translations (
  id SERIAL PRIMARY KEY,
  faq_id INTEGER NOT NULL REFERENCES faqs(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS faq_translations_faq_idx ON faq_translations (faq_id);
CREATE INDEX IF NOT EXISTS faq_translations_locale_idx ON faq_translations (locale);

-- Seed the 6 home-page FAQ items so the public site keeps rendering after wire-up.
-- Skips silently if the table already has rows.
DO $$
DECLARE
  v_faq_id INTEGER;
  v_count  INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM faqs;
  IF v_count = 0 THEN
    -- 01
    INSERT INTO faqs (display_order, is_active) VALUES (10, true) RETURNING id INTO v_faq_id;
    INSERT INTO faq_translations (faq_id, locale, question, answer) VALUES
      (v_faq_id, 'en', 'Do you accept sample orders?',
       'Yes — we support our customers in ordering samples to test quality and function before placing a full production order.');

    -- 02
    INSERT INTO faqs (display_order, is_active) VALUES (20, true) RETURNING id INTO v_faq_id;
    INSERT INTO faq_translations (faq_id, locale, question, answer) VALUES
      (v_faq_id, 'en', 'What is your typical lead time?',
       'Generally 10–15 days for standard orders. For larger volumes, we coordinate a tailored production schedule with you in advance.');

    -- 03
    INSERT INTO faqs (display_order, is_active) VALUES (30, true) RETURNING id INTO v_faq_id;
    INSERT INTO faq_translations (faq_id, locale, question, answer) VALUES
      (v_faq_id, 'en', 'Do you have an MOQ restriction?',
       'Low MOQ — even 1 pc is acceptable for sample checking. We scale production smoothly from a single unit to high-volume runs.');

    -- 04
    INSERT INTO faqs (display_order, is_active) VALUES (40, true) RETURNING id INTO v_faq_id;
    INSERT INTO faq_translations (faq_id, locale, question, answer) VALUES
      (v_faq_id, 'en', 'Do you operate your own factory?',
       'Yes. We have specialized in mirror manufacturing for over fifteen years — producing LED mirrors, bathroom mirrors, dressing mirrors, and full mirror cabinets in-house.');

    -- 05
    INSERT INTO faqs (display_order, is_active) VALUES (50, true) RETURNING id INTO v_faq_id;
    INSERT INTO faq_translations (faq_id, locale, question, answer) VALUES
      (v_faq_id, 'en', 'Can we print our own logo on the products?',
       'Yes. Please inform us formally before production begins and confirm the design first against our pre-production sample.');

    -- 06
    INSERT INTO faqs (display_order, is_active) VALUES (60, true) RETURNING id INTO v_faq_id;
    INSERT INTO faq_translations (faq_id, locale, question, answer) VALUES
      (v_faq_id, 'en', 'Do you offer a warranty on the products?',
       'Yes — every product ships with a two-year warranty, backed by our quality assurance and after-sales support.');
  END IF;
END $$;
