import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const key = "hundred.document.v1";
    if (localStorage.getItem(key)) return;
    const structure = (id: string, name: string) => ({ id, name, mode: "structural", weight: 1, children: [] });
    const company = { ...structure("company", "Company"), children: [structure("dev", "Development")] };
    const budget = { id: "budget", name: "Monthly Budget", mode: "measured", value: 50000, unit: "грн", children: [{ id: "food", name: "Food", mode: "measured", value: 10000, unit: "грн", children: [] }] };
    const learning = structure("learning", "Learning roadmap");
    const long = structure("long", "A remarkably long whole name without gaps for checking mobile layout");
    const documents = [company, budget, learning, long].map(root => ({ root, pathIds: [root.id] }));
    localStorage.setItem(key, JSON.stringify({ version: 3, documents, activeId: null }));
  });
});

test("keyboard actions reorder saved Wholes, respect boundaries and persist", async ({ page }) => {
  await page.goto("/");
  const names = page.locator(".resource-library-grid .resource-card-name");
  const companyActions = page.getByRole("button", { name: "Дії для «Company»" });
  await companyActions.focus();
  await page.keyboard.press("Enter");
  const companyMenu = page.getByRole("dialog", { name: "Company" });
  await expect(companyMenu.getByRole("button", { name: "Перемістити вище" })).toBeDisabled();
  const down = companyMenu.getByRole("button", { name: "Перемістити нижче" });
  await down.focus();
  await expect(down).toHaveCSS("outline-style", "solid");
  await page.keyboard.press("Enter");
  await expect(companyMenu).not.toBeVisible();
  await expect(companyActions).toBeFocused();
  await expect(names).toHaveText(["Monthly Budget", "Company", "Learning roadmap", "A remarkably long whole name without gaps for checking mobile layout"]);
  await page.reload();
  await expect(names.nth(1)).toHaveText("Company");
  await companyActions.focus();
  await page.keyboard.press("Enter");
  const up = companyMenu.getByRole("button", { name: "Перемістити вище" });
  await up.focus();
  await page.keyboard.press("Enter");
  await expect(names.first()).toHaveText("Company");
  const lastActions = page.getByRole("button", { name: "Дії для «A remarkably long whole name without gaps for checking mobile layout»" });
  await lastActions.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog").getByRole("button", { name: "Перемістити нижче" })).toBeDisabled();
  await page.keyboard.press("Escape");
  await page.reload();
  await expect(names.first()).toHaveText("Company");
  await page.getByRole("button", { name: "Налаштування", exact: true }).click();
  await page.locator("#hundred-language").selectOption("en");
  await page.getByRole("button", { name: "Home", exact: true }).click();
  await page.getByRole("button", { name: "Actions for “Company”" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog").getByRole("button", { name: "Move up" })).toBeDisabled();
  await expect(page.getByRole("dialog").getByRole("button", { name: "Move down" })).toBeEnabled();
});

test("compact mobile grid shows structure and measured progress without overflow", async ({ page }) => {
  await page.goto("/");
  const cards = page.locator(".resource-library-grid .resource-card");
  await expect(cards).toHaveCount(4);
  const a = (await cards.nth(0).boundingBox())!;
  const b = (await cards.nth(1).boundingBox())!;
  expect(a.y).toBe(b.y);
  expect(b.x).toBeGreaterThan(a.x + a.width);
  await expect(cards.nth(0).locator(".resource-card-compact-meta")).toContainText("1 частин · 2 рівні");
  await expect(cards.nth(1).locator(".resource-card-value")).toContainText("грн");
  await expect(cards.nth(1).locator(".resource-card-compact-meta")).toContainText("20%");
  await expect(cards.nth(1).locator(".usage-track")).toBeVisible();
  await expect(cards.last().locator(".resource-card-name")).toHaveCSS("-webkit-line-clamp", "3");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.setViewportSize({ width: 360, height: 844 });
  expect((await cards.nth(0).boundingBox())!.y).toBe((await cards.nth(1).boundingBox())!.y);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const last = (await cards.last().boundingBox())!;
  const nav = (await page.locator(".bottom-navigation").boundingBox())!;
  expect(last.y + last.height).toBeLessThanOrEqual(nav.y);
  await expect(page.locator(".home-header")).toBeInViewport();
});

test("mouse drag reorders and focusing search exits reorder mode", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const cards = page.locator(".resource-library-grid .resource-card");
  await expect(cards).toHaveCount(4);
  const source = (await cards.nth(2).boundingBox())!;
  const target = (await cards.nth(0).boundingBox())!;
  await page.mouse.move(source.x + 40, source.y + 50);
  await page.mouse.down();
  await expect(page.locator(".resource-library-grid")).toHaveClass(/is-reordering/, { timeout: 2000 });
  await page.mouse.up();
  await page.getByRole("searchbox").focus();
  await expect(page.locator(".resource-library-grid")).not.toHaveClass(/is-reordering/);
  await page.mouse.move(source.x + 40, source.y + 50);
  await page.mouse.down();
  await expect(page.locator(".resource-library-grid")).toHaveClass(/is-reordering/, { timeout: 2000 });
  await page.mouse.move(target.x + 40, target.y + 50);
  await page.mouse.up();
  await expect(cards.first().locator(".resource-card-name")).toHaveText("Learning roadmap");
});

test("long press and drag reorder Wholes and persist through undo, redo and reload", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const cards = page.locator(".resource-library-grid .resource-card");
  await expect(cards).toHaveCount(4);
  const source = (await cards.nth(2).boundingBox())!;
  const target = (await cards.nth(0).boundingBox())!;
  const cdp = await page.context().newCDPSession(page);
  try {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: source.x + source.width / 2, y: source.y + 55 }] });
    await expect(page.locator(".resource-library-grid")).toHaveClass(/is-reordering/, { timeout: 2000 });
    await expect(page.locator(".resource-card.is-dragging")).toHaveCount(1);
    await expect(cards.first()).toHaveCSS("animation-name", "none");
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: target.x + target.width / 2, y: target.y + 55 }] });
    await expect(page.locator(".resource-card.is-drop-target")).toHaveCount(1);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  } finally { await cdp.detach(); }
  await expect(cards.locator(".resource-card-name")).toHaveText(["Learning roadmap", "Company", "Monthly Budget", "A remarkably long whole name without gaps for checking mobile layout"]);
  await expect(page.locator(".resource-library-grid")).not.toHaveClass(/is-reordering/);
  await cards.first().tap();
  await expect(page.getByRole("heading", { name: "Learning roadmap", level: 1 })).toBeVisible();
  await page.getByRole("button", { name: "Скасувати останню зміну" }).tap();
  await page.getByRole("button", { name: "Повторити скасовану зміну" }).tap();
  await page.getByRole("button", { name: "Головна", exact: true }).tap();
  await page.reload();
  await expect(cards.first().locator(".resource-card-name")).toHaveText("Learning roadmap");
});

