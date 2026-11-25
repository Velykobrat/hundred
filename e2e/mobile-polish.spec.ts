import { expect, test } from "./fixtures";
import { addPart, createWhole } from "./helpers";

test("Settings signature links only the wordmark and remains usable in both themes", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Налаштування" }).click();
  const footer = page.locator(".settings-signature");
  const link = footer.getByRole("link", { name: "Відкрити сайт BeBetter" });
  await expect(footer.getByRole("link")).toHaveCount(1);
  await expect(link).toHaveAttribute("href", "https://bebetter-development.vercel.app/");
  await expect(link).toHaveAttribute("target", "_blank");
  await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  for (const theme of ["dark", "light"]) {
    await page.locator("#hundred-theme").selectOption(theme);
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    const product = (await footer.locator("strong").boundingBox())!;
    const copyright = (await footer.getByText("© 2026").boundingBox())!;
    const maker = (await footer.locator(".maker").boundingBox())!;
    expect(maker.x).toBeGreaterThan(copyright.x + copyright.width);
    expect(product.x).toBeGreaterThan(maker.x + maker.width);
    expect(maker.x - copyright.x - copyright.width).toBeLessThanOrEqual(8);
    expect(Math.abs(copyright.y + copyright.height / 2 - maker.y - maker.height / 2)).toBeLessThan(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(link).toBeVisible();
  }
  await page.locator("#hundred-theme").focus();
  for (let i = 0; i < 30 && !(await link.evaluate(element => document.activeElement === element)); i++) await page.keyboard.press("Tab");
  await expect(link).toBeFocused();
  await expect(link).toHaveCSS("outline-style", "solid");
  await page.context().route("https://bebetter-development.vercel.app/**", route => route.fulfill({ status: 200, body: "BeBetter" }));
  const [popup] = await Promise.all([page.waitForEvent("popup"), page.keyboard.press("Enter")]);
  await popup.waitForURL("https://bebetter-development.vercel.app/");
  await popup.close();
  await page.locator("#hundred-language").selectOption("en");
  await expect(footer.getByRole("link", { name: "Open the BeBetter website" })).toBeVisible();
});

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

test("name counter updates for creation and editing without changing the limit", async ({ page }) => {
  await page.goto("/");
  await page.locator(".home-header-create").click();
  const name = page.getByLabel("Назва", { exact: true });
  await expect(page.getByText("0 / 120")).toBeVisible();
  await name.fill("Company");
  await expect(page.getByText("7 / 120")).toBeVisible();
  await name.fill("x".repeat(120));
  await name.pressSequentially("y");
  await expect(name).toHaveValue("x".repeat(120));
  await expect(page.getByText("120 / 120")).toBeVisible();
  await name.fill("Company");
  await page.getByRole("button", { name: "Створити ціле", exact: true }).click();
  await page.getByRole("button", { name: "Дії для «Company»" }).click();
  await page.getByRole("button", { name: "Редагувати ціле" }).click();
  await expect(page.getByRole("dialog").getByText("7 / 120")).toBeVisible();
});

test("actions dismiss via backdrop, repeated trigger location, Escape and selection", async ({ page }) => {
  await createWhole(page, "Company");
  await addPart(page, "Development");
  await addPart(page, "Marketing");
  const first = page.getByRole("button", { name: "Дії для «Development»" });
  const second = page.getByRole("button", { name: "Дії для «Marketing»" });
  await first.click();
  const menu = page.getByRole("dialog", { name: "Development" });
  await expect(menu).toBeVisible();
  await page.mouse.click(5, 5);
  await expect(menu).toHaveCount(0);
  await expect(first).toBeFocused();
  await first.click();
  await page.keyboard.press("Escape");
  await expect(menu).toHaveCount(0);
  const rootActions = page.getByRole("button", { name: "Дії для «Company»" });
  await rootActions.click();
  const rootMenu = page.getByRole("dialog", { name: "Company" });
  const box = (await rootActions.boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(rootMenu).toHaveCount(0);
  await second.click();
  const otherMenu = page.getByRole("dialog", { name: "Marketing" });
  await expect(otherMenu).toBeVisible();
  await expect(menu).toHaveCount(0);
  await otherMenu.getByRole("button", { name: "Перемістити вище" }).click();
  await expect(otherMenu).toHaveCount(0);
});

test("actions menu consumes the first tap on outside controls", async ({ page }) => {
  await createWhole(page, "Company");
  await addPart(page, "Development");
  const actions = page.getByRole("button", { name: "Дії для «Company»" });
  const levelsButton = page.getByRole("button", { name: "Відкрити навігацію по рівнях" });
  const levelsBox = (await levelsButton.boundingBox())!;
  await actions.tap();
  await expect(page.getByRole("dialog", { name: "Company" })).toBeVisible();
  await page.touchscreen.tap(levelsBox.x + levelsBox.width / 2, levelsBox.y + levelsBox.height / 2);
  await expect(page.getByRole("dialog", { name: "Company" })).toHaveCount(0);
  await expect(page.getByRole("dialog", { name: "Рівні цілого" })).toHaveCount(0);
  await levelsButton.tap();
  await expect(page.getByRole("dialog", { name: "Рівні цілого" })).toBeVisible();
  await page.keyboard.press("Escape");
  const home = page.getByRole("button", { name: "Головна", exact: true });
  const homeBox = (await home.boundingBox())!;
  await actions.tap();
  await page.touchscreen.tap(homeBox.x + homeBox.width / 2, homeBox.y + homeBox.height / 2);
  await expect(page.getByRole("heading", { name: "Company", level: 1 })).toBeVisible();
  await home.tap();
  await expect(page.getByRole("button", { name: "Відкрити ціле «Company»" })).toBeVisible();
});

test("Levels consumes the first outside tap before navigation or actions", async ({ page }) => {
  await createWhole(page, "Company");
  await addPart(page, "Development");
  await page.getByRole("button", { name: "Відкрити «Development»" }).tap();
  const trigger = page.getByRole("button", { name: "Відкрити навігацію по рівнях" });
  const parent = page.getByRole("button", { name: "До батьківського рівня «Company»" });
  const parentBox = (await parent.boundingBox())!;
  const triggerBox = (await trigger.boundingBox())!;
  const levels = page.getByRole("dialog", { name: "Рівні цілого" });
  await trigger.tap();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(levels).toBeVisible();
  await page.touchscreen.tap(5, 5);
  await expect(levels).toHaveCount(0);
  await trigger.tap();
  await page.touchscreen.tap(triggerBox.x + triggerBox.width / 2, triggerBox.y + triggerBox.height / 2);
  await expect(levels).toHaveCount(0);
  await trigger.tap();
  await page.keyboard.press("Escape");
  await expect(levels).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.tap();
  await page.touchscreen.tap(parentBox.x + parentBox.width / 2, parentBox.y + parentBox.height / 2);
  await expect(levels).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Development", level: 1 })).toBeVisible();
  await parent.tap();
  await expect(page.getByRole("heading", { name: "Company", level: 1 })).toBeVisible();
});

test("Settings puts the guide first and omits redundant copy in both languages", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Налаштування", exact: true }).tap();
  await expect(page.locator(".settings-panel > section h2")).toHaveText(["Як користуватися Hundred", "Вигляд", "Дані на цьому пристрої", "Резервні копії"]);
  await expect(page.getByText("Збереження та перенесення твоїх цілих.")).toHaveCount(0);
  await expect(page.getByText("Очищення даних сайту видалить локальні цілі. Імпорт додає копії та зберігає наявні цілі.")).toHaveCount(0);
  await page.getByLabel("Мова інтерфейсу").selectOption("en");
  await expect(page.locator(".settings-panel > section h2")).toHaveText(["How to use Hundred", "Appearance", "Data on this device", "Backups"]);
  await expect(page.getByText("Save and transfer your wholes.")).toHaveCount(0);
  await expect(page.getByText("Clearing site data will delete local wholes. Import adds copies and keeps existing wholes.")).toHaveCount(0);
});

