export function formatNumber(value: number) {
  return new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 6 }).format(value);
}
export function formatPercent(value: number) {
  return `${new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 1 }).format(value)}%`;
}
const COLORS = ["#6366f1", "#ec4899", "#14b8a6", "#f59e0b", "#8b5cf6", "#06b6d4", "#84cc16", "#f97316", "#ef4444", "#3b82f6", "#a855f7", "#10b981"];
export function getNodeColor(id: string) {
  let hash = 0;
  for (let index = 0; index < id.length; index++) hash = id.charCodeAt(index) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}
