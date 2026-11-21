import { isMeasuredNode } from "./node-mode";
import { isNodeColor, withNodeColor, type NodeColor } from "./node-color";
import { isNodeIcon, withNodeIcon, type NodeIcon } from "./node-icon";
import type { Node } from "../types/node";
import { findNodeById, updateNodeById } from "./tree";

export const STORAGE_KEY = "hundred.document.v1";
export const SCALE = 1_000_000;
export const MAX_VALUE = 1_000_000_000;
export type Document = { root: Node | null; pathIds: string[] };
export type FieldErrors = { name?: string; value?: string; unit?: string };
export const emptyDocument: Document = { root: null, pathIds: [] };

export function units(value: number) { return Math.round(value * SCALE); }
export function sumValues(nodes: Node[]) { return nodes.reduce((sum, node) => sum + units(isMeasuredNode(node) ? node.value : 0), 0) / SCALE; }
export function remaining(node: Node) { return isMeasuredNode(node) ? Math.max(0, units(node.value) - units(sumValues(node.children))) / SCALE : 0; }

export function parseValue(input: string): number | null {
  const normalized = input.trim().replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(?:\.\d{1,6})?$/.test(normalized)) return null;
  const value = Number(normalized);
  return Number.isFinite(value) && value > 0 && value <= MAX_VALUE ? value : null;
}

export function validateFields(name: string, value: string, unit?: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!name.trim()) errors.name = "Вкажи назву.";
  else if (name.trim().length > 120) errors.name = "Назва має містити не більше 120 символів.";
  if (parseValue(value) === null) errors.value = "Вкажи число більше нуля, до 1 мільярда та з не більш ніж 6 знаками після коми.";
  if (unit !== undefined && !unit.trim()) errors.unit = "Вкажи одиницю, наприклад грн або год.";
  else if (unit !== undefined && unit.trim().length > 20) errors.unit = "Одиниця має містити не більше 20 символів.";
  return errors;
}

export function normalizeDocument(document: Document): Document {
  if (!document.root) return emptyDocument;
  const path = [document.root.id];
  let current = document.root;
  for (const id of document.pathIds.slice(1)) {
    const child = current.children.find((node) => node.id === id);
    if (!child) break;
    path.push(id);
    current = child;
  }
  return { root: document.root, pathIds: path };
}

export function editPart(root: Node, id: string, name: string, value?: number, color?: NodeColor | null, icon?: NodeIcon | null): Node {
  const node = findNodeById(root, id);
  if (!node || !name.trim() || name.trim().length > 120 || (isMeasuredNode(node) && (value === undefined || parseValue(String(value)) === null))) throw new Error("Некоректні дані частини.");
  const appearance = color === undefined ? node.color : color ?? undefined;
  const nextIcon = icon === undefined ? node.icon : icon ?? undefined;
  const decorate = (previous: Node) => withNodeIcon(withNodeColor(previous, appearance), nextIcon);
  if (!isMeasuredNode(node)) return updateNodeById(root, id, previous => decorate({ ...previous, name: name.trim() }));
  if (value === undefined) throw new Error("Некоректні дані частини.");
  const measuredValue = value;
  if (units(value) < units(sumValues(node.children))) throw new Error("Значення не може бути меншим за суму вкладених частин.");
  function checkParent(parent: Node): void {
    if (parent.children.some((child) => child.id === id)) {
      const siblings = parent.children.filter((child) => child.id !== id);
      if (isMeasuredNode(parent) && units(measuredValue) > units(parent.value) - units(sumValues(siblings))) throw new Error("Значення перевищує доступний обсяг у батьківській категорії.");
    } else parent.children.forEach(checkParent);
  }
  if (root.id !== id) checkParent(root);
  return updateNodeById(root, id, (previous) => isMeasuredNode(previous)
    ? decorate({ ...previous, name: name.trim(), value: measuredValue }) : previous);
}

export function deletePart(root: Node, id: string): Node {
  if (root.id === id) throw new Error("Ціле не можна видалити як частину.");
  function remove(node: Node): Node {
    return { ...node, children: node.children.filter((child) => child.id !== id).map(remove) };
  }
  return remove(root);
}

