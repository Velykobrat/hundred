"use client";

import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";
import { decodePreferences, defaultPreferences, formatNumber, formatPercent, PREFERENCES_KEY, translate, translateMessage, type Language, type Preferences, type Theme, type TranslationParams } from "./i18n";

type State = Preferences & { ready: boolean; error: boolean };
type Action = { type: "load"; preferences: Preferences } | { type: "change"; preferences: Preferences; error: boolean };
function reducer(state: State, action: Action): State {
  return { ...state, ...action.preferences, ready: true, error: action.type === "change" ? action.error : false };
}
type Context = Preferences & {
  setLanguage: (language: Language) => void;
  setTheme: (theme: Theme) => void;
  preferenceError: string;
  t: (key: string, params?: TranslationParams) => string;
  translateMessage: (message: string | null | undefined) => string;
  formatNumber: (value: number) => string;
  formatPercent: (value: number) => string;
};
const PreferencesContext = createContext<Context | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { ...defaultPreferences, ready: false, error: false });
  useEffect(() => {
    function load() {
      let preferences = defaultPreferences;
      try { preferences = decodePreferences(localStorage.getItem(PREFERENCES_KEY)); } catch { /* Keep usable defaults when browser storage is unavailable. */ }
      dispatch({ type: "load", preferences });
    }
    load();
    const onStorage = (event: StorageEvent) => { if (event.key === PREFERENCES_KEY || event.key === null) load(); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!state.ready) return;
    document.documentElement.lang = state.language;
    document.title = translate(state.language, "Hundred — побач свої ресурси");
    const media = state.theme === "system" && typeof window.matchMedia === "function" ? window.matchMedia("(prefers-color-scheme: dark)") : null;
    const apply = () => { document.documentElement.dataset.theme = state.theme === "system" ? media?.matches === false ? "light" : "dark" : state.theme; };
    apply();
    media?.addEventListener("change", apply);
    return () => media?.removeEventListener("change", apply);
  }, [state.language, state.theme, state.ready]);

  const value = useMemo<Context>(() => {
    function change(preferences: Preferences) {
      let error = false;
      try { localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences)); } catch { error = true; }
      dispatch({ type: "change", preferences, error });
    }
    return {
      language: state.language, theme: state.theme,
      setLanguage: (language) => change({ language, theme: state.theme }),
      setTheme: (theme) => change({ language: state.language, theme }),
      preferenceError: state.error ? translate(state.language, "Не вдалося зберегти налаштування. Вони діятимуть до закриття цієї вкладки.") : "",
      t: (key, params) => translate(state.language, key, params),
      translateMessage: (message) => translateMessage(state.language, message),
      formatNumber: (value) => formatNumber(value, state.language),
      formatPercent: (value) => formatPercent(value, state.language),
    };
  }, [state.language, state.theme, state.error]);
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error("usePreferences requires PreferencesProvider");
  return context;
}
