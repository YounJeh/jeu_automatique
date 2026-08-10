import { test, expect } from "@playwright/test";

test.describe("parcours jouer : shooter", () => {
  test("le jeu shooter built-in se charge depuis la sidebar", async ({
    page,
  }) => {
    await page.goto("/");

    await page.locator('[data-game-id="shooter-game"]').click();

    await expect(page.locator("#game-title")).toHaveText("Alien Blaster");
    await expect(page.locator("#game-canvas")).toBeVisible();
    await expect(page.locator("#game-status")).toContainText("Score");
  });

  test("le déplacement et le tir ne déclenchent aucune erreur", async ({
    page,
  }) => {
    const pageErrors: Error[] = [];
    page.on("pageerror", (error) => pageErrors.push(error));

    await page.goto("/");
    await page.locator('[data-game-id="shooter-game"]').click();
    await expect(page.locator("#game-canvas")).toBeVisible();

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Space");
    await page.waitForTimeout(300);

    expect(pageErrors).toEqual([]);
  });

  test("le restart peut être déclenché plusieurs fois de suite sans erreur", async ({
    page,
  }) => {
    const pageErrors: Error[] = [];
    page.on("pageerror", (error) => pageErrors.push(error));

    await page.goto("/");
    await page.locator('[data-game-id="shooter-game"]').click();

    await page.locator("#restart-button").click();
    await page.locator("#restart-button").click();
    await page.locator("#restart-button").click();

    await expect(page.locator("#game-status")).toContainText("Score");
    expect(pageErrors).toEqual([]);
  });

  test("changer de jeu vers dodge puis revenir au shooter ne casse pas l'UI", async ({
    page,
  }) => {
    const pageErrors: Error[] = [];
    page.on("pageerror", (error) => pageErrors.push(error));

    await page.goto("/");
    await page.locator('[data-game-id="shooter-game"]').click();
    await expect(page.locator("#game-title")).toHaveText("Alien Blaster");

    await page.locator('[data-game-id="dodge-game"]').click();
    await expect(page.locator("#game-title")).toHaveText("Meteor Dodge");

    await page.locator('[data-game-id="shooter-game"]').click();
    await expect(page.locator("#game-title")).toHaveText("Alien Blaster");
    expect(pageErrors).toEqual([]);
  });
});
