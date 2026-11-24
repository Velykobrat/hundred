import { expect, type Page } from "@playwright/test";

export async function createWhole(page: Page, name: string, amount?: string) {
  await page.goto("/");
  await expect(page.locator(".resource-library")).toBeVisible();
  const create = page.locator(".home-header-create");
  if (await create.isVisible()) await create.click();
  else await page.getByRole("button", { name: "Створити перше ціле" }).click();
  await page.getByLabel("Назва", { exact: true }).fill(name);
  if (amount !== undefined) {
    await page.getByLabel("Кількість — необов’язково").fill(amount);
    await page.getByLabel("Одиниця", { exact: true }).selectOption("грн");
  }
  await page.getByRole("button", { name: "Створити ціле", exact: true }).click();
  await expect(page.getByRole("heading", { name, level: 1 })).toBeVisible();
}

export async function addPart(page: Page, name: string, amount?: string, structuralParent = false) {
  await page.locator(".add-part-button").click();
  const dialog = page.getByRole("dialog", { name: "Додати частину" });
  await dialog.getByLabel("Назва частини").fill(name);
  if (amount !== undefined) {
    await dialog.getByLabel(structuralParent ? "Кількість — необов’язково" : /Обсяг/).fill(amount);
    if (structuralParent) await dialog.getByLabel("Одиниця", { exact: true }).selectOption("грн");
  }
  await dialog.getByRole("button", { name: "Додати частину", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole("button", { name: `Відкрити «${name}»` })).toBeVisible();
}

export async function actionsFor(page: Page, name: string, action: string) {
  await page.getByRole("button", { name: `Дії для «${name}»` }).click();
  const menu = page.getByRole("dialog", { name });
  await menu.getByRole("button", { name: action, exact: true }).click();
}
