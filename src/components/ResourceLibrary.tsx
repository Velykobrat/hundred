import { getNodeIcon } from "../lib/node-icon";
import { isMeasuredNode } from "../lib/node-mode";
import { countLevels } from "../lib/tree";
import NodeMetadata from "./NodeMetadata";

import { usePreferences } from "../lib/use-preferences";
import type { Collection } from "../lib/collection";
import type { Document } from "../lib/document";
import { MAX_DOCUMENTS } from "../lib/collection";
import { remaining } from "../lib/document";
import { getNodeColor } from "../lib/format";
import Icon from "./Icon";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import LibraryIntro from "./LibraryIntro";
import WholeSearch from "./WholeSearch";

function levelLabel(count: number, language: "uk" | "en") {
  if (language === "en") return count === 1 ? "level" : "levels";
  if (count % 100 >= 11 && count % 100 <= 14) return "рівнів";
  if (count % 10 === 1) return "рівень";
  return count % 10 >= 2 && count % 10 <= 4 ? "рівні" : "рівнів";
}

const LONG_PRESS_MS = 500;
const MOVE_TOLERANCE = 10;

function WholeCard({ document, active, dragging, target, onOpen, onActions, onStart, onMove, onEnd }: { document: Document; active: boolean; dragging: boolean; target: boolean; onOpen: (id: string) => void; onActions: (id: string) => void; onStart: (id: string) => void; onMove: (x: number, y: number) => void; onEnd: (cancelled: boolean) => void }) {
  const { t, formatPercent, language } = usePreferences();
  const root = document.root!;
  const measured = isMeasuredNode(root);
  const usedPercent = measured ? (root.value - remaining(root)) / root.value * 100 : 0;
  const levels = countLevels(root);
  const button = useRef<HTMLButtonElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointer = useRef<{ id: number; x: number; y: number; dragging: boolean } | null>(null);
  const suppressClick = useRef(false);
  const moveRef = useRef(onMove);
  useEffect(() => { moveRef.current = onMove; }, [onMove]);
  useEffect(() => {
    const element = button.current;
    const touchMove = (event: TouchEvent) => {
      if (!pointer.current?.dragging || !event.touches[0]) return;
      event.preventDefault();
      moveRef.current(event.touches[0].clientX, event.touches[0].clientY);
    };
    element?.addEventListener("touchmove", touchMove, { passive: false });
    return () => { element?.removeEventListener("touchmove", touchMove); if (timer.current) clearTimeout(timer.current); };
  }, []);
  function start(event: PointerEvent<HTMLButtonElement>) {
    if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
    suppressClick.current = false;
    if (timer.current) clearTimeout(timer.current);
    const element = event.currentTarget;
    const id = event.pointerId;
    pointer.current = { id, x: event.clientX, y: event.clientY, dragging: active };
    if (active) { suppressClick.current = true; element.setPointerCapture(id); onStart(root.id); return; }
    timer.current = setTimeout(() => {
      timer.current = null;
      if (!pointer.current || pointer.current.id !== id) return;
      pointer.current.dragging = true;
      suppressClick.current = true;
      if (element.isConnected) element.setPointerCapture(id);
      onStart(root.id);
    }, LONG_PRESS_MS);
  }
  function move(event: PointerEvent<HTMLButtonElement>) {
    const start = pointer.current;
    if (!start || start.id !== event.pointerId) return;
    if (start.dragging) { onMove(event.clientX, event.clientY); return; }
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > MOVE_TOLERANCE) {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      pointer.current = null;
      suppressClick.current = true;
    }
  }
  function end(event: PointerEvent<HTMLButtonElement>, cancelled = false) {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const current = pointer.current;
    if (current?.id !== event.pointerId) return;
    pointer.current = null;
    if (current.dragging) onEnd(cancelled);
  }
  return <div data-whole-id={root.id} className={`resource-card surface${measured ? " is-measured" : " is-structural"}${dragging ? " is-dragging" : ""}${target ? " is-drop-target" : ""}`}>
    <button ref={button} type="button" className="resource-card-open" aria-label={t("Відкрити ціле «{p0}»", {p0: root.name})}
    onPointerDown={start} onPointerMove={move} onPointerUp={event => end(event)} onPointerCancel={event => end(event, true)} onContextMenu={event => event.preventDefault()}
    onClick={event => { if (suppressClick.current && event.detail !== 0) { suppressClick.current = false; return; } if (!active) onOpen(root.id); }}>
    <span className="resource-card-top"><span className="resource-card-icon" style={{ color: getNodeColor(root) }}><Icon name={getNodeIcon(root)} width="25" height="25" /></span><Icon name="chevron" /></span>
    <span className="resource-card-name">{root.name}</span>
    <span className="resource-card-value"><NodeMetadata node={root} /></span>
    {measured && <span className="usage-track" aria-hidden="true"><span style={{ width: `${usedPercent}%`, backgroundColor: getNodeColor(root) }} /></span>}
    <span className="resource-card-compact-meta">{measured ? <>{formatPercent(usedPercent)} {t("розподілено")}</> : <>{root.children.length} {t("частин ·")} {levels} {levelLabel(levels, language)}</>}</span>
    {(measured || document.pathIds.length > 1) && <span className="resource-card-footer">{measured && <span className="resource-card-stats"><span>{root.children.length} {t("частин ·")} {formatPercent(usedPercent)} {t("розподілено")}</span><span>{levels} {levelLabel(levels, language)}</span></span>}{document.pathIds.length > 1 && <span className="resource-card-continue">{t("Продовжити")}</span>}</span>}
    </button>
    <button type="button" className="icon-button resource-card-actions" aria-label={t("Дії для «{p0}»", {p0: root.name})} onClick={() => onActions(root.id)}><Icon name="more" /></button>
  </div>;
}

