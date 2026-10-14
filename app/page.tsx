"use client";

import { PreferencesProvider, usePreferences } from "../src/lib/use-preferences";

import { useMemo, useState } from "react";
import type { Node } from "../src/types/node";
import { findNodeById, updateNodeById } from "../src/lib/tree";
import { deletePart, editPart, remaining, sumValues, units } from "../src/lib/document";
import { encodeCollection, MAX_DOCUMENTS } from "../src/lib/collection";
import { useDocument } from "../src/lib/use-document";
import BottomNavigation, { type Screen } from "../src/components/BottomNavigation";
import ResourceLibrary from "../src/components/ResourceLibrary";
import SettingsPanel from "../src/components/SettingsPanel";
import LevelNavigation from "../src/components/LevelNavigation";
import PartsList from "../src/components/PartsList";
import Icon from "../src/components/Icon";
import NodeForm from "../src/components/NodeForm";
import Modal from "../src/components/Modal";
import Treemap from "../src/components/Treemap";
import ImportBackup from "../src/components/ImportBackup";

function countParts(node: Node): number {
  return node.children.reduce((count, child) => count + 1 + countParts(child), 0);
}
function findParent(root: Node, id: string): Node | null {
  if (root.children.some((child) => child.id === id)) return root;
  for (const child of root.children) {
    const result = findParent(child, id);
    if (result) return result;
  }
  return null;
}

