"use client";

import { useMemo, useState } from "react";
import type { Node } from "../src/types/node";
import { findNodeById, updateNodeById } from "../src/lib/tree";
import { deletePart, editPart, encodeDocument, remaining, sumValues, units } from "../src/lib/document";
import { useDocument } from "../src/lib/use-document";
import { formatNumber, formatPercent, getNodeColor } from "../src/lib/format";
import NodeForm from "../src/components/NodeForm";
import Modal from "../src/components/Modal";
import Treemap from "../src/components/Treemap";

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

export default function Home() {
  const workspace = useDocument();
  const { root, pathIds } = workspace.document;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const current = useMemo(() => root ? findNodeById(root, pathIds.at(-1) ?? root.id) : null, [root, pathIds]);
  const path = useMemo(() => root ? pathIds.map((id) => findNodeById(root, id)).filter((node): node is Node => node !== null) : [], [root, pathIds]);
  const editing = root && editingId ? findNodeById(root, editingId) : null;
  const deleting = root && deletingId ? findNodeById(root, deletingId) : null;
  const parent = root && editing ? findParent(root, editing.id) : null;
  const availableForEdit = editing ? parent ? (units(parent.value) - units(sumValues(parent.children.filter((child) => child.id !== editing.id)))) / 1_000_000 : undefined : undefined;
  const free = current ? remaining(current) : 0;
  const used = current ? sumValues(current.children) : 0;

  function openNode(node: Node) {
    workspace.navigate([...pathIds, node.id]);
    setEditingId(null);
    setDeletingId(null);
  }
  function downloadBackup() {
    let data = encodeDocument(workspace.document);
    if (!root && workspace.storageError) {
      try { data = localStorage.getItem("hundred.document.v1") ?? data; } catch { /* Export the current empty document if storage is inaccessible. */ }
    }
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "hundred-backup.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  if (!workspace.ready) return <main className="flex min-h-screen items-center justify-center bg-neutral-950 p-6 text-neutral-300" role="status">Відновлюю твій розподіл…</main>;

  return (
    <main className="min-h-screen bg-neutral-950 px-5 py-6 text-white md:px-10 md:py-10">
      <div className={root ? "mx-auto max-w-7xl" : "mx-auto max-w-xl"}>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
          <button type="button" onClick={() => root && workspace.navigate([root.id])} className="rounded-lg text-xs uppercase tracking-[0.3em] text-neutral-300" aria-label="Hundred — повернутися до цілого">Hundred</button>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => { workspace.undo(); setEditingId(null); setDeletingId(null); }} disabled={!workspace.past.length} className="rounded-xl border border-white/15 px-3 py-2 text-sm hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40" title="Скасувати останню зміну">↶ Скасувати</button>
            <button type="button" onClick={() => { workspace.redo(); setEditingId(null); setDeletingId(null); }} disabled={!workspace.future.length} className="rounded-xl border border-white/15 px-3 py-2 text-sm hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40" title="Повторити скасовану зміну">↷ Повторити</button>
            {(root || workspace.storageError) && <button type="button" onClick={downloadBackup} className="rounded-xl border border-white/15 px-3 py-2 text-sm hover:bg-white/5">Резервна копія</button>}
          </div>
        </div>

        <div className="mb-6 space-y-2">
          <p role="status" className={workspace.storageError ? "text-sm text-amber-300" : "text-xs text-neutral-400"}>
            {workspace.storageError ?? (root ? "✓ Збережено в цьому браузері на цьому пристрої" : "Розподіл зберігатиметься в цьому браузері на цьому пристрої")}
          </p>
          {workspace.storageError && <p className="text-xs leading-relaxed text-neutral-400">Для збереження браузеру потрібен доступ до локального сховища. Резервна копія дозволяє завантажити дані файлом.</p>}
          <p aria-live="polite" aria-atomic="true" className="min-h-5 text-sm text-indigo-300">{workspace.notice}</p>
        </div>

        {!root ? (
          <>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight">Створи свої 100%</h1>
            <p className="mt-3 leading-relaxed text-neutral-400">Вкажи ціле. Це може бути бюджет, час, площа, люди, пам&apos;ять або будь-яка інша величина.</p>
            <section className="mt-8 rounded-[28px] border border-white/10 bg-neutral-900 p-6">
              <NodeForm createWhole submitLabel="Створити 100%" onSubmit={(name, value, unit) => {
                const newRoot: Node = { id: crypto.randomUUID(), name, value, unit, children: [] };
                workspace.change({ root: newRoot, pathIds: [newRoot.id] }, "Ціле створено. Додай першу частину.");
              }} />
            </section>
          </>
        ) : current ? (
          <>
            <nav aria-label="Шлях у розподілі" className="mb-8 flex flex-wrap items-center gap-2 text-sm text-neutral-400">
              {path.length > 1 && <button type="button" onClick={() => workspace.navigate(pathIds.slice(0, -1))} className="mr-2 rounded-xl border border-white/15 px-3 py-2 hover:text-white">← Назад</button>}
              {path.map((node, index) => <div key={node.id} className="flex items-center gap-2">
                <button type="button" aria-current={index === path.length - 1 ? "page" : undefined} onClick={() => workspace.navigate(pathIds.slice(0, index + 1))} className="rounded-md py-1 hover:text-white">{node.name}</button>
                {index < path.length - 1 && <span aria-hidden="true" className="text-neutral-600">/</span>}
              </div>)}
            </nav>

            <header className="mb-8 flex flex-wrap items-end justify-between gap-5">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.3em] text-neutral-400">{path.length === 1 ? "Ціле" : "Частина"}</p>
                <h1 className="mt-3 break-words text-4xl font-semibold tracking-tight md:text-6xl">{current.name}</h1>
                <p className="mt-3 text-neutral-300">{formatNumber(current.value)} {current.unit} <span className="mx-2 text-neutral-600">·</span> 100% цього рівня</p>
                {current.id !== root.id && <p className="mt-2 text-sm text-neutral-400">{formatPercent(current.value / root.value * 100)} від усього «{root.name}»</p>}
                <button type="button" onClick={() => setEditingId(current.id)} className="mt-4 rounded-xl border border-white/15 px-3 py-2 text-sm text-neutral-200 hover:bg-white/5">Редагувати {current.id === root.id ? "ціле" : "частину"}</button>
              </div>
              <div className="text-right">
                <p className="text-sm text-neutral-400">Розподілено</p>
                <p className="mt-1 text-2xl font-medium">{formatPercent(used / current.value * 100)}</p>
                <p className="mt-1 text-sm text-neutral-400">Вільно: {formatNumber(free)} {current.unit}</p>
              </div>
            </header>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
              <Treemap node={current} onOpen={openNode} />
              <aside className="space-y-6">
                <section className="rounded-[28px] border border-white/10 bg-neutral-900 p-5">
                  <h2 className="text-xl font-medium">Додати частину</h2>
                  <p className="mb-5 mt-2 text-sm text-neutral-400">Доступно {formatNumber(free)} {current.unit}</p>
                  {path.length >= 41 || countParts(root) >= 4999 ? <p className="text-sm text-amber-300">Досягнуто межі розміру розподілу. Відредагуй наявні частини.</p> :
                    <NodeForm key={current.id} unit={current.unit} available={free} submitLabel="Додати" onSubmit={(name, value) => {
                      if (units(value) > units(remaining(current))) return "Обсяг змінився. Перевір доступний залишок.";
                      const child: Node = { id: crypto.randomUUID(), name, value, unit: current.unit, children: [] };
                      const nextRoot = updateNodeById(root, current.id, (node) => ({ ...node, children: [...node.children, child] }));
                      workspace.change({ root: nextRoot, pathIds }, `Додано «${name}».`);
                    }} />}
                  <div className="mt-6 flex justify-between gap-4 border-t border-white/10 pt-5 text-sm">
                    <span className="text-neutral-400">Розподілено</span><span>{formatNumber(used)} {current.unit}</span>
                  </div>
                </section>

                <section className="rounded-[28px] border border-white/10 bg-neutral-900 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="text-xl font-medium">Структура</h2><span className="text-sm text-neutral-400">{current.children.length}</span>
                  </div>
                  {!current.children.length ? <p className="mt-6 text-sm leading-relaxed text-neutral-400">Додай першу частину. Її площа відповідатиме частці від поточних 100%.</p> :
                    <ul className="mt-5 space-y-3">
                      {current.children.map((child) => <li key={child.id} className="rounded-2xl border border-white/10 p-3">
                        <button type="button" onClick={() => openNode(child)} className="flex w-full items-center gap-3 rounded-lg text-left hover:brightness-125">
                          <span className="h-4 w-4 shrink-0 rounded-[5px]" style={{ backgroundColor: getNodeColor(child.id) }} aria-hidden="true" />
                          <span className="min-w-0 flex-1">
                            <span className="block break-words text-sm text-neutral-100">{child.name}</span>
                            <span className="mt-1 block text-xs text-neutral-400">{formatNumber(child.value)} {child.unit}{child.children.length ? ` · вкладених: ${child.children.length}` : ""}</span>
                          </span>
                          <span className="shrink-0 text-sm">{formatPercent(child.value / current.value * 100)} <span aria-hidden="true">↗</span></span>
                        </button>
                        <div className="mt-3 flex gap-2 border-t border-white/10 pt-2">
                          <button type="button" onClick={() => setEditingId(child.id)} aria-label={`Редагувати «${child.name}»`} className="rounded-lg px-2 py-2 text-xs text-neutral-300 hover:bg-white/5">Редагувати</button>
                          <button type="button" onClick={() => setDeletingId(child.id)} aria-label={`Видалити «${child.name}»`} className="rounded-lg px-2 py-2 text-xs text-rose-300 hover:bg-rose-400/10">Видалити</button>
                        </div>
                      </li>)}
                    </ul>}
                  {free > 0 && <div className="mt-5 flex justify-between gap-3 border-t border-white/10 pt-4 text-sm text-neutral-400"><span>Вільно</span><span>{formatPercent(free / current.value * 100)}</span></div>}
                </section>
              </aside>
            </div>
          </>
        ) : <p role="alert">Не вдалося відкрити частину. <button type="button" onClick={() => workspace.navigate([root.id])} className="underline">Повернутися до цілого</button></p>}

        {editing && root && <Modal key={editing.id} title={editing.id === root.id ? "Редагувати ціле" : "Редагувати частину"} onClose={() => setEditingId(null)}>
          <p className="mb-5 text-sm leading-relaxed text-neutral-400">Зміни назву або значення. Вкладені частини залишаться.{availableForEdit !== undefined ? ` Доступно до ${formatNumber(availableForEdit)} ${editing.unit}.` : ""}</p>
          <NodeForm key={`${editing.id}-${editing.name}-${editing.value}`} initialName={editing.name} initialValue={editing.value} unit={editing.unit} minimum={sumValues(editing.children)} available={availableForEdit} submitLabel="Зберегти зміни" onCancel={() => setEditingId(null)} onSubmit={(name, value) => {
            try {
              const nextRoot = editPart(root, editing.id, name, value);
              workspace.change({ root: nextRoot, pathIds }, `Зміни до «${name}» збережено.`);
              setEditingId(null);
            } catch (error) { return error instanceof Error ? error.message : "Не вдалося зберегти зміни."; }
          }} />
        </Modal>}

        {deleting && root && <Modal title={`Видалити «${deleting.name}»?`} onClose={() => setDeletingId(null)}>
          <p className="leading-relaxed text-neutral-300">Буде звільнено {formatNumber(deleting.value)} {deleting.unit}.
            {countParts(deleting) > 0 && ` Також буде видалено вкладені частини: ${countParts(deleting)}.`} Дію можна скасувати кнопкою «Скасувати» у верхній панелі.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" autoFocus onClick={() => setDeletingId(null)} className="rounded-2xl border border-white/15 px-4 py-3 text-sm hover:bg-white/5">Залишити</button>
            <button type="button" onClick={() => {
              workspace.change({ root: deletePart(root, deleting.id), pathIds }, `«${deleting.name}» видалено. Можна скасувати дію.`);
              setDeletingId(null);
            }} className="rounded-2xl bg-rose-500 px-4 py-3 text-sm font-medium text-white hover:bg-rose-400">Видалити</button>
          </div>
        </Modal>}
      </div>
    </main>
  );
}
