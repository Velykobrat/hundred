import { expect, test, type Locator, type Page } from "@playwright/test";
import { addPart } from "./helpers";

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

async function expectSafeInitialFocus(page: Page, dialog: Locator, name: Locator) {
  await expect(dialog).toBeVisible();
  await expect(name).not.toBeFocused();
  await expect(dialog.getByRole("button", { name: "Закрити вікно" })).toBeFocused();
  expect(await dialog.evaluate(element => element.contains(document.activeElement))).toBe(true);
  await name.tap();
  await expect(name).toBeFocused();
}

test("touch forms do not autofocus text and dialogs restore focus", async ({ page }) => {
  await page.goto("/");
  await page.locator(".home-header-create").tap();
  const wholeName = page.getByLabel("Назва", { exact: true });
  await expect(wholeName).not.toBeFocused();
  await wholeName.tap();
  await expect(wholeName).toBeFocused();
  await wholeName.fill("Company");
  await page.getByRole("button", { name: "Створити ціле", exact: true }).tap();

  const add = page.locator(".add-part-button");
  await add.tap();
  const createDialog = page.getByRole("dialog", { name: "Додати частину" });
  await expectSafeInitialFocus(page, createDialog, createDialog.getByLabel("Назва частини"));
  await page.keyboard.press("Escape");
  await expect(createDialog).not.toBeVisible();
  await expect(add).toBeFocused();
  await addPart(page, "Development");

  const partActions = page.getByRole("button", { name: "Дії для «Development»" });
  await partActions.tap();
  await page.getByRole("dialog", { name: "Development" }).getByRole("button", { name: "Редагувати частину" }).tap();
  const editPart = page.getByRole("dialog", { name: "Редагувати частину" });
  await expectSafeInitialFocus(page, editPart, editPart.getByLabel("Назва частини"));
  await page.keyboard.press("Escape");
  await expect(partActions).toBeFocused();

  const wholeActions = page.getByRole("button", { name: "Дії для «Company»" });
  await wholeActions.tap();
  await page.getByRole("dialog", { name: "Company" }).getByRole("button", { name: "Редагувати ціле" }).tap();
  const editWhole = page.getByRole("dialog", { name: "Редагувати ціле" });
  await expectSafeInitialFocus(page, editWhole, editWhole.getByLabel("Назва частини"));
  await editWhole.getByRole("button", { name: "Закрити вікно" }).tap();
  await expect(editWhole).not.toBeVisible();
  await expect(wholeActions).toBeFocused();
});
