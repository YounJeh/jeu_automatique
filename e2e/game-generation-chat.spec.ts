import { test, expect, type Route } from "@playwright/test";
import type { GenerateGameResponse } from "../src/mastra/schemas/generate-game-api-schema.js";
import type { DodgeGameConfig } from "../src/mastra/schemas/dodge-game-config-schema.js";
import type { ShooterGameConfig } from "../src/mastra/schemas/shooter-game-config-schema.js";

const GENERATED_GAME: DodgeGameConfig = {
  id: "meteor-dash-generated",
  title: "Meteor Dash",
  description:
    "Évite les astéroïdes qui tombent du ciel le plus longtemps possible.",
  theme: "espace",
  template: "dodge",
  playerColor: "#4fd1c5",
  backgroundColor: "#0b1021",
  obstacleColor: "#f56565",
  playerSpeed: 220,
  obstacleSpeed: 160,
  obstacleSpawnIntervalMs: 700,
  gameDurationSeconds: 30,
  victoryMessage: "Astéroïdes évités !",
  defeatMessage: "Vaisseau touché...",
};

const GENERATED_SHOOTER_GAME: ShooterGameConfig = {
  id: "alien-blaster-generated",
  title: "Alien Blaster Deluxe",
  description: "Détruis les envahisseurs avant qu'ils n'atteignent la Terre.",
  theme: "space invaders",
  template: "shooter",
  playerColor: "#63b3ed",
  backgroundColor: "#0b1021",
  enemyColor: "#f56565",
  projectileColor: "#faf089",
  playerSpeed: 220,
  enemySpeed: 120,
  enemySpawnIntervalMs: 900,
  projectileSpeed: 400,
  fireCooldownMs: 350,
  playerHealth: 3,
  targetKillCount: 10,
  gameDurationSeconds: 30,
  victoryMessage: "Invasion repoussée !",
  defeatMessage: "Vaisseau détruit...",
};

async function fulfillJson(
  route: Route,
  body: GenerateGameResponse,
): Promise<void> {
  await route.fulfill({ status: 200, json: body });
}

test.describe("parcours créer par chat", () => {
  test("un prompt valide génère un jeu testable", async ({ page }) => {
    await page.route("**/games/generate", (route) =>
      fulfillJson(route, {
        success: true,
        result: {
          game: GENERATED_GAME,
          summary: "Un jeu où tu évites des astéroïdes dans l'espace.",
          generationId: "e2e-test-generation-success",
          createdAt: new Date().toISOString(),
        },
      }),
    );

    await page.goto("/");
    await page.getByRole("button", { name: /créer un jeu/i }).click();
    await page
      .getByRole("textbox")
      .fill("Un jeu où j'évite des astéroïdes dans l'espace");
    await page.getByRole("button", { name: /envoyer/i }).click();

    await expect(page.locator("#generation-result")).toBeVisible();
    const testButton = page.locator("#test-game-button");
    await expect(testButton).toBeEnabled();

    await testButton.click();

    await expect(page.locator("#play-view")).toBeVisible();
    await expect(page.locator("#create-view")).toBeHidden();
    await expect(page.locator("#game-title")).toHaveText("Meteor Dash");
  });

  test("un prompt shooter valide génère un jeu testable", async ({ page }) => {
    await page.route("**/games/generate", (route) =>
      fulfillJson(route, {
        success: true,
        result: {
          game: GENERATED_SHOOTER_GAME,
          summary: "Un jeu où tu détruis des envahisseurs venus de l'espace.",
          generationId: "e2e-test-generation-shooter-success",
          createdAt: new Date().toISOString(),
        },
      }),
    );

    await page.goto("/");
    await page.getByRole("button", { name: /créer un jeu/i }).click();
    await page
      .getByRole("textbox")
      .fill("Un jeu où je détruis des envahisseurs venus de l'espace");
    await page.getByRole("button", { name: /envoyer/i }).click();

    await expect(page.locator("#generation-result")).toBeVisible();
    const testButton = page.locator("#test-game-button");
    await expect(testButton).toBeEnabled();

    await testButton.click();

    await expect(page.locator("#play-view")).toBeVisible();
    await expect(page.locator("#create-view")).toBeHidden();
    await expect(page.locator("#game-title")).toHaveText(
      "Alien Blaster Deluxe",
    );
  });

  test("un échec métier affiche un message d'erreur sans jeu jouable", async ({
    page,
  }) => {
    const pageErrors: Error[] = [];
    page.on("pageerror", (error) => pageErrors.push(error));

    await page.route("**/games/generate", (route) =>
      fulfillJson(route, {
        success: false,
        error: {
          code: "INVALID_MODEL_OUTPUT",
          message: "Le modèle n'a pas produit une configuration valide.",
        },
      }),
    );

    await page.goto("/");
    await page.getByRole("button", { name: /créer un jeu/i }).click();
    await page.getByRole("textbox").fill("Un jeu impossible à générer");
    await page.getByRole("button", { name: /envoyer/i }).click();

    await expect(page.locator("#chat-history")).toContainText(
      "Le modèle n'a pas produit une configuration valide.",
    );
    await expect(page.locator("#test-game-button")).toBeDisabled();
    expect(pageErrors).toEqual([]);
  });
});
