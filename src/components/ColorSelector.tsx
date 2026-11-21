import { NODE_COLORS, type NodeColor } from "../lib/node-color";
import { usePreferences } from "../lib/use-preferences";
import { useId } from "react";

export default function ColorSelector({ value, onChange }: { value?: NodeColor; onChange: (color?: NodeColor) => void }) {
  const { t } = usePreferences();
  const group = useId();
  return <fieldset className="color-selector">
    <legend>{t("Колір")}</legend>
    <div className="color-options">
      <label className="color-auto">
        <input type="radio" name={group} checked={value === undefined} onChange={() => onChange(undefined)} />
        <span>{t("Автоматичний")}</span>
      </label>
      {NODE_COLORS.map(color => <label key={color.value} className="color-option" title={t(color.label)}>
        <input type="radio" name={group} value={color.value} checked={value === color.value} onChange={() => onChange(color.value)} aria-label={t(color.label)} />
        <span className="color-swatch" style={{ backgroundColor: color.value }} aria-hidden="true">{value === color.value ? "✓" : ""}</span>
      </label>)}
    </div>
  </fieldset>;
}
