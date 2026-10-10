import { emptyDocument, type Document } from "./document";
import { activeDocument, emptyCollection, putDocument, type Collection } from "./collection";

export type State = { collection: Collection; document: Document; past: Collection[]; future: Collection[]; ready: boolean; storageError: string | null; notice: string };
export type Action =
  | { type: "load"; document?: Document; collection?: Collection; error?: string; notice?: string }
  | { type: "change"; document: Document; notice: string }
  | { type: "replace"; collection: Collection; notice: string }
  | { type: "navigate"; pathIds: string[] }
  | { type: "select"; id: string | null }
  | { type: "remove"; id: string }
  | { type: "undo" | "redo" }
  | { type: "storage"; error: string | null };
export const initialState: State = { collection: emptyCollection, document: emptyDocument, past: [], future: [], ready: false, storageError: null, notice: "" };
function withCollection(state: State, collection: Collection): State {
  return { ...state, collection, document: activeDocument(collection) };
}
function commit(state: State, collection: Collection, notice: string): State {
  return withCollection({ ...state, past: [...state.past.slice(-29), state.collection], future: [], notice }, collection);
}
export function documentReducer(state: State, action: Action): State {
  if (action.type === "load") {
    const collection = action.collection ?? (action.document ? putDocument(emptyCollection, action.document) : emptyCollection);
    return withCollection({ ...initialState, ready: true, storageError: action.error ?? null, notice: action.notice ?? "" }, collection);
  }
  if (action.type === "storage") return { ...state, storageError: action.error };
  if (action.type === "navigate") return state.document.root ? withCollection(state, putDocument(state.collection, { ...state.document, pathIds: action.pathIds })) : state;
  if (action.type === "select") {
    if (action.id !== null && !state.collection.documents.some((document) => document.root?.id === action.id)) return state;
    return withCollection({ ...state, notice: "" }, { ...state.collection, activeId: action.id });
  }
  if (action.type === "remove") {
    const documents = state.collection.documents.filter((document) => document.root?.id !== action.id);
    if (documents.length === state.collection.documents.length) return state;
    return commit(state, { documents, activeId: state.collection.activeId === action.id ? documents[0]?.root?.id ?? null : state.collection.activeId }, "Розподіл видалено. Дію можна скасувати.");
  }
  if (action.type === "change") return commit(state, putDocument(state.collection, action.document), action.notice);
  if (action.type === "replace") return commit(state, action.collection, action.notice);
  if (action.type === "undo" && state.past.length) return withCollection({ ...state, past: state.past.slice(0, -1), future: [state.collection, ...state.future], notice: "Останню дію скасовано." }, state.past[state.past.length - 1]);
  if (action.type === "redo" && state.future.length) return withCollection({ ...state, past: [...state.past.slice(-29), state.collection], future: state.future.slice(1), notice: "Дію повторено." }, state.future[0]);
  return state;
}
