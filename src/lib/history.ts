import { emptyDocument, normalizeDocument, type Document } from "./document";

export type State = { document: Document; past: Document[]; future: Document[]; ready: boolean; storageError: string | null; notice: string };
export type Action =
  | { type: "load"; document: Document; error?: string; notice?: string }
  | { type: "change"; document: Document; notice: string }
  | { type: "navigate"; pathIds: string[] }
  | { type: "undo" | "redo" }
  | { type: "storage"; error: string | null };
export const initialState: State = { document: emptyDocument, past: [], future: [], ready: false, storageError: null, notice: "" };
export function documentReducer(state: State, action: Action): State {
  if (action.type === "load") return { ...initialState, document: action.document, ready: true, storageError: action.error ?? null, notice: action.notice ?? "" };
  if (action.type === "storage") return { ...state, storageError: action.error };
  if (action.type === "navigate") return { ...state, document: normalizeDocument({ ...state.document, pathIds: action.pathIds }) };
  if (action.type === "change") return { ...state, document: normalizeDocument(action.document), past: [...state.past.slice(-29), state.document], future: [], notice: action.notice };
  if (action.type === "undo" && state.past.length) return { ...state, document: normalizeDocument(state.past[state.past.length - 1]), past: state.past.slice(0, -1), future: [state.document, ...state.future], notice: "Останню дію скасовано." };
  if (action.type === "redo" && state.future.length) return { ...state, document: normalizeDocument(state.future[0]), past: [...state.past.slice(-29), state.document], future: state.future.slice(1), notice: "Дію повторено." };
  return state;
}
