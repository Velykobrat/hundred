export const NODE_COLORS = [
  { value: "#555ab5", label: "Індиго" },
  { value: "#9b5075", label: "Рожевий" },
  { value: "#277b72", label: "Бірюзовий" },
  { value: "#8d692e", label: "Золотистий" },
  { value: "#7557a5", label: "Фіолетовий" },
  { value: "#317c91", label: "Блакитний" },
  { value: "#657838", label: "Оливковий" },
  { value: "#a3623d", label: "Помаранчевий" },
  { value: "#a14e56", label: "Червоний" },
  { value: "#3b6b9d", label: "Синій" },
  { value: "#87539a", label: "Бузковий" },
  { value: "#347b5c", label: "Зелений" },
] as const;

export type NodeColor = typeof NODE_COLORS[number]["value"];
export function isNodeColor(value: unknown): value is NodeColor {
  return NODE_COLORS.some(color => color.value === value);
}
export function getNodeColor(node: { id: string; color?: NodeColor }): string {
  if (node.color) return node.color;
  let hash = 0;
  for (let index = 0; index < node.id.length; index++) hash = node.id.charCodeAt(index) + ((hash << 5) - hash);
  return NODE_COLORS[Math.abs(hash) % NODE_COLORS.length].value;
}

export function withNodeColor<T extends { color?: NodeColor }>(node: T, color?: NodeColor): T {
  if (color !== undefined && !isNodeColor(color)) throw new Error("Некоректний колір.");
  const next = { ...node };
  if (color === undefined) delete next.color;
  else next.color = color;
  return next;
}
