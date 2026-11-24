import NodeMetadata from "./NodeMetadata";

import { usePreferences } from "../lib/use-preferences";
import type { Node } from "../types/node";
import Icon from "./Icon";
import Modal from "./Modal";

type Props = { path: Node[]; onNavigate: (pathIds: string[]) => void; showingPath: boolean; onShowPath: (show: boolean) => void };

export default function LevelNavigation({ path, onNavigate, showingPath, onShowPath }: Props) {
  const { t } = usePreferences();
  const current = path.at(-1);
  if (!current) return null;
  const parent = path.at(-2);
  function goTo(ids: string[]) {
    onShowPath(false);
    onNavigate(ids);
  }
  return <>
    <nav className="level-navigation" aria-label={t("Навігація між рівнями")}>
      {parent ? <button type="button" className="parent-link" onClick={() => goTo(path.slice(0, -1).map((node) => node.id))} aria-label={t("До батьківського рівня «{p0}»", {p0: parent.name})}>
        <Icon name="back" /><span><span className="parent-link-caption">{t("На рівень вище")}</span><span className="parent-link-name">{parent.name}</span></span>
      </button> : <span className="level-root"><Icon name="resource" /><span>{t("Усе ціле")}</span></span>}
      <button type="button" data-levels-trigger className="level-path-button" onClick={() => onShowPath(!showingPath)} aria-label={t("Відкрити навігацію по рівнях")} aria-expanded={showingPath} aria-haspopup="dialog"><Icon name="layers" /><span>{t("Рівні")}{path.length > 1 ? ` · ${path.length}` : ""}</span></button>
    </nav>
    {showingPath && <Modal title={t("Рівні цілого")} onClose={() => onShowPath(false)} variant="sheet" nonModal>
      <p className="mb-4 text-sm text-neutral-400">{t("Обери рівень або іншу частину поруч.")}</p>
      <nav aria-label={t("Шлях до поточної частини")}>
        <ol className="level-path-list">{path.map((node, index) => <li key={node.id}>
          <button type="button" aria-current={index === path.length - 1 ? "page" : undefined} onClick={() => goTo(path.slice(0, index + 1).map((item) => item.id))}>
            <span className="level-index">{index === 0 ? <Icon name="resource" width="17" height="17" /> : index + 1}</span>
            <span className="level-option-copy"><span>{node.name}</span><span>{index === 0 ? t("Усе ціле") : index === path.length - 1 ? t("Ти тут") : t("Батьківський рівень")}</span></span>
            {index === path.length - 1 ? <span className="level-current-dot" aria-hidden="true" /> : <Icon name="chevron" width="16" height="16" />}
          </button>
        </li>)}</ol>
      </nav>
      {parent && parent.children.length > 1 && <section className="level-neighbors" aria-labelledby="neighbors-heading">
        <h3 id="neighbors-heading">{t("Інші частини «{name}»", { name: parent.name })}</h3>
        {parent.children.filter((node) => node.id !== current.id).map((node) => <button type="button" key={node.id} onClick={() => goTo([...path.slice(0, -1).map((item) => item.id), node.id])}>
          <span className="level-option-copy"><span>{node.name}</span><span><NodeMetadata node={node} /></span></span><Icon name="chevron" width="16" height="16" />
        </button>)}
      </section>}
    </Modal>}
  </>;
}
