import { MAX_VALUE, parseValue, SCALE, units } from "./document";

export function parsePercent(input: string): number | null {
  const value = parseValue(input);
  return value !== null && value <= 100 ? value : null;
}
export function percentToValue(parentValue: number, percent: number): number {
  if (!Number.isFinite(parentValue) || parentValue <= 0 || parentValue > MAX_VALUE || !Number.isFinite(percent) || percent <= 0 || percent > 100) throw new Error("Некоректний відсоток або значення цілого.");
  const denominator = BigInt(100 * SCALE);
  const result = (BigInt(units(parentValue)) * BigInt(units(percent)) + denominator / BigInt(2)) / denominator;
  return Number(result) / SCALE;
}
export function valueToPercent(parentValue: number, value: number): number {
  return Math.round(value / parentValue * 100 * SCALE) / SCALE;
}
