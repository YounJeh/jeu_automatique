import { isGenericRuntimeCapable } from "../core/runtime/generic-runtime-capability.js";
import { GenericRuntime } from "../core/runtime/generic-runtime.js";
import type { GameDefinition } from "../definition/game-definition-schema.js";
import type { RandomSource } from "../core/random/random-source.js";
import {
  randomWalkInputPolicy,
  type InputPolicy,
  type SimulationMetrics,
} from "./simulation-metrics.js";

export type SimulationOptions = {
  runs: number;
  seed: number;
  maxStepsPerRun?: number;
  stepMs?: number;
  policy?: InputPolicy;
};

const DEFAULT_STEP_MS = 16;
// Used only when the definition has no world.durationSeconds to derive a
// tighter bound from (score/destroy goals without a timer) — generous
// enough to let those goals be reached without letting a broken rule set
// spin forever.
const DEFAULT_MAX_STEPS_PER_RUN = 5000;
const MAX_STEPS_MARGIN = 200;

// Deterministic, dependency-free PRNG (mulberry32) so a given seed always
// produces the same sequence across runs and across processes (CLAUDE.md
// §26) — Math.random() can't offer that.
function mulberry32(seed: number): RandomSource {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function resolveMaxSteps(
  definition: GameDefinition,
  stepMs: number,
  override: number | undefined,
): number {
  if (override !== undefined) return override;

  if (definition.world.durationSeconds !== undefined) {
    return (
      Math.ceil((definition.world.durationSeconds * 1000) / stepMs) +
      MAX_STEPS_MARGIN
    );
  }

  return DEFAULT_MAX_STEPS_PER_RUN;
}

/**
 * Drives `definition` through `options.runs` independent headless playouts
 * of `GenericRuntime` (no renderer, no DOM) and aggregates the outcome into
 * `SimulationMetrics`. Restricted to GenericRuntime-capable definitions —
 * `shoot` (ShooterEngine-only, docs/mechanics/shoot.md) isn't simulate-able
 * here.
 *
 * Each run gets its own seed derived from `options.seed`, so the whole
 * batch is reproducible: two calls with the same seed produce identical
 * metrics.
 */
export function runHeadlessSimulation(
  definition: GameDefinition,
  options: SimulationOptions,
): SimulationMetrics {
  if (!isGenericRuntimeCapable(definition)) {
    throw new Error(
      `runHeadlessSimulation: "${definition.metadata.id}" declares a mechanic ` +
        `not executable by GenericRuntime (likely "shoot") — see docs/mechanics/shoot.md.`,
    );
  }

  const stepMs = options.stepMs ?? DEFAULT_STEP_MS;
  const maxSteps = resolveMaxSteps(definition, stepMs, options.maxStepsPerRun);
  const policy = options.policy ?? randomWalkInputPolicy;

  let completedRuns = 0;
  let wonRuns = 0;
  let totalDurationMs = 0;
  let totalScore = 0;
  let runtimeErrors = 0;

  for (let run = 0; run < options.runs; run++) {
    try {
      // Two independent streams per run (runtime spawn RNG vs. input
      // policy RNG) so the policy's own random consumption never shifts
      // the runtime's entity-spawn sequence.
      const runtimeRandom = mulberry32(options.seed * 2 + run * 2);
      const policyRandom = mulberry32(options.seed * 2 + run * 2 + 1);

      const runtime = new GenericRuntime(runtimeRandom);
      runtime.load(definition);
      runtime.start();

      let state = runtime.getState();
      let steps = 0;
      while (state.status === "playing" && steps < maxSteps) {
        const input = policy(state, policyRandom);
        state = runtime.update(stepMs, input);
        steps++;
      }

      runtime.destroy();

      completedRuns++;
      if (state.status === "won") wonRuns++;
      totalDurationMs += state.elapsedMs;
      totalScore += state.score;
    } catch {
      runtimeErrors++;
    }
  }

  return {
    completedRuns,
    winRate: completedRuns > 0 ? wonRuns / completedRuns : 0,
    averageDurationMs: completedRuns > 0 ? totalDurationMs / completedRuns : 0,
    averageScore: completedRuns > 0 ? totalScore / completedRuns : 0,
    runtimeErrors,
  };
}
