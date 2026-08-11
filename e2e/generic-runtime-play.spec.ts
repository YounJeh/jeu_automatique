import { test, expect, type Page, type Route } from "@playwright/test";
import type { GenerateGameResponse } from "../src/mastra/schemas/generate-game-api-schema.js";
import { dodgeGameDefinitionExample } from "../src/game/definition/examples/dodge-game-definition.js";

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

  // PHASE 7 Task 11: a definition-only generated item (mechanics ->
  // GameDefinition pipeline) has no legacy config at all — this proves
  // the full path end to end: API response -> saved catalog item ->
  // played through GenericRuntime, with no config anywhere in the chain.
  test("un jeu généré sans config (definition seule) est jouable", async ({
    page,
  }) => {
    const pageErrors: Error[] = [];
    page.on("pageerror", (error) => pageErrors.push(error));

    await skipUnlessGenericRuntimeEnabled(page);

    await page.route("**/games/generate", (route: Route) =>
      route.fulfill({
        status: 200,
        json: {
          success: true,
          result: {
            // Deliberately distinct from dodgeGameDefinitionExample's own
            // metadata.id ("dodge-game", same as the built-in entry) —
            // this is what game-catalog-service.ts must use as the
            // catalog item's id (see generated-game-schema.ts).
            id: "generated-dodge-definition-1",
            definition: dodgeGameDefinitionExample,
            template: "dodge",
            summary: "Un jeu généré sans config legacy.",
            generationId: "e2e-test-generation-definition-only",
            createdAt: new Date().toISOString(),
          },
        } satisfies GenerateGameResponse,
      }),
    );

    await page.getByRole("button", { name: /créer un jeu/i }).click();
    await page.getByRole("textbox").fill("Un jeu où j'évite des météorites");
    await page.getByRole("button", { name: /envoyer/i }).click();

    await expect(page.locator("#generation-result")).toBeVisible();
    const testButton = page.locator("#test-game-button");
    await expect(testButton).toBeEnabled();
    await testButton.click();

    await expect(page.locator("#play-view")).toBeVisible();
    await expect(page.locator("#game-canvas")).toBeVisible();
    await expect(page.locator("#game-status")).toContainText("Score");
    expect(pageErrors).toEqual([]);
  });
});
