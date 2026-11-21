import { useId, type CSSProperties } from "react";
import { NODE_ICONS, type NodeIcon } from "../lib/node-icon";
import type { NodeColor } from "../lib/node-color";
import { usePreferences } from "../lib/use-preferences";
import Icon from "./Icon";
import "./IconSelector.css";

export default function IconSelector({ value, color, onChange }: { value?: NodeIcon; color?: NodeColor; onChange: (icon?: NodeIcon) => void }) {
  const { t } = usePreferences();
  const group = useId();
  const options = [{ value: undefined, label: "Стандартний" }, ...NODE_ICONS];
  return <fieldset className="node-icon-picker" style={{ "--icon-color": color ?? "var(--accent)" } as CSSProperties}>
    <legend>{t("Значок")} <span>{t(options.find(option => option.value === value)?.label ?? "Стандартний")}</span></legend>
    <div className="node-icon-picker-options">
      {options.map(icon => <label className="node-icon-picker-option" key={icon.value ?? "default"} title={t(icon.label)}>
        <input type="radio" name={group} value={icon.value ?? "default"} checked={value === icon.value} onChange={() => onChange(icon.value)} aria-label={t(icon.label)} />
        <span className="node-icon-picker-glyph"><Icon name={icon.value ?? "resource"} width="25" height="25" /></span>
      </label>)}
    </div>
  </fieldset>;
}
