import type { GameConfig } from "../../mastra/schemas/generated-game-schema.js";
import { getGameTemplateDefinition } from "../../game/templates/game-template-catalog.js";
import type { GameTemplateDefinition } from "../../game/templates/game-template-definition.js";
import type { GameTemplate } from "../../game/types/game-template.js";
import { GameGenerationError } from "../../mastra/errors/game-generation-error.js";
import type { GenerationStatus } from "../types/generation-status.js";

export const MAX_GAME_PROMPT_LENGTH = 1000;

export type GeneratedGameResult = {
  game: GameConfig;
  summary: string;
  generationId: string;
  createdAt: string;
};

export type GenerationProgressListener = (status: GenerationStatus) => void;

const COLLECT_KEYWORDS = [
  "collect",
  "cristal",
  "ramass",
  "objet",
  "récolt",
  "trésor",
  "tresor",
];

export function selectTemplateFromPrompt(prompt: string): GameTemplate {
  const normalized = prompt.toLowerCase();
  return COLLECT_KEYWORDS.some((keyword) => normalized.includes(keyword))
    ? "collect"
    : "dodge";
}

function clampLength(text: string, min: number, max: number): string {
  const truncated = text.length > max ? text.slice(0, max) : text;
  return truncated.length >= min ? truncated : truncated.padEnd(min, ".");
}

function shorten(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) : text;
}

function buildTitle(prompt: string, template: GameTemplate): string {
  const base = template === "dodge" ? "Jeu d'évitement" : "Jeu de collecte";
  const suffix = prompt.length > 0 ? ` — ${shorten(prompt, 40)}` : "";
  return clampLength(`${base}${suffix}`, 3, 60);
}

function buildDescription(prompt: string, template: GameTemplate): string {
  const base =
    template === "dodge"
      ? "Évite les obstacles le plus longtemps possible."
      : "Collecte tous les objets avant la fin du temps.";
  const detail =
    prompt.length > 0 ? ` Inspiré de : ${shorten(prompt, 160)}` : "";
  return clampLength(`${base}${detail}`, 10, 240);
}

function buildTheme(prompt: string): string {
  return clampLength(prompt.length > 0 ? prompt : "aventure", 2, 80);
}

export function buildGameConfigFromPrompt(
  prompt: string,
  template: GameTemplate,
): GameConfig {
  const id = `generated-${crypto.randomUUID()}`;
  const title = buildTitle(prompt, template);
  const description = buildDescription(prompt, template);
  const theme = buildTheme(prompt);

  if (template === "dodge") {
    return {
      ...getGameTemplateDefinition(template).defaultConfig,
      id,
      title,
      description,
      theme,
    };
  }

  return {
    ...getGameTemplateDefinition(template).defaultConfig,
    id,
    title,
    description,
    theme,
  };
}

function validateWithDefinition<TConfig extends GameConfig>(
  definition: GameTemplateDefinition<TConfig, unknown>,
  game: TConfig,
): TConfig {
  const result = definition.configSchema.safeParse(game);

  if (!result.success) {
    throw new GameGenerationError(
      "VALIDATION_FAILED",
      "La configuration générée n'est pas valide. Réessaie avec une autre description.",
    );
  }

  const report = definition.checkPlayability(result.data);

  if (!report.playable) {
    const firstError = report.issues.find(
      (issue) => issue.severity === "error",
    );
    throw new GameGenerationError(
      "VALIDATION_FAILED",
      firstError?.message ?? "La configuration générée n'est pas jouable.",
    );
  }

  return result.data;
}

function validateGeneratedConfig(game: GameConfig): GameConfig {
  if (game.template === "dodge") {
    return validateWithDefinition(
      getGameTemplateDefinition(game.template),
      game,
    );
  }

  return validateWithDefinition(getGameTemplateDefinition(game.template), game);
}

function buildSummary(game: GameConfig, template: GameTemplate): string {
  const kind = template === "dodge" ? "jeu d'évitement" : "jeu de collecte";
  return `J'ai créé un ${kind} intitulé « ${game.title} ». Tu peux le tester dès maintenant !`;
}

function wait(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Génère une configuration de jeu à partir d'un prompt utilisateur.
 * Il ne s'agit pas encore d'un appel à un modèle réel : cette fonction
 * simule côté navigateur les étapes du futur workflow Mastra
 * `generateGameWorkflow` avec une réponse mockée. La configuration produite
 * passe par le schéma Zod et la vérification de jouabilité du template
 * (via le catalogue de templates), comme le fera l'agent Mastra réel.
 */
export async function generateGameFromPrompt(
  prompt: string,
  onProgress?: GenerationProgressListener,
  stepDelayMs = 250,
): Promise<GeneratedGameResult> {
  const trimmedPrompt = prompt.trim();

  if (trimmedPrompt.length === 0) {
    throw new GameGenerationError(
      "INVALID_PROMPT",
      "Merci de décrire le jeu que tu souhaites créer.",
    );
  }

  if (trimmedPrompt.length > MAX_GAME_PROMPT_LENGTH) {
    throw new GameGenerationError(
      "INVALID_PROMPT",
      `La description est trop longue (maximum ${MAX_GAME_PROMPT_LENGTH} caractères).`,
    );
  }

  onProgress?.("analyzing");
  await wait(stepDelayMs);

  const template = selectTemplateFromPrompt(trimmedPrompt);

  onProgress?.("generating");
  await wait(stepDelayMs);

  const game = buildGameConfigFromPrompt(trimmedPrompt, template);

  onProgress?.("validating");
  await wait(stepDelayMs);

  const validatedGame = validateGeneratedConfig(game);

  onProgress?.("saving");
  await wait(stepDelayMs);

  const result: GeneratedGameResult = {
    game: validatedGame,
    summary: buildSummary(validatedGame, template),
    generationId: `generation-${crypto.randomUUID()}`,
    createdAt: new Date().toISOString(),
  };

  onProgress?.("ready");

  return result;
}
