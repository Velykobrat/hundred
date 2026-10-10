"use client";

import { useEffect, useReducer, useCallback, useRef } from "react";
import { STORAGE_KEY, type Document } from "./document";
import { appendImported, cloneDocument, decodeCollection, emptyCollection, encodeCollection, putDocument, type Collection } from "./collection";
import { documentReducer as reducer, initialState as initial, type Action } from "./history";

export function useDocument() {
  const [state, dispatch] = useReducer(reducer, initial);
  const stateRef = useRef(state);
  const blockedStorage = useRef(false);
  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      dispatch({ type: "load", collection: raw ? decodeCollection(raw) : emptyCollection });
    } catch {
      blockedStorage.current = true;
      dispatch({ type: "load", collection: emptyCollection, error: "Не вдалося прочитати збереження. Нові зміни поки не зберігатимуться; попередні дані не перезаписані." });
    }
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY && event.key !== null) return;
      try {
        const collection = event.newValue ? decodeCollection(event.newValue) : emptyCollection;
        blockedStorage.current = false;
        dispatch({ type: "load", collection, notice: "Дані оновлено в іншій вкладці. Історію дій очищено." });
      } catch {
        blockedStorage.current = true;
        dispatch({ type: "storage", error: "Інша вкладка записала некоректні дані. Автозбереження призупинено; поточні розподіли залишилися." });
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const send = useCallback((action: Action): string | void => {
    const current = stateRef.current;
    if (!current.ready) return "Дані ще відновлюються.";
    let next;
    try { next = reducer(current, action); } catch (error) { return error instanceof Error ? error.message : "Не вдалося виконати дію."; }
    stateRef.current = next;
    dispatch(action);
    if (next.collection === current.collection || blockedStorage.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, encodeCollection(next.collection));
      dispatch({ type: "storage", error: null });
    } catch {
      dispatch({ type: "storage", error: "Не вдалося зберегти дані на цьому пристрої. Залиш цю вкладку відкритою та завантаж резервну копію." });
    }
  }, []);

  const duplicate = () => {
    try {
      const current = stateRef.current;
      const document = cloneDocument(current.document, () => crypto.randomUUID(), `Копія — ${current.document.root?.name ?? ""}`);
      return send({ type: "replace", collection: putDocument(current.collection, document), notice: "Копію створено. Її можна змінювати незалежно від оригіналу." });
    } catch (error) { return error instanceof Error ? error.message : "Не вдалося створити копію."; }
  };
  const importCollection = (incoming: Collection) => {
    try {
      return send({ type: "replace", collection: appendImported(stateRef.current.collection, incoming, () => crypto.randomUUID()), notice: `Імпортовано розподілів: ${incoming.documents.length}. Попередні розподіли залишилися.` });
    } catch (error) { return error instanceof Error ? error.message : "Не вдалося імпортувати копію."; }
  };

  return { ...state, change: (document: Document, notice: string) => send({ type: "change", document, notice }), navigate: (pathIds: string[]) => send({ type: "navigate", pathIds }), select: (id: string | null) => send({ type: "select", id }), remove: (id: string) => send({ type: "remove", id }), duplicate, importCollection, undo: () => send({ type: "undo" }), redo: () => send({ type: "redo" }) };
}
