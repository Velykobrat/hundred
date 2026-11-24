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
import { useEffect, useRef, useState, type PointerEvent, type MouseEvent } from "react";

const EDGE_START_PX = 120;
const SWIPE_BACK_MIN_X = 70;
const SWIPE_HORIZONTAL_DOMINANCE = 1.2;
type Props = { root: Node; current: Node; path: Node[]; showingPath: boolean; free: number; used: number; atLimit: boolean; onNavigate: (path: string[]) => void; onHome: () => void; onShowPath: (show: boolean) => void; onActions: (id: string) => void; onAdd: () => void; onOpen: (node: Node) => void; onToggleLock: (node: Node) => void; onReorder: (id: string, target: number) => void };
export default function WholeScreen({ root, current, path, showingPath, free, used, atLimit, onNavigate, onHome, onShowPath, onActions, onAdd, onOpen, onToggleLock, onReorder }: Props) {
  const { t, formatNumber, formatPercent, structureView } = usePreferences();
  const swipe = useRef<{ id: number; x: number; y: number } | null>(null);
  const suppressClick = useRef(false);
  const addButton = useRef<HTMLButtonElement>(null);
  const [addButtonVisible, setAddButtonVisible] = useState(true);
  const canAdd = !(isMeasuredNode(current) && free === 0) && !atLimit;
  useEffect(() => {
    const button = addButton.current;
    if (!button) return;
    const observer = new IntersectionObserver(([entry]) => setAddButtonVisible(entry.isIntersecting));
    observer.observe(button);
    return () => observer.disconnect();
  }, []);
  function startSwipe(event: PointerEvent<HTMLDivElement>) {
    suppressClick.current = false;
    swipe.current = event.pointerType === "touch" && event.isPrimary && event.clientX <= EDGE_START_PX
      ? { id: event.pointerId, x: event.clientX, y: event.clientY } : null;
  }
  function endSwipe(event: PointerEvent<HTMLDivElement>) {
    const start = swipe.current;
    swipe.current = null;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (dx >= SWIPE_BACK_MIN_X && dx > Math.abs(dy) * SWIPE_HORIZONTAL_DOMINANCE) {
      suppressClick.current = true;
      if (path.length > 1) onNavigate(path.slice(0, -1).map((node) => node.id)); else onHome();
    }
  }
  function captureClick(event: MouseEvent<HTMLDivElement>) {
    if (suppressClick.current && event.detail !== 0) {
      suppressClick.current = false;
      event.preventDefault();
      event.stopPropagation();
    }
  }
  function openActions(id: string) {
    swipe.current = null;
    onActions(id);
  }
  return (
          <div className="whole-screen" onPointerDownCapture={startSwipe} onPointerUpCapture={endSwipe} onPointerCancelCapture={() => { swipe.current = null; }} onClickCapture={captureClick}>
            <LevelNavigation path={path} onNavigate={onNavigate} showingPath={showingPath} onShowPath={onShowPath} />
            <header className="resource-header">
              <div className="resource-title-row">
                <div className="min-w-0">
                  <p className="eyebrow">{path.length === 1 ? t("Ціле") : t("Частина · рівень {p0}", {p0: path.length})}</p>
                  <h1>{current.icon && <span className="whole-title-icon" style={{ color: getNodeColor(current) }}><Icon name={getNodeIcon(current)} width="28" height="28" /></span>}{current.name}</h1>
                  <p className="resource-value"><NodeMetadata node={current} /></p>
                  {isMeasuredNode(current) && isMeasuredNode(root) && current.id !== root.id && <p className="resource-root-share">{formatPercent(current.value / root.value * 100)} {t("від усього «{name}»", { name: root.name })}</p>}
                </div>
                <button type="button" data-actions-trigger className="icon-button" aria-label={t("Дії для «{p0}»", {p0: current.name})} onClick={() => onActions(current.id)}><Icon name="more" /></button>
              </div>
              {isMeasuredNode(current) && <div className="resource-summary">
                <p>{t("Розподілено")}</p><p>{formatPercent(used / current.value * 100)}</p>
                <p>{t("Вільно:")}{" "}{formatNumber(free)} {current.unit}</p>
                <div className="usage-track" aria-hidden="true"><span style={{ width: `${Math.min(100, used / current.value * 100)}%` }} /></div>
              </div>}
              <button ref={addButton} type="button" className="primary-button add-part-button" disabled={!canAdd} onClick={onAdd}><Icon name="plus" /><span>{t("Додати частину")}</span></button>
            </header>
            <div className={`workspace-grid${!isMeasuredNode(current) ? " structure-list-workspace" : ""}`}>
              <div className="min-w-0">
                <div className="map-heading"><h2>{isMeasuredNode(current) ? t("Карта цілого") : t("Структура частин")}</h2>{!isMeasuredNode(current) && <StructureViewToggle />}</div>
                {!isMeasuredNode(current) && structureView === "list"
                  ? <PartsList node={current} free={free} atLimit={atLimit} onOpen={onOpen} onActions={onActions} onToggleLock={onToggleLock} />
                  : !isMeasuredNode(current) && !current.children.length
                    ? <p className="parts-empty">{t("Тут поки немає частин.")}</p>
                    : <Treemap node={current} onOpen={onOpen} onActions={openActions} onToggleLock={onToggleLock} onReorder={onReorder} onReorderStart={() => { swipe.current = null; }} />}
              </div>
              {isMeasuredNode(current) && <aside><PartsList node={current} free={free} atLimit={atLimit} onOpen={onOpen} onActions={onActions} onToggleLock={onToggleLock} /></aside>}
            </div>
            {canAdd && !addButtonVisible && <button type="button" className="primary-button add-part-floating" aria-label={t("Додати частину")} onClick={onAdd}><Icon name="plus" /></button>}
          </div>
  );
}
