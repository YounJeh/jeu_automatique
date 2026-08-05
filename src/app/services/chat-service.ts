import type { GameConfig } from "../../mastra/schemas/generated-game-schema.js";
import { defaultDodgeConfig } from "../../game/templates/dodge/dodge-config.js";
import { defaultCollectConfig } from "../../game/templates/collect/collect-config.js";
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
      ...defaultDodgeConfig,
      id,
      title,
      description,
      theme,
    };
  }

  return {
    ...defaultCollectConfig,
    id,
    title,
    description,
    theme,
  };
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
 * est construite à partir des valeurs par défaut déjà validées par
 * `gameConfigSchema` (voir chat-service.test.ts) ; la validation Zod réelle
 * sera exécutée côté serveur lors du branchement de l'agent Mastra.
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

  onProgress?.("saving");
  await wait(stepDelayMs);

  const result: GeneratedGameResult = {
    game,
    summary: buildSummary(game, template),
    generationId: `generation-${crypto.randomUUID()}`,
    createdAt: new Date().toISOString(),
  };

  onProgress?.("ready");

  return result;
}
