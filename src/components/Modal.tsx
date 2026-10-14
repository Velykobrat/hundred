"use client";

import { usePreferences } from "../lib/use-preferences";
import { useEffect, useId, useRef, type ReactNode } from "react";

export default function Modal({ title, children, onClose, variant = "dialog" }: { title: string; children: ReactNode; onClose: () => void; variant?: "dialog" | "sheet" }) {
  const { t } = usePreferences();
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const element = dialog.current;
    if (element && !element.open) element.showModal();
    return () => element?.close();
  }, []);
  return <dialog ref={dialog} aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); onClose(); }} className={`hundred-modal ${variant === "sheet" ? "hundred-sheet" : ""} m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-[28px] border border-white/15 bg-neutral-900 p-6 text-white shadow-2xl backdrop:bg-black/75`}>
    <div className="mb-6 flex items-start justify-between gap-4">
      <h2 id={titleId} className="text-xl font-semibold">{title}</h2>
      <button type="button" onClick={onClose} aria-label={t("Закрити вікно")} className="rounded-lg px-2 py-1 text-neutral-300 hover:bg-white/10">✕</button>
    </div>
    {children}
  </dialog>;
}

