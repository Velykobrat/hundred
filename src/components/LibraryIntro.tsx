import { usePreferences } from "../lib/use-preferences";
import "./LibraryIntro.css";

export default function LibraryIntro() {
  const { t } = usePreferences();
  return <div className="library-hero">
    <h1 className="library-hero-statement"><strong>{t("Розклади")} <span>{t("ціле")}</span> {t("на")} <span>{t("частини.")}</span><span className="library-hero-tail">{t("Кожну частину можна відкрити як нове ціле.")}</span></strong></h1>
  </div>;
}
