import {
  GAME_GENERATION_ERROR_CODES,
  GameGenerationError,
} from "../../mastra/errors/game-generation-error.js";
import type { GameGenerationErrorCode } from "../../mastra/errors/game-generation-error.js";
import {
  generateGameResponseSchema,
  type GenerateGameRequest,
} from "../../mastra/schemas/generate-game-api-schema.js";
import type { GeneratedGameResult } from "../../mastra/schemas/generated-game-schema.js";
import type { GenerationStatus } from "../types/generation-status.js";

export const MAX_GAME_PROMPT_LENGTH = 1000;

export type { GeneratedGameResult };

export type GenerationProgressListener = (status: GenerationStatus) => void;

const GENERATE_GAME_ENDPOINT = "/games/generate";

function wait(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Derived from the single source of truth (GAME_GENERATION_ERROR_CODES)
// rather than a hand-copied list — a hand-copied list is exactly what let
// this drift out of sync with GameGenerationErrorCode once before.
function isGameGenerationErrorCode(
  code: string,
): code is GameGenerationErrorCode {
  return (GAME_GENERATION_ERROR_CODES as readonly string[]).includes(code);
}

/**
 * Génère une configuration de jeu à partir d'un prompt utilisateur en
 * appelant le backend Mastra réel (gameDesignerAgent + generateGameWorkflow,
 * voir src/mastra/). La progression affichée est simulée côté client (une
 * seule requête, sans streaming) : voir
 * specs/etape-5-connexion-frontend-backend.md.
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
  onProgress?.("generating");

  let response: Response;
  try {
    response = await fetch(GENERATE_GAME_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: trimmedPrompt,
      } satisfies GenerateGameRequest),
    });
  } catch {
    throw new GameGenerationError(
      "MODEL_UNAVAILABLE",
      "Le serveur de génération est injoignable.",
    );
  }

  onProgress?.("validating");
  await wait(stepDelayMs);
  onProgress?.("saving");

  if (!response.ok) {
    throw new GameGenerationError(
      "MODEL_UNAVAILABLE",
      "Le serveur de génération est injoignable.",
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new GameGenerationError(
      "MODEL_UNAVAILABLE",
      "La réponse du serveur est illisible.",
    );
  }

  const parsed = generateGameResponseSchema.safeParse(payload);
  if (!parsed.success) {
    throw new GameGenerationError(
      "MODEL_UNAVAILABLE",
      "La réponse du serveur n'est pas valide.",
    );
  }

  if (!parsed.data.success) {
    const { code, message } = parsed.data.error;
    throw new GameGenerationError(
      isGameGenerationErrorCode(code) ? code : "MODEL_UNAVAILABLE",
      message,
    );
  }

  onProgress?.("ready");

  return parsed.data.result;
}
