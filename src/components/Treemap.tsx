import Icon from "./Icon";
import { isMeasuredNode } from "../lib/node-mode";
import NodeMetadata from "./NodeMetadata";
import PartLock from "./PartLock";

import { usePreferences } from "../lib/use-preferences";

import type { Node, LayoutItem } from "../types/node";
import { createTreemap } from "../lib/treemap";
import { remaining } from "../lib/document";
import { getNodeColor } from "../lib/format";
import { useEffect, useId, useRef, useState, type CSSProperties, type PointerEvent } from "react";

const LONG_PRESS_MS = 500;
const LONG_PRESS_MOVE_TOLERANCE = 10;

function StructuralCard({ child, active, onOpen, onActions, onToggleLock, onStart, onMove, onEnd }: { child: Node; active: boolean; onOpen: (node: Node) => void; onActions: (id: string) => void; onToggleLock: (node: Node) => void; onStart: (id: string) => void; onMove: (x: number, y: number) => void; onEnd: (cancelled: boolean) => void }) {
  const { t } = usePreferences();
  const metadataId = useId();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const moveRef = useRef(onMove);
  useEffect(() => { moveRef.current = onMove; }, [onMove]);
  const pointer = useRef<{ id: number; x: number; y: number; dragging: boolean } | null>(null);
  const suppressClick = useRef(false);
  function clearTimer() {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  }
  useEffect(() => () => clearTimer(), []);
  useEffect(() => {
    const element = button.current;
    if (!element) return;
    const touchMove = (event: TouchEvent) => {
      if (!pointer.current?.dragging) return;
      const touch = event.touches[0];
      if (!touch) return;
      event.preventDefault();
      moveRef.current(touch.clientX, touch.clientY);
    };
    element.addEventListener("touchmove", touchMove, { passive: false });
    return () => element.removeEventListener("touchmove", touchMove);
  }, []);
  function start(event: PointerEvent<HTMLButtonElement>) {
    if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
    suppressClick.current = false;
    clearTimer();
    const element = event.currentTarget;
    pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY, dragging: active };
    if (active) { suppressClick.current = true; element.setPointerCapture(event.pointerId); onStart(child.id); return; }
    const pointerId = event.pointerId;
    timer.current = setTimeout(() => {
      timer.current = null;
      suppressClick.current = true;
      if (!pointer.current) return;
      pointer.current.dragging = true;
      if (element.isConnected) element.setPointerCapture(pointerId);
      // The newly opened sheet can appear under the still-pressed finger.
      // Do not let the release activate an action in that sheet.
      const cleanup = () => {
        document.removeEventListener("click", blockReleaseClick, true);
        document.removeEventListener("pointerdown", nextPress, true);
      };
      const nextPress = (press: globalThis.PointerEvent) => { if (press.pointerId === pointerId) cleanup(); };
      const blockReleaseClick = (click: MouseEvent) => {
        if (click instanceof globalThis.PointerEvent && click.pointerId === pointerId) {
          click.preventDefault();
          click.stopPropagation();
          cleanup();
        }
      };
      const finish = (release: globalThis.PointerEvent) => {
        if (release.pointerId !== pointerId) return;
        document.removeEventListener("pointerup", finish, true);
        document.removeEventListener("pointercancel", finish, true);
        document.addEventListener("pointerdown", nextPress, true);
        setTimeout(cleanup, 500);
      };
      document.addEventListener("click", blockReleaseClick, true);
      document.addEventListener("pointerup", finish, true);
      document.addEventListener("pointercancel", finish, true);
      onStart(child.id);
    }, LONG_PRESS_MS);
  }
  function move(event: PointerEvent<HTMLButtonElement>) {
    const start = pointer.current;
    if (start && start.id === event.pointerId && start.dragging) { onMove(event.clientX, event.clientY); return; }
    if (start && start.id === event.pointerId && Math.hypot(event.clientX - start.x, event.clientY - start.y) > LONG_PRESS_MOVE_TOLERANCE) {
      clearTimer();
      pointer.current = null;
      suppressClick.current = true;
    }
  }
  function end(event: PointerEvent<HTMLButtonElement>, cancelled = false) {
    if (pointer.current?.id === event.pointerId) { const dragging = pointer.current.dragging; pointer.current = null; if (dragging) onEnd(cancelled); }
    clearTimer();
  }
  return <div data-reorder-id={child.id} className="surface structural-card" style={{ "--part-color": getNodeColor(child) } as CSSProperties}>
    <button ref={button} type="button" className="structural-card-open" aria-label={t("Відкрити «{p0}»", {p0: child.name})} aria-disabled={Boolean(child.locked)} aria-describedby={isMeasuredNode(child) ? metadataId : undefined}
      onPointerDown={start} onPointerMove={move} onPointerUp={event => end(event)} onPointerCancel={event => end(event, true)}
      onContextMenu={(event) => event.preventDefault()}
      onClick={(event) => {
        if (suppressClick.current && event.detail !== 0) { suppressClick.current = false; return; }
        if (!active && !child.locked) onOpen(child);
      }}>
      <span className="structural-card-utility" aria-hidden="true">{child.icon && <Icon name={child.icon} style={{ color: getNodeColor(child) }} />}</span><span className="structural-card-title"><strong>{child.name}</strong></span>{isMeasuredNode(child) && <span id={metadataId}><NodeMetadata node={child} /></span>}
    </button>
    <PartLock node={child} onToggle={onToggleLock} />
    <button type="button" data-actions-trigger className="icon-button structural-card-actions" aria-label={t("Дії для «{p0}»", {p0: child.name})} onClick={() => onActions(child.id)}><Icon name="more" /></button>
  </div>;
}