function Workspace() {
  const { t, formatNumber, formatPercent, translateMessage } = usePreferences();
  const workspace = useDocument();
  const { root, pathIds } = workspace.document;
  const [screen, setScreen] = useState<Screen>("home");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionsId, setActionsId] = useState<string | null>(null);
  const [showingPath, setShowingPath] = useState(false);
  const [deletingWhole, setDeletingWhole] = useState(false);
  const [importing, setImporting] = useState(false);
  const [adding, setAdding] = useState(false);
  const [actionError, setActionError] = useState("");
  const current = useMemo(() => root ? findNodeById(root, pathIds.at(-1) ?? root.id) : null, [root, pathIds]);
  const path = useMemo(() => root ? pathIds.map((id) => findNodeById(root, id)).filter((node): node is Node => node !== null) : [], [root, pathIds]);
  const partsCount = useMemo(() => root ? countParts(root) : 0, [root]);
  const editing = root && editingId ? findNodeById(root, editingId) : null;
  const deleting = root && deletingId ? findNodeById(root, deletingId) : null;
  const actionNode = root && actionsId ? findNodeById(root, actionsId) : null;
  const parent = root && editing ? findParent(root, editing.id) : null;
  const availableForEdit = editing && parent ? (units(parent.value) - units(sumValues(parent.children.filter((child) => child.id !== editing.id)))) / 1_000_000 : undefined;
  const free = current ? remaining(current) : 0;
  const used = current ? sumValues(current.children) : 0;
  const atLimit = path.length >= 41 || partsCount >= 4999;

  function clearDialogs() {
    setAdding(false);
    setEditingId(null);
    setDeletingId(null);
    setActionsId(null);
    setShowingPath(false);
    setDeletingWhole(false);
    setImporting(false);
  }
  function goToScreen(next: Screen) {
    clearDialogs();
    setActionError("");
    setScreen(next);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function goToPath(next: string[]) {
    clearDialogs();
    workspace.navigate(next);
    setScreen("resource");
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function openNode(node: Node) {
    goToPath([...pathIds, node.id]);
  }
  function selectDocument(id: string | null) {
    workspace.select(id);
    goToScreen("resource");
  }
  function downloadBackup() {
    let data = encodeCollection(workspace.collection);
    if (!workspace.collection.documents.length && workspace.storageError) {
      try { data = localStorage.getItem("hundred.document.v1") ?? data; } catch { /* Preserve the export option when storage is inaccessible. */ }
    }
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "hundred-backup.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  if (!workspace.ready) return <main className="flex min-h-screen items-center justify-center bg-neutral-950 p-6 text-neutral-300" role="status">{t("Відновлюю твій розподіл…")}</main>;

  return (
    <main className="hundred-app min-h-screen px-4 py-5 text-white sm:px-8 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <header className="app-header">
          <button type="button" onClick={() => goToScreen("home")} className="brand" aria-label={t("Hundred — на головну")}>Hundred<span className="brand-dot" aria-hidden="true" /></button>
          {screen === "resource" ? <div className="history-controls">
            <button type="button" onClick={() => { clearDialogs(); workspace.undo(); }} disabled={!workspace.past.length} className="icon-button" title={t("Скасувати останню зміну")} aria-label={t("Скасувати останню зміну")}>↶</button>
            <button type="button" onClick={() => { clearDialogs(); workspace.redo(); }} disabled={!workspace.future.length} className="icon-button" title={t("Повторити скасовану зміну")} aria-label={t("Повторити скасовану зміну")}>↷</button>
          </div> : <span className="app-header-caption">{t("Місце для кожної частини")}</span>}
        </header>

        <div className="save-status">
          <p role="status" className={workspace.storageError ? "text-sm text-amber-300" : "text-xs text-neutral-400"}>
            {translateMessage(workspace.storageError) || (workspace.collection.documents.length ? t("✓ Збережено в цьому браузері") : t("Збереження на цьому пристрої"))}
          </p>
          {workspace.storageError && <p className="mt-2 text-xs leading-relaxed text-neutral-400">{t("Завантаж резервну копію в налаштуваннях, щоб зберегти поточні дані файлом.")}</p>}
          <p aria-live="polite" aria-atomic="true" className="mt-1 text-sm text-indigo-300">{translateMessage(workspace.notice)}</p>
          {actionError && <p role="alert" className="mt-2 text-sm text-rose-300">{translateMessage(actionError)}</p>}
        </div>

        {screen === "home" && <ResourceLibrary collection={workspace.collection} onOpen={selectDocument} onCreate={() => selectDocument(null)} onImport={() => setImporting(true)} />}

        {screen === "settings" && <SettingsPanel count={workspace.collection.documents.length} storageError={workspace.storageError} canExport={workspace.collection.documents.length > 0 || Boolean(workspace.storageError)} onExport={downloadBackup} onImport={() => setImporting(true)} />}

        {screen === "resource" && (!root ? (
          <section className="create-resource">
            <header className="screen-heading"><p className="eyebrow">{t("Почни з цілого")}</p><h1>{t("Новий ресурс")}</h1><p>{t("Що маєш, скільки та в яких одиницях?")}</p></header>
            {workspace.collection.documents.length >= MAX_DOCUMENTS ? <div className="surface p-6"><p>{t("Збережено всі")}{" "}{MAX_DOCUMENTS} {" "}{t("ресурсів. Звільни місце, перш ніж створювати новий.")}</p><button type="button" className="primary-button mt-5" onClick={() => goToScreen("home")}>{t("Мої ресурси")}</button></div> : <div className="surface p-5 sm:p-7">
              <NodeForm createWhole submitLabel={t("Створити ресурс")} onCancel={() => goToScreen("home")} onSubmit={(name, value, unit) => {
                const newRoot: Node = { id: crypto.randomUUID(), name, value, unit, children: [] };
                return workspace.change({ root: newRoot, pathIds: [newRoot.id] }, t("Ціле створено. Додай першу частину."));
              }} />
            </div>}
          </section>
        ) : current ? (
          <>
            <LevelNavigation path={path} onNavigate={goToPath} showingPath={showingPath} onShowPath={setShowingPath} />
            <header className="resource-header">
              <div className="resource-title-row">
                <div className="min-w-0">
                  <p className="eyebrow">{path.length === 1 ? t("Ціле") : t("Частина · рівень {p0}", {p0: path.length})}</p>
                  <h1>{current.name}</h1>
                  <p className="resource-value">{formatNumber(current.value)} {current.unit}<span>{t("100% цього рівня")}</span></p>
                  {current.id !== root.id && <p className="resource-root-share">{formatPercent(current.value / root.value * 100)} {t("від усього «{name}»", { name: root.name })}</p>}
                </div>
                <button type="button" className="icon-button" aria-label={t("Дії для «{p0}»", {p0: current.name})} onClick={() => setActionsId(current.id)}><Icon name="more" /></button>
              </div>
              <div className="resource-summary">
                <p>{t("Розподілено")}</p><p>{formatPercent(used / current.value * 100)}</p>
                <p>{t("Вільно:")}{" "}{formatNumber(free)} {current.unit}</p>
                <div className="usage-track" aria-hidden="true"><span style={{ width: `${Math.min(100, used / current.value * 100)}%` }} /></div>
              </div>
              <button type="button" className="primary-button add-part-button" disabled={free === 0 || atLimit} onClick={() => setAdding(true)}><Icon name="plus" /><span>{t("Додати частину")}</span></button>
            </header>
            <div className="workspace-grid">
              <div className="min-w-0">
                <div className="map-heading"><h2>{t("Карта ресурсу")}</h2><span>{t("Натисни частину, щоб відкрити")}</span></div>
                <Treemap node={current} onOpen={openNode} />
              </div>
              <aside><PartsList node={current} free={free} atLimit={atLimit} onOpen={openNode} onActions={setActionsId} /></aside>
            </div>
          </>
        ) : <p role="alert">{t("Не вдалося відкрити частину.")}{" "}<button type="button" onClick={() => goToPath([root.id])} className="underline">{t("Повернутися до цілого")}</button></p>)}

        {actionNode && root && <Modal title={actionNode.name} onClose={() => setActionsId(null)} variant="sheet">
          <p className="mb-5 text-sm text-neutral-400">{formatNumber(actionNode.value)} {actionNode.unit}{actionNode.children.length ? t(" · частин: {p0}", {p0: actionNode.children.length}) : ""}</p>
          <div className="action-sheet-list">
            {actionNode.id !== current?.id && <button type="button" onClick={() => {
              const actionParent = findParent(root, actionNode.id);
              const parentIndex = path.findIndex((node) => node.id === actionParent?.id);
              if (parentIndex >= 0) goToPath([...path.slice(0, parentIndex + 1).map((node) => node.id), actionNode.id]);
            }}><Icon name="resource" /><span>{t("Відкрити частину")}</span><Icon name="chevron" width="16" height="16" /></button>}
            <button type="button" onClick={() => { setActionsId(null); setEditingId(actionNode.id); }}><Icon name="edit" /><span>{actionNode.id === root.id ? t("Редагувати ресурс") : t("Редагувати частину")}</span></button>
            {actionNode.id === root.id && <button type="button" disabled={workspace.collection.documents.length >= MAX_DOCUMENTS} onClick={() => {
              const issue = workspace.duplicate(t("Копія — {name}", { name: root.name }));
              if (issue) { setActionError(issue); setActionsId(null); } else goToScreen("resource");
            }}><Icon name="copy" /><span>{t("Створити копію ресурсу")}</span></button>}
            <button type="button" className="action-danger" onClick={() => { setActionsId(null); if (actionNode.id === root.id) setDeletingWhole(true); else setDeletingId(actionNode.id); }}><Icon name="trash" /><span>{actionNode.id === root.id ? t("Видалити ресурс") : t("Видалити частину")}</span></button>
          </div>
        </Modal>}

        {adding && current && root && <Modal title={t("Додати частину")} onClose={() => setAdding(false)}>
          <p className="mb-5 text-sm text-neutral-400">{t("Доступно")}{" "}{formatNumber(free)} {current.unit}</p>
          {atLimit ? <p className="text-sm text-amber-300">{t("Досягнуто межі розміру розподілу. Відредагуй наявні частини.")}</p> :
            <NodeForm key={current.id} unit={current.unit} available={free} parentValue={current.value} parentName={current.name} submitLabel={t("Додати частину")} onCancel={() => setAdding(false)} onSubmit={(name, value) => {
              if (units(value) > units(remaining(current))) return t("Обсяг змінився. Перевір доступний залишок.");
              const child: Node = { id: crypto.randomUUID(), name, value, unit: current.unit, children: [] };
              const nextRoot = updateNodeById(root, current.id, (node) => ({ ...node, children: [...node.children, child] }));
              const issue = workspace.change({ root: nextRoot, pathIds }, t("Додано «{p0}».", {p0: name}));
              if (issue) return issue;
              setAdding(false);
            }} />}
        </Modal>}

        {editing && root && <Modal key={editing.id} title={editing.id === root.id ? t("Редагувати ціле") : t("Редагувати частину")} onClose={() => setEditingId(null)}>
          <p className="mb-5 text-sm leading-relaxed text-neutral-400">{t("Зміни назву або значення. Вкладені частини залишаться.")}{availableForEdit !== undefined ? t(" Доступно до {p0} {p1}.", {p0: formatNumber(availableForEdit), p1: editing.unit}) : ""}</p>
          <NodeForm key={`${editing.id}-${editing.name}-${editing.value}`} initialName={editing.name} initialValue={editing.value} unit={editing.unit} minimum={sumValues(editing.children)} available={availableForEdit} parentValue={parent?.value} parentName={parent?.name} submitLabel={t("Зберегти зміни")} onCancel={() => setEditingId(null)} onSubmit={(name, value) => {
            try {
              const nextRoot = editPart(root, editing.id, name, value);
              const issue = workspace.change({ root: nextRoot, pathIds }, t("Зміни до «{p0}» збережено.", {p0: name}));
              if (issue) return issue;
              setEditingId(null);
            } catch (error) { return error instanceof Error ? error.message : t("Не вдалося зберегти зміни."); }
          }} />
        </Modal>}

        {deletingWhole && root && <Modal title={t("Видалити ресурс «{p0}»?", {p0: root.name})} onClose={() => setDeletingWhole(false)}>
          <p className="text-sm leading-relaxed text-neutral-300">{t("Буде видалено весь ресурс разом із частинами. Інші ресурси залишаться. Дію можна скасувати у верхній панелі вкладки «Ресурс».")}</p>
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" autoFocus onClick={() => setDeletingWhole(false)} className="rounded-2xl border border-white/15 px-4 py-3 text-sm">{t("Залишити")}</button>
            <button type="button" onClick={() => {
              const issue = workspace.remove(root.id);
              if (issue) setActionError(issue); else goToScreen("home");
              setDeletingWhole(false);
            }} className="rounded-2xl bg-rose-500 px-4 py-3 text-sm font-medium">{t("Видалити ресурс")}</button>
          </div>
        </Modal>}

        {importing && <ImportBackup currentCount={workspace.collection.documents.length} onImport={(incoming) => {
          const issue = workspace.importCollection(incoming);
          if (!issue) goToScreen("resource");
          return issue;
        }} onClose={() => setImporting(false)} />}

        {deleting && root && <Modal title={t("Видалити «{p0}»?", {p0: deleting.name})} onClose={() => setDeletingId(null)}>
          <p className="leading-relaxed text-neutral-300">{t("Буде звільнено")}{" "}{formatNumber(deleting.value)} {deleting.unit}.
            {countParts(deleting) > 0 && t(" Також буде видалено вкладені частини: {p0}.", {p0: countParts(deleting)})} {" "}{t("Дію можна скасувати кнопкою «Скасувати» у верхній панелі.")}{" "}</p>
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" autoFocus onClick={() => setDeletingId(null)} className="rounded-2xl border border-white/15 px-4 py-3 text-sm">{t("Залишити")}</button>
            <button type="button" onClick={() => {
              const issue = workspace.change({ root: deletePart(root, deleting.id), pathIds }, t("«{p0}» видалено. Можна скасувати дію.", {p0: deleting.name}));
              if (issue) setActionError(issue);
              setDeletingId(null);
            }} className="rounded-2xl bg-rose-500 px-4 py-3 text-sm font-medium">{t("Видалити")}</button>
          </div>
        </Modal>}
      </div>
      <BottomNavigation screen={screen} onNavigate={goToScreen} />
    </main>
  );
}


export default function Home() {
  return <PreferencesProvider><Workspace /></PreferencesProvider>;
}
