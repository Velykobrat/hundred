import { decodeCollection, emptyCollection, encodeCollection, type Collection } from "./collection";
import { STORAGE_KEY } from "./document";

export type StoredCollection = { collection: Collection; revision: string | null };

export class InvalidStoredCollection extends Error {}

export function decodeStoredCollection(raw: string | null): StoredCollection {
  if (raw === null) return { collection: emptyCollection, revision: null };
  try {
    const collection = decodeCollection(raw);
    const data = JSON.parse(raw);
    if (data.revision !== undefined && (typeof data.revision !== "string" || !data.revision)) {
      throw new Error("Invalid storage revision");
    }
    return { collection, revision: data.revision ?? null };
  } catch {
    throw new InvalidStoredCollection("Invalid stored collection");
  }
}

export function writeCollection(
  storage: Pick<Storage, "getItem" | "setItem">,
  expectedRaw: string | null,
  collection: Collection,
  createRevision: () => string,
): { kind: "conflict"; raw: string | null; stored: StoredCollection } | { kind: "saved"; raw: string; revision: string } {
  const raw = storage.getItem(STORAGE_KEY);
  if (raw !== expectedRaw) return { kind: "conflict", raw, stored: decodeStoredCollection(raw) };
  const revision = createRevision();
  const nextRaw = JSON.stringify({ ...JSON.parse(encodeCollection(collection)), revision });
  storage.setItem(STORAGE_KEY, nextRaw);
  return { kind: "saved", raw: nextRaw, revision };
}
