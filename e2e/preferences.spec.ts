import { expect, test } from "./fixtures";

test("language can be switched to English and persists across reload", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Налаштування", exact: true }).click();
  await page.getByLabel("Мова інтерфейсу").selectOption("en");
  await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Interface language")).toHaveValue("en");
  await page.getByRole("button", { name: "Home", exact: true }).click();
  await expect(page.getByRole("heading", { name: /Break a whole into parts/ })).toBeVisible();
});

test("theme changes visibly and persists across reload", async ({ page }) => {
  await page.goto("/");
  const body = page.locator("body");
  const dark = await body.evaluate(el => getComputedStyle(el).backgroundColor);
  await page.getByRole("button", { name: "Налаштування", exact: true }).click();
  await page.getByLabel("Тема", { exact: true }).selectOption("light");
  await expect.poll(() => body.evaluate(el => getComputedStyle(el).backgroundColor)).not.toBe(dark);
  const light = await body.evaluate(el => getComputedStyle(el).backgroundColor);
  await page.reload();
  await expect(page.getByLabel("Тема", { exact: true })).toHaveValue("light");
  await expect.poll(() => body.evaluate(el => getComputedStyle(el).backgroundColor)).toBe(light);
});
