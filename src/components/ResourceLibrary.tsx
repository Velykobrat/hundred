
import { usePreferences } from "../lib/use-preferences";
import type { Collection } from "../lib/collection";
import { MAX_DOCUMENTS } from "../lib/collection";
import { remaining } from "../lib/document";
import { getNodeColor } from "../lib/format";
import Icon from "./Icon";

export default function ResourceLibrary({ collection, onOpen, onCreate, onImport }: { collection: Collection; onOpen: (id: string) => void; onCreate: () => void; onImport: () => void }) {
  const { t, formatNumber, formatPercent } = usePreferences();
  const full = collection.documents.length >= MAX_DOCUMENTS;
  return <section className="resource-library" aria-labelledby="library-heading">
    <header className="library-header">
      <div><p className="eyebrow">{t("Твій простір")}</p><h1 id="library-heading">{t("Мої ресурси")}</h1><p>{t("Усе, що має межі. Кожному ресурсу — свій розподіл.")}</p></div>
      <button type="button" className="primary-button" onClick={onCreate} disabled={full}><Icon name="plus" /><span>{t("Новий ресурс")}</span></button>
    </header>
    {collection.documents.length ? <>
      <div className="resource-library-grid">
        {collection.documents.map(({ root, pathIds }) => {
          if (!root) return null;
          const usedPercent = (root.value - remaining(root)) / root.value * 100;
          return <button type="button" key={root.id} className="resource-card surface" onClick={() => onOpen(root.id)} aria-label={t("Відкрити ресурс «{p0}»", {p0: root.name})}>
            <span className="resource-card-top"><span className="resource-card-icon" style={{ color: getNodeColor(root.id) }}><Icon name="resource" width="25" height="25" /></span><Icon name="chevron" /></span>
            <span className="resource-card-name">{root.name}</span>
            <span className="resource-card-value">{formatNumber(root.value)} {root.unit}</span>
            <span className="usage-track" aria-hidden="true"><span style={{ width: `${usedPercent}%` }} /></span>
            <span className="resource-card-footer"><span>{root.children.length} {" "}{t("частин ·")}{" "}{formatPercent(usedPercent)} {" "}{t("розподілено")}</span><span>{pathIds.length > 1 ? t("Продовжити") : t("Відкрити")}</span></span>
          </button>;
        })}
      </div>
      {full && <p className="parts-note">{t("Збережено всі")}{" "}{MAX_DOCUMENTS} {" "}{t("ресурсів. Щоб додати новий, видали один із наявних.")}</p>}
    </> : <div className="library-empty surface">
      <div className="welcome-map" aria-hidden="true"><span>{t("Ціле")}</span><span>{t("Частина")}</span><span>{t("Вільно")}</span></div>
      <h2>{t("Побач ціле.")}<br />{t("Знайди місце кожній частині.")}</h2>
      <p>{t("Почни з бюджету, часу або простору. Вкажи обсяг і розділи його на частини — Hundred покаже, що залишається.")}</p>
      <button type="button" className="primary-button" onClick={onCreate}><Icon name="plus" />{t("Створити перший ресурс")}</button>
      <button type="button" className="text-button" onClick={onImport}>{t("Маю резервну копію")}</button>
    </div>}
  </section>;
}
