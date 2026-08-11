import type { InputState } from "../core/game-state.js";
import type { RandomSource } from "../core/random/random-source.js";
import type { RuntimeState } from "../core/runtime/runtime-state.js";

// CLAUDE.md §15.2 — exact field names.
export type SimulationMetrics = {
  completedRuns: number;
  winRate: number;
  averageDurationMs: number;
  averageScore: number;
  runtimeErrors: number;
};

// Decides the next frame's input from the current runtime state. Takes its
// own RandomSource (distinct from the runtime's, so a policy's random
// consumption never shifts the entity-spawn sequence — see
// headless-simulation.ts).
export type InputPolicy = (
  state: RuntimeState,
  random: RandomSource,
) => InputState;

// Not a solver: picks one of {none, left, right, up, down} uniformly each
// frame, ignoring `state`. Good enough to smoke-test a definition (does it
// crash? is it trivially unwinnable?), not to measure difficulty precisely
// — see tasks/plan.md, "Portée assumée".
export const randomWalkInputPolicy: InputPolicy = (_state, random) => {
  const roll = random();
  return {
    left: roll < 0.2,
    right: roll >= 0.2 && roll < 0.4,
    up: roll >= 0.4 && roll < 0.6,
    down: roll >= 0.6 && roll < 0.8,
    fire: false,
  };
};
