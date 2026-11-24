import { expect, test } from "@playwright/test";
import { addPart, createWhole } from "./helpers";

test("creation, duplication and import persist when randomUUID is unavailable", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(crypto, "randomUUID", { configurable: true, value: undefined }));
  await createWhole(page, "Existing");
  await addPart(page, "Existing part");
  await page.getByRole("button", { name: "Дії для «Existing»" }).click();
  await page.getByRole("button", { name: "Створити копію цілого" }).click();
  await expect(page.getByRole("heading", { name: "Копія — Existing", level: 1 })).toBeVisible();
  await page.getByRole("button", { name: "Налаштування", exact: true }).click();
  await page.getByRole("button", { name: /Імпортувати файл/ }).click();
  const dialog = page.getByRole("dialog", { name: "Імпорт резервної копії" });
  const root = { id: "original-root", name: "Imported", mode: "structural", weight: 1, children: [{ id: "original-child", name: "Imported part", mode: "structural", weight: 1, children: [] }] };
  await dialog.getByLabel("Файл резервної копії").setInputFiles({ name: "backup.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify({ version: 3, activeId: root.id, documents: [{ root, pathIds: [root.id] }] })) });
  await expect(dialog.getByText("Imported", { exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "Додати цілі" }).click();
  await expect(page.getByRole("heading", { name: "Imported", level: 1 })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Imported", level: 1 })).toBeVisible();
  await expect(page.getByRole("button", { name: "Відкрити «Imported part»" })).toBeVisible();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("hundred.document.v1")!));
  const imported = stored.documents.find((document: { root: { name: string } }) => document.root.name === "Imported");
  expect(imported.root.id).not.toBe("original-root");
  expect(imported.root.children[0].id).not.toBe("original-child");
  expect(stored.documents).toHaveLength(3);
  expect(stored.revision).toMatch(/^[0-9a-f-]{36}$/);
});
