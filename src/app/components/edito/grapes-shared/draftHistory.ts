// Sauvegarde de brouillon (localStorage) + historique de versions léger pour les éditeurs GrapesJS.
// Volontairement simple : pas de backend, pas de diff — un instantané complet par entrée, plafonné en nombre.

export interface EditorSnapshot {
  html: string;
  css: string;
  js: string;
  savedAt: number;
}

export type EditorScope = "post" | "product" | "project" | "page";

const DRAFT_PREFIX = "md2i:editor-draft:";
const HISTORY_PREFIX = "md2i:editor-history:";
const MAX_HISTORY_ENTRIES = 20;
const MIN_HISTORY_INTERVAL_MS = 60_000;

function draftKey(scope: EditorScope, id: string) {
  return `${DRAFT_PREFIX}${scope}:${id}`;
}

function historyKey(scope: EditorScope, id: string) {
  return `${HISTORY_PREFIX}${scope}:${id}`;
}

function safeGet(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function safeRemove(key: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function saveDraft(scope: EditorScope, id: string, snapshot: EditorSnapshot) {
  safeSet(draftKey(scope, id), JSON.stringify(snapshot));
}

export function loadDraft(scope: EditorScope, id: string): EditorSnapshot | null {
  const raw = safeGet(draftKey(scope, id));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as EditorSnapshot;
  } catch {
    return null;
  }
}

export function clearDraft(scope: EditorScope, id: string) {
  safeRemove(draftKey(scope, id));
}

export function listHistory(scope: EditorScope, id: string): EditorSnapshot[] {
  const raw = safeGet(historyKey(scope, id));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Ajoute un instantané, en respectant un intervalle minimum entre deux entrées
// et un plafond (les plus anciennes sont évincées en premier).
export function pushHistoryEntry(scope: EditorScope, id: string, snapshot: EditorSnapshot) {
  const entries = listHistory(scope, id);
  const last = entries[entries.length - 1];
  if (last && snapshot.savedAt - last.savedAt < MIN_HISTORY_INTERVAL_MS) return;

  const next = [...entries, snapshot].slice(-MAX_HISTORY_ENTRIES);
  if (safeSet(historyKey(scope, id), JSON.stringify(next))) return;

  // Quota localStorage dépassé : on réduit de moitié et on retente une fois.
  const trimmed = next.slice(Math.ceil(next.length / 2));
  safeSet(historyKey(scope, id), JSON.stringify(trimmed));
}

export function clearHistory(scope: EditorScope, id: string) {
  safeRemove(historyKey(scope, id));
}

export function formatRelativeTime(timestamp: number): string {
  const diffMs = timestamp - Date.now();
  const diffMin = Math.round(diffMs / 60_000);
  const rtf = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });

  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, "minute");

  const diffHour = Math.round(diffMin / 60);
  if (Math.abs(diffHour) < 24) return rtf.format(diffHour, "hour");

  const diffDay = Math.round(diffHour / 24);
  return rtf.format(diffDay, "day");
}
