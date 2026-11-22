"use client";

import { PreferencesProvider, usePreferences } from "../src/lib/use-preferences";

import { useMemo, useState } from "react";
import NodeMetadata from "../src/components/NodeMetadata";
import PwaRegistration from "../src/components/PwaRegistration";
import { getNodeColor } from "../src/lib/node-color";
import { getNodeIcon } from "../src/lib/node-icon";
import { isMeasuredNode } from "../src/lib/node-mode";
import type { Node } from "../src/types/node";
import { findNodeById, countDescendants as countParts, findParent, movePart } from "../src/lib/tree";
import { addPart, createNode, deletePart, editPart, remaining, sumValues, units } from "../src/lib/document";
import { encodeCollection, MAX_DOCUMENTS } from "../src/lib/collection";
import { useDocument } from "../src/lib/use-document";
import { useBackupReminder } from "../src/lib/use-backup-reminder";
import { useScreen } from "../src/lib/use-screen";
import BottomNavigation, { type Screen } from "../src/components/BottomNavigation";
import ResourceLibrary from "../src/components/ResourceLibrary";
import SettingsPanel from "../src/components/SettingsPanel";
import LevelNavigation from "../src/components/LevelNavigation";
import PartsList from "../src/components/PartsList";
import Icon from "../src/components/Icon";
import NodeForm from "../src/components/NodeForm";
import Modal from "../src/components/Modal";
import Treemap from "../src/components/Treemap";
import StructureViewToggle from "../src/components/StructureViewToggle";
import ImportBackup from "../src/components/ImportBackup";
import BackupReminder from "../src/components/BackupReminder";

