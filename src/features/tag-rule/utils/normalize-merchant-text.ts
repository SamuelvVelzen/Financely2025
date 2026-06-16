/**
 * Normalize merchant/transaction name for consistent rule matching.
 * Mirrors subscription auto-flag normalization.
 */
export function normalizeMerchantText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}/g, "")
    .replace(/\b\d{4}[\/\-.]\d{1,2}[\/\-.]\d{1,2}\b/g, "")
    .replace(/\s*#\s*\d+/g, "")
    .replace(/\s*ref\s*:?\s*\d+/gi, "")
    .trim();
}
