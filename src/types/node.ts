type BaseNode = {
  id: string;
  name: string;
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