test("mobile floating add follows the regular action and avoids navigation", async ({ page }) => {
  await createWhole(page, "Company");
  for (let i = 1; i <= 11; i++) await addPart(page, `Part ${i}`);
  const regular = page.locator(".add-part-button");
  const floating = page.locator(".add-part-floating");
  await regular.scrollIntoViewIfNeeded();
  await expect(floating).toHaveCount(0);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(floating).toBeVisible();
  const fabBox = (await floating.boundingBox())!;
  const navBox = (await page.locator(".bottom-navigation").boundingBox())!;
  expect(fabBox.y + fabBox.height).toBeLessThanOrEqual(navBox.y);
  await floating.click();
  await expect(page.getByRole("dialog", { name: "Додати частину" })).toBeVisible();
  await page.keyboard.press("Escape");
  await regular.scrollIntoViewIfNeeded();
  await expect(floating).toHaveCount(0);
});

test("floating add is absent when a measured whole is fully allocated", async ({ page }) => {
  await createWhole(page, "Budget", "10");
  await addPart(page, "Everything", "10");
  await expect(page.locator(".add-part-button")).toBeDisabled();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(page.locator(".add-part-floating")).toHaveCount(0);
});

test("mobile Home header stays visible, scrolls to top and opens creation", async ({ page }) => {
  await createWhole(page, "Company");
  await page.getByRole("button", { name: "Головна", exact: true }).click();
  for (let i = 1; i <= 5; i++) {
    await page.locator(".home-header-create").click();
    await page.getByLabel("Назва", { exact: true }).fill(`Whole ${i}`);
    await page.getByRole("button", { name: "Створити ціле", exact: true }).click();
    await page.getByRole("button", { name: "Головна", exact: true }).click();
  }
  const header = page.locator(".home-header");
  const brand = header.locator(".brand");
  const create = header.locator(".home-header-create");
  const a = (await brand.boundingBox())!;
  const b = (await create.boundingBox())!;
  expect(b.width).toBeGreaterThanOrEqual(48);
  expect(b.height).toBe(48);
  await expect(create).toHaveAccessibleName("Нове ціле");
  await expect(create.locator("span")).toHaveText("Нове ціле");
  await expect(create).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  expect(Math.abs(a.y + a.height / 2 - b.y - b.height / 2)).toBeLessThan(2);
  await expect(page.locator(".whole-search-create")).toBeHidden();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  await expect(header).toBeInViewport();
  await page.evaluate(() => {
    const scroll = window.scrollTo.bind(window);
    window.scrollTo = ((options: ScrollToOptions) => { (window as unknown as { lastScroll: ScrollToOptions }).lastScroll = options; scroll(options); }) as typeof window.scrollTo;
  });
  await brand.click();
  expect(await page.evaluate(() => (window as unknown as { lastScroll: ScrollToOptions }).lastScroll.behavior)).toBe("smooth");
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await brand.click();
  expect(await page.evaluate(() => (window as unknown as { lastScroll: ScrollToOptions }).lastScroll.behavior)).toBe("instant");
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await brand.focus();
  await page.keyboard.press("Tab");
  await expect(create).toBeFocused();
  await expect(create).toHaveCSS("outline-style", "solid");
  await create.press("Enter");
  await expect(page.getByRole("heading", { name: "Нове ціле" })).toBeVisible();
});
