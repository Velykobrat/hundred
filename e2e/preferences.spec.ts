import { expect, test } from "./fixtures";

test("language segments expose selection and persist in both languages", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Налаштування", exact: true }).click();
  await expect(page.getByText("Твій Hundred", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Інтерфейс" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Мова інтерфейсу" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Тема", exact: true })).toBeVisible();
  const guide = page.getByRole("button", { name: "Як користуватися Hundred" });
  await expect(guide).toHaveAttribute("aria-expanded", "false");
  await guide.click();
  await expect(guide).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByText("Ціле → частини → нове ціле. Наприклад: команда → відділ → учасники.")).toBeVisible();
  await guide.click();
  await expect(guide).toHaveAttribute("aria-expanded", "false");
  const uk = page.getByRole("button", { name: "УКР" });
  const en = page.getByRole("button", { name: "ENG" });
  await expect(uk).toHaveAttribute("aria-pressed", "true");
  await uk.focus();
  await page.keyboard.press("Tab");
  await expect(en).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(en).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Interface", exact: true })).toBeVisible();
  await expect(page.getByText("Auto uses your device theme.")).toBeVisible();
  await page.reload();
  await expect(en).toHaveAttribute("aria-pressed", "true");
  await uk.click();
  await expect(uk).toHaveAttribute("aria-pressed", "true");
});

test("theme segments persist and system follows device preference", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  await page.getByRole("button", { name: "Налаштування", exact: true }).click();
  for (const [name, value, applied] of [["Світла", "light", "light"], ["Темна", "dark", "dark"], ["Авто", "system", "dark"]]) {
    const button = page.getByRole("button", { name, exact: true });
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("html")).toHaveAttribute("data-theme", applied);
    expect(await page.locator(`[data-theme-option="${value}"]`).getAttribute("aria-pressed")).toBe("true");
  }
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(page.getByRole("button", { name: "Авто", exact: true })).toHaveAttribute("aria-pressed", "true");
});
