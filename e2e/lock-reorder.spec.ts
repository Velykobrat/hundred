import { expect, test } from "@playwright/test";
import { addPart, createWhole } from "./helpers";

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

test("locking blocks card and list navigation and persists through reload and undo", async ({ page }) => {
  await createWhole(page, "Company");
  await addPart(page, "Development");
  const card = page.getByRole("button", { name: "Відкрити «Development»" });
  await page.getByRole("button", { name: "Зафіксувати частину" }).tap();
  await expect(page.getByRole("button", { name: "Зняти фіксацію" })).toHaveAttribute("aria-pressed", "true");
  await expect(card).toHaveAttribute("aria-disabled", "true");
  const box = (await card.boundingBox())!;
  await page.touchscreen.tap(box.x + 30, box.y + 70);
  await card.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Company", level: 1 })).toBeVisible();
  await page.getByRole("button", { name: "Скасувати останню зміну" }).tap();
  await expect(page.getByRole("button", { name: "Зафіксувати частину" })).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: "Повторити скасовану зміну" }).tap();
  await expect(page.getByRole("button", { name: "Зняти фіксацію" })).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(page.getByRole("button", { name: "Зняти фіксацію" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Список", exact: true }).tap();
  const row = (await page.getByRole("button", { name: "Відкрити «Development»" }).boundingBox())!;
  await page.touchscreen.tap(row.x + 30, row.y + 30);
  await expect(page.getByRole("heading", { name: "Company", level: 1 })).toBeVisible();
  await page.getByRole("button", { name: "Зняти фіксацію" }).tap();
  await page.getByRole("button", { name: "Відкрити «Development»" }).tap();
  await expect(page.getByRole("heading", { name: "Development", level: 1 })).toBeVisible();
});

test("measured parts respect the same lock in the list and treemap", async ({ page }) => {
  await createWhole(page, "Budget", "100");
  await addPart(page, "Food", "40");
  await page.getByRole("button", { name: "Зафіксувати частину" }).tap();
  const tile = page.locator(".map-tile").filter({ hasText: "Food" });
  await expect(tile).toHaveAttribute("aria-disabled", "true");
  const box = (await tile.boundingBox())!;
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page.getByRole("heading", { name: "Budget", level: 1 })).toBeVisible();
  await page.getByRole("button", { name: "Зняти фіксацію" }).tap();
  await page.getByRole("button", { name: "Відкрити «Food»" }).tap();
  await expect(page.getByRole("heading", { name: "Food", level: 1 })).toBeVisible();
});

test("long press enters reorder mode and a locked card can be dragged among siblings", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await createWhole(page, "Company");
  await addPart(page, "Development");
  await addPart(page, "Marketing");
  await page.locator(".structural-card").nth(1).getByRole("button", { name: "Зафіксувати частину" }).tap();
  const source = page.getByRole("button", { name: "Відкрити «Marketing»" });
  const destination = page.getByRole("button", { name: "Відкрити «Development»" });
  const a = (await source.boundingBox())!;
  const b = (await destination.boundingBox())!;
  const cdp = await page.context().newCDPSession(page);
  try {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: a.x + 50, y: a.y + 60 }] });
    await expect(page.locator(".structural-grid")).toHaveClass(/is-reordering/, { timeout: 2000 });
    await expect(page.getByRole("dialog", { name: "Marketing" })).toHaveCount(0);
    await expect(page.locator(".structural-card").first()).toHaveCSS("animation-name", "none");
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: b.x + 50, y: b.y + 60 }] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  } finally { await cdp.detach(); }
  await expect(page.locator(".structural-card strong")).toHaveText(["Marketing", "Development"]);
  await expect(page.locator(".structural-grid")).not.toHaveClass(/is-reordering/);
  await page.reload();
  await expect(page.locator(".structural-card strong")).toHaveText(["Marketing", "Development"]);
  await expect(page.getByRole("button", { name: "Зняти фіксацію" })).toBeVisible();
});

test("reorder mode supports mouse dragging and exits on outside interaction", async ({ page }) => {
  await createWhole(page, "Company");
  await addPart(page, "Development");
  await addPart(page, "Marketing");
  const cards = page.locator(".structural-card-open");
  const source = (await cards.nth(1).boundingBox())!;
  const target = (await cards.nth(0).boundingBox())!;
  await page.mouse.move(source.x + 30, source.y + 60);
  await page.mouse.down();
  await expect(page.locator(".structural-grid")).toHaveClass(/is-reordering/, { timeout: 2000 });
  await page.mouse.move(target.x + 30, target.y + 60);
  await page.mouse.up();
  await expect(page.locator(".structural-card strong")).toHaveText(["Marketing", "Development"]);
  const first = (await cards.nth(0).boundingBox())!;
  await page.mouse.move(first.x + 30, first.y + 60);
  await page.mouse.down();
  await expect(page.locator(".structural-grid")).toHaveClass(/is-reordering/, { timeout: 2000 });
  await page.mouse.up();
  await page.mouse.click(5, 5);
  await expect(page.locator(".structural-grid")).not.toHaveClass(/is-reordering/);
});
