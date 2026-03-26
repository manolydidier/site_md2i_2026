/**
 * Generate a URL-safe slug from a string.
 * Handles accented characters, strips HTML, collapses whitespace.
 */
export function generateSlug(text: string): string {
  return text
    .normalize("NFD")                          // decompose accents
    .replace(/[\u0300-\u036f]/g, "")           // remove diacritics
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")             // keep only alphanumeric, spaces, hyphens
    .trim()
    .replace(/[\s_]+/g, "-")                   // spaces → hyphens
    .replace(/-+/g, "-")                       // collapse multiple hyphens
    .replace(/^-|-$/g, "");                    // trim leading/trailing hyphens
}