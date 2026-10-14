import { MAX_DOCUMENTS } from "../lib/collection";
import Icon from "./Icon";

type Props = { count: number; storageError: string | null; canExport: boolean; onExport: () => void; onImport: () => void };

export default function SettingsPanel({ count, storageError, canExport, onExport, onImport }: Props) {
  return <section className="settings-panel" aria-labelledby="settings-heading">
    <header className="screen-heading"><p className="eyebrow">Твій Hundred</p><h1 id="settings-heading">Налаштування</h1><p>Збереження та перенесення твоїх ресурсів.</p></header>
    <section className="surface settings-section" aria-labelledby="storage-heading">
      <div className="settings-section-heading"><Icon name="resource" /><h2 id="storage-heading">Дані на цьому пристрої</h2></div>
      <p>Ресурси зберігаються автоматично в цьому браузері. Синхронізації між пристроями поки немає.</p>
      <div className="settings-fact"><span>Збережено ресурсів</span><span>{count} із {MAX_DOCUMENTS}</span></div>
      <div className="settings-fact"><span>Автозбереження</span><span className={storageError ? "text-amber-300" : "text-indigo-200"}>{storageError ? "Потребує уваги" : "Увімкнено"}</span></div>
    </section>
    <section className="surface settings-section" aria-labelledby="backup-heading">
      <div className="settings-section-heading"><Icon name="download" /><h2 id="backup-heading">Резервні копії</h2></div>
      <p>Завантаж копію перед очищенням браузера або для перенесення на інший пристрій.</p>
      <div className="settings-actions">
        <button type="button" disabled={!canExport} onClick={onExport}><Icon name="download" /><span><span>Завантажити резервну копію</span><span>Усі ресурси в одному JSON-файлі</span></span><Icon name="chevron" width="16" height="16" /></button>
        <button type="button" onClick={onImport}><Icon name="upload" /><span><span>Імпортувати файл</span><span>Додати ресурси з резервної копії</span></span><Icon name="chevron" width="16" height="16" /></button>
      </div>
    </section>
    <p className="settings-footnote">Очищення даних сайту видалить локальні ресурси. Імпорт додає копії та зберігає наявні розподіли.</p>
  </section>;
}
