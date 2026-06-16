/**
 * Serializable article shape the server page hands to the client filter
 * island. Labels are pre-localized server-side so the island ships no
 * formatting logic — it only filters and renders.
 */
export interface DisplayArticle {
  id: number;
  categoryKey: string;
  categoryLabel: string;
  dateLabel: string;
  readLabel: string;
  title: string;
  dek: string | null;
  author: string | null;
  href: string;
  /** Row thumbnail key (thumbnail, falling back to cover); null → text-only row. */
  imagePath: string | null;
  /** 1-based position in the full list, zero-padded ("01") — the index numeral. */
  indexLabel: string;
}

export interface CategoryTab {
  key: string;
  label: string;
}
