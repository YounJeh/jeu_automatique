import { randomUUID } from "node:crypto";
import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { collectTemplateDefinition } from "../../game/templates/collect/collect-template.js";
import { dodgeTemplateDefinition } from "../../game/templates/dodge/dodge-template.js";
import { listGameTemplateDefinitions } from "../../game/templates/game-template-catalog.js";
import type { GameTemplateDefinition } from "../../game/templates/game-template-definition.js";
import { GAME_TEMPLATES } from "../../game/types/game-template.js";
import { GameGenerationError } from "../errors/game-generation-error.js";
import { saveGeneratedGameTool } from "../tools/save-generated-game-tool.js";
import { collectGameConfigSchema } from "../schemas/collect-game-config-schema.js";
import { dodgeGameConfigSchema } from "../schemas/dodge-game-config-schema.js";
import { generatedGameCatalogItemSchema } from "../schemas/generated-game-catalog-item-schema.js";
import {
  gameConfigSchema,
  generatedGameResultSchema,
  type GameConfig,
} from "../schemas/generated-game-schema.js";

const DEFAULT_MAX_GAME_PROMPT_LENGTH = 1000;

function getMaxGamePromptLength(): number {
  const configured = Number(process.env.MAX_GAME_PROMPT_LENGTH);
  return Number.isFinite(configured) && configured > 0
    ? configured
    : DEFAULT_MAX_GAME_PROMPT_LENGTH;
}

const receiveUserRequestStep = createStep({
  id: "receive-user-request",
  description: "Valide la longueur et le contenu de la demande utilisateur.",
  inputSchema: z.object({ prompt: z.string() }),
  outputSchema: z.object({ prompt: z.string() }),
  execute: async ({ inputData }) => {
    const trimmedPrompt = inputData.prompt.trim();
    const maxLength = getMaxGamePromptLength();

    if (trimmedPrompt.length === 0) {
      throw new GameGenerationError(
        "INVALID_PROMPT",
        "Merci de décrire le jeu que tu souhaites créer.",
      );
    }

    if (trimmedPrompt.length > maxLength) {
      throw new GameGenerationError(
        "INVALID_PROMPT",
        `La description est trop longue (maximum ${maxLength} caractères).`,
      );
    }

    return { prompt: trimmedPrompt };
  },
});

const classifyGameTemplateStep = createStep({
  id: "classify-game-template",
  description:
    "Sélectionne, via l'agent, le template le plus adapté à la demande.",
  inputSchema: z.object({ prompt: z.string() }),
  outputSchema: z.object({
    prompt: z.string(),
    template: z.enum(GAME_TEMPLATES),
  }),
  retries: 1,
  execute: async ({ inputData, mastra }) => {
    const agent = mastra.getAgent("gameDesignerAgent");
    const templateOptions = listGameTemplateDefinitions()
      .map((definition) => `- "${definition.id}" : ${definition.description}`)
      .join("\n");

    const response = await agent.generate(
      `Templates disponibles :\n${templateOptions}\n\n` +
        `Demande de l'utilisateur : "${inputData.prompt}"\n\n` +
        `Choisis le template le plus adapté à cette demande.`,
      {
        structuredOutput: {
          schema: z.object({ template: z.enum(GAME_TEMPLATES) }),
        },
      },
    );

    if (!response.object) {
      throw new GameGenerationError(
        "MODEL_UNAVAILABLE",
        "Le modèle n'a pas produit de réponse exploitable.",
      );
    }

    return { prompt: inputData.prompt, template: response.object.template };
  },
});

function buildGenerationPrompt(
  definition: GameTemplateDefinition<GameConfig, unknown>,
  prompt: string,
): string {
  return (
    `Template choisi : "${definition.id}" (${definition.description})\n` +
    `Configuration de référence : ${JSON.stringify(definition.defaultConfig)}\n` +
    `Demande de l'utilisateur : "${prompt}"\n\n` +
    `Produis une configuration complète et cohérente avec cette demande.`
  );
}

