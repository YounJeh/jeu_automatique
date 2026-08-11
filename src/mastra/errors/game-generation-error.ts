export type GameGenerationErrorCode =
  | "INVALID_PROMPT"
  | "MODEL_UNAVAILABLE"
  | "INVALID_MODEL_OUTPUT"
  | "UNSUPPORTED_TEMPLATE"
  | "SCHEMA_VALIDATION_FAILED"
  | "SEMANTIC_VALIDATION_FAILED"
  | "PLAYABILITY_VALIDATION_FAILED"
  | "SAVE_FAILED"
  | "GAME_INITIALIZATION_FAILED"
  // PHASE 7: GameDefinition-first generation (inferGameDefinitionStep).
  | "INVALID_GAME_DEFINITION"
  | "REPAIR_FAILED";

export class GameGenerationError extends Error {
  readonly code: GameGenerationErrorCode;

  constructor(code: GameGenerationErrorCode, message: string) {
    super(message);
    this.name = "GameGenerationError";
    this.code = code;
  }
}
