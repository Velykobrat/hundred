import { usePreferences } from "../lib/use-preferences";
import "./LibraryIntro.css";

export default function LibraryIntro() {
  const { t } = usePreferences();
  return <div className="library-hero">
    <h1 className="library-hero-statement"><strong>{t("Система опису")} <span>{t("Цілого")}</span> {t("через")} <span>{t("Частини")}</span>,<span className="library-hero-tail">{t("де кожна Частина може стати новим Цілим.")}</span></strong></h1>
  </div>;
}