export function decodeDocument(raw: string): Document {
  if (raw.length > 2_000_000) throw new Error("Збереження завелике.");
  const data = JSON.parse(raw);
  if (!data || ![1, 3].includes(data.version) || !Array.isArray(data.pathIds)) throw new Error("Невідома версія збереження.");
  const ids = new Set<string>();
  let count = 0;
  function read(value: unknown, depth: number, expectedUnit?: string): Node {
    if (!value || typeof value !== "object" || depth > 40 || ++count > 5000) throw new Error("Некоректна структура збереження.");
    const node = value as Record<string, unknown>;
    const mode = data.version === 1 ? "measured" : node.mode;
    if (typeof node.id !== "string" || !node.id || node.id.length > 100 || ids.has(node.id) ||
        typeof node.name !== "string" || !node.name.trim() || node.name.length > 120 ||
        !Array.isArray(node.children)) throw new Error("Некоректні дані збереження.");
    ids.add(node.id);
    if (node.color !== undefined && !isNodeColor(node.color)) throw new Error("Некоректний колір.");
    if (node.icon !== undefined && !isNodeIcon(node.icon)) throw new Error("Некоректний значок.");
    const appearance = {
      ...(node.color === undefined ? {} : { color: node.color as NodeColor }),
      ...(node.icon === undefined ? {} : { icon: node.icon as NodeIcon }),
    };
    if (mode === "structural") {
      if (expectedUnit !== undefined || typeof node.weight !== "number" || !Number.isFinite(node.weight) || node.weight <= 0)
        throw new Error("Некоректні дані збереження.");
      return { id: node.id, name: node.name, ...appearance, mode, weight: node.weight, children: node.children.map(child => read(child, depth + 1)) };
    }
    if (mode !== "measured" || typeof node.unit !== "string" || !node.unit.trim() || node.unit.length > 20 ||
        (expectedUnit !== undefined && node.unit !== expectedUnit) ||
        typeof node.value !== "number" || parseValue(String(node.value)) === null ||
        Math.abs(node.value - units(node.value) / SCALE) > 1e-10) throw new Error("Некоректні дані збереження.");
    const children = node.children.map(child => read(child, depth + 1, node.unit as string));
    if (units(sumValues(children)) > units(node.value)) throw new Error("Частини перевищують ціле.");
    return { id: node.id, name: node.name, ...appearance, mode, value: units(node.value) / SCALE, unit: node.unit, children };
  }
  const root = data.root === null ? null : read(data.root, 0);
  if (data.pathIds.length > 41 || data.pathIds.some((id: unknown) => typeof id !== "string")) throw new Error("Некоректний шлях.");
  return normalizeDocument({ root, pathIds: data.pathIds });
}

export function encodeDocument(document: Document): string {
  return JSON.stringify({ version: 3, ...normalizeDocument(document) });
}

// Creation keeps optional input at the boundary; persisted nodes always have an explicit mode.
export function createNode(id: string, name: string, value?: number, unit = "", color?: NodeColor, icon?: NodeIcon): Node {
  const errors = validateFields(name, value === undefined ? "1" : String(value), value === undefined ? undefined : unit);
  if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
  const node: Node = value === undefined
    ? { id, name: name.trim(), mode: "structural", weight: 1, children: [] }
    : { id, name: name.trim(), mode: "measured", value, unit: unit.trim(), children: [] };
  return withNodeIcon(withNodeColor(node, color), icon);
}
export function addPart(root: Node, parentId: string, child: Node): Node {
  const parent = findNodeById(root, parentId);
  if (!parent) throw new Error("Некоректні дані частини.");
  if (isMeasuredNode(parent) && (!isMeasuredNode(child) || child.unit !== parent.unit || units(child.value) > units(remaining(parent))))
    throw new Error("Частини перевищують ціле.");
  const next = updateNodeById(root, parentId, node => ({ ...node, children: [...node.children, child] }));
  // Reuse the strict reader for duplicate IDs, capacity, precision, and technical limits.
  return decodeDocument(encodeDocument({ root: next, pathIds: [next.id] })).root!;
}
