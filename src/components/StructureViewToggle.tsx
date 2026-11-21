import { usePreferences } from "../lib/use-preferences";
import Icon from "./Icon";
import "./StructureViewToggle.css";

export default function StructureViewToggle() {
  const { t, structureView, setStructureView } = usePreferences();
  return <div className="structure-view-toggle" role="group" aria-label={t("Вигляд структури")}>
    <button type="button" aria-pressed={structureView === "cards"} onClick={() => setStructureView("cards")}>
      <Icon name="resource" width="17" height="17" /><span>{t("Картки")}</span>
    </button>
    <button type="button" aria-pressed={structureView === "list"} onClick={() => setStructureView("list")}>
      <Icon name="list" width="17" height="17" /><span>{t("Список")}</span>
    </button>
  </div>;
}
