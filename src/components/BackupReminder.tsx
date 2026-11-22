import { usePreferences } from "../lib/use-preferences";

export default function BackupReminder({ onDownload, onLater }: { onDownload: () => void; onLater: () => void }) {
  const { t } = usePreferences();
  return <section className="backup-reminder surface" aria-label={t("Нагадування про резервну копію")}>
    <p>{t("Дані Hundred зберігаються лише в цьому браузері. Створи резервну копію, щоб зберегти свої цілі.")}</p>
    <div className="backup-reminder-actions">
      <button type="button" className="primary-button" onClick={onDownload}>{t("Завантажити копію")}</button>
      <button type="button" className="text-button" onClick={onLater}>{t("Нагадати пізніше")}</button>
    </div>
  </section>;
}
