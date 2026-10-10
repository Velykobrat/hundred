"use client";

import { useId, useState, type FormEvent } from "react";
import { parseValue, units, validateFields, type FieldErrors } from "../lib/document";
import { formatNumber, formatPercent } from "../lib/format";
import { parsePercent, percentToValue, valueToPercent } from "../lib/percentage";

type Props = {
  initialName?: string; initialValue?: number; unit?: string; createWhole?: boolean;
  available?: number; minimum?: number; submitLabel: string;
  parentValue?: number; parentName?: string;
  onSubmit: (name: string, value: number, unit: string) => string | void;
  onCancel?: () => void;
};
export default function NodeForm({ initialName = "", initialValue, unit = "", createWhole = false, available, minimum = 0, submitLabel, onSubmit, onCancel, parentValue, parentName }: Props) {
  const id = useId();
  const [name, setName] = useState(initialName);
  const [value, setValue] = useState(initialValue === undefined ? "" : String(initialValue).replace(".", ","));
  const [unitValue, setUnitValue] = useState(unit);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [mode, setMode] = useState<"amount" | "percent">("amount");
  const percent = mode === "percent" ? parsePercent(value) : null;
  const previewValue = mode === "percent" ? percent !== null && parentValue ? percentToValue(parentValue, percent) : null : parseValue(value);
  function switchMode(next: "amount" | "percent") {
    if (mode === next || !parentValue) return;
    const amount = previewValue;
    setValue(amount === null ? "" : String(next === "percent" ? valueToPercent(parentValue, amount) : amount).replace(".", ","));
    setMode(next);
    setErrors((previous) => ({ ...previous, value: undefined }));
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateFields(name, value, createWhole ? unitValue : undefined);
    const parsed = mode === "percent" ? percent !== null && parentValue ? percentToValue(parentValue, percent) : null : parseValue(value);
    if (mode === "percent") {
      if (percent === null) nextErrors.value = "Вкажи відсоток більше 0 і до 100, з не більш ніж 6 знаками після коми.";
      else if (parsed === 0) nextErrors.value = "Ця частка надто мала для точності розподілу. Введи більше значення або скористайся режимом «Значення».";
    }
    if (parsed !== null && available !== undefined && units(parsed) > units(available)) nextErrors.value = `Доступно лише ${formatNumber(available)} ${unitValue}.`;
    if (parsed !== null && units(parsed) < units(minimum)) nextErrors.value = `Вкладені частини вже займають ${formatNumber(minimum)} ${unitValue}. Значення не може бути меншим.`;
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length || parsed === null) {
      const field = nextErrors.name ? "name" : nextErrors.value ? "value" : "unit";
      (event.currentTarget.elements.namedItem(`${id}-${field}`) as HTMLInputElement | null)?.focus();
      return;
    }
    const error = onSubmit(name.trim(), parsed, unitValue.trim());
    if (error) { setErrors({ value: error }); return; }
    if (initialValue === undefined) { setName(""); setValue(""); }
  }
  const fieldClass = "w-full rounded-2xl border border-white/15 bg-neutral-950 px-4 py-3 text-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30";
  return (
    <form noValidate onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor={`${id}-name`} className="mb-2 block text-sm text-neutral-300">Назва</label>
        <input id={`${id}-name`} autoFocus={Boolean(onCancel)} value={name} onChange={(event) => { setName(event.target.value); setErrors((previous) => ({ ...previous, name: undefined })); }} maxLength={120} autoComplete="off" placeholder={createWhole ? "Наприклад: Місячний бюджет" : "Наприклад: Оренда"} className={fieldClass} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? `${id}-name-error` : undefined} />
        {errors.name && <p id={`${id}-name-error`} role="alert" className="mt-2 text-sm text-rose-300">{errors.name}</p>}
      </div>
      <div className={createWhole ? "grid grid-cols-[minmax(0,1fr)_110px] gap-3" : ""}>
        <div>
          {parentValue !== undefined && !createWhole && <div role="group" aria-label="Спосіб введення частини" className="mb-4 flex rounded-xl border border-white/10 bg-neutral-950 p-1">
            <button type="button" aria-pressed={mode === "amount"} onClick={() => switchMode("amount")} className={`flex-1 rounded-lg px-3 py-2 text-sm ${mode === "amount" ? "bg-neutral-700 text-white" : "text-neutral-400 hover:text-white"}`}>Значення</button>
            <button type="button" aria-pressed={mode === "percent"} onClick={() => switchMode("percent")} className={`flex-1 rounded-lg px-3 py-2 text-sm ${mode === "percent" ? "bg-neutral-700 text-white" : "text-neutral-400 hover:text-white"}`}>Відсоток, %</button>
          </div>}
          <label htmlFor={`${id}-value`} className="mb-2 block text-sm text-neutral-300">{mode === "percent" ? "Частка, %" : `Значення${!createWhole && unitValue ? `, ${unitValue}` : ""}`}</label>
          <input id={`${id}-value`} type="text" inputMode="decimal" autoComplete="off" value={value} onChange={(event) => { setValue(event.target.value); setErrors((previous) => ({ ...previous, value: undefined })); }} placeholder={mode === "percent" ? "Наприклад: 30" : available !== undefined ? `До ${formatNumber(available)}` : "1000"} className={fieldClass} aria-invalid={Boolean(errors.value)} aria-describedby={`${id}-value-hint${errors.value ? ` ${id}-value-error` : ""}`} />
          <p id={`${id}-value-hint`} className="mt-2 text-xs leading-relaxed text-neutral-400">{mode === "percent" ? `Від ${parentName ? `«${parentName}»` : "поточної категорії"}: ${formatNumber(parentValue ?? 0)} ${unitValue}.` : "Можна вводити дроби через кому або крапку."}</p>
          {parentValue !== undefined && previewValue !== null && previewValue > 0 && <p className="mt-3 rounded-xl bg-indigo-400/10 px-3 py-2 text-sm text-indigo-200">{formatNumber(previewValue)} {unitValue} · {formatPercent(previewValue / parentValue * 100)} цього рівня</p>}
          {errors.value && <p id={`${id}-value-error`} role="alert" className="mt-2 text-sm text-rose-300">{errors.value}</p>}
        </div>
        {createWhole && <div>
          <label htmlFor={`${id}-unit`} className="mb-2 block text-sm text-neutral-300">Одиниця</label>
          <input id={`${id}-unit`} value={unitValue} onChange={(event) => { setUnitValue(event.target.value); setErrors((previous) => ({ ...previous, unit: undefined })); }} maxLength={20} placeholder="грн" className={fieldClass} aria-invalid={Boolean(errors.unit)} aria-describedby={errors.unit ? `${id}-unit-error` : undefined} />
          {errors.unit && <p id={`${id}-unit-error`} role="alert" className="mt-2 text-sm text-rose-300">{errors.unit}</p>}
        </div>}
      </div>
      {available === 0 && <p className="text-sm text-neutral-300">Усе розподілено. Зменш або видали одну з частин, щоб звільнити місце.</p>}
      <div className="flex gap-3 pt-2">
        {onCancel && <button type="button" onClick={onCancel} className="rounded-2xl border border-white/15 px-4 py-3 text-sm hover:bg-white/5">Скасувати</button>}
        <button type="submit" disabled={available === 0} className="flex-1 rounded-2xl bg-white px-5 py-3 font-medium text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-400">{submitLabel}</button>
      </div>
    </form>
  );
}