function WholeGrid({ collection, onOpen, onActions, onReorder }: { collection: Collection; onOpen: (id: string) => void; onActions: (id: string) => void; onReorder: (id: string, target: number) => void }) {
  const { t } = usePreferences();
  const [active, setActive] = useState(false);
  const [dragged, setDragged] = useState<string | null>(null);
  const [targetId, setTargetId] = useState<string | null>(null);
  const grid = useRef<HTMLDivElement>(null);
  const draggedRef = useRef<string | null>(null);
  const targetRef = useRef(-1);
  useEffect(() => {
    if (!active) return;
    const outside = (event: globalThis.PointerEvent) => { if (event.target instanceof globalThis.Node && !grid.current?.contains(event.target)) { setActive(false); setDragged(null); setTargetId(null); } };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { setActive(false); setDragged(null); setTargetId(null); } };
    document.addEventListener("pointerdown", outside, true);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside, true); document.removeEventListener("keydown", escape); };
  }, [active]);
  function start(id: string) { draggedRef.current = id; targetRef.current = collection.documents.findIndex(document => document.root?.id === id); setActive(true); setDragged(id); setTargetId(id); }
  function move(x: number, y: number) {
    const card = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-whole-id]");
    if (!card || !grid.current?.contains(card)) return;
    const index = collection.documents.findIndex(document => document.root?.id === card.dataset.wholeId);
    if (index >= 0) { targetRef.current = index; setTargetId(card.dataset.wholeId ?? null); }
  }
  function end(cancelled: boolean) {
    const id = draggedRef.current;
    draggedRef.current = null;
    setDragged(null);
    if (cancelled) { setActive(false); setTargetId(null); return; }
    const original = collection.documents.findIndex(document => document.root?.id === id);
    if (id && targetRef.current >= 0 && original !== targetRef.current) { onReorder(id, targetRef.current); setActive(false); setTargetId(null); }
  }
  return <div ref={grid} className={`resource-library-grid${active ? " is-reordering" : ""}`}>
    {active && <span className="sr-only" role="status">{t("Режим перестановки")}</span>}
    {collection.documents.map(document => document.root && <WholeCard key={document.root.id} document={document} active={active} dragging={dragged === document.root.id} target={targetId === document.root.id && targetId !== dragged} onOpen={onOpen} onActions={id => { setActive(false); setDragged(null); setTargetId(null); onActions(id); }} onStart={start} onMove={move} onEnd={end} />)}
  </div>;
}

export default function ResourceLibrary({ collection, onOpen, onActions, onOpenResult, onCreate, onImport, onReorder }: { collection: Collection; onOpen: (id: string) => void; onActions: (id: string) => void; onOpenResult: (rootId: string, pathIds: string[]) => void; onCreate: () => void; onImport: () => void; onReorder: (id: string, target: number) => void }) {
  const { t } = usePreferences();
  const full = collection.documents.length >= MAX_DOCUMENTS;
  const [query, setQuery] = useState("");
  const [gridSession, setGridSession] = useState(0);
  return <section className="resource-library" aria-label={t("Твої збережені цілі. Обери ціле або створи нове.")}>
    <LibraryIntro />
    {collection.documents.length > 0 && <WholeSearch collection={collection} query={query} onQueryChange={setQuery} onOpen={onOpenResult} onCreate={onCreate} full={full} onSearchFocus={() => setGridSession(session => session + 1)} />}
    {collection.documents.length ? <>
      {!query.trim() && <WholeGrid key={gridSession} collection={collection} onOpen={onOpen} onActions={onActions} onReorder={onReorder} />}
      {full && <p className="parts-note">{t("Збережено всі")}{" "}{MAX_DOCUMENTS} {" "}{t("цілих. Щоб додати нове, видали одне з наявних.")}</p>}
    </> : <div className="library-empty surface">
      <h2>{t("Тут поки немає цілих.")}</h2>
      <div className="library-empty-copy">
        <p>{t("Ціле — це те, що ти хочеш описати: команда, проєкт, бюджет або час.")}</p>
        <p>{t("Без кількості — структура чи список. З кількістю та одиницею — пропорційні частини.")}</p>
      </div>
      <button type="button" className="primary-button" onClick={onCreate}><Icon name="plus" />{t("Створити перше ціле")}</button>
      <button type="button" className="text-button" onClick={onImport}>{t("Маю резервну копію")}</button>
    </div>}
  </section>;
}
