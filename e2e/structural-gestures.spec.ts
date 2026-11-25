import { expect, test } from "./fixtures";
import type { Page } from "@playwright/test";
import { addPart, createWhole } from "./helpers";

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

async function touchSequence(page: Page, start: { x: number; y: number }, end: { x: number; y: number }, hold = 0) {
  const cdp = await page.context().newCDPSession(page);
  try {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [start] });
    if (hold) await page.waitForTimeout(hold);
    if (start.x !== end.x || start.y !== end.y) {
      await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [end] });
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  } finally {
    await cdp.detach();
  }
}

test("structural cards and list are exclusive and a quick tap opens a part", async ({ page }) => {
  await createWhole(page, "Company");
  await addPart(page, "Development");
  const card = page.getByRole("button", { name: "Відкрити «Development»" });
  await expect(page.locator(".structural-grid")).toBeVisible();
  await expect(page.locator(".parts-panel")).toHaveCount(0);
  await expect(page.locator(".structural-card-actions")).toHaveCSS("position", "absolute");
  await expect(page.locator(".structural-card-actions")).toHaveCSS("border-top-width", "0px");
  const actionsBox = (await page.locator(".structural-card-actions").boundingBox())!;
  expect(actionsBox.width).toBeGreaterThanOrEqual(44);
  expect(actionsBox.height).toBeGreaterThanOrEqual(44);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Список", exact: true }).click();
  await expect(page.locator(".parts-panel")).toBeVisible();
  await expect(page.locator(".structural-grid")).toHaveCount(0);
  await page.getByRole("button", { name: "Дії для «Development»" }).click();
  await expect(page.getByRole("dialog", { name: "Development" })).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Картки", exact: true }).click();
  await card.tap();
  await expect(page.getByRole("heading", { name: "Development", level: 1 })).toBeVisible();
});

