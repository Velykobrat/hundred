import Icon from "./Icon";
import { isMeasuredNode } from "../lib/node-mode";
import NodeMetadata from "./NodeMetadata";

import { usePreferences } from "../lib/use-preferences";

import type { Node, LayoutItem } from "../types/node";
import { createTreemap } from "../lib/treemap";
import { remaining } from "../lib/document";
import { getNodeColor } from "../lib/format";
import { useEffect, useId, useRef, type PointerEvent } from "react";

const LONG_PRESS_MS = 500;
const LONG_PRESS_MOVE_TOLERANCE = 10;

function StructuralCard({ child, onOpen, onActions }: { child: Node; onOpen: (node: Node) => void; onActions: (id: string) => void }) {
  const { t } = usePreferences();
  const metadataId = useId();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointer = useRef<{ id: number; x: number; y: number } | null>(null);
  const suppressClick = useRef(false);
  function clearTimer() {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  }
  useEffect(() => () => clearTimer(), []);
  function start(event: PointerEvent<HTMLButtonElement>) {
    if ((event.pointerType !== "touch" && event.pointerType !== "pen") || !event.isPrimary) return;
    suppressClick.current = false;
    clearTimer();
    pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
    const pointerId = event.pointerId;
    timer.current = setTimeout(() => {
      timer.current = null;
      suppressClick.current = true;
      pointer.current = null;
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
      onActions(child.id);
    }, LONG_PRESS_MS);
  }
  function move(event: PointerEvent<HTMLButtonElement>) {
    const start = pointer.current;
    if (start && start.id === event.pointerId && Math.hypot(event.clientX - start.x, event.clientY - start.y) > LONG_PRESS_MOVE_TOLERANCE) {
      clearTimer();
      pointer.current = null;
      suppressClick.current = true;
    }
  }
  function end(event: PointerEvent<HTMLButtonElement>) {
    if (pointer.current?.id === event.pointerId) pointer.current = null;
    clearTimer();
  }
  return <div className="surface structural-card" style={{ borderTop: "4px solid " + getNodeColor(child) }}>
    <button type="button" className="structural-card-open" aria-label={t("Відкрити «{p0}»", {p0: child.name})} aria-describedby={isMeasuredNode(child) ? metadataId : undefined}
      onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end}
      onContextMenu={(event) => event.preventDefault()}
      onClick={(event) => {
        if (suppressClick.current && event.detail !== 0) { suppressClick.current = false; return; }
        onOpen(child);
      }}>
      <span className="structural-card-title">{child.icon && <Icon name={child.icon} style={{ color: getNodeColor(child) }} />}<strong>{child.name}</strong></span>{isMeasuredNode(child) && <span id={metadataId}><NodeMetadata node={child} /></span>}
    </button>
    <button type="button" data-actions-trigger className="icon-button structural-card-actions" aria-label={t("Дії для «{p0}»", {p0: child.name})} onClick={() => onActions(child.id)}><Icon name="more" /></button>
  </div>;
}

export default function Treemap({ node, onOpen, onActions }: { node: Node; onOpen: (node: Node) => void; onActions: (id: string) => void }) {
  const { t, formatNumber, formatPercent } = usePreferences();
  if (!isMeasuredNode(node)) return <section aria-label={t("Структура частин")} className="structural-grid">
    {node.children.map(child => <StructuralCard key={child.id} child={child} onOpen={onOpen} onActions={onActions} />)}
  </section>;
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
                    aria-label={`${node.name}: ${formatNumber(node.value)} ${node.unit}, ${formatPercent(node.value / totalValue * 100)}${isRemaining ? "" : t(". Відкрити частину")}`}
                    title={`${node.name} · ${formatNumber(node.value)} ${node.unit}`}
                    onClick={() => {
                      if (!isRemaining) {
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


