import type { Collection } from "./collection";
import type { Node } from "../types/node";

export type SearchMatch = { rootId: string; node: Node; pathIds: string[]; pathNames: string[] };
export const SEARCH_LIMIT = 100;
function normalize(text: string) {
  return text.normalize("NFKC").toLocaleLowerCase("uk").replace(/[’ʼ]/g, "'");
}

// Search user-created names only. Results retain exact IDs for unambiguous navigation.
export function searchCollection(collection: Collection, query: string): { matches: SearchMatch[]; total: number } {
  const words = normalize(query).trim().split(/\s+/).filter(Boolean);
  const matches: SearchMatch[] = [];
  let total = 0;
  if (!words.length) return { matches, total };
  function visit(node: Node, rootId: string, ids: string[], names: string[]) {
    const pathIds = [...ids, node.id];
    const pathNames = [...names, node.name];
    const name = normalize(node.name);
    if (words.every(word => name.includes(word))) {
      total++;
      if (matches.length < SEARCH_LIMIT) matches.push({ rootId, node, pathIds, pathNames });
    }
    for (const child of node.children) visit(child, rootId, pathIds, pathNames);
  }
  for (const { root } of collection.documents) if (root) visit(root, root.id, [], []);
  return { matches, total };
}
