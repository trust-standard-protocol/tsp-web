// Tiny i18n layer for the static site. EN is the server-rendered default; NO is
// a launch draft (pending native Bokmål proofread). Components render EN via
// t("en", key) and tag each localized node with data-i18n="<key>"; the i18n
// island swaps text to the active language on the client. Keys are dot-paths
// with numeric segments for arrays, e.g. "scope.verifies_items.0.title".
import en from "./en.json";
import no from "./no.json";

export type Lang = "en" | "no";
export const LANGS: readonly Lang[] = ["en", "no"];
export const DEFAULT_LANG: Lang = "en";

export const dicts: Record<Lang, unknown> = { en, no };

/** Resolve a dot-path (with numeric array segments) against a dictionary. */
export function resolve(dict: unknown, path: string): unknown {
  let node: unknown = dict;
  for (const seg of path.split(".")) {
    if (node == null || typeof node !== "object") return undefined;
    node = (node as Record<string, unknown>)[seg];
  }
  return node;
}

/** Active language on the client: persisted choice, then <html lang>, then EN.
 * Client-only — call it at event time so language toggles apply immediately. */
export function clientLang(): Lang {
  try {
    const stored = localStorage.getItem("tsp-lang");
    if (stored === "en" || stored === "no") return stored;
  } catch {
    /* storage unavailable */
  }
  return document.documentElement.lang === "no" ? "no" : "en";
}

/** Localized string for a key; falls back to EN, then "". */
export function t(lang: Lang, path: string): string {
  const v = resolve(dicts[lang], path);
  if (typeof v === "string") return v;
  const fallback = resolve(dicts.en, path);
  return typeof fallback === "string" ? fallback : "";
}

export { en, no };
