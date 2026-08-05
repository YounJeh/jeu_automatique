import {
  GENERATION_STATUS_LABELS,
  type GenerationStatus,
} from "../types/generation-status.js";

export function renderGenerationStatus(
  container: HTMLElement,
  status: GenerationStatus,
): void {
  const label = GENERATION_STATUS_LABELS[status];

  if (status === "idle" || label.length === 0) {
    container.hidden = true;
    container.textContent = "";
    container.classList.remove("generation-status--error");
    return;
  }

  container.hidden = false;
  container.textContent = label;
  container.classList.toggle("generation-status--error", status === "error");
}