const generateGameConfigStep = createStep({
  id: "generate-game-config",
  description: "Génère une configuration structurée pour le template choisi.",
  inputSchema: z.object({
    prompt: z.string(),
    template: z.enum(GAME_TEMPLATES),
  }),
  outputSchema: gameConfigSchema,
  retries: 1,
  execute: async ({ inputData, mastra }) => {
    const agent = mastra.getAgent("gameDesignerAgent");

    if (inputData.template === "dodge") {
      const response = await agent.generate(
        buildGenerationPrompt(dodgeTemplateDefinition, inputData.prompt),
        { structuredOutput: { schema: dodgeGameConfigSchema } },
      );

      if (!response.object) {
        throw new GameGenerationError(
          "MODEL_UNAVAILABLE",
          "Le modèle n'a pas produit de configuration exploitable.",
        );
      }

      return response.object;
    }

    const response = await agent.generate(
      buildGenerationPrompt(collectTemplateDefinition, inputData.prompt),
      { structuredOutput: { schema: collectGameConfigSchema } },
    );

    if (!response.object) {
      throw new GameGenerationError(
        "MODEL_UNAVAILABLE",
        "Le modèle n'a pas produit de configuration exploitable.",
      );
    }

    return response.object;
  },
});

/**
 * Enchaîne les trois couches de validation (CLAUDE.md §8.1) : schema (Zod),
 * puis semantic (cohérence arithmétique entre champs déclarés), puis
 * playability (capacité physique du joueur). Chacune peut bloquer la
 * génération indépendamment des deux autres.
 */
export function validateGameConfig<TConfig extends GameConfig>(
  definition: GameTemplateDefinition<TConfig, unknown>,
  candidate: TConfig,
): TConfig {
  const parsed = definition.configSchema.safeParse(candidate);

  if (!parsed.success) {
    throw new GameGenerationError(
      "SCHEMA_VALIDATION_FAILED",
      "La configuration générée n'est pas valide. Réessaie avec une autre description.",
    );
  }

  const semanticReport = definition.checkSemantics(parsed.data);

  if (!semanticReport.valid) {
    const firstError = semanticReport.issues.find(
      (issue) => issue.severity === "error",
    );
    throw new GameGenerationError(
      "SEMANTIC_VALIDATION_FAILED",
      firstError?.message ?? "La configuration générée n'est pas cohérente.",
    );
  }

  const playabilityReport = definition.checkPlayability(parsed.data);

  if (!playabilityReport.playable) {
    const firstError = playabilityReport.issues.find(
      (issue) => issue.severity === "error",
    );
    throw new GameGenerationError(
      "PLAYABILITY_VALIDATION_FAILED",
      firstError?.message ?? "La configuration générée n'est pas jouable.",
    );
  }

  return parsed.data;
}

const validateGameConfigStep = createStep({
  id: "validate-game-config",
  description:
    "Attribue un identifiant sûr, revalide avec Zod et vérifie la jouabilité de la configuration.",
  inputSchema: gameConfigSchema,
  outputSchema: gameConfigSchema,
  execute: async ({ inputData }) => {
    const candidate = { ...inputData, id: `generated-${randomUUID()}` };

    if (candidate.template === "dodge") {
      return validateGameConfig(dodgeTemplateDefinition, candidate);
    }

    return validateGameConfig(collectTemplateDefinition, candidate);
  },
});

const createCatalogEntryStep = createStep({
  id: "create-catalog-entry",
  description:
    "Construit l'entrée de catalogue à partir de la configuration validée.",
  inputSchema: gameConfigSchema,
  outputSchema: generatedGameCatalogItemSchema,
  execute: async ({ inputData }) => ({
    id: inputData.id,
    title: inputData.title,
    description: inputData.description,
    template: inputData.template,
    source: "generated" as const,
    config: inputData,
    createdAt: new Date().toISOString(),
  }),
});

const returnGamePreviewStep = createStep({
  id: "return-game-preview",
  description:
    "Construit le résultat final, prêt à être prévisualisé et testé.",
  inputSchema: generatedGameCatalogItemSchema,
  outputSchema: generatedGameResultSchema,
  execute: async ({ inputData }) => {
    const kind =
      inputData.template === "dodge" ? "jeu d'évitement" : "jeu de collecte";

    return {
      game: inputData.config,
      summary: `J'ai créé un ${kind} intitulé « ${inputData.title} ». Tu peux le tester dès maintenant !`,
      generationId: `generation-${randomUUID()}`,
      createdAt: inputData.createdAt,
    };
  },
});

export const generateGameWorkflow = createWorkflow({
  id: "generateGameWorkflow",
  description:
    "Transforme une demande utilisateur en jeu généré, validé et enregistré.",
  inputSchema: z.object({ prompt: z.string() }),
  outputSchema: generatedGameResultSchema,
})
  .then(receiveUserRequestStep)
  .then(classifyGameTemplateStep)
  .then(generateGameConfigStep)
  .then(validateGameConfigStep)
  .then(createCatalogEntryStep)
  .then(createStep(saveGeneratedGameTool))
  .then(returnGamePreviewStep)
  .commit();
