"use client";

import { useEffect, useLayoutEffect, useReducer, useCallback, useRef } from "react";
import { STORAGE_KEY, type Document } from "./document";
import { appendImported, cloneDocument, emptyCollection, putDocument, type Collection } from "./collection";
import { decodeStoredCollection, InvalidStoredCollection, writeCollection } from "./collection-storage";
import { documentReducer as reducer, initialState as initial, type Action, type State } from "./history";
import { createId } from "./id";

const conflictNotice = "Дані змінилися в іншій вкладці. Новішу версію завантажено, щоб не перезаписати зміни.";

export function useDocument() {
  const [state, dispatch] = useReducer((_previous: State, next: State) => next, initial);
  const stateRef = useRef(state);
  const blockedStorage = useRef(false);
  const persistedRaw = useRef<string | null>(null);
  const awaitingExternalRender = useRef(false);
  const apply = useCallback((action: Action) => {
    const next = reducer(stateRef.current, action);
    stateRef.current = next;
    dispatch(next);
    return next;
  }, []);
  useLayoutEffect(() => {
    if (state.collection === stateRef.current.collection) awaitingExternalRender.current = false;
  }, [state.collection]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const stored = decodeStoredCollection(raw);
      persistedRaw.current = raw;
      blockedStorage.current = false;
      apply({ type: "load", collection: stored.collection });
    } catch {
      blockedStorage.current = true;
      apply({ type: "load", collection: emptyCollection, error: "Не вдалося прочитати збереження. Нові зміни поки не зберігатимуться; попередні дані не перезаписані." });
    }
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY && event.key !== null) return;
      try {
        // A queued event may describe a value already superseded by another write.
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw === persistedRaw.current) return;
        const stored = decodeStoredCollection(raw);
        persistedRaw.current = raw;
        blockedStorage.current = false;
        awaitingExternalRender.current = true;
        apply({ type: "load", collection: stored.collection, notice: "Дані оновлено в іншій вкладці. Історію дій очищено." });
      } catch {
        blockedStorage.current = true;
        apply({ type: "storage", error: "Інша вкладка записала некоректні дані. Автозбереження призупинено; поточні цілі залишилися." });
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [apply]);

  const send = useCallback((action: Action): string | void => {
    const current = stateRef.current;
    if (!current.ready) return "Дані ще відновлюються.";
    // Event handlers from the previous render can still contain an old document.
    if (awaitingExternalRender.current) return conflictNotice;
    let next;
    try { next = reducer(current, action); } catch (error) { return error instanceof Error ? error.message : "Не вдалося виконати дію."; }
    if (next.collection === current.collection || blockedStorage.current) {
      apply(action);
      return;
    }
    try {
      const result = writeCollection(localStorage, persistedRaw.current, next.collection, createId);
      if (result.kind === "conflict") {
        persistedRaw.current = result.raw;
        awaitingExternalRender.current = true;
        apply({ type: "load", collection: result.stored.collection, notice: conflictNotice });
        return conflictNotice;
      }
      persistedRaw.current = result.raw;
      apply(action);
      apply({ type: "storage", error: null });
    } catch (error) {
      if (error instanceof InvalidStoredCollection) {
        blockedStorage.current = true;
        apply({ type: "storage", error: "Інша вкладка записала некоректні дані. Автозбереження призупинено; поточні цілі залишилися." });
        return "Інша вкладка записала некоректні дані. Автозбереження призупинено; поточні цілі залишилися.";
      }
      apply(action);
      apply({ type: "storage", error: "Не вдалося зберегти дані на цьому пристрої. Залиш цю вкладку відкритою та завантаж резервну копію." });
    }
  }, [apply]);

  const duplicate = (copyName?: string) => {
    try {
      const current = stateRef.current;
      const document = cloneDocument(current.document, createId, copyName ?? `Копія — ${current.document.root?.name ?? ""}`);
      return send({ type: "replace", collection: putDocument(current.collection, document), notice: "Копію створено. Її можна змінювати незалежно від оригіналу." });
    } catch (error) { return error instanceof Error ? error.message : "Не вдалося створити копію."; }
  };
  const importCollection = (incoming: Collection) => {
    try {
      return send({ type: "replace", collection: appendImported(stateRef.current.collection, incoming, createId), notice: `Імпортовано цілих: ${incoming.documents.length}. Попередні цілі залишилися.` });
    } catch (error) { return error instanceof Error ? error.message : "Не вдалося імпортувати копію."; }
  };

  return { ...state, change: (document: Document, notice: string) => send({ type: "change", document, notice }), navigate: (pathIds: string[]) => send({ type: "navigate", pathIds }), select: (id: string | null) => send({ type: "select", id }), open: (id: string, pathIds: string[]) => send({ type: "open", id, pathIds }), remove: (id: string) => send({ type: "remove", id }), duplicate, importCollection, undo: () => send({ type: "undo" }), redo: () => send({ type: "redo" }) };
}

