"use client";

import { usePreferences } from "../lib/use-preferences";
import { useEffect, useId, useRef, type ReactNode } from "react";

export default function Modal({ title, children, onClose, variant = "dialog", nonModal = false }: { title: string; children: ReactNode; onClose: () => void; variant?: "dialog" | "sheet"; nonModal?: boolean }) {
  const { t } = usePreferences();
  const dialog = useRef<HTMLDialogElement>(null);
  const restoreFocus = useRef(true);
  const titleId = useId();
  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (element && !element.open) {
      if (nonModal) element.show(); else element.showModal();
      (element.querySelector<HTMLElement>("[data-dialog-initial-focus]") ?? (nonModal ? element.querySelector<HTMLElement>("button") : null))?.focus();
    }
    return () => {
      element?.close();
      if (restoreFocus.current && previousFocus?.isConnected) {
        previousFocus.focus({ preventScroll: true });
        if (nonModal) requestAnimationFrame(() => {
          if (previousFocus.isConnected && document.activeElement === document.body) previousFocus.focus({ preventScroll: true });
        });
      }
    };
  }, [nonModal]);
  useEffect(() => {
    if (!nonModal) return;
    const outside = (event: globalThis.PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element) || dialog.current?.contains(target) || target.closest("[data-actions-trigger]")) return;
      restoreFocus.current = !target.closest("button, a, input, select, textarea, [tabindex]");
      onClose();
    };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { event.preventDefault(); onClose(); } };
    document.addEventListener("pointerdown", outside, true);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside, true); document.removeEventListener("keydown", escape); };
  }, [nonModal, onClose]);
  return <dialog ref={dialog} aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); onClose(); }} className={`hundred-modal ${variant === "sheet" ? "hundred-sheet" : ""} ${nonModal ? "actions-popover" : ""} m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-[28px] border border-white/15 bg-neutral-900 p-6 text-white shadow-2xl backdrop:bg-black/75`}>
    <div className="mb-6 flex items-start justify-between gap-4">
      <h2 id={titleId} className="text-xl font-semibold">{title}</h2>
      <button type="button" onClick={onClose} aria-label={t("Закрити вікно")} className="rounded-lg px-2 py-1 text-neutral-300 hover:bg-white/10">✕</button>
    </div>
    {children}
  </dialog>;
}

