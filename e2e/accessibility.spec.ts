import { expect, test } from "./fixtures";
import type { Locator, Page } from "@playwright/test";
import { addPart, createWhole } from "./helpers";

async function tabTo(page: Page, target: Locator) {
  for (let i = 0; i < 30; i++) {
    if (await target.evaluate(element => element === document.activeElement)) return;
    await page.keyboard.press("Tab");
  }
  throw new Error("The target was not reachable using Tab");
}

test("keyboard navigation creates a Whole and opens and closes a dialog", async ({ page }) => {
  await page.goto("/");
  const create = page.getByRole("button", { name: "Створити перше ціле" });
  await tabTo(page, create);
  await expect(create).toBeFocused();
  await expect(create).toHaveCSS("outline-style", "solid");
  await page.keyboard.press("Enter");
  const name = page.getByLabel("Назва", { exact: true });
  await expect(name).toBeFocused();
  await page.keyboard.type("Keyboard company");
  const submit = page.getByRole("button", { name: "Створити ціле", exact: true });
  await tabTo(page, submit);
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Keyboard company", level: 1 })).toBeVisible();
  const add = page.getByRole("button", { name: "Додати частину", exact: true });
  await tabTo(page, add);
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Додати частину" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel("Назва частини")).toBeFocused();
  expect(await dialog.evaluate(element => element.matches(":modal"))).toBe(true);
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press("Tab");
    expect(await dialog.evaluate(element => element.contains(document.activeElement) || document.activeElement === document.body)).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(add).toBeFocused();
});

test("invalid form fields expose errors and receive focus", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Створити перше ціле" }).click();
  const name = page.getByLabel("Назва", { exact: true });
  await page.getByRole("button", { name: "Створити ціле", exact: true }).click();
  await expect(name).toHaveAttribute("aria-invalid", "true");
  await expect(name).toHaveAccessibleDescription(/Вкажи назву/);
  await expect(name).toBeFocused();
  await name.fill("Budget");
  await page.getByLabel("Кількість — необов’язково").fill("1000");
  await page.getByRole("button", { name: "Створити ціле", exact: true }).click();
  const unit = page.getByLabel("Одиниця", { exact: true });
  await expect(unit).toHaveAttribute("aria-invalid", "true");
  await expect(unit).toHaveAccessibleDescription(/Вкажи одиницю/);
  await expect(unit).toBeFocused();
});

test("closing an edit dialog returns focus to the part's action button", async ({ page }) => {
  await createWhole(page, "Company");
  await addPart(page, "Development");
  const actions = page.getByRole("button", { name: "Дії для «Development»" });
  await actions.click();
  await page.getByRole("dialog", { name: "Development" }).getByRole("button", { name: "Редагувати частину" }).click();
  const dialog = page.getByRole("dialog", { name: "Редагувати частину" });
  await expect(dialog.getByLabel("Назва частини")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(actions).toBeFocused();
});

test("the textual parts list exposes amounts and percentages to assistive technology", async ({ page }) => {
  await createWhole(page, "Budget", "50000");
  await addPart(page, "Housing", "18000");
  const part = page.getByRole("button", { name: "Відкрити «Housing»" });
  await expect(part).toHaveAccessibleDescription(/18\s*000\s*грн\s*36%/);
  await tabTo(page, part);
  await expect(part).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Housing", level: 1 })).toBeVisible();
});

test("mobile controls and an open dialog remain usable without horizontal scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await createWhole(page, "Mobile");
  await page.getByRole("button", { name: "Додати частину", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Додати частину" });
  await expect(dialog.getByLabel("Назва частини")).toBeFocused();
  const submit = dialog.getByRole("button", { name: "Додати частину", exact: true });
  await submit.scrollIntoViewIfNeeded();
  await expect(submit).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("navigation", { name: "Основна навігація" })).toBeVisible();
});
