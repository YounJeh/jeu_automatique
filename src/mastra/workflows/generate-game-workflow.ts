import { randomUUID } from "node:crypto";
import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { collectTemplateDefinition } from "../../game/templates/collect/collect-template.js";
import { dodgeTemplateDefinition } from "../../game/templates/dodge/dodge-template.js";
import { shooterTemplateDefinition } from "../../game/templates/shooter/shooter-template.js";
import { listGameTemplateDefinitions } from "../../game/templates/game-template-catalog.js";
import type { GameTemplateDefinition } from "../../game/templates/game-template-definition.js";
import { GAME_TEMPLATES } from "../../game/types/game-template.js";
import { gameDefinitionSchema } from "../../game/definition/game-definition-schema.js";
import { isGenericRuntimeEnabled } from "../../game/core/feature-flags.js";
import { templateMechanics } from "../../game/mechanics/template-mechanics.js";
import { GameGenerationError } from "../errors/game-generation-error.js";
import {
  buildDefinitionGenerationLogRecord,
  buildLegacyGenerationLogRecord,
  logGeneration,
} from "../observability/generation-log.js";
import { saveGeneratedGameTool } from "../tools/save-generated-game-tool.js";
import { collectGameConfigSchema } from "../schemas/collect-game-config-schema.js";
import { dodgeGameConfigSchema } from "../schemas/dodge-game-config-schema.js";
import { shooterGameConfigSchema } from "../schemas/shooter-game-config-schema.js";
import { generatedGameCatalogItemSchema } from "../schemas/generated-game-catalog-item-schema.js";
import {
  gameConfigSchema,
  generatedGameResultSchema,
  type GameConfig,
} from "../schemas/generated-game-schema.js";
import { inferGameDefinitionStep } from "./infer-game-definition-step.js";

/**
 * Garantit à la compilation qu'aucune branche exhaustive sur `template`
 * (CLAUDE.md §27) n'oublie silencieusement un template : si un futur
 * template est ajouté à GAME_TEMPLATES sans mettre à jour l'appelant,
 * `value` cesse d'être `never` et tsc échoue avant même l'exécution.
 */
function assertNever(value: never): never {
  throw new Error(`Unexpected template: ${String(value)}`);
}

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

    if (inputData.template === "collect") {
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
    }

    if (inputData.template === "shooter") {
      const response = await agent.generate(
        buildGenerationPrompt(shooterTemplateDefinition, inputData.prompt),
        { structuredOutput: { schema: shooterGameConfigSchema } },
      );

      if (!response.object) {
        throw new GameGenerationError(
          "MODEL_UNAVAILABLE",
          "Le modèle n'a pas produit de configuration exploitable.",
        );
      }

      return response.object;
    }

    return assertNever(inputData.template);
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
    const id = `generated-${randomUUID()}`;

    if (inputData.template === "dodge") {
      return validateGameConfig(dodgeTemplateDefinition, { ...inputData, id });
    }

    if (inputData.template === "collect") {
      return validateGameConfig(collectTemplateDefinition, {
        ...inputData,
        id,
      });
    }

    if (inputData.template === "shooter") {
      return validateGameConfig(shooterTemplateDefinition, {
        ...inputData,
        id,
      });
    }

    return assertNever(inputData);
  },
});

const createCatalogEntryStep = createStep({
  id: "create-catalog-entry",
  description:
    "Construit l'entrée de catalogue à partir de la configuration validée.",
  inputSchema: gameConfigSchema,
  outputSchema: generatedGameCatalogItemSchema,
  execute: async ({ inputData }) => {
    logGeneration(
      buildLegacyGenerationLogRecord({
        generationId: randomUUID(),
        gameId: inputData.id,
        mechanics: templateMechanics[inputData.template],
      }),
    );

    return {
      id: inputData.id,
      title: inputData.title,
      description: inputData.description,
      template: inputData.template,
      source: "generated" as const,
      config: inputData,
      createdAt: new Date().toISOString(),
    };
  },
});

function describeTemplateKind(template: GameConfig["template"]): string {
  switch (template) {
    case "dodge":
      return "jeu d'évitement";
    case "collect":
      return "jeu de collecte";
    case "shooter":
      return "jeu de tir";
    default:
      return assertNever(template);
  }
}

