import { expect, test, type Locator } from "@playwright/test";
import { addPart, createWhole } from "./helpers";

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

async function expectTwoColumns(cards: Locator) {
  const first = (await cards.nth(0).boundingBox())!;
  const second = (await cards.nth(1).boundingBox())!;
  expect(second.x).toBeGreaterThan(first.x + first.width);
  expect(Math.abs(second.y - first.y)).toBeLessThan(2);
}

test("compact structural cards fit at mobile widths on root and nested levels", async ({ page }) => {
  await createWhole(page, "Company");
  const longName = "A very long structural part name that should remain inside its compact card";
  await addPart(page, longName);
  await addPart(page, "Operations");
  const cards = page.locator(".structural-card");
  for (const width of [390, 360, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await expectTwoColumns(cards);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const card = cards.first();
    const title = card.locator("strong");
    await expect(title).toHaveCSS("-webkit-line-clamp", "3");
    const box = (await card.boundingBox())!;
    const nameBox = (await title.boundingBox())!;
    expect(nameBox.x + nameBox.width).toBeLessThanOrEqual(box.x + box.width);
    expect(nameBox.y + nameBox.height).toBeLessThanOrEqual(box.y + box.height);
    const lock = (await card.locator(".part-lock").boundingBox())!;
    const actions = (await card.locator(".structural-card-actions").boundingBox())!;
    expect(lock.width).toBeGreaterThanOrEqual(44);
    expect(lock.height).toBeGreaterThanOrEqual(44);
    expect(actions.width).toBeGreaterThanOrEqual(43.99);
    expect(actions.height).toBeGreaterThanOrEqual(44);
    expect(lock.x + lock.width).toBeLessThanOrEqual(actions.x);
    expect(lock.x).toBeGreaterThanOrEqual(box.x);
    expect(actions.x + actions.width).toBeLessThanOrEqual(box.x + box.width);
  }
  await page.setViewportSize({ width: 319, height: 844 });
  const first = (await cards.nth(0).boundingBox())!;
  const second = (await cards.nth(1).boundingBox())!;
  expect(second.y).toBeGreaterThanOrEqual(first.y + first.height);
  await page.setViewportSize({ width: 390, height: 844 });
  await cards.first().getByRole("button", { name: "Зафіксувати частину" }).tap();
  await expect(cards.first().getByRole("button", { name: "Зняти фіксацію" })).toHaveAttribute("aria-pressed", "true");
  await cards.first().getByRole("button", { name: `Дії для «${longName}»` }).tap();
  await expect(page.getByRole("dialog", { name: longName })).toBeVisible();
  await page.keyboard.press("Escape");
  await cards.first().getByRole("button", { name: "Зняти фіксацію" }).tap();
  await page.getByRole("button", { name: `Відкрити «${longName}»` }).tap();
  await addPart(page, "Frontend");
  await addPart(page, "Backend");
  await expectTwoColumns(page.locator(".structural-card"));
  await page.getByRole("button", { name: "Список", exact: true }).tap();
  await expect(page.locator(".structural-grid")).toHaveCount(0);
  await expect(page.locator(".parts-panel")).toBeVisible();
  const rows = page.locator(".parts-panel").getByRole("button", { name: /Відкрити «/ });
  const row1 = (await rows.nth(0).boundingBox())!;
  const row2 = (await rows.nth(1).boundingBox())!;
  expect(row2.y).toBeGreaterThanOrEqual(row1.y + row1.height);
});

test("long press drags a structural part from bottom right to top left and saves the order", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await createWhole(page, "Company");
  for (const name of ["Development", "Marketing", "Operations", "Support"]) await addPart(page, name);
  const cards = page.locator(".structural-card");
  const source = (await cards.nth(3).locator(".structural-card-open").boundingBox())!;
  const target = (await cards.nth(0).locator(".structural-card-open").boundingBox())!;
  expect(source.x).toBeGreaterThan(target.x);
  expect(source.y).toBeGreaterThan(target.y);
  const cdp = await page.context().newCDPSession(page);
  try {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: source.x + 25, y: source.y + 80 }] });
    await expect(page.locator(".structural-grid")).toHaveClass(/is-reordering/, { timeout: 2000 });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: target.x + 25, y: target.y + 80 }] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  } finally { await cdp.detach(); }
  await expect(page.getByRole("heading", { name: "Company", level: 1 })).toBeVisible();
  await expect(cards.locator("strong")).toHaveText(["Support", "Development", "Marketing", "Operations"]);
  await page.reload();
  await expect(cards.locator("strong")).toHaveText(["Support", "Development", "Marketing", "Operations"]);
});

test("measured wholes retain the treemap and parts list", async ({ page }) => {
  await createWhole(page, "Budget", "100");
  await addPart(page, "Food", "40");
  await expect(page.locator(".map-tile").filter({ hasText: "Food" })).toBeVisible();
  await expect(page.locator(".parts-panel")).toBeVisible();
  await expect(page.locator(".structural-grid")).toHaveCount(0);
});
