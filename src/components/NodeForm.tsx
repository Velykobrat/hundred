"use client";

import { useId, useState, type FormEvent } from "react";
import { parseValue, units, validateFields, type FieldErrors } from "../lib/document";
import { formatNumber } from "../lib/format";

type Props = {
  initialName?: string; initialValue?: number; unit?: string; createWhole?: boolean;
  available?: number; minimum?: number; submitLabel: string;
  onSubmit: (name: string, value: number, unit: string) => string | void;
  onCancel?: () => void;
};
export default function NodeForm({ initialName = "", initialValue, unit = "", createWhole = false, available, minimum = 0, submitLabel, onSubmit, onCancel }: Props) {
  const id = useId();
  const [name, setName] = useState(initialName);
  const [value, setValue] = useState(initialValue === undefined ? "" : String(initialValue).replace(".", ","));
  const [unitValue, setUnitValue] = useState(unit);
  const [errors, setErrors] = useState<FieldErrors>({});
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateFields(name, value, createWhole ? unitValue : undefined);
    const parsed = parseValue(value);
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
          <label htmlFor={`${id}-value`} className="mb-2 block text-sm text-neutral-300">Значення{!createWhole && unitValue ? `, ${unitValue}` : ""}</label>
          <input id={`${id}-value`} type="text" inputMode="decimal" autoComplete="off" value={value} onChange={(event) => { setValue(event.target.value); setErrors((previous) => ({ ...previous, value: undefined })); }} placeholder={available !== undefined ? `До ${formatNumber(available)}` : "1000"} className={fieldClass} aria-invalid={Boolean(errors.value)} aria-describedby={`${id}-value-hint${errors.value ? ` ${id}-value-error` : ""}`} />
          <p id={`${id}-value-hint`} className="mt-2 text-xs text-neutral-400">Можна вводити дроби через кому або крапку.</p>
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
