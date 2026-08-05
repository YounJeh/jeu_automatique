export type GenerationStatus =
  | "idle"
  | "sending"
  | "analyzing"
  | "generating"
  | "validating"
  | "saving"
  | "ready"
  | "error";
