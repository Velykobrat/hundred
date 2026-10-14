
import { usePreferences } from "../lib/use-preferences";
import { MAX_DOCUMENTS } from "../lib/collection";
import Icon from "./Icon";

type Props = { count: number; storageError: string | null; canExport: boolean; onExport: () => void; onImport: () => void };

export default function SettingsPanel({ count, storageError, canExport, onExport, onImport }: Props) {
  const { t, language, theme, setLanguage, setTheme, preferenceError } = usePreferences();
  return <section className="settings-panel" aria-labelledby="settings-heading">
    <header className="screen-heading"><p className="eyebrow">{t("Твій Hundred")}</p><h1 id="settings-heading">{t("Налаштування")}</h1><p>{t("Збереження та перенесення твоїх ресурсів.")}</p></header>
    <section className="surface settings-section" aria-labelledby="appearance-heading">
      <div className="settings-section-heading"><Icon name="settings" /><h2 id="appearance-heading">{t("Вигляд")}</h2></div>
      <label htmlFor="hundred-language" className="preference-label">{t("Мова інтерфейсу")}</label>
      <select id="hundred-language" value={language} onChange={(event) => setLanguage(event.target.value === "en" ? "en" : "uk")} className="preference-select" aria-describedby="language-hint">
        <option value="uk" lang="uk">Українська</option>
        <option value="en" lang="en">English</option>
      </select>
      <p id="language-hint" className="preference-hint">{t("Назви твоїх ресурсів і одиниці виміру залишаться такими, як ти їх ввів.")}</p>
      <label htmlFor="hundred-theme" className="preference-label">{t("Тема")}</label>
      <select id="hundred-theme" value={theme} onChange={(event) => setTheme(event.target.value === "light" ? "light" : event.target.value === "system" ? "system" : "dark")} className="preference-select" aria-describedby="theme-hint">
        <option value="dark">{t("Темна")}</option>
        <option value="light">{t("Світла")}</option>
        <option value="system">{t("Як у системі")}</option>
      </select>
      <p id="theme-hint" className="preference-hint">{t("Системна тема змінюється разом із налаштуваннями пристрою.")}</p>
      {preferenceError && <p role="alert" className="text-sm text-amber-300">{preferenceError}</p>}
    </section>
    <section className="surface settings-section" aria-labelledby="storage-heading">
      <div className="settings-section-heading"><Icon name="resource" /><h2 id="storage-heading">{t("Дані на цьому пристрої")}</h2></div>
      <p>{t("Ресурси зберігаються автоматично в цьому браузері. Синхронізації між пристроями поки немає.")}</p>
      <div className="settings-fact"><span>{t("Збережено ресурсів")}</span><span>{count} {" "}{t("із")}{" "}{MAX_DOCUMENTS}</span></div>
      <div className="settings-fact"><span>{t("Автозбереження")}</span><span className={storageError ? "text-amber-300" : "text-indigo-200"}>{storageError ? t("Потребує уваги") : t("Увімкнено")}</span></div>
    </section>
    <section className="surface settings-section" aria-labelledby="backup-heading">
      <div className="settings-section-heading"><Icon name="download" /><h2 id="backup-heading">{t("Резервні копії")}</h2></div>
      <p>{t("Завантаж копію перед очищенням браузера або для перенесення на інший пристрій.")}</p>
      <div className="settings-actions">
        <button type="button" disabled={!canExport} onClick={onExport}><Icon name="download" /><span><span>{t("Завантажити резервну копію")}</span><span>{t("Усі ресурси в одному JSON-файлі")}</span></span><Icon name="chevron" width="16" height="16" /></button>
        <button type="button" onClick={onImport}><Icon name="upload" /><span><span>{t("Імпортувати файл")}</span><span>{t("Додати ресурси з резервної копії")}</span></span><Icon name="chevron" width="16" height="16" /></button>
      </div>
    </section>
    <p className="settings-footnote">{t("Очищення даних сайту видалить локальні ресурси. Імпорт додає копії та зберігає наявні розподіли.")}</p>
  </section>;
}
