import { registerApiRoute, type ContextWithMastra } from "@mastra/core/server";
import {
  generateGameRequestSchema,
  type GenerateGameResponse,
} from "../schemas/generate-game-api-schema.js";
import type { GeneratedGameResult } from "../schemas/generated-game-schema.js";

function isErrorShape(
  value: unknown,
): value is { code: string; message: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { code?: unknown }).code === "string" &&
    typeof (value as { message?: unknown }).message === "string"
  );
}

/** Le sous-ensemble d'un run de workflow réellement utilisé ici, pour rester testable sans mocker toute l'API Mastra. */
export interface GenerateGameWorkflowRun {
  start(options: {
    inputData: { prompt: string };
  }): Promise<
    | { status: "success"; result: GeneratedGameResult }
    | {
        status: "failed" | "suspended" | "tripwire" | "paused";
        error?: unknown;
      }
  >;
}

export interface GenerateGameWorkflowSource {
  getWorkflow(name: "generateGameWorkflow"): {
    createRun(): Promise<GenerateGameWorkflowRun>;
  };
}

/**
 * Logique pure de la route : construit la réponse à partir du corps brut de
 * la requête et d'une source de workflow. Séparée du handler Hono pour
 * rester testable sans mocker tout le Context.
 */
export async function buildGenerateGameResponse(
  body: unknown,
  mastra: GenerateGameWorkflowSource,
): Promise<GenerateGameResponse> {
  const parsedRequest = generateGameRequestSchema.safeParse(body);
  if (!parsedRequest.success) {
    return {
      success: false,
      error: {
        code: "INVALID_PROMPT",
        message: "Requête invalide : le champ prompt est requis.",
      },
    };
  }

  try {
    const workflow = mastra.getWorkflow("generateGameWorkflow");
    const run = await workflow.createRun();
    const result = await run.start({
      inputData: { prompt: parsedRequest.data.prompt },
    });

    if (result.status === "success") {
      return { success: true, result: result.result };
    }

    const details = isErrorShape(result.error)
      ? { code: result.error.code, message: result.error.message }
      : {
          code: "MODEL_UNAVAILABLE",
          message: "La génération n'a pas pu aboutir.",
        };
    return { success: false, error: details };
  } catch (error) {
    const details = isErrorShape(error)
      ? { code: error.code, message: error.message }
      : {
          code: "MODEL_UNAVAILABLE",
          message: "Une erreur inattendue est survenue pendant la génération.",
        };
    return { success: false, error: details };
  }
}

/**
 * Chemin volontairement hors du préfixe /api : registerApiRoute interdit
 * les routes custom qui commencent par le apiPrefix du serveur Mastra
 * (/api par défaut, réservé aux routes intégrées — agents, workflows,
 * studio...). Voir specs/etape-5-connexion-frontend-backend.md.
 */
export async function handleGenerateGame(
  c: ContextWithMastra,
): Promise<Response> {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    body = undefined;
  }

  const response = await buildGenerateGameResponse(body, c.get("mastra"));
  return c.json<GenerateGameResponse>(response, 200);
}

export const generateGameRoute = registerApiRoute("/games/generate", {
  method: "POST",
  handler: handleGenerateGame,
});