test("long press enters reorder mode without navigation and movement cancels the press", async ({ page }) => {
  await createWhole(page, "Company");
  await addPart(page, "Development");
  const card = page.getByRole("button", { name: "Відкрити «Development»" });
  await card.scrollIntoViewIfNeeded();
  const box = (await card.boundingBox())!;
  const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  await touchSequence(page, point, point, 600);
  await expect(page.locator(".structural-grid")).toHaveClass(/is-reordering/);
  await expect(page.getByRole("dialog", { name: "Development" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Company", level: 1 })).toBeVisible();
  await page.keyboard.press("Escape");
  await card.dispatchEvent("click", { detail: 1 });
  await expect(page.getByRole("heading", { name: "Company", level: 1 })).toBeVisible();
  await card.dispatchEvent("pointerdown", { pointerType: "touch", pointerId: 8, isPrimary: true, clientX: 150, clientY: 300 });
  await card.dispatchEvent("pointermove", { pointerType: "touch", pointerId: 8, isPrimary: true, clientX: 150, clientY: 312 });
  await page.waitForTimeout(600);
  await card.dispatchEvent("pointerup", { pointerType: "touch", pointerId: 8, isPrimary: true, clientX: 150, clientY: 312 });
  await expect(page.locator(".structural-grid")).not.toHaveClass(/is-reordering/);
  await expect(page.getByRole("heading", { name: "Company", level: 1 })).toBeVisible();
});

test("vertical touch scrolling on a card stays native and does not open actions", async ({ page }) => {
  await createWhole(page, "Company");
  await addPart(page, "Development");
  await addPart(page, "Marketing");
  await addPart(page, "Operations");
  await page.evaluate(() => window.scrollTo(0, 0));
  const card = page.getByRole("button", { name: "Відкрити «Development»" });
  const box = (await card.boundingBox())!;
  const start = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  await touchSequence(page, start, { x: start.x, y: start.y - 140 });
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  await expect(page.getByRole("dialog", { name: "Development" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Company", level: 1 })).toBeVisible();
});

test("edge swipe returns a child to the root and the root to Home", async ({ page }) => {
  await createWhole(page, "Company");
  await addPart(page, "Development");
  await page.getByRole("button", { name: "Відкрити «Development»" }).click();
  await expect(page.getByRole("heading", { name: "Development", level: 1 })).toBeVisible();
  await touchSequence(page, { x: 20, y: 180 }, { x: 25, y: 280 });
  await expect(page.getByRole("heading", { name: "Development", level: 1 })).toBeVisible();
  await touchSequence(page, { x: 28, y: 180 }, { x: 2, y: 180 });
  await expect(page.getByRole("heading", { name: "Development", level: 1 })).toBeVisible();
  await touchSequence(page, { x: 20, y: 180 }, { x: 60, y: 180 });
  await expect(page.getByRole("heading", { name: "Development", level: 1 })).toBeVisible();
  await touchSequence(page, { x: 20, y: 180 }, { x: 120, y: 180 });
  await expect(page.getByRole("heading", { name: "Company", level: 1 })).toBeVisible();
  await touchSequence(page, { x: 20, y: 180 }, { x: 120, y: 180 });
  await expect(page.getByRole("button", { name: "Відкрити ціле «Company»" })).toBeVisible();
});

test("swipe returns one level at a time, including from the expanded start zone", async ({ page }) => {
  await createWhole(page, "Company");
  await addPart(page, "Development");
  await page.getByRole("button", { name: "Відкрити «Development»" }).click();
  await addPart(page, "Frontend");
  await page.getByRole("button", { name: "Відкрити «Frontend»" }).click();
  await addPart(page, "React");
  await page.getByRole("button", { name: "Відкрити «React»" }).click();
  await expect(page.getByRole("heading", { name: "React", level: 1 })).toBeVisible();
  await touchSequence(page, { x: 150, y: 180 }, { x: 250, y: 180 });
  await expect(page.getByRole("heading", { name: "React", level: 1 })).toBeVisible();
  await touchSequence(page, { x: 100, y: 180 }, { x: 200, y: 180 });
  await expect(page.getByRole("heading", { name: "Frontend", level: 1 })).toBeVisible();
  await touchSequence(page, { x: 100, y: 180 }, { x: 200, y: 180 });
  await expect(page.getByRole("heading", { name: "Development", level: 1 })).toBeVisible();
  await touchSequence(page, { x: 100, y: 180 }, { x: 200, y: 180 });
  await expect(page.getByRole("heading", { name: "Company", level: 1 })).toBeVisible();
  await touchSequence(page, { x: 100, y: 180 }, { x: 200, y: 180 });
  await expect(page.getByRole("button", { name: "Відкрити ціле «Company»" })).toBeVisible();
});

test("swipe works at the top, middle and bottom of Whole content", async ({ page }) => {
  await createWhole(page, "Company");
  await addPart(page, "Development");
  for (const y of [150, 400, 740]) {
    await page.getByRole("button", { name: "Відкрити «Development»" }).click();
    await expect(page.getByRole("heading", { name: "Development", level: 1 })).toBeVisible();
    expect(await page.evaluate((point) => Boolean(document.elementFromPoint(8, point)?.closest(".whole-screen")), y)).toBe(true);
    await touchSequence(page, { x: 8, y }, { x: 108, y });
    await expect(page.getByRole("heading", { name: "Company", level: 1 })).toBeVisible();
  }
});

test("long press followed by an edge drag stays in reorder mode", async ({ page }) => {
  await createWhole(page, "Company");
  await addPart(page, "Development");
  await page.getByRole("button", { name: "Відкрити «Development»" }).click();
  await addPart(page, "Frontend");
  const card = page.getByRole("button", { name: "Відкрити «Frontend»" });
  await card.scrollIntoViewIfNeeded();
  const box = (await card.boundingBox())!;
  const cdp = await page.context().newCDPSession(page);
  try {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 20, y: box.y + box.height / 2 }] });
    await expect(page.locator(".structural-grid")).toHaveClass(/is-reordering/, { timeout: 2000 });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: 130, y: box.y + box.height / 2 }] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect(page.getByRole("heading", { name: "Development", level: 1 })).toBeVisible();
    await expect(page.getByRole("dialog", { name: "Frontend" })).toHaveCount(0);
  } finally {
    await cdp.detach();
  }
});

test("edge swipe on a card cancels long press and navigates to the root", async ({ page }) => {
  await createWhole(page, "Company");
  await addPart(page, "Development");
  await page.getByRole("button", { name: "Відкрити «Development»" }).click();
  await addPart(page, "Frontend");
  const card = page.getByRole("button", { name: "Відкрити «Frontend»" });
  await card.scrollIntoViewIfNeeded();
  const box = (await card.boundingBox())!;
  await touchSequence(page, { x: 20, y: box.y + box.height / 2 }, { x: 120, y: box.y + box.height / 2 });
  await expect(page.getByRole("heading", { name: "Company", level: 1 })).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Frontend" })).toHaveCount(0);
});

test("keyboard users can open a card and its actions", async ({ page }) => {
  await createWhole(page, "Company");
  await addPart(page, "Development");
  const open = page.getByRole("button", { name: "Відкрити «Development»" });
  const actions = page.getByRole("button", { name: "Дії для «Development»" });
  await page.locator("body").click({ position: { x: 1, y: 1 } });
  for (let i = 0; i < 30 && !(await open.evaluate(el => el === document.activeElement)); i++) await page.keyboard.press("Tab");
  await expect(open).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Зафіксувати частину" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(actions).toBeFocused();
  await expect(actions).toHaveCSS("outline-style", "solid");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "Development" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(actions).toBeFocused();
  await open.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Development", level: 1 })).toBeVisible();
});
