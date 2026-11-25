import { expect, test } from "./fixtures";
import { createWhole } from "./helpers";

test("the reminder waits for saved data and can be postponed for seven days", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-01-01T12:00:00Z") });
  await page.goto("/");
  const reminder = page.getByRole("region", { name: "Нагадування про резервну копію" });
  await expect(reminder).toHaveCount(0);
  await createWhole(page, "Company");
  await page.getByRole("button", { name: "Головна", exact: true }).click();
  await expect(reminder).toBeVisible();
  await reminder.getByRole("button", { name: "Нагадати пізніше" }).click();
  await expect(reminder).toHaveCount(0);
  await page.reload();
  await expect(reminder).toHaveCount(0);
  await page.clock.fastForward(7 * 24 * 60 * 60 * 1000 + 1000);
  await expect(reminder).toBeVisible();
});

test("a backup from Settings suppresses the reminder in both tabs for thirty days", async ({ page, context }) => {
  await page.clock.setFixedTime(new Date("2026-01-01T12:00:00Z"));
  await createWhole(page, "Company");
  await page.getByRole("button", { name: "Головна", exact: true }).click();
  const firstReminder = page.getByRole("region", { name: "Нагадування про резервну копію" });
  await expect(firstReminder).toBeVisible();
  const second = await context.newPage();
  await second.goto("/");
  await expect(second.getByRole("region", { name: "Нагадування про резервну копію" })).toBeVisible();
  await second.getByRole("button", { name: "Налаштування", exact: true }).click();
  const [download] = await Promise.all([
    second.waitForEvent("download"),
    second.getByRole("button", { name: /Завантажити резервну копію/ }).click(),
  ]);
  expect(download.suggestedFilename()).toBe("hundred-backup.json");
  await expect(firstReminder).toHaveCount(0);
  await second.getByRole("button", { name: "Головна", exact: true }).click();
  await expect(second.getByRole("region", { name: "Нагадування про резервну копію" })).toHaveCount(0);
  await page.clock.setFixedTime(new Date("2026-01-30T12:00:00Z"));
  await page.reload();
  await expect(firstReminder).toHaveCount(0);
  await page.clock.setFixedTime(new Date("2026-01-31T12:00:01Z"));
  await page.reload();
  await expect(firstReminder).toBeVisible();
});

test("a failed download does not dismiss the reminder", async ({ page }) => {
  await page.addInitScript(() => { URL.createObjectURL = () => { throw new Error("Download unavailable"); }; });
  await createWhole(page, "Company");
  await page.getByRole("button", { name: "Головна", exact: true }).click();
  const reminder = page.getByRole("region", { name: "Нагадування про резервну копію" });
  await reminder.getByRole("button", { name: "Завантажити копію" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Не вдалося розпочати завантаження резервної копії." })).toBeVisible();
  await expect(reminder).toBeVisible();
  await page.reload();
  await expect(reminder).toBeVisible();
});

test("the reminder can download a backup directly", async ({ page }) => {
  await createWhole(page, "Company");
  await page.getByRole("button", { name: "Головна", exact: true }).click();
  const reminder = page.getByRole("region", { name: "Нагадування про резервну копію" });
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    reminder.getByRole("button", { name: "Завантажити копію" }).click(),
  ]);
  expect(download.suggestedFilename()).toBe("hundred-backup.json");
  await expect(reminder).toHaveCount(0);
  await page.reload();
  await expect(reminder).toHaveCount(0);
});

test("the reminder is translated and its postpone action works from the keyboard", async ({ page }) => {
  await createWhole(page, "Company");
  await page.getByRole("button", { name: "Налаштування", exact: true }).click();
  await page.getByLabel("Мова інтерфейсу").selectOption("en");
  await page.getByRole("button", { name: "Home", exact: true }).click();
  const reminder = page.getByRole("region", { name: "Backup reminder" });
  await expect(reminder).toContainText("Hundred data is stored only in this browser.");
  const later = reminder.getByRole("button", { name: "Remind me later" });
  await later.focus();
  await later.press("Enter");
  await expect(reminder).toHaveCount(0);
});

test("the reminder and backup download work offline after the app has loaded", async ({ page, context }) => {
  await createWhole(page, "Company");
  await page.getByRole("button", { name: "Головна", exact: true }).click();
  const reminder = page.getByRole("region", { name: "Нагадування про резервну копію" });
  await expect(reminder).toBeVisible();
  await context.setOffline(true);
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    reminder.getByRole("button", { name: "Завантажити копію" }).click(),
  ]);
  expect(download.suggestedFilename()).toBe("hundred-backup.json");
  await expect(reminder).toHaveCount(0);
});
