"use client";
import { useSyncExternalStore } from "react";

export type Screen = "home" | "resource" | "settings";
function readScreen(): Screen {
  const value = window.location.hash.slice(1);
  return value === "resource" || value === "settings" ? value : "home";
}
function subscribe(listener: () => void) {
  window.addEventListener("hashchange", listener);
  window.addEventListener("popstate", listener);
  window.addEventListener("hundred-screen", listener);
  return () => {
    window.removeEventListener("hashchange", listener);
    window.removeEventListener("popstate", listener);
    window.removeEventListener("hundred-screen", listener);
  };
}
function setScreen(screen: Screen) {
  if (window.location.hash === "#" + screen) return;
  window.history.pushState(null, "", "#" + screen);
  window.dispatchEvent(new Event("hundred-screen"));
}
export function useScreen(): [Screen, (screen: Screen) => void] {
  const screen = useSyncExternalStore<Screen>(subscribe, readScreen, () => "home");
  return [screen, setScreen];
}

