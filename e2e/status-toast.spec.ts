import { expect, test } from "./fixtures";
import { addPart, createWhole } from "./helpers";

test("routine notices float without shifting content and restart their dismissal timer", async ({ page }) => {
  await createWhole(page, "Team");
  await addPart(page, "Робота");
  const card = page.locator(".structural-card").first();
  const before = (await card.boundingBox())!.y;
  await card.getByRole("button", { name: "Зафіксувати частину" }).click();
  const toast = page.locator(".status-toast");
  await expect(toast).toHaveText("Частину зафіксовано.");
  await expect(toast).toHaveAttribute("aria-live", "polite");
  await expect(toast).toHaveAttribute("aria-atomic", "true");
  expect((await card.boundingBox())!.y).toBe(before);
  await page.waitForTimeout(1800);
  await card.getByRole("button", { name: "Зняти фіксацію" }).click();
  await expect(toast).toHaveText("Фіксацію знято.");
  await page.waitForTimeout(1500);
  await expect(toast).toBeVisible();
  await expect(toast).toBeHidden({ timeout: 2500 });
  expect((await card.boundingBox())!.y).toBe(before);
});
