"use client";

import UnitSelector from "./UnitSelector";
import ColorSelector from "./ColorSelector";
import IconSelector from "./IconSelector";
import type { NodeIcon } from "../lib/node-icon";
import type { NodeColor } from "../lib/node-color";
import { usePreferences } from "../lib/use-preferences";
import { isTouchDevice } from "../lib/touch-device";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { parseValue, units, validateFields, type FieldErrors } from "../lib/document";
import { parsePercent, percentToValue, valueToPercent } from "../lib/percentage";

type Props = {
  initialName?: string; initialValue?: number; unit?: string; createWhole?: boolean; optionalQuantity?: boolean; structuralEdit?: boolean;
  available?: number; minimum?: number; submitLabel: string;
  parentValue?: number; parentName?: string;
  initialColor?: NodeColor;
  initialIcon?: NodeIcon;
  onSubmit: (name: string, value: number | undefined, unit: string, color?: NodeColor, icon?: NodeIcon) => string | void;
  onCancel?: () => void;
};
export default function NodeForm({ initialName = "", initialValue, initialColor, initialIcon, unit = "", createWhole = false, optionalQuantity = false, structuralEdit = false, available, minimum = 0, submitLabel, onSubmit, onCancel, parentValue, parentName }: Props) {
  const { t, formatNumber, formatPercent, translateMessage, language } = usePreferences();
  const id = useId();
  const nameInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (createWhole && !isTouchDevice()) nameInput.current?.focus();
  }, [createWhole]);
  const optional = createWhole || optionalQuantity;
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState<NodeColor | undefined>(initialColor);
  const [icon, setIcon] = useState<NodeIcon | undefined>(initialIcon);
  const [value, setValue] = useState(initialValue === undefined ? "" : String(initialValue).replace(".", language === "uk" ? "," : "."));
  const structural = structuralEdit || (optional && !value.trim());
  const [unitValue, setUnitValue] = useState(unit);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [mode, setMode] = useState<"amount" | "percent">("amount");
  const percent = mode === "percent" ? parsePercent(value) : null;
  const previewValue = mode === "percent" ? percent !== null && parentValue ? percentToValue(parentValue, percent) : null : parseValue(value);
  function switchMode(next: "amount" | "percent") {
    if (mode === next || !parentValue) return;
    const amount = previewValue;
    setValue(amount === null ? "" : String(next === "percent" ? valueToPercent(parentValue, amount) : amount).replace(".", language === "uk" ? "," : "."));
    setMode(next);
    setErrors((previous) => ({ ...previous, value: undefined }));
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateFields(name, structural ? "1" : value, !structural && optional ? unitValue : undefined);
    const parsed = mode === "percent" ? percent !== null && parentValue ? percentToValue(parentValue, percent) : null : parseValue(value);
    if (mode === "percent") {
      if (percent === null) nextErrors.value = t("Вкажи відсоток більше 0 і до 100, з не більш ніж 6 знаками після коми.");
      else if (parsed === 0) nextErrors.value = t("Ця частка надто мала для точності розподілу. Введи більше значення або скористайся режимом «Значення».");
    }
    if (parsed !== null && available !== undefined && units(parsed) > units(available)) nextErrors.value = t("Доступно лише {p0} {p1}.", {p0: formatNumber(available), p1: unitValue});
    if (parsed !== null && units(parsed) < units(minimum)) nextErrors.value = t("Вкладені частини вже займають {p0} {p1}. Значення не може бути меншим.", {p0: formatNumber(minimum), p1: unitValue});
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length || (!structural && parsed === null)) {
      const field = nextErrors.name ? "name" : nextErrors.value ? "value" : "unit";
      (event.currentTarget.elements.namedItem(`${id}-${field}`) as HTMLInputElement | null)?.focus();
      return;
    }
    try {
      const error = onSubmit(name.trim(), structural ? undefined : parsed!, unitValue.trim(), color, icon);
      if (error) { setErrors({ name: error }); return; }
    } catch (error) {
      setErrors({ name: error instanceof Error ? error.message : t("Не вдалося виконати дію.") }); return;
    }
    if (initialValue === undefined) { setName(""); setValue(""); }
  }
  const fieldClass = "w-full rounded-2xl border border-white/15 bg-neutral-950 px-4 py-3 text-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30";
  const appearance = <><ColorSelector value={color} onChange={setColor} /><IconSelector value={icon} color={color} onChange={setIcon} /></>;
  return (
    <form noValidate onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor={`${id}-name`} className="mb-2 block text-sm text-neutral-300">{createWhole ? t("Назва") : t("Назва частини")}</label>
        <input ref={nameInput} id={`${id}-name`} data-dialog-initial-focus={onCancel ? "" : undefined} value={name} onChange={(event) => { setName(event.target.value); setErrors((previous) => ({ ...previous, name: undefined })); }} maxLength={120} autoComplete="off" placeholder={createWhole ? t("Наприклад: Мої проєкти") : t("Назва категорії")} className={fieldClass} aria-required="true" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? `${id}-name-error` : undefined} />
        <p aria-hidden="true" className="mt-1 text-right text-xs text-neutral-400">{name.length} / 120</p>
        {errors.name && <p id={`${id}-name-error`} role="alert" className="mt-2 text-sm text-rose-300">{translateMessage(errors.name)}</p>}
      </div>
      {!structuralEdit && <div className="space-y-4">
        <div>
          {parentValue !== undefined && !createWhole && <div role="group" aria-label={t("Спосіб введення частини")} className="mb-4 flex rounded-xl border border-white/10 bg-neutral-950 p-1">
            <button type="button" aria-pressed={mode === "amount"} onClick={() => switchMode("amount")} className={`flex-1 rounded-lg px-3 py-2 text-sm ${mode === "amount" ? "bg-neutral-700 text-white" : "text-neutral-400 hover:text-white"}`}>{t("Значення")}</button>
            <button type="button" aria-pressed={mode === "percent"} onClick={() => switchMode("percent")} className={`flex-1 rounded-lg px-3 py-2 text-sm ${mode === "percent" ? "bg-neutral-700 text-white" : "text-neutral-400 hover:text-white"}`}>{t("Відсоток, %")}</button>
          </div>}
          <label htmlFor={`${id}-value`} className="mb-2 block text-sm text-neutral-300">{optional ? t("Кількість — необов’язково") : mode === "percent" ? t("Частка, %") : t("Обсяг{p0}", {p0: !createWhole && unitValue ? `, ${unitValue}` : ""})}</label>
          <input id={`${id}-value`} type="text" inputMode="decimal" autoComplete="off" value={value} onChange={(event) => { setValue(event.target.value); setErrors((previous) => ({ ...previous, value: undefined })); }} placeholder={createWhole ? undefined : mode === "percent" ? t("Наприклад: 30") : available !== undefined ? t("До {p0}", {p0: formatNumber(available)}) : "1000"} className={fieldClass} aria-required={!optional} aria-invalid={Boolean(errors.value)} aria-describedby={`${id}-value-hint${errors.value ? ` ${id}-value-error` : ""}`} />
          <p id={`${id}-value-hint`} className="mt-2 text-xs leading-relaxed text-neutral-400">{createWhole ? t("Без кількості — структура чи список. З кількістю та одиницею — пропорційні частини.") : optional ? t("Не вказуй кількість, якщо створюєш структуру або список.") : mode === "percent" ? t("Від {p0}: {p1} {p2}.", {p0: parentName ? `«${parentName}»` : t("поточної категорії"), p1: formatNumber(parentValue ?? 0), p2: unitValue}) : t("Можна вводити дроби через кому або крапку.")}</p>
          {parentValue !== undefined && previewValue !== null && previewValue > 0 && <p className="mt-3 rounded-xl bg-indigo-400/10 px-3 py-2 text-sm text-indigo-200">{formatNumber(previewValue)} {unitValue} · {formatPercent(previewValue / parentValue * 100)} {" "}{t("цього рівня")}</p>}
          {errors.value && <p id={`${id}-value-error`} role="alert" className="mt-2 text-sm text-rose-300">{translateMessage(errors.value)}</p>}
        </div>
        {optional && !structural && <div>{createWhole && <p id={`${id}-unit-hint`} className="mb-2 text-xs leading-relaxed text-neutral-400">{t("Для кількості обери одиницю виміру.")}</p>}<UnitSelector value={unitValue} onChange={setUnitValue} fieldId={id + "-unit"} className={fieldClass} hintId={createWhole ? `${id}-unit-hint` : undefined} error={translateMessage(errors.unit)} /></div>}
      </div>}
      {(structuralEdit || initialValue !== undefined) && <p className="text-xs text-neutral-400">{t("Тип цілого після створення не змінюється.")}</p>}
      {createWhole ? <details className="whole-appearance"><summary>{t("Оформлення")}</summary><div className="whole-appearance-options">{appearance}</div></details> : appearance}

      {available === 0 && <p className="text-sm text-neutral-300">{t("Усе розподілено. Зменш або видали одну з частин, щоб звільнити місце.")}</p>}
      <div className="flex gap-3 pt-2">
        {onCancel && <button type="button" onClick={onCancel} className="rounded-2xl border border-white/15 px-4 py-3 text-sm hover:bg-white/5">{t("Скасувати")}</button>}
        <button type="submit" disabled={available === 0} className="flex-1 rounded-2xl bg-white px-5 py-3 font-medium text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-400">{submitLabel}</button>
      </div>
    </form>
  );
}

