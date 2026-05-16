"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  DEFAULT_LOCALE,
  isLocale,
  LOCALE_STORAGE_KEY,
  type Locale,
} from "./index";
import { translate } from "./dictionary";

// Tiny in-memory pub/sub so same-tab writes notify immediately.
// Cross-tab sync is handled by the 'storage' event in subscribe().
const listeners = new Set<() => void>();

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  if (typeof window !== "undefined") {
    window.addEventListener("storage", callback);
  }
  return () => {
    listeners.delete(callback);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", callback);
    }
  };
}

function notifyListeners() {
  listeners.forEach((cb) => cb());
}

function getClientSnapshot(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isLocale(stored)) return stored;

    const browser = window.navigator?.language?.toLowerCase() ?? "";
    if (browser.startsWith("cs")) return "cs";
  } catch {
    // ignore (private mode etc.)
  }
  return DEFAULT_LOCALE;
}

function getServerSnapshot(): Locale {
  // SSR always renders DEFAULT_LOCALE; client hydrates and re-renders if
  // localStorage / navigator says otherwise. Brief flash for non-en users.
  return DEFAULT_LOCALE;
}

type I18nContextValue = {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot
  );

  const setLocale = useCallback((next: Locale) => {
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      // ignore
    }
    notifyListeners();
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) =>
      translate(locale, key, vars),
    [locale]
  );

  const value = useMemo<I18nContextValue>(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

function useI18nContext(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useT/useLocale must be used inside <I18nProvider>");
  }
  return ctx;
}

export function useT() {
  return useI18nContext().t;
}

export function useLocale() {
  const { locale, setLocale } = useI18nContext();
  return { locale, setLocale };
}
