import type { Node } from "../types/node";
import { formatNumber, formatPercent, getNodeColor } from "../lib/format";
import Icon from "./Icon";

export default function PartsList({ node, free, atLimit, onOpen, onActions }: { node: Node; free: number; atLimit: boolean; onOpen: (node: Node) => void; onActions: (id: string) => void }) {
  return <section className="surface parts-panel" aria-labelledby="parts-heading">
    <div className="parts-heading">
      <h2 id="parts-heading">Частини <span>{node.children.length}</span></h2>
      <span className="parts-heading-hint">Натисни, щоб відкрити</span>
    </div>
    {node.children.length ? <ul className="parts-list">
      {node.children.map((child) => <li key={child.id} className="part-row">
        <button type="button" className="part-open" onClick={() => onOpen(child)} aria-label={`Відкрити «${child.name}»`}>
          <span className="part-color" style={{ backgroundColor: getNodeColor(child.id) }} aria-hidden="true" />
          <span className="part-copy">
            <span className="part-name">{child.name}</span>
            <span className="part-value">{formatNumber(child.value)} {child.unit}{child.children.length ? ` · частин: ${child.children.length}` : ""}</span>
          </span>
          <span className="part-percent">{formatPercent(child.value / node.value * 100)}</span>
          <Icon name="chevron" className="part-chevron" width="15" height="15" />
        </button>
        <button type="button" className="icon-button part-actions" aria-label={`Дії для «${child.name}»`} onClick={() => onActions(child.id)}><Icon name="more" /></button>
      </li>)}
    </ul> : <p className="parts-empty">Додай першу частину — її розмір на карті покаже, скільки вона займає.</p>}
    {atLimit && <p className="parts-note text-amber-300">Досягнуто межі розміру. Можна редагувати наявні частини.</p>}
    {free === 0 ? <p className="parts-note">Усе розподілено. Зменш частину, щоб звільнити місце.</p> : <div className="parts-free"><span>Вільно</span><span>{formatNumber(free)} {node.unit} · {formatPercent(free / node.value * 100)}</span></div>}
  </section>;
}
