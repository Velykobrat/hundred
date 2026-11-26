
import { usePreferences } from "../lib/use-preferences";
import { MAX_DOCUMENTS } from "../lib/collection";
import Icon from "./Icon";
import BeginnerGuide from "./BeginnerGuide";
import { version } from "../../package.json";

type Props = { count: number; storageError: string | null; canExport: boolean; onExport: () => void; onImport: () => void };

export default function SettingsPanel({ count, storageError, canExport, onExport, onImport }: Props) {
  const { t, language, theme, setLanguage, setTheme, preferenceError } = usePreferences();
  return <section className="settings-panel" aria-labelledby="settings-heading">
    <header className="screen-heading"><h1 id="settings-heading">{t("Налаштування")}</h1></header>
    <BeginnerGuide />
    <section className="surface settings-section" aria-labelledby="appearance-heading">
      <div className="settings-section-heading"><Icon name="settings" /><h2 id="appearance-heading">{t("Інтерфейс")}</h2></div>
      <div className="preference-segments" role="group" aria-label={t("Мова інтерфейсу")} aria-describedby="language-hint">
        <button type="button" lang="uk" data-language-option="uk" aria-pressed={language === "uk"} onClick={() => setLanguage("uk")}>УКР</button>
        <button type="button" lang="en" data-language-option="en" aria-pressed={language === "en"} onClick={() => setLanguage("en")}>ENG</button>
      </div>
      <p id="language-hint" className="preference-hint">{t("Назви твоїх цілих і одиниці виміру залишаться такими, як ти їх ввів.")}</p>
      <div className="preference-segments theme-segments" role="group" aria-label={t("Тема")} aria-describedby="theme-hint">
        <button type="button" data-theme-option="light" aria-pressed={theme === "light"} onClick={() => setTheme("light")}><Icon name="sun" />{t("Світла")}</button>
        <button type="button" data-theme-option="dark" aria-pressed={theme === "dark"} onClick={() => setTheme("dark")}><Icon name="moon" />{t("Темна")}</button>
        <button type="button" data-theme-option="system" aria-pressed={theme === "system"} onClick={() => setTheme("system")}><Icon name="monitor" />{t("Авто")}</button>
      </div>
      <p id="theme-hint" className="preference-hint">{t("Авто використовує тему пристрою.")}</p>
      {preferenceError && <p role="alert" className="text-sm text-amber-300">{preferenceError}</p>}
    </section>
    <section className="surface settings-section" aria-labelledby="storage-heading">
      <div className="settings-section-heading"><Icon name="resource" /><h2 id="storage-heading">{t("Дані на цьому пристрої")}</h2></div>
      <p>{t("Цілі зберігаються автоматично в цьому браузері. Синхронізації між пристроями поки немає.")}</p>
      <div className="settings-fact"><span>{t("Збережено цілих")}</span><span>{count} {" "}{t("із")}{" "}{MAX_DOCUMENTS}</span></div>
      <div className="settings-fact"><span>{t("Автозбереження")}</span><span className={storageError ? "text-amber-300" : "text-indigo-200"}>{storageError ? t("Потребує уваги") : t("Увімкнено")}</span></div>
    </section>
    <section className="surface settings-section" aria-labelledby="backup-heading">
      <div className="settings-section-heading"><Icon name="download" /><h2 id="backup-heading">{t("Резервні копії")}</h2></div>
      <p>{t("Завантаж копію перед очищенням браузера або для перенесення на інший пристрій.")}</p>
      <div className="settings-actions">
        <button type="button" disabled={!canExport} onClick={onExport}><Icon name="download" /><span><span>{t("Завантажити резервну копію")}</span><span>{t("Усі цілі в одному JSON-файлі")}</span></span><Icon name="chevron" width="16" height="16" /></button>
        <button type="button" onClick={onImport}><Icon name="upload" /><span><span>{t("Імпортувати файл")}</span><span>{t("Додати цілі з резервної копії")}</span></span><Icon name="chevron" width="16" height="16" /></button>
      </div>
    </section>
    <footer className="settings-signature">
      <span className="settings-signature-attribution"><span className="settings-signature-copyright">© 2026</span>
      <span className="maker">by <a href="https://bebetter-development.vercel.app/" target="_blank" rel="noopener noreferrer" aria-label={t("Відкрити сайт BeBetter")}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/bebetter-text.svg" width="62" height="18" alt="" />
      </a>
      </span></span><strong>Hundred · v{version}</strong>
    </footer>
  </section>;
}