type Props = { node: Node; onOpen: (node: Node) => void; onActions: (id: string) => void; onToggleLock: (node: Node) => void; onReorder: (id: string, target: number) => void; onReorderStart: () => void };
function StructuralGrid({ node, onOpen, onActions, onToggleLock, onReorder, onReorderStart }: Props) {
  const { t } = usePreferences();
  const [active, setActive] = useState(false);
  const grid = useRef<HTMLElement>(null);
  const dragged = useRef<string | null>(null);
  const target = useRef(-1);
  useEffect(() => {
    if (!active) return;
    const outside = (event: globalThis.PointerEvent) => { if (event.target instanceof globalThis.Node && !grid.current?.contains(event.target)) setActive(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setActive(false); };
    document.addEventListener("pointerdown", outside, true);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside, true); document.removeEventListener("keydown", escape); };
  }, [active]);
  function start(id: string) { dragged.current = id; target.current = node.children.findIndex(child => child.id === id); setActive(true); onReorderStart(); }
  function move(x: number, y: number) {
    const card = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-reorder-id]");
    if (!card || !grid.current?.contains(card)) return;
    const index = node.children.findIndex(child => child.id === card.dataset.reorderId);
    if (index >= 0) target.current = index;
  }
  function end(cancelled: boolean) {
    const id = dragged.current; dragged.current = null;
    if (cancelled) { setActive(false); return; }
    if (id && target.current >= 0 && node.children.findIndex(child => child.id === id) !== target.current) { onReorder(id, target.current); setActive(false); }
  }
  return <section ref={grid} aria-label={t("Структура частин")} className={`structural-grid${active ? " is-reordering" : ""}`}>
    {active && <span className="sr-only" role="status">{t("Режим перестановки")}</span>}
    {node.children.map(child => <StructuralCard key={child.id} child={child} active={active} onOpen={onOpen} onActions={onActions} onToggleLock={onToggleLock} onStart={start} onMove={move} onEnd={end} />)}
  </section>;
}

