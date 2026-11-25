import { expect, test } from "@playwright/test";

test("first launch creates two normal starter Wholes and persists navigation", async ({ page, context }) => {
  const other = await context.newPage();
  await Promise.all([page.goto("/"), other.goto("/")]);
  for (const tab of [page, other]) {
    await expect(tab.locator(".resource-library-grid .resource-card")).toHaveCount(2);
    await expect(tab.getByRole("button", { name: "Відкрити ціле «Моє життя»" })).toBeVisible();
    await expect(tab.getByRole("button", { name: "Відкрити ціле «Місячний бюджет»" })).toBeVisible();
  }
  await other.close();
  await page.getByRole("button", { name: "Відкрити ціле «Моє життя»" }).click();
  await page.getByRole("button", { name: "Відкрити «Робота»" }).click();
  await expect(page.getByRole("heading", { name: "Робота", level: 1 })).toBeVisible();
  await page.getByRole("button", { name: "Головна", exact: true }).click();
  await page.getByRole("button", { name: "Відкрити ціле «Місячний бюджет»" }).click();
  await expect(page.locator(".resource-map")).toBeVisible();
  await page.getByRole("button", { name: "Відкрити «Житло»" }).click();
  await expect(page.getByRole("heading", { name: "Житло", level: 1 })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Житло", level: 1 })).toBeVisible();
  await page.getByRole("button", { name: "Головна", exact: true }).click();
  await expect(page.getByRole("button", { name: "Відкрити ціле «Моє життя»" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Відкрити ціле «Місячний бюджет»" })).toBeVisible();
});

test("deleting starter Wholes does not recreate them on reload", async ({ page }) => {
  await page.goto("/");
  for (const name of ["Моє життя", "Місячний бюджет"]) {
    await page.getByRole("button", { name: `Дії для «${name}»` }).click();
    await page.getByRole("dialog", { name }).getByRole("button", { name: "Видалити ціле" }).click();
    await page.getByRole("dialog", { name: `Видалити ціле «${name}»?` }).getByRole("button", { name: "Видалити ціле" }).click();
  }
  await page.reload();
  await expect(page.locator(".resource-library-grid .resource-card")).toHaveCount(0);
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("hundred.document.v1")!));
  expect(stored.documents).toEqual([]);
});
