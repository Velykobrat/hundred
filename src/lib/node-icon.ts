export const NODE_ICONS = [
  { value: "money", label: "Гроші" },
  { value: "clock", label: "Час" },
  { value: "people", label: "Люди" },
  { value: "home", label: "Дім" },
  { value: "project", label: "Проєкт" },
  { value: "folder", label: "Папка" },
  { value: "target", label: "Ціль" },
  { value: "book", label: "Навчання" },
  { value: "briefcase", label: "Робота" },
  { value: "heart", label: "Серце" },
  { value: "star", label: "Зірка" },
  { value: "bolt", label: "Енергія" },
  { value: "globe", label: "Світ" },
  { value: "coffee", label: "Відпочинок" },
  { value: "shield", label: "Захист" },
] as const;

export type NodeIcon = typeof NODE_ICONS[number]["value"];
export function isNodeIcon(value: unknown): value is NodeIcon {
  return NODE_ICONS.some(icon => icon.value === value);
}
export function getNodeIcon(node: { icon?: NodeIcon }): NodeIcon | "resource" {
  return node.icon ?? "resource";
}
export function withNodeIcon<T extends { icon?: NodeIcon }>(node: T, icon?: NodeIcon): T {
  if (icon !== undefined && !isNodeIcon(icon)) throw new Error("Некоректний значок.");
  const next = { ...node };
  if (icon === undefined) delete next.icon;
  else next.icon = icon;
  return next;
}
