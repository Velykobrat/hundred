import type { Node, MeasuredNode, StructuralNode } from "../types/node";
export function isMeasuredNode(node: Node): node is MeasuredNode { return node.mode === "measured"; }
export function isStructuralNode(node: Node): node is StructuralNode { return node.mode === "structural"; }
export function layoutWeight(node: Node): number { return isMeasuredNode(node) ? node.value : node.weight; }
