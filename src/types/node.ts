import type { NodeColor } from "../lib/node-color";
import type { NodeIcon } from "../lib/node-icon";

type BaseNode = {
  id: string;
  name: string;
  color?: NodeColor;
  icon?: NodeIcon;
  children: Node[];
};
export type MeasuredNode = BaseNode & { mode: "measured"; value: number; unit: string };
export type StructuralNode = BaseNode & { mode: "structural"; weight: number };
export type Node = MeasuredNode | StructuralNode;

export type LayoutItem = {
  node: Node;
  x: number;
  y: number;
  width: number;
  height: number;
  isRemaining?: boolean;
};
