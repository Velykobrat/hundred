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
export function countDescendants(node: Node): number {
  return node.children.reduce((count, child) => count + 1 + countDescendants(child), 0);
}
export function countLevels(node: Node): number {
  return 1 + node.children.reduce((depth, child) => Math.max(depth, countLevels(child)), 0);
}
export function findParent(root: Node, id: string): Node | null {
  if (root.children.some(child => child.id === id)) return root;
  for (const child of root.children) {
    const parent = findParent(child, id);
    if (parent) return parent;
  }
  return null;
}

// Array order is the source of truth for cards, lists, navigation and backups.
export function movePart(root: Node, id: string, direction: "up" | "down"): Node {
  const parent = findParent(root, id);
  if (!parent) return root;
  const index = parent.children.findIndex(child => child.id === id);
  const target = index + (direction === "up" ? -1 : 1);
  return movePartTo(root, id, target);
}

export function movePartTo(root: Node, id: string, target: number): Node {
  const parent = findParent(root, id);
  if (!parent) return root;
  const index = parent.children.findIndex(child => child.id === id);
  if (!Number.isInteger(target) || target < 0 || target >= parent.children.length || target === index) return root;
  return updateNodeById(root, parent.id, node => {
    const children = [...node.children];
    children.splice(target, 0, children.splice(index, 1)[0]);
    return { ...node, children };
  });
}
