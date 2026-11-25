import { test as base, expect } from "@playwright/test";

export const test = base.extend({
  page: async ({ page }, runWithPage) => {
    await page.addInitScript(() => {
      const key = "hundred.document.v1";
      if (localStorage.getItem(key) === null) localStorage.setItem(key, JSON.stringify({ version: 3, documents: [], activeId: null }));
    });
    await runWithPage(page);
  },
});
export { expect };
