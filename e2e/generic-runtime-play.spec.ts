import { test, expect, type Page } from "@playwright/test";

// PHASE 7 Task 7: exercises GameController's GenericRuntime branch. Mastra's
// dev server only allows one instance per project (.mastra/dev.lock), so
// this can't spin up its own flag-ON server alongside the shared one used
// by the rest of the e2e suite. Instead it reads the flag actually served
// by whichever server is running and skips itself when it's off — the
// default `pnpm test:e2e` stays a deterministic flag-off run (see
// playwright.config.ts), and this suite is meaningfully exercised by
// running `GENERIC_RUNTIME_ENABLED=true pnpm test:e2e` explicitly.
async function skipUnlessGenericRuntimeEnabled(page: Page): Promise<void> {
  await page.goto("/");
  const flag = await page.evaluate(
    () =>
      (window as unknown as { __GENERIC_RUNTIME_ENABLED__?: boolean })
        .__GENERIC_RUNTIME_ENABLED__,
  );
  test.skip(
    flag !== true,
    "run with GENERIC_RUNTIME_ENABLED=true pnpm test:e2e to exercise this suite",
  );
}

test.describe("parcours jouer (GenericRuntime)", () => {
  test("dodge-game (générique) est jouable sans erreur", async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on("pageerror", (error) => pageErrors.push(error));

    await skipUnlessGenericRuntimeEnabled(page);

    await expect(page.locator("#game-title")).toHaveText("Meteor Dodge");
    await expect(page.locator("#game-canvas")).toBeVisible();
    await page.keyboard.down("ArrowLeft");
    await page.waitForTimeout(300);
    await page.keyboard.up("ArrowLeft");
    await expect(page.locator("#game-status")).toContainText("Score");
    expect(pageErrors).toEqual([]);
  });

  test("collect-game (générique) est jouable sans erreur", async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on("pageerror", (error) => pageErrors.push(error));

    await skipUnlessGenericRuntimeEnabled(page);
    await page.locator('[data-game-id="collect-game"]').click();

    await expect(page.locator("#game-title")).toHaveText("Crystal Collector");
    await page.keyboard.down("ArrowRight");
    await page.waitForTimeout(300);
    await page.keyboard.up("ArrowRight");
    await expect(page.locator("#game-status")).toContainText("Score");
    expect(pageErrors).toEqual([]);
  });

  test("shooter-game reste sur le moteur legacy même flag ON", async ({
    page,
  }) => {
    const pageErrors: Error[] = [];
    page.on("pageerror", (error) => pageErrors.push(error));

    await skipUnlessGenericRuntimeEnabled(page);
    await page.locator('[data-game-id="shooter-game"]').click();

    await expect(page.locator("#game-title")).toHaveText("Alien Blaster");
    await page.keyboard.down("Space");
    await page.waitForTimeout(300);
    await page.keyboard.up("Space");
    await expect(page.locator("#game-status")).toContainText("Score");
    expect(pageErrors).toEqual([]);
  });

  test("restart répété ne casse pas l'UI en mode générique", async ({
    page,
  }) => {
    const pageErrors: Error[] = [];
    page.on("pageerror", (error) => pageErrors.push(error));

    await skipUnlessGenericRuntimeEnabled(page);

    await page.locator("#restart-button").click();
    await page.locator("#restart-button").click();
    await page.locator("#restart-button").click();

    await expect(page.locator("#game-status")).toContainText("Score");
    expect(pageErrors).toEqual([]);
  });
});
