import { expect, test } from "./fixtures";
import { addPart, createWhole } from "./helpers";
import { version } from "../package.json";

test("structural hierarchy, views, dialog, and persistence", async ({ page }) => {
  await createWhole(page, "Company");
  await addPart(page, "Development");
  await addPart(page, "Operations");
  await page.getByRole("button", { name: "Список", exact: true }).click();
  await expect(page.locator(".parts-panel")).toBeVisible();
  await page.getByRole("button", { name: "Картки", exact: true }).click();
  await page.getByRole("button", { name: "Дії для «Development»" }).click();
  await expect(page.getByRole("dialog", { name: "Development" })).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Відкрити «Development»" }).click();
  await expect(page.getByRole("heading", { name: "Development", level: 1 })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Development", level: 1 })).toBeVisible();
});

test("home and settings render the product signature", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".resource-library")).toBeVisible();
  await page.getByRole("button", { name: "Налаштування" }).click();
  await expect(page.getByRole("heading", { name: "Налаштування" })).toBeVisible();
  const footer = page.locator(".settings-signature");
  await expect(footer).toContainText(`Hundred · v${version}`);
  await expect(footer.locator(".maker")).toContainText("by");
  await expect(footer.getByRole("link", { name: "Відкрити сайт BeBetter" })).toBeVisible();
  await expect(footer).toContainText("© 2026");
  await expect(footer.locator("img")).toHaveAttribute("alt", "");
  await expect(footer.locator("img")).toHaveAttribute("src", "/brand/bebetter-text.svg");
  await expect(footer.locator("img")).toBeVisible();
  await expect(footer.locator("img")).toHaveJSProperty("complete", true);
  const link = footer.getByRole("link", { name: "Відкрити сайт BeBetter" });
  await expect(link).toHaveAttribute("href", "https://bebetter-development.vercel.app/");
  await expect(link).toHaveAttribute("target", "_blank");
  await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  for (const theme of ["light", "dark"]) {
    await page.locator("#hundred-theme").selectOption(theme);
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    await expect(footer.locator("img")).toBeVisible();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
