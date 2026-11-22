import { getNodeIcon } from "../lib/node-icon";
import { isMeasuredNode } from "../lib/node-mode";
import { countLevels } from "../lib/tree";
import NodeMetadata from "./NodeMetadata";

import { usePreferences } from "../lib/use-preferences";
import type { Collection } from "../lib/collection";
import { MAX_DOCUMENTS } from "../lib/collection";
import { remaining } from "../lib/document";
import { getNodeColor } from "../lib/format";
import Icon from "./Icon";
import { useState } from "react";
import LibraryIntro from "./LibraryIntro";
import WholeSearch from "./WholeSearch";

function levelLabel(count: number, language: "uk" | "en") {
  if (language === "en") return count === 1 ? "level" : "levels";
  if (count % 100 >= 11 && count % 100 <= 14) return "рівнів";
  if (count % 10 === 1) return "рівень";
  return count % 10 >= 2 && count % 10 <= 4 ? "рівні" : "рівнів";
}

export default function ResourceLibrary({ collection, onOpen, onOpenResult, onCreate, onImport }: { collection: Collection; onOpen: (id: string) => void; onOpenResult: (rootId: string, pathIds: string[]) => void; onCreate: () => void; onImport: () => void }) {
  const { t, formatPercent, language } = usePreferences();
  const full = collection.documents.length >= MAX_DOCUMENTS;
  const [query, setQuery] = useState("");
  return <section className="resource-library" aria-label={t("Твої збережені цілі. Обери ціле або створи нове.")}>
    <LibraryIntro />
    {collection.documents.length > 0 && <WholeSearch collection={collection} query={query} onQueryChange={setQuery} onOpen={onOpenResult} onCreate={onCreate} full={full} />}
    {collection.documents.length ? <>
      {!query.trim() && <div className="resource-library-grid">
        {collection.documents.map(({ root, pathIds }) => {
          if (!root) return null;
          const usedPercent = isMeasuredNode(root) ? (root.value - remaining(root)) / root.value * 100 : 0;
          const levels = countLevels(root);
          return <button type="button" key={root.id} className="resource-card surface" onClick={() => onOpen(root.id)} aria-label={t("Відкрити ціле «{p0}»", {p0: root.name})}>
            <span className="resource-card-top"><span className="resource-card-icon" style={{ color: getNodeColor(root) }}><Icon name={getNodeIcon(root)} width="25" height="25" /></span><Icon name="chevron" /></span>
            <span className="resource-card-name">{root.name}</span>
            <span className="resource-card-value"><NodeMetadata node={root} /></span>
            {isMeasuredNode(root) && <span className="usage-track" aria-hidden="true"><span style={{ width: `${usedPercent}%`, backgroundColor: getNodeColor(root) }} /></span>}
            {(isMeasuredNode(root) || pathIds.length > 1) && <span className="resource-card-footer">{isMeasuredNode(root) && <span className="resource-card-stats"><span>{root.children.length} {t("частин ·")} {formatPercent(usedPercent)} {t("розподілено")}</span><span>{levels} {levelLabel(levels, language)}</span></span>}{pathIds.length > 1 && <span className="resource-card-continue">{t("Продовжити")}</span>}</span>}
          </button>;
        })}
      </div>}
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
