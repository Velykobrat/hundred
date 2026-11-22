import { useDeferredValue, useId, useMemo, useRef } from "react";
import type { Collection } from "../lib/collection";
import { searchCollection, SEARCH_LIMIT } from "../lib/search";
import { getNodeColor } from "../lib/node-color";
import { getNodeIcon } from "../lib/node-icon";
import { usePreferences } from "../lib/use-preferences";
import Icon from "./Icon";
import NodeMetadata from "./NodeMetadata";
import "./WholeSearch.css";

export default function WholeSearch({ collection, query, onQueryChange, onOpen, onCreate, full }: {
  collection: Collection; query: string; onQueryChange: (query: string) => void;
  onOpen: (rootId: string, pathIds: string[]) => void;
  onCreate: () => void; full: boolean;
}) {
  const { t } = usePreferences();
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const deferredQuery = useDeferredValue(query);
  const results = useMemo(() => searchCollection(collection, deferredQuery), [collection, deferredQuery]);
  const searching = query.trim().length > 0;
  function clear() { onQueryChange(""); input.current?.focus(); }
  return <section className="whole-search" aria-label={t("Пошук по всіх цілих і частинах")}>
    <label className="whole-search-label" htmlFor={id}>{t("Пошук по всіх цілих і частинах")}</label>
    <div className="whole-search-controls">
    <div className="whole-search-field">
      <Icon name="search" />
      <input ref={input} id={id} type="search" value={query} onChange={event => onQueryChange(event.target.value)} onKeyDown={event => { if (event.key === "Escape") clear(); }} placeholder={t("Знайти ціле або частину…")} autoComplete="off" aria-controls={id + "-results"} />
      {query && <button type="button" onClick={clear} aria-label={t("Очистити пошук")}>×</button>}
    </div>
    <button type="button" className="primary-button whole-search-create" onClick={onCreate} disabled={full}><Icon name="plus" /><span>{t("Нове ціле")}</span></button>
    </div>
    <div id={id + "-results"} aria-busy={query !== deferredQuery}>
      {searching && <>
        <p className="whole-search-status" role="status">{results.total ? t("Знайдено: {count}", { count: results.total }) : t("Нічого не знайдено. Спробуй іншу назву.")}</p>
        {results.total > SEARCH_LIMIT && <p className="whole-search-status">{t("Показано перші {count}. Уточни запит.", { count: SEARCH_LIMIT })}</p>}
        <ul className="whole-search-results">{results.matches.map(match => <li key={match.rootId + ":" + match.node.id}>
          <button type="button" onClick={() => onOpen(match.rootId, match.pathIds)}>
            <span className="whole-search-icon" style={{ color: getNodeColor(match.node) }}><Icon name={getNodeIcon(match.node)} width="23" height="23" /></span>
            <span className="whole-search-copy">
              <strong>{match.node.name}</strong>
              <span className="whole-search-path">{match.pathNames.length > 1 ? match.pathNames.slice(0, -1).join(" › ") : t("Ціле")}</span>
              <span className="whole-search-meta"><NodeMetadata node={match.node} /></span>
            </span>
            <Icon name="chevron" width="16" height="16" />
          </button>
        </li>)}</ul>
      </>}
    </div>
  </section>;
}
