"use client";

import { PreferencesProvider, usePreferences } from "../src/lib/use-preferences";

import { useMemo, useState } from "react";
import PwaRegistration from "../src/components/PwaRegistration";
import type { NodeColor } from "../src/lib/node-color";
import type { NodeIcon } from "../src/lib/node-icon";
import { isMeasuredNode } from "../src/lib/node-mode";
import type { Node } from "../src/types/node";
import { findNodeById, countDescendants as countParts, findParent, movePart } from "../src/lib/tree";
import { addPart, createNode, deletePart, editPart, remaining, sumValues, units } from "../src/lib/document";
import { encodeCollection, type Collection } from "../src/lib/collection";
import { useDocument } from "../src/lib/use-document";
import { useBackupReminder } from "../src/lib/use-backup-reminder";
import { useScreen } from "../src/lib/use-screen";
import BottomNavigation, { type Screen } from "../src/components/BottomNavigation";
import SettingsPanel from "../src/components/SettingsPanel";
import HomeScreen from "../src/components/screens/HomeScreen";
import CreateWholeScreen from "../src/components/screens/CreateWholeScreen";
import WholeScreen from "../src/components/screens/WholeScreen";
import WorkspaceDialogs from "../src/components/WorkspaceDialogs";

function Workspace() {
  const { t, translateMessage } = usePreferences();
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
  function handleCreateWhole(name: string, value: number | undefined, unit: string, color?: NodeColor, icon?: NodeIcon) {
    const newRoot = createNode(crypto.randomUUID(), name, value, unit, color, icon);
    return workspace.change({ root: newRoot, pathIds: [newRoot.id] }, t("Ціле створено. Додай першу частину."));
  }
  function handleAddPart(name: string, value: number | undefined, unit: string, color?: NodeColor, icon?: NodeIcon) {
    if (!root || !current) return;
    const child = createNode(crypto.randomUUID(), name, value, isMeasuredNode(current) ? current.unit : unit, color, icon);
    const nextRoot = addPart(root, current.id, child);
    const issue = workspace.change({ root: nextRoot, pathIds }, t("Додано «{p0}».", {p0: name}));
    if (issue) return issue;
    setAdding(false);
  }
  function handleEditNode(name: string, value: number | undefined, _unit: string, color?: NodeColor, icon?: NodeIcon) {
    if (!root || !editing) return;
    try {
      const nextRoot = editPart(root, editing.id, name, value, color ?? null, icon ?? null);
      const issue = workspace.change({ root: nextRoot, pathIds }, t("Зміни до «{p0}» збережено.", {p0: name}));
      if (issue) return issue;
      setEditingId(null);
    } catch (error) { return error instanceof Error ? error.message : t("Не вдалося зберегти зміни."); }
  }
  function handleDeleteWhole() {
    if (!root) return;
    const issue = workspace.remove(root.id);
    if (issue) setActionError(issue); else goToScreen("home");
    setDeletingWhole(false);
  }
  function handleDeletePart() {
    if (!root || !deleting) return;
    const issue = workspace.change({ root: deletePart(root, deleting.id), pathIds }, t("«{p0}» видалено. Можна скасувати дію.", {p0: deleting.name}));
    if (issue) setActionError(issue);
    setDeletingId(null);
  }
  function handleDuplicateWhole() {
    if (!root) return;
    const issue = workspace.duplicate(t("Копія — {name}", { name: root.name }));
    if (issue) { setActionError(issue); setActionsId(null); } else goToScreen("resource");
  }
  function handleImport(incoming: Collection) {
    const issue = workspace.importCollection(incoming);
    if (!issue) goToScreen("resource");
    return issue;
  }
  function openActionNode() {
    if (!root || !actionNode) return;
    const actionParent = findParent(root, actionNode.id);
    const parentIndex = path.findIndex((node) => node.id === actionParent?.id);
    if (parentIndex >= 0) goToPath([...path.slice(0, parentIndex + 1).map((node) => node.id), actionNode.id]);
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

        <div className={`save-status${workspace.storageError || workspace.notice || actionError ? "" : " save-status-empty"}`}>
          {workspace.storageError && <p role="alert" className="text-sm text-amber-300">{translateMessage(workspace.storageError)}</p>}
          {workspace.storageError && <p className="mt-2 text-xs leading-relaxed text-neutral-400">{t("Завантаж резервну копію в налаштуваннях, щоб зберегти поточні дані файлом.")}</p>}
          <p aria-live="polite" aria-atomic="true" className="mt-1 text-sm text-indigo-300">{translateMessage(workspace.notice)}</p>
          {actionError && <p role="alert" className="mt-2 text-sm text-rose-300">{translateMessage(actionError)}</p>}
        </div>

        {screen === "home" && <HomeScreen collection={workspace.collection} reminderVisible={backupReminder.visible} onDownload={downloadBackup} onRemindLater={backupReminder.remindLater} onSelect={selectDocument} onOpenResult={openSearchResult} onImport={() => setImporting(true)} />}

        {screen === "settings" && <SettingsPanel count={workspace.collection.documents.length} storageError={workspace.storageError} canExport={workspace.collection.documents.length > 0 || Boolean(workspace.storageError)} onExport={downloadBackup} onImport={() => setImporting(true)} />}

        {screen === "resource" && (!root ? (
          <CreateWholeScreen count={workspace.collection.documents.length} onCancel={() => goToScreen("home")} onSubmit={handleCreateWhole} />
        ) : current ? (
          <WholeScreen root={root} current={current} path={path} showingPath={showingPath} free={free} used={used} atLimit={atLimit} onNavigate={goToPath} onShowPath={setShowingPath} onActions={setActionsId} onAdd={() => setAdding(true)} onOpen={openNode} />
        ) : <p role="alert">{t("Не вдалося відкрити частину.")}{" "}<button type="button" onClick={() => goToPath([root.id])} className="underline">{t("Повернутися до цілого")}</button></p>)}

        <WorkspaceDialogs
          nodes={{ root, current, actionNode, actionParent, actionIndex, editing, parent, availableForEdit, deleting, deletingParent, free, atLimit, count: workspace.collection.documents.length }}
          visibility={{ deletingWhole, adding, importing, onActionsId: setActionsId, onEditingId: setEditingId, onDeletingId: setDeletingId, onDeletingWhole: setDeletingWhole, onAdding: setAdding, onImporting: setImporting }}
          actions={{ onOpenAction: openActionNode, onMove: moveActionPart, onDuplicate: handleDuplicateWhole, onAddPart: handleAddPart, onEditNode: handleEditNode, onDeleteWhole: handleDeleteWhole, onDeletePart: handleDeletePart, onImport: handleImport }}
        />
      </div>
      <BottomNavigation screen={screen} onNavigate={goToScreen} />
    </main>
  );
}


export default function Home() {
  return <PreferencesProvider><Workspace /></PreferencesProvider>;
}
