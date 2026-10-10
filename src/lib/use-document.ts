"use client";

import { useEffect, useReducer, useCallback, useRef } from "react";
import { decodeDocument, emptyDocument, encodeDocument, STORAGE_KEY, type Document } from "./document";
import { documentReducer as reducer, initialState as initial, type Action } from "./history";

export function useDocument() {
  const [state, dispatch] = useReducer(reducer, initial);
  const stateRef = useRef(state);
  const blockedStorage = useRef(false);
  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      dispatch({ type: "load", document: raw ? decodeDocument(raw) : emptyDocument });
    } catch {
      blockedStorage.current = true;
      dispatch({ type: "load", document: emptyDocument, error: "Не вдалося прочитати збереження. Нові зміни поки не зберігатимуться; попередні дані не перезаписані." });
    }
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY && event.key !== null) return;
      try {
        const document = event.newValue ? decodeDocument(event.newValue) : emptyDocument;
        blockedStorage.current = false;
        dispatch({ type: "load", document, notice: "Дані оновлено в іншій вкладці. Історію дій очищено." });
      } catch {
        blockedStorage.current = true;
        dispatch({ type: "storage", error: "Інша вкладка записала некоректні дані. Автозбереження призупинено; поточний розподіл залишився." });
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const send = useCallback((action: Action) => {
    const current = stateRef.current;
    if (!current.ready) return;
    const next = reducer(current, action);
    stateRef.current = next;
    dispatch(action);
    if (next.document === current.document || blockedStorage.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, encodeDocument(next.document));
      dispatch({ type: "storage", error: null });
    } catch {
      dispatch({ type: "storage", error: "Не вдалося зберегти дані на цьому пристрої. Залиш цю вкладку відкритою та завантаж резервну копію." });
    }
  }, []);

  return { ...state, change: (document: Document, notice: string) => send({ type: "change", document, notice }), navigate: (pathIds: string[]) => send({ type: "navigate", pathIds }), undo: () => send({ type: "undo" }), redo: () => send({ type: "redo" }) };
}
