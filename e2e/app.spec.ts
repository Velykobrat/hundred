import { expect, test } from "@playwright/test";
import { addPart, createWhole } from "./helpers";

test("a new visitor sees onboarding and can start a whole", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Розклади ціле на частини/ })).toBeVisible();
  await expect(page.getByText("Тут поки немає цілих.")).toBeVisible();
  await page.getByRole("button", { name: "Створити перше ціле" }).click();
  await expect(page.getByRole("heading", { name: "Нове ціле" })).toBeVisible();
  await expect(page.getByLabel("Кількість — необов’язково")).toBeEmpty();
});

test("structural hierarchy and active path survive navigation and reload", async ({ page }) => {
  await createWhole(page, "Company");
  await addPart(page, "Development");
  await addPart(page, "Marketing");
  await page.getByRole("button", { name: "Відкрити «Development»" }).click();
  await addPart(page, "Frontend");
  await addPart(page, "Backend");
  await expect(page.getByText(/Вільно:/)).toHaveCount(0);
  await expect(page.getByText(/\d+\s*%/)).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Development", level: 1 })).toBeVisible();
  await expect(page.getByRole("button", { name: "Відкрити «Frontend»" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Відкрити «Backend»" })).toBeVisible();
  await page.getByRole("button", { name: "До батьківського рівня «Company»" }).click();
  await expect(page.getByRole("button", { name: "Відкрити «Marketing»" })).toBeVisible();
  await page.getByRole("button", { name: "Головна", exact: true }).click();
  await page.getByRole("button", { name: "Відкрити ціле «Company»" }).click();
  await expect(page.getByRole("button", { name: "Відкрити «Development»" })).toBeVisible();
});

test("mobile navigation can create and reopen a whole", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await createWhole(page, "Mobile company");
  await addPart(page, "Mobile part");
  const nav = page.getByRole("navigation", { name: "Основна навігація" });
  await nav.getByRole("button", { name: "Головна" }).click();
  await page.getByRole("button", { name: "Відкрити ціле «Mobile company»" }).click();
  await expect(page.getByRole("button", { name: "Відкрити «Mobile part»" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Додати частину", exact: true })).toBeInViewport();
});
