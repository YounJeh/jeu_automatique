import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  evalCaseListSchema,
  evalCaseSchema,
} from "../../mastra/evals/eval-case-schema.js";

const DATASET_PATH = new URL(
  "../../../tests/evals/game-generation-cases.json",
  import.meta.url,
);

function loadDataset(): unknown {
  return JSON.parse(readFileSync(DATASET_PATH, "utf-8"));
}

describe("tests/evals/game-generation-cases.json", () => {
  it("validates against evalCaseListSchema", () => {
    const parsed = evalCaseListSchema.safeParse(loadDataset());
    expect(parsed.success).toBe(true);
  });

  it("has at least the 9 categories required by CLAUDE.md §15.4", () => {
    const cases = evalCaseListSchema.parse(loadDataset());
    expect(cases.length).toBeGreaterThanOrEqual(9);
  });

  it("has unique case ids", () => {
    const cases = evalCaseListSchema.parse(loadDataset());
    const ids = cases.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("only accepts mechanics from the closed GAME_MECHANICS registry", () => {
    // A case expecting an unsupported mechanic (e.g. "jump", "fly") would
    // fail this parse — the registry stays closed by construction, not by
    // a manual check here.
    const result = evalCaseSchema.safeParse({
      id: "should-fail",
      prompt: "x",
      expected: { schemaValid: true, mechanics: ["jump"] },
    });
    expect(result.success).toBe(false);
  });
});
