import type { Node } from "../../types/node";
import { usePreferences } from "../../lib/use-preferences";
import { isMeasuredNode } from "../../lib/node-mode";
import { getNodeColor } from "../../lib/node-color";
import { getNodeIcon } from "../../lib/node-icon";
import LevelNavigation from "../LevelNavigation";
import NodeMetadata from "../NodeMetadata";
import Icon from "../Icon";
import PartsList from "../PartsList";
import Treemap from "../Treemap";
import StructureViewToggle from "../StructureViewToggle";
type Props = { root: Node; current: Node; path: Node[]; showingPath: boolean; free: number; used: number; atLimit: boolean; onNavigate: (path: string[]) => void; onShowPath: (show: boolean) => void; onActions: (id: string) => void; onAdd: () => void; onOpen: (node: Node) => void };
export default function WholeScreen({ root, current, path, showingPath, free, used, atLimit, onNavigate, onShowPath, onActions, onAdd, onOpen }: Props) {
  const { t, formatNumber, formatPercent, structureView } = usePreferences();
  return (
          <>
            <LevelNavigation path={path} onNavigate={onNavigate} showingPath={showingPath} onShowPath={onShowPath} />
            <header className="resource-header">
              <div className="resource-title-row">
                <div className="min-w-0">
                  <p className="eyebrow">{path.length === 1 ? t("Ціле") : t("Частина · рівень {p0}", {p0: path.length})}</p>
                  <h1>{current.icon && <span className="whole-title-icon" style={{ color: getNodeColor(current) }}><Icon name={getNodeIcon(current)} width="28" height="28" /></span>}{current.name}</h1>
                  <p className="resource-value"><NodeMetadata node={current} /></p>
                  {isMeasuredNode(current) && isMeasuredNode(root) && current.id !== root.id && <p className="resource-root-share">{formatPercent(current.value / root.value * 100)} {t("від усього «{name}»", { name: root.name })}</p>}
                </div>
                <button type="button" className="icon-button" aria-label={t("Дії для «{p0}»", {p0: current.name})} onClick={() => onActions(current.id)}><Icon name="more" /></button>
              </div>
              {isMeasuredNode(current) && <div className="resource-summary">
                <p>{t("Розподілено")}</p><p>{formatPercent(used / current.value * 100)}</p>
                <p>{t("Вільно:")}{" "}{formatNumber(free)} {current.unit}</p>
                <div className="usage-track" aria-hidden="true"><span style={{ width: `${Math.min(100, used / current.value * 100)}%` }} /></div>
              </div>}
              <button type="button" className="primary-button add-part-button" disabled={(isMeasuredNode(current) && free === 0) || atLimit} onClick={onAdd}><Icon name="plus" /><span>{t("Додати частину")}</span></button>
            </header>
            <div className={`workspace-grid${!isMeasuredNode(current) && (structureView === "list" || !current.children.length) ? " structure-list-workspace" : ""}`}>
              <div className="min-w-0">
                <div className="map-heading"><h2>{isMeasuredNode(current) ? t("Карта цілого") : t("Структура частин")}</h2>{!isMeasuredNode(current) && <StructureViewToggle />}</div>
                {!isMeasuredNode(current) && (structureView === "list" || !current.children.length)
                  ? <PartsList node={current} free={free} atLimit={atLimit} onOpen={onOpen} onActions={onActions} />
                  : <Treemap node={current} onOpen={onOpen} />}
              </div>
              {(isMeasuredNode(current) || (structureView === "cards" && current.children.length > 0)) && <aside><PartsList node={current} free={free} atLimit={atLimit} onOpen={onOpen} onActions={onActions} /></aside>}
            </div>
          </>
  );
}