const returnGamePreviewStep = createStep({
  id: "return-game-preview",
  description:
    "Construit le résultat final, prêt à être prévisualisé et testé.",
  inputSchema: generatedGameCatalogItemSchema,
  outputSchema: generatedGameResultSchema,
  execute: async ({ inputData }) => {
    const kind = describeTemplateKind(inputData.template);

    return {
      id: inputData.id,
      game: inputData.config,
      template: inputData.template,
      summary: `J'ai créé un ${kind} intitulé « ${inputData.title} ». Tu peux le tester dès maintenant !`,
      generationId: `generation-${randomUUID()}`,
      createdAt: inputData.createdAt,
    };
  },
});

// PHASE 7: analogues of createCatalogEntryStep/returnGamePreviewStep for
// the mechanics -> GameDefinition pipeline (inferGameDefinitionStep). A
// GameDefinition-only item has no legacy config — see
// generatedGameCatalogItemSchema (Task 9) and GameController's guard.
const createDefinitionCatalogEntryStep = createStep({
  id: "create-definition-catalog-entry",
  description:
    "Construit l'entrée de catalogue à partir de la GameDefinition validée.",
  inputSchema: z.object({
    definition: gameDefinitionSchema,
    template: z.enum(GAME_TEMPLATES),
    repaired: z.boolean(),
    usedFallbackPreset: z.boolean(),
  }),
  outputSchema: generatedGameCatalogItemSchema,
  execute: async ({ inputData }) => {
    const id = `generated-${randomUUID()}`;

    logGeneration(
      buildDefinitionGenerationLogRecord({
        generationId: randomUUID(),
        gameId: id,
        definition: inputData.definition,
        repaired: inputData.repaired,
        usedFallbackPreset: inputData.usedFallbackPreset,
      }),
    );

    return {
      id,
      title: inputData.definition.metadata.title,
      description: inputData.definition.metadata.description,
      template: inputData.template,
      source: "generated" as const,
      definition: inputData.definition,
      createdAt: new Date().toISOString(),
    };
  },
});

const returnGameDefinitionPreviewStep = createStep({
  id: "return-game-definition-preview",
  description:
    "Construit le résultat final pour une GameDefinition générée, prête à être prévisualisée et testée.",
  inputSchema: generatedGameCatalogItemSchema,
  outputSchema: generatedGameResultSchema,
  execute: async ({ inputData }) => {
    if (!inputData.definition) {
      // Unreachable in practice: this step only ever follows
      // createDefinitionCatalogEntryStep, which always sets definition.
      throw new GameGenerationError(
        "INVALID_GAME_DEFINITION",
        "L'entrée de catalogue générée n'a pas de définition de jeu.",
      );
    }

    return {
      id: inputData.id,
      definition: inputData.definition,
      template: inputData.template,
      summary: `J'ai créé un jeu intitulé « ${inputData.title} ». Tu peux le tester dès maintenant !`,
      generationId: `generation-${randomUUID()}`,
      createdAt: inputData.createdAt,
    };
  },
});

function buildLegacyGenerateGameWorkflow() {
  return createWorkflow({
    id: "generateGameWorkflow",
    description:
      "Transforme une demande utilisateur en jeu généré, validé et enregistré (classify -> config).",
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
}

function buildDefinitionGenerateGameWorkflow() {
  return createWorkflow({
    id: "generateGameWorkflow",
    description:
      "Transforme une demande utilisateur en jeu généré, validé et enregistré (mechanics -> GameDefinition).",
    inputSchema: z.object({ prompt: z.string() }),
    outputSchema: generatedGameResultSchema,
  })
    .then(receiveUserRequestStep)
    .then(inferGameDefinitionStep)
    .then(createDefinitionCatalogEntryStep)
    .then(createStep(saveGeneratedGameTool))
    .then(returnGameDefinitionPreviewStep)
    .commit();
}

// PHASE 7 §14.2: the classify -> config pipeline is not removed, it stays
// the default (flag off) fallback until the GameDefinition pipeline is
// validated. The flag is read once at module load (server startup), same
// deployment-time granularity as the browser-side flag injection in
// static-frontend-route.ts — not re-evaluated per request.
export const generateGameWorkflow = isGenericRuntimeEnabled()
  ? buildDefinitionGenerateGameWorkflow()
  : buildLegacyGenerateGameWorkflow();
