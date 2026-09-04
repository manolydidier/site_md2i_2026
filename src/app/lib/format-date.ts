// src/app/lib/format-date.ts
// Formatage de date centralisé — un seul endroit pour les quatre gabarits
// (`Intl.DateTimeFormat`) qui étaient auparavant réimplémentés à l'identique
// dans une vingtaine de fichiers admin et publics.

export type DateFormatStyle = "short" | "medium" | "long" | "datetime" | "numeric";

const STYLE_OPTIONS: Record<DateFormatStyle, Intl.DateTimeFormatOptions> = {
  short: { day: "2-digit", month: "short", year: "numeric" },
  medium: { dateStyle: "medium" },
  long: { day: "2-digit", month: "long", year: "numeric" },
  datetime: { dateStyle: "medium", timeStyle: "short" },
  numeric: { day: "2-digit", month: "2-digit", year: "numeric" },
};

export function formatDate(
  value: string | Date | null | undefined,
  options: { style?: DateFormatStyle; fallback?: string; locale?: string } = {}
): string {
  const { style = "medium", fallback = "—", locale = "fr-FR" } = options;

  if (!value) return fallback;

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return fallback;

  return new Intl.DateTimeFormat(locale, STYLE_OPTIONS[style]).format(date);
}
