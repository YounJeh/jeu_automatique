import { isGenericRuntimeCapable } from "../../game/core/runtime/generic-runtime-capability.js";
import { GenericRuntime } from "../../game/core/runtime/generic-runtime.js";
import type { GameDefinition } from "../../game/definition/game-definition-schema.js";
import type { GameMechanic } from "../../game/mechanics/registry.js";

export type RuntimeLoadResult = "ok" | "error" | "not-applicable";

// CLAUDE.md §32 — fields relevant at this stage of the project. Omitted on
// purpose:
// - `model`: not trivially available from `mastra.getAgent(...)` without
//   coupling to the agent's internal config shape; adding a fragile
//   dependency on that isn't worth it for one log field.
// - `latencyMs`: this record is built inside create*CatalogEntryStep,
//   after generation already happened — measuring "this step's own
//   duration" would be near-zero and mislabeled as generation latency.
//   Capturing the real value needs a start timestamp threaded from
//   receiveUserRequestStep through the typed step schemas, which is a
//   wider change than this task's scope.
export type GenerationLogRecord = {
  generationId: string;
  gameId: string;
  schemaVersion?: "1";
  selectedMechanics: GameMechanic[];
  validationResult: "ok";
  repairAttempted: boolean;
  fallbackUsed: boolean;
  runtimeLoadResult: RuntimeLoadResult;
};

// A cheap `load()` sanity check, not a simulation batch — CLAUDE.md §32
// tracks "runtime initialization success" and "simulation result" as two
// separate metrics; running runHeadlessSimulation() here would add
// per-request latency to every generation for a metric the offline eval
// tooling (Tasks 1/5) already covers.
export function checkRuntimeLoadResult(
  definition: GameDefinition,
): RuntimeLoadResult {
  if (!isGenericRuntimeCapable(definition)) return "not-applicable";

  try {
    new GenericRuntime().load(definition);
    return "ok";
  } catch {
    return "error";
  }
}

export function buildLegacyGenerationLogRecord(params: {
  generationId: string;
  gameId: string;
  mechanics: GameMechanic[];
}): GenerationLogRecord {
  return {
    generationId: params.generationId,
    gameId: params.gameId,
    selectedMechanics: params.mechanics,
    validationResult: "ok",
    repairAttempted: false,
    fallbackUsed: false,
    // The legacy (classify -> config) pipeline never produces a
    // GameDefinition, so there's nothing to load into GenericRuntime.
    runtimeLoadResult: "not-applicable",
  };
}

export function buildDefinitionGenerationLogRecord(params: {
  generationId: string;
  gameId: string;
  definition: GameDefinition;
  repaired: boolean;
  usedFallbackPreset: boolean;
}): GenerationLogRecord {
  return {
    generationId: params.generationId,
    gameId: params.gameId,
    schemaVersion: params.definition.version,
    selectedMechanics: params.definition.mechanics,
    validationResult: "ok",
    repairAttempted: params.repaired,
    fallbackUsed: params.usedFallbackPreset,
    runtimeLoadResult: checkRuntimeLoadResult(params.definition),
  };
}

// Never let an observability side-channel break generation itself
// (CLAUDE.md §53 — no lifecycle leak). Deliberately excludes the prompt
// and any model reasoning (§32).
export function logGeneration(record: GenerationLogRecord): void {
  try {
    console.log(JSON.stringify({ type: "game-generation", ...record }));
  } catch {
    // Serialization failure on an observability record must never
    // surface to the caller — see comment above.
  }
}
