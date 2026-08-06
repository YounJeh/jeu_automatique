import { describe, expect, it } from "vitest";
import {
  buildGenerateGameResponse,
  type GenerateGameWorkflowRun,
  type GenerateGameWorkflowSource,
} from "../../mastra/server/generate-game-route.js";
import { defaultDodgeConfig } from "../../game/templates/dodge/dodge-config.js";

function makeSource(
  start: GenerateGameWorkflowRun["start"],
): GenerateGameWorkflowSource {
  return {
    getWorkflow: () => ({
      createRun: async () => ({ start }),
    }),
  };
}

describe("buildGenerateGameResponse", () => {
  it("returns the generated game on success", async () => {
    const generatedResult = {
      game: defaultDodgeConfig,
      summary: "Un jeu généré.",
      generationId: "generation-1",
      createdAt: new Date().toISOString(),
    };
    const source = makeSource(async () => ({
      status: "success",
      result: generatedResult,
    }));

    const response = await buildGenerateGameResponse(
      { prompt: "un jeu où j'évite des météorites" },
      source,
    );

    expect(response).toEqual({ success: true, result: generatedResult });
  });

  it("rejects a body without a prompt before touching the workflow", async () => {
    const source = makeSource(async () => {
      throw new Error("should not be called");
    });

    const response = await buildGenerateGameResponse({}, source);

    expect(response).toMatchObject({
      success: false,
      error: { code: "INVALID_PROMPT" },
    });
  });

  it("maps a structured workflow failure to its error code", async () => {
    const source = makeSource(async () => ({
      status: "failed",
      error: { code: "VALIDATION_FAILED", message: "Jeu non jouable." },
    }));

    const response = await buildGenerateGameResponse(
      { prompt: "un jeu" },
      source,
    );

    expect(response).toEqual({
      success: false,
      error: { code: "VALIDATION_FAILED", message: "Jeu non jouable." },
    });
  });

  it("falls back to a generic error when the workflow failure has no structured shape", async () => {
    const source = makeSource(async () => ({
      status: "failed",
      error: undefined,
    }));

    const response = await buildGenerateGameResponse(
      { prompt: "un jeu" },
      source,
    );

    expect(response).toMatchObject({
      success: false,
      error: { code: "MODEL_UNAVAILABLE" },
    });
  });

  it("catches an unexpected thrown error without leaking its details", async () => {
    const source = makeSource(async () => {
      throw new Error("network exploded with a huge stack trace");
    });

    const response = await buildGenerateGameResponse(
      { prompt: "un jeu" },
      source,
    );

    expect(response).toMatchObject({
      success: false,
      error: { code: "MODEL_UNAVAILABLE" },
    });
    if (!response.success) {
      expect(response.error.message).not.toContain("stack trace");
    }
  });
});
