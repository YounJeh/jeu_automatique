import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  evalCaseListSchema,
  type EvalCase,
} from "../../mastra/evals/eval-case-schema.js";
import {
  inferGameDefinition,
  type GenerateGameDefinition,
} from "../../mastra/workflows/infer-game-definition-step.js";
import { gameDefinitionSchema } from "../../game/definition/game-definition-schema.js";
import type { GameDefinition } from "../../game/definition/game-definition-schema.js";
import { gameDefinitionSemanticRules } from "../../game/definition/game-definition-semantic-rules.js";
import { gameDefinitionPlayabilityRules } from "../../game/definition/game-definition-playability-rules.js";
import { createSemanticValidator } from "../../game/validation/semantic/semantic-validator.js";
import { createPlayabilityValidator } from "../../game/validation/playability/playability-validator.js";
import { isGenericRuntimeCapable } from "../../game/core/runtime/generic-runtime-capability.js";
import { GenericRuntime } from "../../game/core/runtime/generic-runtime.js";
import { runHeadlessSimulation } from "../../game/simulation/headless-simulation.js";
import { dodgeGameDefinitionExample } from "../../game/definition/examples/dodge-game-definition.js";
import { dodgePreset } from "../../game/presets/dodge.js";
import { collectPreset } from "../../game/presets/collect.js";
import { shooterPreset } from "../../game/presets/shooter.js";
import { survivalPreset } from "../../game/presets/survival.js";

const DATASET_PATH = new URL(
  "../../../tests/evals/game-generation-cases.json",
  import.meta.url,
);

function loadCases(): EvalCase[] {
  return evalCaseListSchema.parse(
    JSON.parse(readFileSync(DATASET_PATH, "utf-8")),
  );
}

// Schema-valid but semantically broken on purpose: a "destroy" goal with no
// "enemy" entity trips checkDestroyGoalReachable
// (game-definition-semantic-rules.ts). Standing in for "the model produced
// something structurally well-formed but incoherent" — the case this
// dataset actually needs to exercise for its repair/fallback categories,
// since a raw schema failure never reaches inferGameDefinition's `generate`
// callback in production (Mastra's structuredOutput already guarantees the
// shape, see infer-game-definition-step.ts).
const invalidDefinition: GameDefinition = {
  ...dodgeGameDefinitionExample,
  goals: [{ type: "destroy", target: 1 }],
};

// Combines dodge's obstacle and collect's collectible (same known-good
// world/speed numbers as both presets, so playability is inherited rather
// than guessed) into a move+collect+avoid definition. Eval-only fixture —
// never exported, never added to src/game/definition/examples (those stay
// the per-template source of truth).
const hybridDefinition: GameDefinition = {
  version: "1",
  metadata: {
    id: "hybrid-eval-fixture",
    title: "Hybrid Eval Fixture",
    description:
      "Collecte des cristaux en évitant des météorites — fixture d'éval.",
    theme: "test",
  },
  world: { width: 480, height: 640, boundaries: "clamp" },
  player: {
    speed: 220,
    size: 28,
    appearance: { type: "shape", shape: "rectangle", color: "#4fd1c5" },
  },
  entities: [
    {
      id: "obstacle",
      kind: "obstacle",
      size: 28,
      speed: 160,
      spawnIntervalMs: 700,
      appearance: { type: "shape", shape: "rectangle", color: "#f56565" },
    },
    {
      id: "collectible",
      kind: "collectible",
      size: 20,
      spawnIntervalMs: 900,
      appearance: { type: "shape", shape: "circle", color: "#68d391" },
    },
  ],
  mechanics: ["move", "collect", "avoid"],
  rules: [
    { when: "player-collides-obstacle", then: [{ type: "lose-game" }] },
    {
      when: "player-collides-collectible",
      then: [{ type: "increase-score", amount: 10 }, { type: "remove-entity" }],
    },
    { when: "score-reached", then: [{ type: "win-game" }] },
  ],
  goals: [{ type: "score", target: 50 }],
  presentation: {
    backgroundColor: "#0b1021",
    victoryMessage: "Cristaux collectés !",
    defeatMessage: "Touché par une météorite...",
  },
};

