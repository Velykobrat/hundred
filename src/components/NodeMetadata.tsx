import type { Node } from "../types/node";
import { isMeasuredNode } from "../lib/node-mode";
import { countDescendants, countLevels } from "../lib/tree";
import { usePreferences } from "../lib/use-preferences";
export default function NodeMetadata({ node }: { node: Node }) {
  const { t, formatNumber } = usePreferences();
  return isMeasuredNode(node) ? <>{formatNumber(node.value)} {node.unit}</> :
    <>{t("Частин: {count}", { count: node.children.length })} · {t("Вкладених: {count}", { count: countDescendants(node) })} · {t("Рівнів: {count}", { count: countLevels(node) })}</>;
}
