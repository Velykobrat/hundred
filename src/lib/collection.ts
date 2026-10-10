import type { Node } from "../types/node";
import { decodeDocument, emptyDocument, normalizeDocument, type Document } from "./document";

export type Collection = { documents: Document[]; activeId: string | null };
export const emptyCollection: Collection = { documents: [], activeId: null };
export const MAX_DOCUMENTS = 20;
export const MAX_FILE_SIZE = 4_000_000;

export function activeDocument(collection: Collection): Document {
  return collection.documents.find((document) => document.root?.id === collection.activeId) ?? emptyDocument;
}
export function encodeCollection(collection: Collection): string {
  return JSON.stringify({ version: 2, ...collection });
}
export function decodeCollection(raw: string): Collection {
  if (raw.length > MAX_FILE_SIZE) throw new Error("Файл завеликий. Максимальний розмір — 4 МБ.");
  let data;
  try { data = JSON.parse(raw); } catch { throw new Error("Це не коректний JSON-файл резервної копії."); }
  if (data?.version === 1) {
    const document = decodeDocument(raw);
    return document.root ? { documents: [document], activeId: document.root.id } : emptyCollection;
  }
  if (!data || data.version !== 2 || !Array.isArray(data.documents) || data.documents.length > MAX_DOCUMENTS ||
      (data.activeId !== null && typeof data.activeId !== "string")) throw new Error("Непідтримуваний формат копії Hundred або забагато розподілів.");
  const documents: Document[] = data.documents.map((document: unknown) => {
    if (!document || typeof document !== "object") throw new Error("Некоректні дані розподілу.");
    const candidate = document as Document;
    const restored = decodeDocument(JSON.stringify({ version: 1, root: candidate.root, pathIds: candidate.pathIds }));
    if (!restored.root) throw new Error("Копія містить порожній розподіл.");
    return restored;
  });
  const ids = new Set(documents.map((document) => document.root!.id));
  if (ids.size !== documents.length) throw new Error("Копія містить розподіли з однаковими ідентифікаторами.");
  const activeId = data.activeId === null ? null : ids.has(data.activeId) ? data.activeId : documents[0]?.root?.id ?? null;
  return { documents, activeId };
}
export function cloneDocument(document: Document, nextId: () => string, name?: string): Document {
  if (!document.root) throw new Error("Немає розподілу для копіювання.");
  function clone(node: Node): Node {
    return { ...node, id: nextId(), children: node.children.map(clone) };
  }
  const root = clone(document.root);
  if (name) root.name = name.slice(0, 120);
  return { root, pathIds: [root.id] };
}
export function putDocument(collection: Collection, document: Document): Collection {
  const normalized = normalizeDocument(document);
  if (!normalized.root) return { ...collection, activeId: null };
  const exists = collection.documents.some((item) => item.root?.id === normalized.root!.id);
  if (!exists && collection.documents.length >= MAX_DOCUMENTS) throw new Error(`Можна зберегти до ${MAX_DOCUMENTS} розподілів. Видали один із наявних.`);
  return { documents: exists ? collection.documents.map((item) => item.root?.id === normalized.root!.id ? normalized : item) : [...collection.documents, normalized], activeId: normalized.root.id };
}
export function appendImported(collection: Collection, incoming: Collection, nextId: () => string): Collection {
  if (!incoming.documents.length) throw new Error("Файл не містить збережених розподілів.");
  if (collection.documents.length + incoming.documents.length > MAX_DOCUMENTS) throw new Error(`Після імпорту буде більше ${MAX_DOCUMENTS} розподілів. Звільни місце та спробуй ще раз.`);
  const imported = incoming.documents.map((document) => cloneDocument(document, nextId));
  return { documents: [...collection.documents, ...imported], activeId: imported[0].root!.id };
}
