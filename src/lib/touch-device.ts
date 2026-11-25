// Prefer the browser's input capabilities over viewport size, including hybrid devices.
export function isTouchDevice(): boolean {
  return navigator.maxTouchPoints > 0 || (typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches);
}
