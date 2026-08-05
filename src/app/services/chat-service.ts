import {
  gameConfigSchema,
  type GameConfig,
} from "../../mastra/schemas/generated-game-schema.js";
import { defaultDodgeConfig } from "../../game/templates/dodge/dodge-config.js";
import { defaultCollectConfig } from "../../game/templates/collect/collect-config.js";
import { addGeneratedGame } from "../../game/catalog/game-catalog.js";
import type { GameCatalogItem } from "../../game/types/game-catalog-item.js";
import type { GameTemplate } from "../../game/types/game-template.js";
import type { GenerationStatus } from "../types/generation-status.js";
import { GameGenerationError } from "../errors/game-generation-error.js";

export const MAX_GAME_PROMPT_LENGTH = 1000;

export type GeneratedGameResult = {
  game: GameConfig;
  summary: string;
  generationId: string;
  createdAt: string;
};

export type GenerateGameMockOptions = {
  stepDelayMs?: number;
};

const COLLECT_KEYWORDS = [
  "collect",
  "ramass",
  "cristal",
  "récolt",
  "objet",
  "trésor",
];

const TEMPLATE_LABELS: Record<GameTemplate, string> = {
  dodge: "évitement",
  collect: "collecte",
};

function classifyTemplate(prompt: string): GameTemplate {
  const normalized = prompt.toLowerCase();
  return COLLECT_KEYWORDS.some((keyword) => normalized.includes(keyword))
    ? "collect"
    : "dodge";
}

function buildConfig(
  prompt: string,
  template: GameTemplate,
  generationId: string,
): GameConfig {
  const shortPrompt = prompt.slice(0, 40).trim();
  const title = (
    shortPrompt.length > 0 ? `Jeu : ${shortPrompt}` : "Jeu généré"
  ).slice(0, 60);
  const description =
    `Jeu généré à partir de la demande : "${prompt.slice(0, 150)}"`.slice(
      0,
      240,
    );
  const id = `generated-${generationId}`;

  if (template === "collect") {
    return { ...defaultCollectConfig, id, title, description };
  }

  return { ...defaultDodgeConfig, id, title, description };
}

function wait(ms: number): Promise<void> {
  return ms <= 0
    ? Promise.resolve()
    : new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateGameMock(
  prompt: string,
  onStatusChange: (status: GenerationStatus) => void,
  options: GenerateGameMockOptions = {},
): Promise<GeneratedGameResult> {
  const stepDelayMs = options.stepDelayMs ?? 350;
  const trimmedPrompt = prompt.trim();
  const startedAt = Date.now();

  onStatusChange("sending");
  console.log(
    `[chat-service] génération démarrée (promptLength=${trimmedPrompt.length})`,
  );
  await wait(stepDelayMs);

  if (
    trimmedPrompt.length === 0 ||
    trimmedPrompt.length > MAX_GAME_PROMPT_LENGTH
  ) {
    onStatusChange("error");
    console.error("[chat-service] prompt invalide (vide ou trop long)");
    throw new GameGenerationError(
      "INVALID_PROMPT",
      "La description du jeu est vide ou dépasse la longueur autorisée.",
    );
  }

  onStatusChange("analyzing");
  await wait(stepDelayMs);
  const template = classifyTemplate(trimmedPrompt);
  const generationId = crypto.randomUUID();
  console.log(
    `[chat-service] template sélectionné: ${template} (generationId=${generationId})`,
  );

  onStatusChange("generating");
  await wait(stepDelayMs);
  const config = buildConfig(trimmedPrompt, template, generationId);

  onStatusChange("validating");
  await wait(stepDelayMs);
  let validated: GameConfig;
  try {
    validated = gameConfigSchema.parse(config);
  } catch (error) {
    onStatusChange("error");
    console.error(
      "[chat-service] échec de validation de la configuration générée",
      error,
    );
    throw new GameGenerationError(
      "VALIDATION_FAILED",
      "La configuration générée n'est pas valide.",
    );
  }

  onStatusChange("saving");
  await wait(stepDelayMs);
  const catalogItem: GameCatalogItem = {
    id: validated.id,
    title: validated.title,
    description: validated.description,
    template: validated.template,
    source: "generated",
    config: validated,
    createdAt: new Date().toISOString(),
  };

  try {
    addGeneratedGame(catalogItem);
  } catch (error) {
    onStatusChange("error");
    console.error("[chat-service] échec de sauvegarde du jeu généré", error);
    throw new GameGenerationError(
      "SAVE_FAILED",
      "Le jeu généré n'a pas pu être enregistré.",
    );
  }

  onStatusChange("ready");
  const durationMs = Date.now() - startedAt;
  console.log(
    `[chat-service] génération terminée en ${durationMs}ms (generationId=${generationId})`,
  );

  return {
    game: validated,
    summary: `Jeu "${validated.title}" créé (${TEMPLATE_LABELS[template]}). Il est prêt à être testé.`,
    generationId,
    createdAt: catalogItem.createdAt ?? new Date().toISOString(),
  };
}
