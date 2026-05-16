// Public types and constants for the i18n module.

export type Locale = "en" | "cs";

export const LOCALES: Locale[] = ["en", "cs"];

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_STORAGE_KEY = "unseen.language";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  cs: "Čeština",
};

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "cs";
}
