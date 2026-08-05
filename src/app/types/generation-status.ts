export const GENERATION_STATUSES = [
  "idle",
  "sending",
  "analyzing",
  "generating",
  "validating",
  "saving",
  "ready",
  "error",
] as const;

export type GenerationStatus = (typeof GENERATION_STATUSES)[number];

export const GENERATION_STATUS_LABELS: Record<GenerationStatus, string> = {
  idle: "",
  sending: "Envoi de ta demande",
  analyzing: "Analyse de ta demande",
  generating: "Choix du type de jeu et création des règles",
  validating: "Validation de la configuration",
  saving: "Préparation du jeu",
  ready: "Jeu prêt",
  error: "Une erreur est survenue",
};
