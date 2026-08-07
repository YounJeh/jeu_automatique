import { test, expect } from "@playwright/test";

test("la page se charge et sert le shell applicatif", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#app-shell")).toBeVisible();
});
