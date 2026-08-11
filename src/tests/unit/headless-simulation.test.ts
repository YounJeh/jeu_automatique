import { describe, expect, it } from "vitest";
import { runHeadlessSimulation } from "../../game/simulation/headless-simulation.js";
import { collectPreset } from "../../game/presets/collect.js";
import { dodgePreset } from "../../game/presets/dodge.js";
import { shooterPreset } from "../../game/presets/shooter.js";

describe("runHeadlessSimulation", () => {
  it("runs a full batch of dodge playouts without crashing", () => {
    const metrics = runHeadlessSimulation(dodgePreset.definition, {
      runs: 50,
      seed: 1,
    });

    expect(metrics.runtimeErrors).toBe(0);
    expect(metrics.completedRuns).toBe(50);
    expect(metrics.winRate).toBeGreaterThanOrEqual(0);
    expect(metrics.winRate).toBeLessThanOrEqual(1);
  });

  it("runs a full batch of collect playouts without crashing", () => {
    const metrics = runHeadlessSimulation(collectPreset.definition, {
      runs: 50,
      seed: 1,
    });

    expect(metrics.runtimeErrors).toBe(0);
    expect(metrics.completedRuns).toBe(50);
  });

  it("is deterministic: the same seed produces identical metrics", () => {
    const first = runHeadlessSimulation(dodgePreset.definition, {
      runs: 20,
      seed: 42,
    });
    const second = runHeadlessSimulation(dodgePreset.definition, {
      runs: 20,
      seed: 42,
    });

    expect(second).toEqual(first);
  });

  it("does not guarantee identical metrics across different seeds", () => {
    const seedOne = runHeadlessSimulation(dodgePreset.definition, {
      runs: 20,
      seed: 1,
    });
    const seedTwo = runHeadlessSimulation(dodgePreset.definition, {
      runs: 20,
      seed: 2,
    });

    // Both are internally consistent (deterministic per seed, asserted
    // above) — this only checks the two seeds aren't silently collapsed
    // onto the same underlying stream.
    expect(seedOne).not.toEqual(seedTwo);
  });

  it("rejects definitions that declare a mechanic GenericRuntime can't execute", () => {
    expect(() =>
      runHeadlessSimulation(shooterPreset.definition, { runs: 1, seed: 1 }),
    ).toThrow(/not executable by GenericRuntime/);
  });
});
