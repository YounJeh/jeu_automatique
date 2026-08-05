export type GameGenerationErrorCode =
  | "INVALID_PROMPT"
  | "MODEL_UNAVAILABLE"
  | "INVALID_MODEL_OUTPUT"
  | "UNSUPPORTED_TEMPLATE"
  | "VALIDATION_FAILED"
  | "SAVE_FAILED"
  | "GAME_INITIALIZATION_FAILED";

export class GameGenerationError extends Error {
  readonly code: GameGenerationErrorCode;

  constructor(code: GameGenerationErrorCode, message: string) {
    super(message);
    this.name = "GameGenerationError";
    this.code = code;
  }
}
