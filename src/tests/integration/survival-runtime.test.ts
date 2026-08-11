import { describe, expect, it } from "vitest";
import { GenericRuntime } from "../../game/core/runtime/generic-runtime.js";
import { survivalGameDefinition } from "../../game/definition/examples/survival-game-definition.js";
import type { InputState } from "../../game/core/game-state.js";

const noInput: InputState = {
  left: false,
  right: false,
  up: false,
  down: false,
  fire: false,
};

// End-to-end proof that the shipped survival preset's rule wiring is
// correct (player-collides-enemy -> damage-player + remove-entity,
// health-zero -> lose-game, timer-expired -> win-game), not just the
// "seek" primitive in isolation (already covered at the unit level in
// generic-runtime.test.ts). Fixed RandomSource (CLAUDE.md §13.4) makes
// both scenarios fully reproducible.
describe("survival preset — end to end via GenericRuntime", () => {
  it("loses once the chaser has hit the player enough times to exhaust health", () => {
    const runtime = new GenericRuntime(() => 0.5);
    runtime.load(survivalGameDefinition);
    runtime.start();

    let state = runtime.getState();
    // A static player (noInput) is always eventually caught by a seeking
    // chaser — advance in small steps until a terminal state is reached,
    // well before the 30s survive duration.
    while (state.status === "playing" && state.elapsedMs < 30_000) {
      state = runtime.update(50, noInput);
    }

    expect(state.status).toBe("lost");
    expect(state.playerHealth).toBe(0);
    expect(state.elapsedMs).toBeLessThan(30_000);
  });

  it("wins once the survive duration elapses without health reaching zero", () => {
    const runtime = new GenericRuntime(() => 0.5);
    // Isolates the timer/goal wiring from the pursuit-evasion problem
    // (already covered by the "loses" scenario above and by the seek unit
    // tests) — same world/player/rules/goals as the shipped preset, no
    // threat present.
    runtime.load({ ...survivalGameDefinition, entities: [] });
    runtime.start();

    const state = runtime.update(
      survivalGameDefinition.world.durationSeconds! * 1000,
      noInput,
    );

    expect(state.status).toBe("won");
    expect(state.playerHealth).toBe(survivalGameDefinition.player.health);
  });
});
