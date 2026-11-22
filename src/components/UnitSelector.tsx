import { useId, useState } from "react";
import { usePreferences } from "../lib/use-preferences";
const presets = ["грн", "$", "€", "%", "год", "хв", "день", "m²", "km", "kg", "l", "шт", "GB", "TB", "осіб"];
const labels = ["UAH / грн", "USD / $", "EUR / €", "%", "hour / год", "minute / хв", "day / день", "m²", "km", "kg", "l", "pcs / шт", "GB", "TB", "people / осіб"];
export default function UnitSelector({ value, onChange, error, fieldId, className, hintId }: { value: string; onChange: (value: string) => void; error?: string; fieldId: string; className: string; hintId?: string }) {
  const { t } = usePreferences();
  const id = useId();
  const [custom, setCustom] = useState(Boolean(value && !presets.includes(value)));
  const description = [hintId, error ? fieldId + "-error" : undefined].filter(Boolean).join(" ") || undefined;
  return <div>
    <label htmlFor={custom ? id : fieldId} className="mb-2 block text-sm text-neutral-300">{t("Одиниця")}</label>
    <select id={fieldId} aria-required="true" aria-invalid={Boolean(error)} aria-describedby={description} aria-label={t("Одиниця")} value={custom ? "__custom" : value} className={className} onChange={event => {
      const next = event.target.value;
      setCustom(next === "__custom"); onChange(next === "__custom" ? "" : next);
    }}><option value="">{t("Обери одиницю")}</option>{presets.map((unit, index) => <option key={unit} value={unit}>{labels[index]}</option>)}<option value="__custom">{t("Своя одиниця")}</option></select>
    {custom && <input id={id} aria-label={t("Своя одиниця")} aria-required="true" value={value} onChange={event => onChange(event.target.value)} maxLength={20} className={className + " mt-2"} aria-invalid={Boolean(error)} aria-describedby={description} />}
    {error && <p id={fieldId + "-error"} role="alert" className="mt-2 text-sm text-rose-300">{error}</p>}
  </div>;
}