export default function Treemap({ node, onOpen, onActions, onToggleLock, onReorder, onReorderStart }: Props) {
  const { t, formatNumber, formatPercent } = usePreferences();
  if (!isMeasuredNode(node)) return <StructuralGrid key={node.id} node={node} onOpen={onOpen} onActions={onActions} onToggleLock={onToggleLock} onReorder={onReorder} onReorderStart={onReorderStart} />;
  const totalValue = node.value;
  const free = remaining(node);
  const items: LayoutItem[] = node.children.map((child) => ({ node: child, x: 0, y: 0, width: 0, height: 0 }));
  if (free > 0) items.push({ node: { mode: "measured", id: "__remaining__", name: t("Вільно"), value: free, unit: node.unit, children: [] }, x: 0, y: 0, width: 0, height: 0, isRemaining: true });
  const layout = createTreemap(items);
  return (
          <section aria-label={t("Карта частин цілого")} className="resource-map relative aspect-square w-full overflow-hidden rounded-[24px] border border-white/10 bg-neutral-900">
            {layout.map(
              ({
                node,
                x,
                y,
                width,
                height,
                isRemaining,
              }) => {
                if (!isMeasuredNode(node)) return null;
                const percent = (node.value / totalValue) * 100;

                const area = width * height;

                const showFullInfo =
                  !isRemaining && area >= 650;

                const showCompactInfo =
                  !isRemaining &&
                  area >= 250 &&
                  area < 650;

                const color = isRemaining
                  ? "var(--map-free)"
                  : getNodeColor(node);

                return (
                  <button
                    key={node.id}
                    type="button"
                    disabled={isRemaining}
                    aria-disabled={isRemaining || Boolean(node.locked)}
                    aria-label={`${node.name}: ${formatNumber(node.value)} ${node.unit}, ${formatPercent(node.value / totalValue * 100)}${isRemaining ? "" : t(". Відкрити частину")}`}
                    title={`${node.name} · ${formatNumber(node.value)} ${node.unit}`}
                    onClick={() => {
                      if (!isRemaining && !node.locked) {
                        onOpen(node);
                      }
                    }}
                    className={`map-tile group absolute overflow-hidden border border-neutral-950/80 text-left transition-all duration-300 ${
                      isRemaining
                        ? "cursor-default"
                        : "cursor-pointer hover:z-20 hover:brightness-110"
                    }`}
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      width: `${width}%`,
                      height: `${height}%`,
                      backgroundColor: color,
                    }}
                  >
                    {isRemaining && area >= 500 && (
                      <div className="flex h-full flex-col justify-between p-4 text-neutral-300 md:p-6">
                        <span className="text-sm">
                          {formatPercent(percent)}
                        </span>

                        <div>
                          <p className="font-medium">
                            {t("Вільно")}{" "}</p>

                          <p className="mt-1 text-xs">
                            {formatNumber(node.value)}{" "}
                            {node.unit}
                          </p>
                        </div>
                      </div>
                    )}

                    {showFullInfo && (
                      <div className="flex h-full flex-col justify-between p-4 md:p-6">
                        <div className="flex items-start justify-between gap-3">
                          <span className="text-sm">
                            {formatPercent(percent)}
                          </span>

                          <span aria-hidden="true" className="text-white/50 transition group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-white">
                            ↗
                          </span>
                        </div>

                        <div>
                          <span className="block break-words text-base font-medium tracking-tight md:text-xl">
                            {node.name}
                          </span>

                          <p className="mt-1 text-sm">
                            {formatNumber(node.value)}{" "}
                            {node.unit}
                          </p>
                        </div>
                      </div>
                    )}

                    {showCompactInfo && (
                      <div className="flex h-full flex-col justify-between p-3">
                        <span className="text-xs">
                          {formatPercent(percent)}
                        </span>

                        <p className="truncate text-sm font-medium">
                          {node.name}
                        </p>
                      </div>
                    )}
                  </button>
                );
              }
            )}
          </section>

  );
}


