import { PREFERENCES_KEY } from "./i18n";

// Apply stored, validated preferences before paint. Never evaluate stored content.
export const preferenceScript = `try {
  var p = JSON.parse(localStorage.getItem("${PREFERENCES_KEY}") || "{}");
  var root = document.documentElement;
  root.lang = p.language === "en" ? "en" : "uk";
  root.dataset.theme = p.theme === "light" ? "light" : p.theme === "system" && window.matchMedia && !window.matchMedia("(prefers-color-scheme: dark)").matches ? "light" : "dark";
} catch (_) {}`;
