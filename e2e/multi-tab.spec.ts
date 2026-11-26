import { expect, test } from "./fixtures";
import { addPart, createWhole } from "./helpers";

test("a stale tab cannot overwrite another tab and can edit after reloading", async ({ context, page }) => {
  await createWhole(page, "Team");
  const second = await context.newPage();
  await second.addInitScript(() => {
    const add = window.addEventListener.bind(window);
    window.addEventListener = ((type: string, listener: EventListenerOrEventListenerObject | null, options?: boolean | AddEventListenerOptions) => {
      // Hold storage events to reproduce the race before the browser delivers them.
      if (type !== "storage" && listener) add(type, listener, options);
    }) as typeof window.addEventListener;
  });
  await second.goto("/");
  await second.getByRole("button", { name: "Відкрити ціле «Team»" }).click();
  await second.getByRole("button", { name: "Додати частину", exact: true }).click();
  const dialog = second.getByRole("dialog", { name: "Додати частину" });
  await dialog.getByLabel("Назва частини").fill("Stale edit");

  await addPart(page, "First edit");
  const saved = await page.evaluate(() => localStorage.getItem("hundred.document.v1"));
  await dialog.getByRole("button", { name: "Додати частину", exact: true }).click();
  await expect(second.getByText("Дані змінилися в іншій вкладці. Новішу версію завантажено, щоб не перезаписати зміни.").first()).toBeVisible();
  await second.waitForTimeout(3200);
  await expect(second.locator(".save-status [role=alert]").filter({ hasText: "Дані змінилися в іншій вкладці" })).toBeVisible();
  expect(await second.evaluate(() => localStorage.getItem("hundred.document.v1"))).toBe(saved);
  await expect(second.getByRole("button", { name: "Відкрити «First edit»" })).toBeVisible();
  await second.keyboard.press("Escape");
  await addPart(second, "Second edit");
  await expect(page.getByRole("button", { name: "Відкрити «Second edit»" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Відкрити «First edit»" })).toBeVisible();
});

test("a storage event immediately followed by an action cannot use the old render", async ({ page }) => {
  await createWhole(page, "Team");
  await page.getByRole("button", { name: "Додати частину", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Додати частину" });
  await dialog.getByLabel("Назва частини").fill("Old render");
  await page.evaluate(() => {
    const key = "hundred.document.v1";
    const stored = JSON.parse(localStorage.getItem(key)!);
    stored.documents[0].root.children.push({ id: crypto.randomUUID(), name: "Remote", mode: "structural", weight: 1, children: [] });
    stored.revision = crypto.randomUUID();
    const raw = JSON.stringify(stored);
    localStorage.setItem(key, raw);
    window.dispatchEvent(new StorageEvent("storage", { key, newValue: raw }));
    const submit = [...document.querySelectorAll<HTMLButtonElement>("dialog button")].find(button => button.textContent === "Додати частину");
    submit?.click();
  });
  await expect(page.getByRole("button", { name: "Відкрити «Remote»" })).toBeVisible();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("hundred.document.v1")!));
  expect(stored.documents[0].root.children.map((node: { name: string }) => node.name)).toEqual(["Remote"]);
  await expect(page.getByText("Дані оновлено в іншій вкладці. Історію дій очищено.")).toBeVisible();
});