test("scroll and search do not reorder Wholes", async ({ page }) => {
  await page.goto("/");
  const cards = page.locator(".resource-library-grid .resource-card");
  await expect(cards).toHaveCount(4);
  const box = (await cards.first().boundingBox())!;
  const cdp = await page.context().newCDPSession(page);
  try {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: box.x + 40, y: box.y + 70 }] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: box.x + 40, y: box.y - 60 }] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  } finally { await cdp.detach(); }
  await expect(page.locator(".resource-library-grid")).not.toHaveClass(/is-reordering/);
  await page.getByRole("searchbox").fill("Budget");
  await expect(page.locator(".resource-library-grid")).toHaveCount(0);
  await expect(page.locator(".whole-search-results")).toContainText("Monthly Budget");
  await page.getByRole("searchbox").fill("");
  await expect(cards.first().locator(".resource-card-name")).toHaveText("Company");
});

test("Whole actions open from Home without opening or reordering the card", async ({ page }) => {
  await page.goto("/");
  const card = page.locator(".resource-card").filter({ has: page.getByRole("button", { name: "Відкрити ціле «Company»" }) });
  const actions = card.getByRole("button", { name: "Дії для «Company»" });
  await expect(actions).toBeVisible();
  const bounds = (await actions.boundingBox())!;
  expect(bounds.width).toBeGreaterThanOrEqual(44);
  expect(bounds.height).toBeGreaterThanOrEqual(44);
  await actions.focus();
  await page.keyboard.press("Enter");
  const menu = page.getByRole("dialog", { name: "Company" });
  await expect(menu).toBeVisible();
  await expect(page.locator(".resource-library")).toBeVisible();
  await expect(page.locator(".resource-library-grid")).not.toHaveClass(/is-reordering/);
  await page.keyboard.press("Escape");
  await expect(actions).toBeFocused();
  const cdp = await page.context().newCDPSession(page);
  try {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }] });
    await page.waitForTimeout(600);
    await expect(page.locator(".resource-library-grid")).not.toHaveClass(/is-reordering/);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  } finally { await cdp.detach(); }
  await expect(menu).toBeVisible();
  await menu.getByRole("button", { name: "Редагувати ціле" }).tap();
  const edit = page.getByRole("dialog", { name: "Редагувати ціле" });
  await edit.getByLabel("Назва частини").fill("Company updated");
  await edit.getByRole("button", { name: "Зберегти зміни" }).tap();
  await expect(page.getByRole("button", { name: "Відкрити ціле «Company updated»" })).toBeVisible();
  await page.getByRole("button", { name: "Дії для «Company updated»" }).tap();
  await expect(page.getByRole("dialog", { name: "Company updated" })).toBeVisible();
  await page.touchscreen.tap(5, 5);
  await expect(page.getByRole("dialog", { name: "Company updated" })).not.toBeVisible();
  await expect(page.locator(".resource-library")).toBeVisible();
  await page.getByRole("button", { name: "Відкрити ціле «Company updated»" }).tap();
  await expect(page.getByRole("heading", { name: "Company updated", level: 1 })).toBeVisible();
});
