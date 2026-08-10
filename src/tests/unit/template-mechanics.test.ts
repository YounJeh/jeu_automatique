import { describe, expect, it } from "vitest";
import { validateMechanicSet } from "../../game/mechanics/compatibility.js";
import { templateMechanics } from "../../game/mechanics/template-mechanics.js";
import { GAME_TEMPLATES } from "../../game/types/game-template.js";

describe("templateMechanics", () => {
  it("maps dodge to move + avoid + timer", () => {
    expect(templateMechanics.dodge).toEqual(["move", "avoid", "timer"]);
  });

  it("maps collect to move + collect + score + timer", () => {
    expect(templateMechanics.collect).toEqual([
      "move",
      "collect",
      "score",
      "timer",
    ]);
  });

  it("maps shooter to move + shoot + avoid + health + score", () => {
    expect(templateMechanics.shooter).toEqual([
      "move",
      "shoot",
      "avoid",
      "health",
      "score",
    ]);
  });

  it("has an entry for every known game template", () => {
    expect(Object.keys(templateMechanics).sort()).toEqual(
      [...GAME_TEMPLATES].sort(),
    );
  });

  it.each(GAME_TEMPLATES)(
    "validates cleanly against the mechanic registry: %s",
    (template) => {
      const issues = validateMechanicSet(templateMechanics[template]);
      expect(issues).toEqual([]);
    },
  );
});
