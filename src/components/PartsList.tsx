import { isMeasuredNode } from "../lib/node-mode";
import NodeMetadata from "./NodeMetadata";

import { usePreferences } from "../lib/use-preferences";
import type { Node } from "../types/node";
import { getNodeColor } from "../lib/format";
import Icon from "./Icon";
import { useId } from "react";

export default function PartsList({ node, free, atLimit, onOpen, onActions }: { node: Node; free: number; atLimit: boolean; onOpen: (node: Node) => void; onActions: (id: string) => void }) {
  const { t, formatPercent } = usePreferences();
  const descriptionId = useId();
  return <section className="surface parts-panel" aria-labelledby="parts-heading">
    <div className="parts-heading">
      <h2 id="parts-heading">{t("Частини")}{" "}<span>{node.children.length}</span></h2>
    </div>
    {node.children.length ? <ul className="parts-list">
      {node.children.map((child, index) => <li key={child.id} className="part-row">
        <button type="button" className="part-open" onClick={() => onOpen(child)} aria-label={t("Відкрити «{p0}»", {p0: child.name})} aria-describedby={`${descriptionId}-value-${index}${isMeasuredNode(node) && isMeasuredNode(child) ? ` ${descriptionId}-percent-${index}` : ""}`}>
          {child.icon ? <Icon name={child.icon} className="part-node-icon" style={{ color: getNodeColor(child) }} width="18" height="18" /> : <span className="part-color" style={{ backgroundColor: getNodeColor(child) }} aria-hidden="true" />}
          <span className="part-copy">
            <span className="part-name">{child.name}</span>
            <span id={`${descriptionId}-value-${index}`} className="part-value">{<NodeMetadata node={child} />}{isMeasuredNode(child) && child.children.length ? t(" · частин: {p0}", {p0: child.children.length}) : ""}</span>
          </span>
          {isMeasuredNode(node) && isMeasuredNode(child) && <span id={`${descriptionId}-percent-${index}`} className="part-percent">{formatPercent(child.value / node.value * 100)}</span>}
          <Icon name="chevron" className="part-chevron" width="15" height="15" />
        </button>
        <button type="button" data-actions-trigger className="icon-button part-actions" aria-label={t("Дії для «{p0}»", {p0: child.name})} onClick={() => onActions(child.id)}><Icon name="more" /></button>
      </li>)}
    </ul> : <p className="parts-empty">{t("Тут поки немає частин.")}</p>}
    {atLimit && <p className="parts-note text-amber-300">{t("Досягнуто межі розміру. Можна редагувати наявні частини.")}</p>}
    {isMeasuredNode(node) && free === 0 && <p className="parts-note">{t("Усе розподілено. Зменш частину, щоб звільнити місце.")}</p>}
  </section>;
}
