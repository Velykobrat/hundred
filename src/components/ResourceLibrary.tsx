import { isMeasuredNode } from "../lib/node-mode";
import { countLevels } from "../lib/tree";
import NodeMetadata from "./NodeMetadata";

import { usePreferences } from "../lib/use-preferences";
import type { Collection } from "../lib/collection";
import { MAX_DOCUMENTS } from "../lib/collection";
import { remaining } from "../lib/document";
import { getNodeColor } from "../lib/format";
import Icon from "./Icon";

function levelLabel(count: number, language: "uk" | "en") {
  if (language === "en") return count === 1 ? "level" : "levels";
  if (count % 100 >= 11 && count % 100 <= 14) return "рівнів";
  if (count % 10 === 1) return "рівень";
  return count % 10 >= 2 && count % 10 <= 4 ? "рівні" : "рівнів";
}

export default function ResourceLibrary({ collection, onOpen, onCreate, onImport }: { collection: Collection; onOpen: (id: string) => void; onCreate: () => void; onImport: () => void }) {
  const { t, formatPercent, language } = usePreferences();
  const full = collection.documents.length >= MAX_DOCUMENTS;
  return <section className="resource-library" aria-labelledby="library-heading">
    <header className="library-header">
      <div><h1 id="library-heading" className="library-description">{t("Твої збережені цілі. Обери ціле або створи нове.")}</h1></div>
      <button type="button" className="primary-button" onClick={onCreate} disabled={full}><Icon name="plus" /><span>{t("Нове ціле")}</span></button>
    </header>
    {collection.documents.length ? <>
      <div className="resource-library-grid">
        {collection.documents.map(({ root, pathIds }) => {
          if (!root) return null;
          const usedPercent = isMeasuredNode(root) ? (root.value - remaining(root)) / root.value * 100 : 0;
          const levels = countLevels(root);
          return <button type="button" key={root.id} className="resource-card surface" onClick={() => onOpen(root.id)} aria-label={t("Відкрити ціле «{p0}»", {p0: root.name})}>
            <span className="resource-card-top"><span className="resource-card-icon" style={{ color: getNodeColor(root.id) }}><Icon name="resource" width="25" height="25" /></span><Icon name="chevron" /></span>
            <span className="resource-card-name">{root.name}</span>
            <span className="resource-card-value"><NodeMetadata node={root} /></span>
            {isMeasuredNode(root) && <span className="usage-track" aria-hidden="true"><span style={{ width: `${usedPercent}%` }} /></span>}
            <span className="resource-card-footer"><span className="resource-card-stats"><span>{root.children.length} {t("частин ·")} {isMeasuredNode(root) && <>{formatPercent(usedPercent)} {t("розподілено")}</>}</span><span>{levels} {levelLabel(levels, language)}</span></span><span>{pathIds.length > 1 ? t("Продовжити") : t("Відкрити")}</span></span>
          </button>;
        })}
      </div>
      {full && <p className="parts-note">{t("Збережено всі")}{" "}{MAX_DOCUMENTS} {" "}{t("цілих. Щоб додати нове, видали одне з наявних.")}</p>}
    </> : <div className="library-empty surface">
      <div className="welcome-map" aria-hidden="true"><span>{t("Ціле")}</span><span>{t("Частина")}</span><span>{t("Вільно")}</span></div>
      <h2>{t("Побач ціле.")}<br />{t("Знайди місце кожній частині.")}</h2>
      <p>{t("Почни зі структури, списку, бюджету, часу або простору. Кожну частину можна відкрити як нове ціле.")}</p>
      <button type="button" className="primary-button" onClick={onCreate}><Icon name="plus" />{t("Створити перше ціле")}</button>
      <button type="button" className="text-button" onClick={onImport}>{t("Маю резервну копію")}</button>
    </div>}
  </section>;
}
