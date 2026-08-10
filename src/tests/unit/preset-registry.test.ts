import { describe, expect, it } from "vitest";
import { getGamePreset, listGamePresets } from "../../game/presets/registry.js";
import { dodgePreset } from "../../game/presets/dodge.js";
import { collectPreset } from "../../game/presets/collect.js";
import { shooterPreset } from "../../game/presets/shooter.js";

describe("preset registry", () => {
  it("getGamePreset returns the matching preset for each template", () => {
    expect(getGamePreset("dodge")).toBe(dodgePreset);
    expect(getGamePreset("collect")).toBe(collectPreset);
    expect(getGamePreset("shooter")).toBe(shooterPreset);
  });

  it("listGamePresets returns all 3 presets in a stable order", () => {
    expect(listGamePresets()).toEqual([
      dodgePreset,
      collectPreset,
      shooterPreset,
    ]);
  });
});
