import { z } from "zod";
import { GAME_MECHANICS } from "../../game/mechanics/registry.js";

// Mirrors GoalDefinition's discriminant (game-definition/goal-definition-schema.ts)
// — kept local rather than derived from the Zod union to avoid coupling
// this eval schema to that schema's internals for a 3-value list.
const GOAL_TYPES = ["survive", "score", "destroy"] as const;

// CLAUDE.md §15.4: properties are structural ("has mechanic X", "schema
// valid"), never an exact expected text. Every property is optional except
// schemaValid — a case only asserts on what it cares about.
export const evalCaseSchema = z
  .object({
    id: z.string().min(1),
    prompt: z.string().min(1),
    expected: z
      .object({
        schemaValid: z.boolean(),
        semanticValid: z.boolean().optional(),
        playabilityValid: z.boolean().optional(),
        mechanics: z.array(z.enum(GAME_MECHANICS)).optional(),
        goalTypes: z.array(z.enum(GOAL_TYPES)).optional(),
        runtimeLoads: z.boolean().optional(),
        repaired: z.boolean().optional(),
        usedFallbackPreset: z.boolean().optional(),
      })
      .strict(),
    // Optional: run a real headless simulation batch (runHeadlessSimulation)
    // and assert on its runtimeErrors. Only meaningful for
    // GenericRuntime-capable, stable definitions (known presets) — omitted
    // for mocked/fallback cases where the resulting definition isn't fixed
    // ahead of time. No minWinRate here on purpose: a random-walk policy's
    // win rate isn't a reliable pass/fail signal yet (tasks/plan.md, Open
    // Questions).
    expectedSimulation: z
      .object({
        runs: z.number().int().positive(),
        seed: z.number(),
        maxRuntimeErrors: z.number().int().nonnegative(),
      })
      .strict()
      .optional(),
  })
  .strict();

export type EvalCase = z.infer<typeof evalCaseSchema>;

export const evalCaseListSchema = z.array(evalCaseSchema);
