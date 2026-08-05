import type { GenerationStatus } from "../types/generation-status.js";

const GENERATION_STATUS_LABELS: Record<GenerationStatus, string> = {
  idle: "",
  sending: "Analyse de ta demande",
  analyzing: "Choix du type de jeu",
  generating: "Création des règles",
  validating: "Validation de la configuration",
  saving: "Préparation du jeu",
  ready: "Jeu prêt",
  error: "Une erreur est survenue",
};

export function getGenerationStatusLabel(status: GenerationStatus): string {
  return GENERATION_STATUS_LABELS[status];
}

export function renderGenerationStatus(
  element: HTMLElement,
  status: GenerationStatus,
): void {
  element.textContent = getGenerationStatusLabel(status);
  element.dataset.status = status;
}
