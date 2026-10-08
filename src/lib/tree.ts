import type { Node } from "../types/node";

export function findNodeById(
  node: Node,
  id: string
): Node | null {
  if (node.id === id) {
    return node;
  }

  for (const child of node.children) {
    const found = findNodeById(child, id);

    if (found) {
      return found;
    }
  }

  return null;
}

export function updateNodeById(
  node: Node,
  id: string,
  updater: (node: Node) => Node
): Node {
  if (node.id === id) {
    return updater(node);
  }

  return {
    ...node,
    children: node.children.map((child) =>
      updateNodeById(child, id, updater)
    ),
  };
}