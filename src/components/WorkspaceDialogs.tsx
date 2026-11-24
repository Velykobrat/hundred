import type { Node } from "../types/node";
import type { NodeColor } from "../lib/node-color";
import type { NodeIcon } from "../lib/node-icon";
import type { Collection } from "../lib/collection";
import { MAX_DOCUMENTS } from "../lib/collection";
import { sumValues } from "../lib/document";
import { countDescendants as countParts } from "../lib/tree";
import { isMeasuredNode } from "../lib/node-mode";
import { usePreferences } from "../lib/use-preferences";
import Icon from "./Icon";
import Modal from "./Modal";
import NodeMetadata from "./NodeMetadata";
import NodeForm from "./NodeForm";
import ImportBackup from "./ImportBackup";

type Submit = (name: string, value: number | undefined, unit: string, color?: NodeColor, icon?: NodeIcon) => string | void;
type Props = {
  nodes: {
    root: Node | null; current: Node | null; actionNode: Node | null; actionParent: Node | null; actionIndex: number;
    editing: Node | null; parent: Node | null; availableForEdit: number | undefined;
    deleting: Node | null; deletingParent: Node | null; free: number; atLimit: boolean; count: number;
  };
  visibility: {
    deletingWhole: boolean; adding: boolean; importing: boolean;
    onActionsId: (id: string | null) => void; onEditingId: (id: string | null) => void;
    onDeletingId: (id: string | null) => void; onDeletingWhole: (show: boolean) => void;
    onAdding: (show: boolean) => void; onImporting: (show: boolean) => void;
  };
  actions: {
    onOpenAction: () => void; onMove: (direction: "up" | "down") => void; onDuplicate: () => void;
    onAddPart: Submit; onEditNode: Submit; onDeleteWhole: () => void; onDeletePart: () => void;
    onImport: (collection: Collection) => string | void;
  };
};
export default function WorkspaceDialogs({ nodes, visibility, actions }: Props) {
  const { root, current, actionNode, actionParent, actionIndex, editing, parent, availableForEdit, deleting, deletingParent, free, atLimit, count } = nodes;
  const { deletingWhole, adding, importing, onActionsId, onEditingId, onDeletingId, onDeletingWhole, onAdding, onImporting } = visibility;
  const { onOpenAction, onMove, onDuplicate, onAddPart, onEditNode, onDeleteWhole, onDeletePart, onImport } = actions;
  const { t, formatNumber } = usePreferences();
  return <>
        {actionNode && root && <Modal title={actionNode.name} onClose={() => onActionsId(null)} variant="sheet" nonModal>
          <p className="mb-5 text-sm text-neutral-400"><NodeMetadata node={actionNode} />{isMeasuredNode(actionNode) && actionNode.children.length ? t(" · частин: {p0}", {p0: actionNode.children.length}) : ""}</p>
          <div className="action-sheet-list">
            {actionNode.id !== current?.id && <button type="button" onClick={onOpenAction}><Icon name="resource" /><span>{t("Відкрити частину")}</span><Icon name="chevron" width="16" height="16" /></button>}
            <button type="button" onClick={() => { onActionsId(null); onEditingId(actionNode.id); }}><Icon name="edit" /><span>{actionNode.id === root.id ? t("Редагувати ціле") : t("Редагувати частину")}</span></button>
            {actionParent && <>
              <button type="button" disabled={actionIndex <= 0} onClick={() => { onMove("up"); onActionsId(null); }}><Icon name="back" style={{ transform: "rotate(90deg)" }} /><span>{t("Перемістити вище")}</span></button>
              <button type="button" disabled={actionIndex >= actionParent.children.length - 1} onClick={() => { onMove("down"); onActionsId(null); }}><Icon name="back" style={{ transform: "rotate(-90deg)" }} /><span>{t("Перемістити нижче")}</span></button>
            </>}
            {actionNode.id === root.id && <button type="button" disabled={count >= MAX_DOCUMENTS} onClick={onDuplicate}><Icon name="copy" /><span>{t("Створити копію цілого")}</span></button>}
            <button type="button" className="action-danger" onClick={() => { onActionsId(null); if (actionNode.id === root.id) onDeletingWhole(true); else onDeletingId(actionNode.id); }}><Icon name="trash" /><span>{actionNode.id === root.id ? t("Видалити ціле") : t("Видалити частину")}</span></button>
          </div>
        </Modal>}

        {adding && current && root && <Modal title={t("Додати частину")} onClose={() => onAdding(false)}>
          {isMeasuredNode(current) && <p className="mb-5 text-sm text-neutral-400">{t("Доступно")}{" "}{formatNumber(free)} {current.unit}</p>}
          {atLimit ? <p className="text-sm text-amber-300">{t("Досягнуто межі розміру цілого. Відредагуй наявні частини.")}</p> :
            <NodeForm key={current.id} optionalQuantity={!isMeasuredNode(current)} unit={isMeasuredNode(current) ? current.unit : ""} available={isMeasuredNode(current) ? free : undefined} parentValue={isMeasuredNode(current) ? current.value : undefined} parentName={current.name} submitLabel={t("Додати частину")} onCancel={() => onAdding(false)} onSubmit={onAddPart} />}
        </Modal>}

        {editing && root && <Modal key={editing.id} title={editing.id === root.id ? t("Редагувати ціле") : t("Редагувати частину")} onClose={() => onEditingId(null)}>
          <p className="mb-5 text-sm leading-relaxed text-neutral-400">{isMeasuredNode(editing) ? t("Зміни назву або значення. Вкладені частини залишаться.") : t("Тип цілого після створення не змінюється.")}{availableForEdit !== undefined ? t(" Доступно до {p0} {p1}.", {p0: formatNumber(availableForEdit), p1: isMeasuredNode(editing) ? editing.unit : ""}) : ""}</p>
          <NodeForm key={editing.id} initialName={editing.name} initialColor={editing.color} initialIcon={editing.icon} structuralEdit={!isMeasuredNode(editing)} initialValue={isMeasuredNode(editing) ? editing.value : undefined} unit={isMeasuredNode(editing) ? editing.unit : ""} minimum={sumValues(editing.children)} available={availableForEdit} parentValue={parent && isMeasuredNode(parent) ? parent.value : undefined} parentName={parent?.name} submitLabel={t("Зберегти зміни")} onCancel={() => onEditingId(null)} onSubmit={onEditNode} />
        </Modal>}

        {deletingWhole && root && <Modal title={t("Видалити ціле «{p0}»?", {p0: root.name})} onClose={() => onDeletingWhole(false)}>
          <p className="text-sm leading-relaxed text-neutral-300">{t("Буде видалено усе ціле разом із частинами. Інші цілі залишаться. Дію можна скасувати у верхній панелі вкладки «Ціле».")}</p>
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" autoFocus data-dialog-initial-focus onClick={() => onDeletingWhole(false)} className="rounded-2xl border border-white/15 px-4 py-3 text-sm">{t("Залишити")}</button>
            <button type="button" onClick={onDeleteWhole} className="rounded-2xl bg-rose-500 px-4 py-3 text-sm font-medium">{t("Видалити ціле")}</button>
          </div>
        </Modal>}

        {importing && <ImportBackup currentCount={count} onImport={onImport} onClose={() => onImporting(false)} />}

        {deleting && root && <Modal title={t("Видалити «{p0}»?", {p0: deleting.name})} onClose={() => onDeletingId(null)}>
          <p className="leading-relaxed text-neutral-300">{isMeasuredNode(deleting) && deletingParent && isMeasuredNode(deletingParent) && <>{t("Буде звільнено")}{" "}{formatNumber(deleting.value)} {deleting.unit}.</>}
            {countParts(deleting) > 0 && t(" Також буде видалено вкладені частини: {p0}.", {p0: countParts(deleting)})} {" "}{t("Дію можна скасувати кнопкою «Скасувати» у верхній панелі.")}{" "}</p>
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" autoFocus data-dialog-initial-focus onClick={() => onDeletingId(null)} className="rounded-2xl border border-white/15 px-4 py-3 text-sm">{t("Залишити")}</button>
            <button type="button" onClick={onDeletePart} className="rounded-2xl bg-rose-500 px-4 py-3 text-sm font-medium">{t("Видалити")}</button>
          </div>
        </Modal>}
  </>;
}
