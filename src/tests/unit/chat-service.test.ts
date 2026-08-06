import { afterEach, describe, expect, it, vi } from "vitest";
import {
  MAX_GAME_PROMPT_LENGTH,
  generateGameFromPrompt,
} from "../../app/services/chat-service.js";
import { defaultDodgeConfig } from "../../game/templates/dodge/dodge-config.js";

function mockFetchOnce(response: {
  ok?: boolean;
  json?: () => Promise<unknown>;
}): void {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: response.ok ?? true,
      json: response.json ?? (async () => ({})),
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("generateGameFromPrompt", () => {
  it("resolves a valid generated game and reports progress, without calling fetch for local validation", async () => {
    const generatedResult = {
      game: defaultDodgeConfig,
      summary: "Un jeu généré.",
      generationId: "generation-1",
      createdAt: new Date().toISOString(),
    };
    mockFetchOnce({
      json: async () => ({ success: true, result: generatedResult }),
    });

    const statuses: string[] = [];
    const result = await generateGameFromPrompt(
      "Un jeu de collecte de cristaux dans une grotte",
      (status) => statuses.push(status),
      0,
    );

    expect(result).toEqual(generatedResult);
    expect(statuses).toEqual([
      "analyzing",
      "generating",
      "validating",
      "saving",
      "ready",
    ]);
    expect(fetch).toHaveBeenCalledWith(
      "/games/generate",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          prompt: "Un jeu de collecte de cristaux dans une grotte",
        }),
      }),
    );
  });

  it("rejects an empty prompt without calling fetch", async () => {
    mockFetchOnce({});

    await expect(
      generateGameFromPrompt("   ", undefined, 0),
    ).rejects.toMatchObject({ code: "INVALID_PROMPT" });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects a prompt that is too long without calling fetch", async () => {
    mockFetchOnce({});
    const longPrompt = "a".repeat(MAX_GAME_PROMPT_LENGTH + 1);

    await expect(
      generateGameFromPrompt(longPrompt, undefined, 0),
    ).rejects.toMatchObject({ code: "INVALID_PROMPT" });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("propagates a structured error returned by the server", async () => {
    mockFetchOnce({
      json: async () => ({
        success: false,
        error: { code: "VALIDATION_FAILED", message: "Jeu non jouable." },
      }),
    });

    await expect(
      generateGameFromPrompt("un jeu", undefined, 0),
    ).rejects.toMatchObject({
      code: "VALIDATION_FAILED",
      message: "Jeu non jouable.",
    });
  });

  it("falls back to MODEL_UNAVAILABLE for an unrecognized error code", async () => {
    mockFetchOnce({
      json: async () => ({
        success: false,
        error: { code: "SOMETHING_UNKNOWN", message: "?" },
      }),
    });

    await expect(
      generateGameFromPrompt("un jeu", undefined, 0),
    ).rejects.toMatchObject({ code: "MODEL_UNAVAILABLE" });
  });

  it("rejects with MODEL_UNAVAILABLE on a non-ok HTTP response", async () => {
    mockFetchOnce({ ok: false });

    await expect(
      generateGameFromPrompt("un jeu", undefined, 0),
    ).rejects.toMatchObject({ code: "MODEL_UNAVAILABLE" });
  });

  it("rejects with MODEL_UNAVAILABLE when fetch itself fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );

    await expect(
      generateGameFromPrompt("un jeu", undefined, 0),
    ).rejects.toMatchObject({ code: "MODEL_UNAVAILABLE" });
  });

  it("rejects with MODEL_UNAVAILABLE when the response body doesn't match the expected shape", async () => {
    mockFetchOnce({ json: async () => ({ nonsense: true }) });

    await expect(
      generateGameFromPrompt("un jeu", undefined, 0),
    ).rejects.toMatchObject({ code: "MODEL_UNAVAILABLE" });
  });
});
