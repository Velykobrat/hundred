import { expect, test } from "./fixtures";
import { actionsFor, addPart, createWhole } from "./helpers";

test("measured parts show correct units, allocation, and remaining capacity", async ({ page }) => {
  await createWhole(page, "Monthly Budget", "50000");
  await addPart(page, "Housing", "18000");
  await addPart(page, "Food", "10000");
  await expect(page.getByText("56%", { exact: true })).toBeVisible();
  await expect(page.getByText(/Вільно:\s*22\s*000\s*грн/)).toBeVisible();
  const parts = page.getByRole("region", { name: /Частини/ });
  await expect(parts.getByText(/18\s*000\s*грн/)).toBeVisible();
  await expect(parts.getByText(/10\s*000\s*грн/)).toBeVisible();
});

test("invalid and excessive measured amounts are rejected without changing data", async ({ page }) => {
  await createWhole(page, "Monthly Budget", "50000");
  await addPart(page, "Housing", "18000");
  await page.getByRole("button", { name: "Додати частину", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Додати частину" });
  await dialog.getByLabel("Назва частини").fill("Invalid");
  const amount = dialog.getByLabel(/Обсяг/);
  await amount.fill("abc");
  await dialog.getByRole("button", { name: "Додати частину", exact: true }).click();
  await expect(dialog.getByRole("alert")).toContainText("Вкажи число більше нуля");
  await amount.fill("40000");
  await dialog.getByRole("button", { name: "Додати частину", exact: true }).click();
  await expect(dialog.getByRole("alert")).toContainText("Доступно лише");
  await amount.clear();
  await dialog.getByRole("button", { name: "Додати частину", exact: true }).click();
  await expect(dialog.getByRole("alert")).toContainText("Вкажи число більше нуля");
  await dialog.getByRole("button", { name: "Скасувати" }).click();
  await expect(page.getByRole("button", { name: "Відкрити «Housing»" })).toBeVisible();
  await expect(page.getByText(/Вільно:\s*32\s*000\s*грн/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Відкрити «Invalid»" })).toHaveCount(0);
});

test("edit, undo, and redo restore the visible part", async ({ page }) => {
  await createWhole(page, "Monthly Budget", "50000");
  await addPart(page, "Housing", "18000");
  await actionsFor(page, "Housing", "Редагувати частину");
  const dialog = page.getByRole("dialog", { name: "Редагувати частину" });
  await dialog.getByLabel("Назва частини").fill("Home");
  await dialog.getByLabel(/Обсяг/).fill("20000");
  await dialog.getByRole("button", { name: "Зберегти зміни" }).click();
  await expect(page.getByRole("button", { name: "Відкрити «Home»" })).toBeVisible();
  await expect(page.getByText(/Вільно:\s*30\s*000\s*грн/)).toBeVisible();
  await page.getByRole("button", { name: "Скасувати останню зміну" }).click();
  await expect(page.getByRole("button", { name: "Відкрити «Housing»" })).toBeVisible();
  await expect(page.getByText(/Вільно:\s*32\s*000\s*грн/)).toBeVisible();
  await page.getByRole("button", { name: "Повторити скасовану зміну" }).click();
  await expect(page.getByRole("button", { name: "Відкрити «Home»" })).toBeVisible();
  await expect(page.getByText(/Вільно:\s*30\s*000\s*грн/)).toBeVisible();
});

test("deleting a measured child of a measured whole explains freed capacity and can be undone", async ({ page }) => {
  await createWhole(page, "Monthly Budget", "50000");
  await addPart(page, "Housing", "18000");
  await actionsFor(page, "Housing", "Видалити частину");
  const dialog = page.getByRole("dialog", { name: "Видалити «Housing»?" });
  await expect(dialog.getByText(/Буде звільнено\s*18\s*000\s*грн/)).toBeVisible();
  await dialog.getByRole("button", { name: "Видалити", exact: true }).click();
  await expect(page.getByRole("button", { name: "Відкрити «Housing»" })).toHaveCount(0);
  await page.getByRole("button", { name: "Скасувати останню зміну" }).click();
  await expect(page.getByRole("button", { name: "Відкрити «Housing»" })).toBeVisible();
});

test("deleting a measured child of a structural parent does not claim capacity is freed", async ({ page }) => {
  await createWhole(page, "Company");
  await addPart(page, "Department");
  await page.getByRole("button", { name: "Відкрити «Department»" }).click();
  await addPart(page, "Budget", "5000", true);
  await actionsFor(page, "Budget", "Видалити частину");
  const dialog = page.getByRole("dialog", { name: "Видалити «Budget»?" });
  await expect(dialog).not.toContainText("Буде звільнено");
  await dialog.getByRole("button", { name: "Видалити", exact: true }).click();
  await expect(page.getByRole("button", { name: "Відкрити «Budget»" })).toHaveCount(0);
  await page.getByRole("button", { name: "Скасувати останню зміну" }).click();
  await expect(page.getByRole("button", { name: "Відкрити «Budget»" })).toBeVisible();
});
