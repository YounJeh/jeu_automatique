import { describe, expect, it } from "vitest";
import {
  getMechanicDefinition,
  listMechanics,
  mechanicRegistry,
  type GameMechanic,
} from "../../game/mechanics/registry.js";

const ALL_MECHANICS: GameMechanic[] = [
  "move",
  "avoid",
  "collect",
  "shoot",
  "health",
  "score",
  "timer",
];

describe("mechanicRegistry", () => {
  it("has exactly the 7 closed mechanics, no more no less", () => {
    expect(Object.keys(mechanicRegistry).sort()).toEqual(
      [...ALL_MECHANICS].sort(),
    );
  });

  it("gives move, health, score and timer no dependencies", () => {
    expect(mechanicRegistry.move.dependencies).toEqual([]);
    expect(mechanicRegistry.health.dependencies).toEqual([]);
    expect(mechanicRegistry.score.dependencies).toEqual([]);
    expect(mechanicRegistry.timer.dependencies).toEqual([]);
  });

  it("makes avoid, collect and shoot depend on move", () => {
    expect(mechanicRegistry.avoid.dependencies).toEqual(["move"]);
    expect(mechanicRegistry.collect.dependencies).toEqual(["move"]);
    expect(mechanicRegistry.shoot.dependencies).toEqual(["move"]);
  });

  it("declares no conflicts by default", () => {
    for (const mechanic of ALL_MECHANICS) {
      expect(mechanicRegistry[mechanic].conflicts).toBeUndefined();
    }
  });
});

describe("listMechanics", () => {
  it("returns all 7 definitions", () => {
    const ids = listMechanics()
      .map((definition) => definition.id)
      .sort();

    expect(ids).toEqual([...ALL_MECHANICS].sort());
  });
});

describe("getMechanicDefinition", () => {
  it("returns the matching definition for a valid id", () => {
    expect(getMechanicDefinition("shoot")).toEqual(mechanicRegistry.shoot);
  });

  it("throws on an id outside the closed GameMechanic union", () => {
    expect(() => getMechanicDefinition("fly" as GameMechanic)).toThrow(
      /Unknown game mechanic/,
    );
  });
});
