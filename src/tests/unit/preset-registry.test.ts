import { describe, expect, it } from "vitest";
import { getGamePreset, listGamePresets } from "../../game/presets/registry.js";
import { dodgePreset } from "../../game/presets/dodge.js";
import { collectPreset } from "../../game/presets/collect.js";
import { shooterPreset } from "../../game/presets/shooter.js";
import { survivalPreset } from "../../game/presets/survival.js";

describe("preset registry", () => {
  it("getGamePreset returns the matching preset for each template", () => {
    expect(getGamePreset("dodge")).toBe(dodgePreset);
    expect(getGamePreset("collect")).toBe(collectPreset);
    expect(getGamePreset("shooter")).toBe(shooterPreset);
    expect(getGamePreset("survival")).toBe(survivalPreset);
  });

  it("listGamePresets returns all 4 presets in a stable order", () => {
    expect(listGamePresets()).toEqual([
      dodgePreset,
      collectPreset,
      shooterPreset,
      survivalPreset,
    ]);
  });
});
