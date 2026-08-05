import { describe, expect, it } from "vitest";
import { getGenerationStatusLabel } from "../../app/components/generation-status.js";

describe("getGenerationStatusLabel", () => {
  it("returns a short French label for every generation status", () => {
    expect(getGenerationStatusLabel("idle")).toBe("");
    expect(getGenerationStatusLabel("sending")).toBe("Analyse de ta demande");
    expect(getGenerationStatusLabel("analyzing")).toBe("Choix du type de jeu");
    expect(getGenerationStatusLabel("generating")).toBe("Création des règles");
    expect(getGenerationStatusLabel("validating")).toBe(
      "Validation de la configuration",
    );
    expect(getGenerationStatusLabel("saving")).toBe("Préparation du jeu");
    expect(getGenerationStatusLabel("ready")).toBe("Jeu prêt");
    expect(getGenerationStatusLabel("error")).toBe("Une erreur est survenue");
  });
});
