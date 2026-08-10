import { describe, expect, it } from "vitest";
import { validateMechanicSet } from "../../game/mechanics/compatibility.js";
import {
  mechanicRegistry,
  type GameMechanic,
  type MechanicDefinition,
} from "../../game/mechanics/registry.js";

describe("validateMechanicSet", () => {
  it("returns no issues for an empty set", () => {
    expect(validateMechanicSet([])).toEqual([]);
  });

  it("returns no issues for a valid set", () => {
    expect(validateMechanicSet(["move", "collect"])).toEqual([]);
  });

  it("reports a missing dependency", () => {
    const issues = validateMechanicSet(["shoot"]);

    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      severity: "error",
      code: "MISSING_MECHANIC_DEPENDENCY",
    });
    expect(issues[0]!.message).toContain("shoot");
    expect(issues[0]!.message).toContain("move");
  });

  it("does not report a false missing-dependency issue for duplicate mechanics", () => {
    const issues = validateMechanicSet(["move", "move", "collect", "collect"]);

    expect(issues).toEqual([]);
  });

  it("detects a conflict using a fabricated test-only registry", () => {
    const testRegistry: Record<GameMechanic, MechanicDefinition> = {
      ...mechanicRegistry,
      score: {
        id: "score",
        dependencies: [],
        conflicts: ["timer"],
      },
      timer: {
        id: "timer",
        dependencies: [],
        conflicts: ["score"],
      },
    };

    const issues = validateMechanicSet(["score", "timer"], testRegistry);

    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      severity: "error",
      code: "CONFLICTING_MECHANICS",
    });
  });

  it("reports a conflicting pair only once even if declared on both sides", () => {
    const testRegistry: Record<GameMechanic, MechanicDefinition> = {
      ...mechanicRegistry,
      score: { id: "score", dependencies: [], conflicts: ["health"] },
      health: { id: "health", dependencies: [], conflicts: ["score"] },
    };

    const issues = validateMechanicSet(["score", "health"], testRegistry);

    expect(issues).toHaveLength(1);
  });

  it("does not flag a conflicting mechanic that is absent from the set", () => {
    const testRegistry: Record<GameMechanic, MechanicDefinition> = {
      ...mechanicRegistry,
      score: { id: "score", dependencies: [], conflicts: ["timer"] },
    };

    const issues = validateMechanicSet(["score"], testRegistry);

    expect(issues).toEqual([]);
  });
});
