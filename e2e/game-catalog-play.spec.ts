import { test, expect } from "@playwright/test";

test.describe("parcours jouer", () => {
  test("le jeu par défaut est chargé et jouable au démarrage", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.locator("#game-title")).toHaveText("Meteor Dodge");
    await expect(page.locator("#game-canvas")).toBeVisible();
    await expect(page.locator("#game-status")).toContainText("Score");
  });

  test("changer de jeu depuis la sidebar met à jour la vue jouer", async ({
    page,
  }) => {
    await page.goto("/");

    await page.locator('[data-game-id="collect-game"]').click();

    await expect(page.locator("#game-title")).toHaveText("Crystal Collector");
  });

  test("le restart peut être déclenché plusieurs fois de suite sans erreur", async ({
    page,
  }) => {
    const pageErrors: Error[] = [];
    page.on("pageerror", (error) => pageErrors.push(error));

    await page.goto("/");

    await page.locator("#restart-button").click();
    await page.locator("#restart-button").click();
    await page.locator("#restart-button").click();

    await expect(page.locator("#game-status")).toContainText("Score");
    expect(pageErrors).toEqual([]);
  });

  test("changer de jeu pendant une partie en cours ne casse pas l'UI", async ({
    page,
  }) => {
    const pageErrors: Error[] = [];
    page.on("pageerror", (error) => pageErrors.push(error));

    await page.goto("/");
    await expect(page.locator("#game-status")).toContainText("Score");

    await page.locator('[data-game-id="collect-game"]').click();

    await expect(page.locator("#game-title")).toHaveText("Crystal Collector");
    await expect(page.locator("#game-status")).toContainText("Score");
    expect(pageErrors).toEqual([]);
  });
});
