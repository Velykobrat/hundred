import type { Node } from "../types/node";
import { usePreferences } from "../lib/use-preferences";
import Icon from "./Icon";

export default function PartLock({ node, onToggle }: { node: Node; onToggle: (node: Node) => void }) {
  const { t } = usePreferences();
  return <button type="button" className="part-lock" aria-label={t(node.locked ? "Зняти фіксацію" : "Зафіксувати частину")} aria-pressed={Boolean(node.locked)} onClick={() => onToggle(node)}><Icon name="lock" width="18" height="18" /></button>;
}
