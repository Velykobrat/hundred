export type Node = {
  id: string;
  name: string;
  value: number;
  unit: string;
  children: Node[];
};

export type LayoutItem = {
  node: Node;
  x: number;
  y: number;
  width: number;
  height: number;
  isRemaining?: boolean;
};