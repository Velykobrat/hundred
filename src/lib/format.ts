export function formatNumber(value: number) {
  return new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 6 }).format(value);
}
export function formatPercent(value: number) {
  return `${new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 1 }).format(value)}%`;
}
const COLORS = ["#555ab5", "#9b5075", "#277b72", "#8d692e", "#7557a5", "#317c91", "#657838", "#a3623d", "#a14e56", "#3b6b9d", "#87539a", "#347b5c"];
export function getNodeColor(id: string) {
  let hash = 0;
  for (let index = 0; index < id.length; index++) hash = id.charCodeAt(index) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}