function Workspace() {
  const { t, formatNumber, formatPercent, translateMessage, structureView } = usePreferences();
  const workspace = useDocument();
  const backupReminder = useBackupReminder(workspace.collection.documents.length);
  const { root, pathIds } = workspace.document;
  const [screen, setScreen] = useScreen();
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
  const deletingParent = root && deleting ? findParent(root, deleting.id) : null;
  const actionNode = root && actionsId ? findNodeById(root, actionsId) : null;
  const actionParent = root && actionNode ? findParent(root, actionNode.id) : null;
  const actionIndex = actionParent?.children.findIndex(child => child.id === actionNode?.id) ?? -1;
  const parent = root && editing ? findParent(root, editing.id) : null;
  const availableForEdit = editing && parent && isMeasuredNode(parent) ? (units(parent.value) - units(sumValues(parent.children.filter((child) => child.id !== editing.id)))) / 1_000_000 : undefined;
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
  function moveActionPart(direction: "up" | "down") {
    if (!root || !actionNode) return;
    const nextRoot = movePart(root, actionNode.id, direction);
    if (nextRoot === root) return;
    const issue = workspace.change({ root: nextRoot, pathIds }, t("Порядок частин змінено."));
    if (issue) setActionError(issue);
  }
  function selectDocument(id: string | null) {
    workspace.select(id);
    goToScreen("resource");
  }
  function openSearchResult(id: string, nextPath: string[]) {
    const issue = workspace.open(id, nextPath);
    if (issue) { setActionError(issue); return; }
    goToScreen("resource");
  }
  function downloadBackup() {
    try {
      let data = encodeCollection(workspace.collection);
      if (!workspace.collection.documents.length && workspace.storageError) {
        try { data = localStorage.getItem("hundred.document.v1") ?? data; } catch { /* Preserve the export option when storage is inaccessible. */ }
      }
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      try {
        const link = document.createElement("a");
        link.href = url;
        link.download = "hundred-backup.json";
        link.click();
        if (workspace.collection.documents.length > 0) backupReminder.backupStarted();
        setActionError("");
      } finally {
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch {
      setActionError(t("Не вдалося розпочати завантаження резервної копії."));
    }
  }

  if (!workspace.ready) return <main className="flex min-h-screen items-center justify-center bg-neutral-950 p-6 text-neutral-300" role="status">{t("Відновлюю твої цілі…")}</main>;

  return (
    <main className="hundred-app min-h-screen px-4 py-5 text-white sm:px-8 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <PwaRegistration />
        <header className="app-header">
          <button type="button" onClick={() => goToScreen("home")} className="brand" aria-label={t("Hundred — на головну")}>Hundred<span className="brand-dot" aria-hidden="true" /></button>
          {screen === "resource" ? <div className="history-controls">
            <button type="button" onClick={() => { clearDialogs(); workspace.undo(); }} disabled={!workspace.past.length} className="icon-button" title={t("Скасувати останню зміну")} aria-label={t("Скасувати останню зміну")}>↶</button>
            <button type="button" onClick={() => { clearDialogs(); workspace.redo(); }} disabled={!workspace.future.length} className="icon-button" title={t("Повторити скасовану зміну")} aria-label={t("Повторити скасовану зміну")}>↷</button>
          </div> : null}
        </header>

        {(workspace.storageError || workspace.notice || actionError) && <div className="save-status">
          {workspace.storageError && <p role="alert" className="text-sm text-amber-300">{translateMessage(workspace.storageError)}</p>}
          {workspace.storageError && <p className="mt-2 text-xs leading-relaxed text-neutral-400">{t("Завантаж резервну копію в налаштуваннях, щоб зберегти поточні дані файлом.")}</p>}
          <p aria-live="polite" aria-atomic="true" className="mt-1 text-sm text-indigo-300">{translateMessage(workspace.notice)}</p>
          {actionError && <p role="alert" className="mt-2 text-sm text-rose-300">{translateMessage(actionError)}</p>}
        </div>}

        {screen === "home" && <>
          {backupReminder.visible && <BackupReminder onDownload={downloadBackup} onLater={backupReminder.remindLater} />}
          <ResourceLibrary collection={workspace.collection} onOpen={selectDocument} onOpenResult={openSearchResult} onCreate={() => selectDocument(null)} onImport={() => setImporting(true)} />
        </>}

        {screen === "settings" && <SettingsPanel count={workspace.collection.documents.length} storageError={workspace.storageError} canExport={workspace.collection.documents.length > 0 || Boolean(workspace.storageError)} onExport={downloadBackup} onImport={() => setImporting(true)} />}

        {screen === "resource" && (!root ? (
          <section className="create-resource">
            <header className="screen-heading"><p className="eyebrow">{t("Почни з цілого")}</p><h1>{t("Нове ціле")}</h1><p>{t("Назви ціле, наприклад команду, проєкт, бюджет або час.")}</p></header>
            {workspace.collection.documents.length >= MAX_DOCUMENTS ? <div className="surface p-6"><p>{t("Збережено всі")}{" "}{MAX_DOCUMENTS} {" "}{t("цілих. Звільни місце, перш ніж створювати нове.")}</p><button type="button" className="primary-button mt-5" onClick={() => goToScreen("home")}>{t("Мої цілі")}</button></div> : <div className="surface p-5 sm:p-7">
              <NodeForm createWhole submitLabel={t("Створити ціле")} onCancel={() => goToScreen("home")} onSubmit={(name, value, unit, color, icon) => {
                const newRoot = createNode(crypto.randomUUID(), name, value, unit, color, icon);
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
                  <h1>{current.icon && <span className="whole-title-icon" style={{ color: getNodeColor(current) }}><Icon name={getNodeIcon(current)} width="28" height="28" /></span>}{current.name}</h1>
                  <p className="resource-value"><NodeMetadata node={current} /></p>
                  {isMeasuredNode(current) && isMeasuredNode(root) && current.id !== root.id && <p className="resource-root-share">{formatPercent(current.value / root.value * 100)} {t("від усього «{name}»", { name: root.name })}</p>}
                </div>
                <button type="button" className="icon-button" aria-label={t("Дії для «{p0}»", {p0: current.name})} onClick={() => setActionsId(current.id)}><Icon name="more" /></button>
              </div>
              {isMeasuredNode(current) && <div className="resource-summary">
                <p>{t("Розподілено")}</p><p>{formatPercent(used / current.value * 100)}</p>
                <p>{t("Вільно:")}{" "}{formatNumber(free)} {current.unit}</p>
                <div className="usage-track" aria-hidden="true"><span style={{ width: `${Math.min(100, used / current.value * 100)}%` }} /></div>
              </div>}
              <button type="button" className="primary-button add-part-button" disabled={(isMeasuredNode(current) && free === 0) || atLimit} onClick={() => setAdding(true)}><Icon name="plus" /><span>{t("Додати частину")}</span></button>
            </header>
            <div className={`workspace-grid${!isMeasuredNode(current) && (structureView === "list" || !current.children.length) ? " structure-list-workspace" : ""}`}>
              <div className="min-w-0">
                <div className="map-heading"><h2>{isMeasuredNode(current) ? t("Карта цілого") : t("Структура частин")}</h2>{!isMeasuredNode(current) && <StructureViewToggle />}</div>
                {!isMeasuredNode(current) && (structureView === "list" || !current.children.length)
                  ? <PartsList node={current} free={free} atLimit={atLimit} onOpen={openNode} onActions={setActionsId} />
                  : <Treemap node={current} onOpen={openNode} />}
              </div>
              {(isMeasuredNode(current) || (structureView === "cards" && current.children.length > 0)) && <aside><PartsList node={current} free={free} atLimit={atLimit} onOpen={openNode} onActions={setActionsId} /></aside>}
            </div>
          </>
        ) : <p role="alert">{t("Не вдалося відкрити частину.")}{" "}<button type="button" onClick={() => goToPath([root.id])} className="underline">{t("Повернутися до цілого")}</button></p>)}

        {actionNode && root && <Modal title={actionNode.name} onClose={() => setActionsId(null)} variant="sheet">
          <p className="mb-5 text-sm text-neutral-400"><NodeMetadata node={actionNode} />{isMeasuredNode(actionNode) && actionNode.children.length ? t(" · частин: {p0}", {p0: actionNode.children.length}) : ""}</p>
          <div className="action-sheet-list">
            {actionNode.id !== current?.id && <button type="button" onClick={() => {
              const actionParent = findParent(root, actionNode.id);
              const parentIndex = path.findIndex((node) => node.id === actionParent?.id);
              if (parentIndex >= 0) goToPath([...path.slice(0, parentIndex + 1).map((node) => node.id), actionNode.id]);
            }}><Icon name="resource" /><span>{t("Відкрити частину")}</span><Icon name="chevron" width="16" height="16" /></button>}
            <button type="button" onClick={() => { setActionsId(null); setEditingId(actionNode.id); }}><Icon name="edit" /><span>{actionNode.id === root.id ? t("Редагувати ціле") : t("Редагувати частину")}</span></button>
            {actionParent && <>
              <button type="button" disabled={actionIndex <= 0} onClick={() => moveActionPart("up")}><Icon name="back" style={{ transform: "rotate(90deg)" }} /><span>{t("Перемістити вище")}</span></button>
              <button type="button" disabled={actionIndex >= actionParent.children.length - 1} onClick={() => moveActionPart("down")}><Icon name="back" style={{ transform: "rotate(-90deg)" }} /><span>{t("Перемістити нижче")}</span></button>
            </>}
            {actionNode.id === root.id && <button type="button" disabled={workspace.collection.documents.length >= MAX_DOCUMENTS} onClick={() => {
              const issue = workspace.duplicate(t("Копія — {name}", { name: root.name }));
              if (issue) { setActionError(issue); setActionsId(null); } else goToScreen("resource");
            }}><Icon name="copy" /><span>{t("Створити копію цілого")}</span></button>}
            <button type="button" className="action-danger" onClick={() => { setActionsId(null); if (actionNode.id === root.id) setDeletingWhole(true); else setDeletingId(actionNode.id); }}><Icon name="trash" /><span>{actionNode.id === root.id ? t("Видалити ціле") : t("Видалити частину")}</span></button>
          </div>
        </Modal>}

        {adding && current && root && <Modal title={t("Додати частину")} onClose={() => setAdding(false)}>
          {isMeasuredNode(current) && <p className="mb-5 text-sm text-neutral-400">{t("Доступно")}{" "}{formatNumber(free)} {current.unit}</p>}
          {atLimit ? <p className="text-sm text-amber-300">{t("Досягнуто межі розміру цілого. Відредагуй наявні частини.")}</p> :
            <NodeForm key={current.id} optionalQuantity={!isMeasuredNode(current)} unit={isMeasuredNode(current) ? current.unit : ""} available={isMeasuredNode(current) ? free : undefined} parentValue={isMeasuredNode(current) ? current.value : undefined} parentName={current.name} submitLabel={t("Додати частину")} onCancel={() => setAdding(false)} onSubmit={(name, value, unit, color, icon) => {
              const child = createNode(crypto.randomUUID(), name, value, isMeasuredNode(current) ? current.unit : unit, color, icon);
              const nextRoot = addPart(root, current.id, child);
              const issue = workspace.change({ root: nextRoot, pathIds }, t("Додано «{p0}».", {p0: name}));
              if (issue) return issue;
              setAdding(false);
            }} />}
        </Modal>}

        {editing && root && <Modal key={editing.id} title={editing.id === root.id ? t("Редагувати ціле") : t("Редагувати частину")} onClose={() => setEditingId(null)}>
          <p className="mb-5 text-sm leading-relaxed text-neutral-400">{isMeasuredNode(editing) ? t("Зміни назву або значення. Вкладені частини залишаться.") : t("Тип цілого після створення не змінюється.")}{availableForEdit !== undefined ? t(" Доступно до {p0} {p1}.", {p0: formatNumber(availableForEdit), p1: isMeasuredNode(editing) ? editing.unit : ""}) : ""}</p>
          <NodeForm key={editing.id} initialName={editing.name} initialColor={editing.color} initialIcon={editing.icon} structuralEdit={!isMeasuredNode(editing)} initialValue={isMeasuredNode(editing) ? editing.value : undefined} unit={isMeasuredNode(editing) ? editing.unit : ""} minimum={sumValues(editing.children)} available={availableForEdit} parentValue={parent && isMeasuredNode(parent) ? parent.value : undefined} parentName={parent?.name} submitLabel={t("Зберегти зміни")} onCancel={() => setEditingId(null)} onSubmit={(name, value, _unit, color, icon) => {
            try {
              const nextRoot = editPart(root, editing.id, name, value, color ?? null, icon ?? null);
              const issue = workspace.change({ root: nextRoot, pathIds }, t("Зміни до «{p0}» збережено.", {p0: name}));
              if (issue) return issue;
              setEditingId(null);
            } catch (error) { return error instanceof Error ? error.message : t("Не вдалося зберегти зміни."); }
          }} />
        </Modal>}

        {deletingWhole && root && <Modal title={t("Видалити ціле «{p0}»?", {p0: root.name})} onClose={() => setDeletingWhole(false)}>
          <p className="text-sm leading-relaxed text-neutral-300">{t("Буде видалено усе ціле разом із частинами. Інші цілі залишаться. Дію можна скасувати у верхній панелі вкладки «Ціле».")}</p>
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" autoFocus onClick={() => setDeletingWhole(false)} className="rounded-2xl border border-white/15 px-4 py-3 text-sm">{t("Залишити")}</button>
            <button type="button" onClick={() => {
              const issue = workspace.remove(root.id);
              if (issue) setActionError(issue); else goToScreen("home");
              setDeletingWhole(false);
            }} className="rounded-2xl bg-rose-500 px-4 py-3 text-sm font-medium">{t("Видалити ціле")}</button>
          </div>
        </Modal>}

        {importing && <ImportBackup currentCount={workspace.collection.documents.length} onImport={(incoming) => {
          const issue = workspace.importCollection(incoming);
          if (!issue) goToScreen("resource");
          return issue;
        }} onClose={() => setImporting(false)} />}

        {deleting && root && <Modal title={t("Видалити «{p0}»?", {p0: deleting.name})} onClose={() => setDeletingId(null)}>
          <p className="leading-relaxed text-neutral-300">{isMeasuredNode(deleting) && deletingParent && isMeasuredNode(deletingParent) && <>{t("Буде звільнено")}{" "}{formatNumber(deleting.value)} {deleting.unit}.</>}
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
