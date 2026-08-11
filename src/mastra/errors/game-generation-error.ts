export const GAME_GENERATION_ERROR_CODES = [
  "INVALID_PROMPT",
  "MODEL_UNAVAILABLE",
  "INVALID_MODEL_OUTPUT",
  "UNSUPPORTED_TEMPLATE",
  "SCHEMA_VALIDATION_FAILED",
  "SEMANTIC_VALIDATION_FAILED",
  "PLAYABILITY_VALIDATION_FAILED",
  "SAVE_FAILED",
  "GAME_INITIALIZATION_FAILED",
  // PHASE 7: GameDefinition-first generation (inferGameDefinitionStep).
  "INVALID_GAME_DEFINITION",
  "REPAIR_FAILED",
] as const;

export type GameGenerationErrorCode =
  (typeof GAME_GENERATION_ERROR_CODES)[number];

export class GameGenerationError extends Error {
  readonly code: GameGenerationErrorCode;

  constructor(code: GameGenerationErrorCode, message: string) {
    super(message);
    this.name = "GameGenerationError";
    this.code = code;
  }
}
