// Client-side language toggle. EN is server-rendered; this swaps every
// [data-i18n] node to the active language and persists the choice. NO is a
// launch draft — the draft notice is CSS-gated on <html lang="no">.
import { dicts, resolve, LANGS, DEFAULT_LANG } from "../i18n";
import type { Lang } from "../i18n";

const STORAGE_KEY = "tsp-lang";

function isLang(v: string | null): v is Lang {
  return v === "en" || v === "no";
}

function initialLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isLang(stored)) return stored;
  } catch {
    /* storage unavailable */
  }
  const nav = (navigator.language || "").toLowerCase();
  if (nav.startsWith("nb") || nav.startsWith("nn") || nav.startsWith("no")) return "no";
  return DEFAULT_LANG;
}

function applyLang(lang: Lang): void {
  const dict = dicts[lang];
  document.documentElement.lang = lang;

  document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    if (!key) return;
    const value = resolve(dict, key);
    if (typeof value === "string") el.textContent = value;
  });

  document.querySelectorAll<HTMLElement>("[data-i18n-placeholder]").forEach((el) => {
    const key = el.dataset.i18nPlaceholder;
    if (!key) return;
    const value = resolve(dict, key);
    if (typeof value === "string") el.setAttribute("placeholder", value);
  });

  document.querySelectorAll<HTMLButtonElement>("[data-lang-set]").forEach((btn) => {
    btn.setAttribute("aria-pressed", String(btn.dataset.langSet === lang));
  });

  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* storage unavailable */
  }
}

const current = initialLang();
// EN is already in the DOM; only walk-and-swap when starting in another language.
if (current !== DEFAULT_LANG) applyLang(current);
else {
  document.documentElement.lang = current;
  document.querySelectorAll<HTMLButtonElement>("[data-lang-set]").forEach((btn) => {
    btn.setAttribute("aria-pressed", String(btn.dataset.langSet === current));
  });
}

for (const lang of LANGS) {
  document.querySelectorAll<HTMLButtonElement>(`[data-lang-set="${lang}"]`).forEach((btn) => {
    btn.addEventListener("click", () => applyLang(lang));
  });
}
