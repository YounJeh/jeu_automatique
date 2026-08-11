import { describe, expect, it, vi } from "vitest";
import {
  buildDefinitionGenerationLogRecord,
  buildLegacyGenerationLogRecord,
  checkRuntimeLoadResult,
  logGeneration,
} from "../../mastra/observability/generation-log.js";
import { dodgePreset } from "../../game/presets/dodge.js";
import { shooterPreset } from "../../game/presets/shooter.js";

describe("buildLegacyGenerationLogRecord", () => {
  it("marks the legacy pipeline as not runtime-applicable", () => {
    const record = buildLegacyGenerationLogRecord({
      generationId: "gen-1",
      gameId: "game-1",
      mechanics: ["move", "avoid", "timer"],
    });

    expect(record.runtimeLoadResult).toBe("not-applicable");
    expect(record.repairAttempted).toBe(false);
    expect(record.fallbackUsed).toBe(false);
    expect(record.schemaVersion).toBeUndefined();
  });
});

describe("buildDefinitionGenerationLogRecord", () => {
  it("carries repaired/fallback flags and a GenericRuntime-capable load result", () => {
    const record = buildDefinitionGenerationLogRecord({
      generationId: "gen-2",
      gameId: "game-2",
      definition: dodgePreset.definition,
      repaired: true,
      usedFallbackPreset: false,
    });

    expect(record.schemaVersion).toBe("1");
    expect(record.repairAttempted).toBe(true);
    expect(record.fallbackUsed).toBe(false);
    expect(record.runtimeLoadResult).toBe("ok");
    expect(record.selectedMechanics).toEqual(dodgePreset.definition.mechanics);
  });

  it("marks a shoot-declaring definition as not runtime-applicable, never ok/error", () => {
    const record = buildDefinitionGenerationLogRecord({
      generationId: "gen-3",
      gameId: "game-3",
      definition: shooterPreset.definition,
      repaired: false,
      usedFallbackPreset: false,
    });

    expect(record.runtimeLoadResult).toBe("not-applicable");
  });
});

describe("checkRuntimeLoadResult", () => {
  it("returns ok for a GenericRuntime-capable definition", () => {
    expect(checkRuntimeLoadResult(dodgePreset.definition)).toBe("ok");
  });

  it("returns not-applicable for a definition declaring shoot", () => {
    expect(checkRuntimeLoadResult(shooterPreset.definition)).toBe(
      "not-applicable",
    );
  });
});

describe("logGeneration", () => {
  it("emits exactly one structured console.log line, without the prompt", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});

    logGeneration(
      buildLegacyGenerationLogRecord({
        generationId: "gen-4",
        gameId: "game-4",
        mechanics: ["move", "collect", "score", "timer"],
      }),
    );

    expect(spy).toHaveBeenCalledTimes(1);
    const logged = JSON.parse(spy.mock.calls[0]![0] as string);
    expect(logged.gameId).toBe("game-4");
    expect(logged).not.toHaveProperty("prompt");

    spy.mockRestore();
  });

  it("never throws, even if console.log itself fails", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {
      throw new Error("should be swallowed by logGeneration");
    });

    expect(() =>
      logGeneration(
        buildLegacyGenerationLogRecord({
          generationId: "gen-5",
          gameId: "game-5",
          mechanics: ["move"],
        }),
      ),
    ).not.toThrow();

    spy.mockRestore();
  });
});
