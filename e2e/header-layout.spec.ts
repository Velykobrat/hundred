import { expect, test } from "@playwright/test";
import { addPart } from "./helpers";

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

test("mobile header geometry stays consistent across main screens", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.locator(".resource-library")).toBeVisible();
  const header = page.locator(".app-header");
  const brand = header.locator(".brand");
  const actions = header.locator(".app-header-actions");
  const homeHeader = (await header.boundingBox())!;
  const homeBrand = (await brand.boundingBox())!;
  const homeActions = (await actions.boundingBox())!;
  expect(homeHeader.height).toBe(64);
  expect(homeBrand.x).toBe(16);
  await page.screenshot({ path: testInfo.outputPath("header-home.png") });

  async function verify(screen: string) {
    const h = (await header.boundingBox())!;
    const b = (await brand.boundingBox())!;
    const a = (await actions.boundingBox())!;
    expect(h).toEqual(homeHeader);
    expect(b).toEqual(homeBrand);
    expect(a.y + a.height / 2).toBe(homeActions.y + homeActions.height / 2);
    expect(a.x + a.width).toBe(homeActions.x + homeActions.width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`header-${screen}.png`) });
  }

  await page.locator(".home-header-create").tap();
  await page.getByLabel("Назва", { exact: true }).fill("Company");
  await page.getByRole("button", { name: "Створити ціле", exact: true }).tap();
  await expect(page.getByRole("heading", { name: "Company", level: 1 })).toBeVisible();
  const undo = page.getByRole("button", { name: "Скасувати останню зміну" });
  const redo = page.getByRole("button", { name: "Повторити скасовану зміну" });
  await expect(undo).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(undo).toHaveCSS("border-top-width", "0px");
  await expect(redo).toBeDisabled();
  const undoBox = (await undo.boundingBox())!;
  expect(undoBox.width).toBeGreaterThanOrEqual(44);
  expect(undoBox.height).toBeGreaterThanOrEqual(44);
  await verify("whole");
  await brand.focus();
  await page.keyboard.press("Tab");
  await expect(undo).toBeFocused();
  await expect(undo).toHaveCSS("outline-style", "solid");
  const nav = (await page.locator(".level-navigation").boundingBox())!;
  expect(nav.y).toBeGreaterThanOrEqual(homeHeader.y + homeHeader.height);
  await addPart(page, "Development");
  await page.getByRole("button", { name: "Відкрити «Development»" }).tap();
  await expect(page.getByRole("heading", { name: "Development", level: 1 })).toBeVisible();
  await verify("nested");
  await page.getByRole("button", { name: "Налаштування", exact: true }).tap();
  await expect(page.getByRole("heading", { name: "Налаштування", level: 1 })).toBeVisible();
  await verify("settings");
});