// One mocked response queue per dataset case id — the sequence
// inferGameDefinition's `generate` callback returns across its (at most
// two) calls: first attempt, then repair attempt if the first one fails
// validation. Reaching `usedFallbackPreset` requires the FIRST call to
// return a (schema-shaped but invalid) definition, not undefined —
// inferGameDefinition throws immediately on an undefined first response
// (MODEL_UNAVAILABLE), it never falls back from that.
const MOCK_RESPONSES: Record<string, (GameDefinition | undefined)[]> = {
  "dodge-simple": [dodgePreset.definition],
  "collect-simple": [collectPreset.definition],
  "shooter-simple": [shooterPreset.definition],
  "survival-simple": [survivalPreset.definition],
  "hybrid-collect-avoid": [hybridDefinition],
  "ambiguous-request": [invalidDefinition, invalidDefinition],
  "impossible-request": [invalidDefinition, invalidDefinition],
  "extreme-parameters": [invalidDefinition, dodgePreset.definition],
  "adversarial-prompt": [invalidDefinition, invalidDefinition],
  "unsupported-mechanic": [invalidDefinition, invalidDefinition],
};

function createMockGenerate(
  responses: readonly (GameDefinition | undefined)[],
): GenerateGameDefinition {
  let call = 0;
  return async () => {
    const response = responses[call];
    call += 1;
    return response;
  };
}

function runtimeLoads(definition: GameDefinition): boolean {
  if (!isGenericRuntimeCapable(definition)) return false;
  try {
    new GenericRuntime().load(definition);
    return true;
  } catch {
    return false;
  }
}

describe("game-generation-cases eval dataset", () => {
  it("can assert an expected schema failure, not just an expected success", () => {
    // Proves the runner is able to fail a case the same way it passes one
    // — none of the dataset's own cases exercise `schemaValid: false`
    // because the pipeline is designed to never surface an invalid
    // definition to the caller (repair, then fallback to a known-valid
    // preset — see inferGameDefinition).
    const malformed = { ...dodgeGameDefinitionExample, version: "2" };
    expect(gameDefinitionSchema.safeParse(malformed).success).toBe(false);
  });

  const cases = loadCases();

  it.each(cases)("$id", async (testCase) => {
    const responses = MOCK_RESPONSES[testCase.id];
    if (!responses) {
      throw new Error(
        `No mock responses configured for eval case "${testCase.id}" — ` +
          `add an entry to MOCK_RESPONSES.`,
      );
    }

    const result = await inferGameDefinition(
      testCase.prompt,
      createMockGenerate(responses),
    );
    const { definition } = result;

    expect(gameDefinitionSchema.safeParse(definition).success).toBe(
      testCase.expected.schemaValid,
    );

    if (testCase.expected.semanticValid !== undefined) {
      const report = createSemanticValidator(
        gameDefinitionSemanticRules,
      ).validate(definition);
      expect(report.valid).toBe(testCase.expected.semanticValid);
    }

    if (testCase.expected.playabilityValid !== undefined) {
      const report = createPlayabilityValidator(
        gameDefinitionPlayabilityRules,
      ).validate(definition);
      expect(report.playable).toBe(testCase.expected.playabilityValid);
    }

    for (const mechanic of testCase.expected.mechanics ?? []) {
      expect(definition.mechanics).toContain(mechanic);
    }

    if (testCase.expected.goalTypes) {
      const goalTypes = definition.goals.map((g) => g.type);
      for (const goalType of testCase.expected.goalTypes) {
        expect(goalTypes).toContain(goalType);
      }
    }

    if (testCase.expected.runtimeLoads !== undefined) {
      expect(runtimeLoads(definition)).toBe(testCase.expected.runtimeLoads);
    }

    if (testCase.expected.repaired !== undefined) {
      expect(result.repaired).toBe(testCase.expected.repaired);
    }

    if (testCase.expected.usedFallbackPreset !== undefined) {
      expect(result.usedFallbackPreset).toBe(
        testCase.expected.usedFallbackPreset,
      );
    }

    if (testCase.expectedSimulation) {
      const { runs, seed, maxRuntimeErrors } = testCase.expectedSimulation;
      const metrics = runHeadlessSimulation(definition, { runs, seed });
      expect(metrics.runtimeErrors).toBeLessThanOrEqual(maxRuntimeErrors);
    }
  });
});
