import { describe, expect, it } from "vitest";
import { dodgeGameConfigSchema } from "../../mastra/schemas/dodge-game-config-schema.js";
import { collectGameConfigSchema } from "../../mastra/schemas/collect-game-config-schema.js";
import { defaultDodgeConfig } from "../../game/templates/dodge/dodge-config.js";
import { defaultCollectConfig } from "../../game/templates/collect/collect-config.js";
import { DodgeEngine } from "../../game/templates/dodge/dodge-engine.js";
import { CollectEngine } from "../../game/templates/collect/collect-engine.js";
import { GenericRuntime } from "../../game/core/runtime/generic-runtime.js";
import { dodgeGameDefinitionExample } from "../../game/definition/examples/dodge-game-definition.js";
import { collectGameDefinitionExample } from "../../game/definition/examples/collect-game-definition.js";
import type { InputState } from "../../game/core/game-state.js";

const noInput: InputState = {
  left: false,
  right: false,
  up: false,
  down: false,
  fire: false,
};

// Both sides use random() = 0.5 throughout: it aligns the spawned entity's
// x with the player's x in every scenario below (both DodgeEngine and
// GenericRuntime center/derive the player at the same x for these
// dimensions), so the only variable left to reason about is fall time.
const random = () => 0.5;

describe("dodge: DodgeEngine vs GenericRuntime(dodgeGameDefinitionExample)", () => {
  it("both end lost when an obstacle reaches the player", () => {
    const dodgeEngine = new DodgeEngine(
      dodgeGameConfigSchema.parse(defaultDodgeConfig),
      random,
    );
    // DodgeEngine's player starts near the bottom (y=584); GenericRuntime
    // centers the player (y=306) — GameDefinition has no initial-position
    // field (tasks/plan.md). Same obstacle physics, different fall
    // distance to the player, hence different second-tick duration below.
    dodgeEngine.update(700, noInput); // spawn (interval=700ms)
    const dodgeState = dodgeEngine.update(3100, noInput); // falls to y~580

    const runtime = new GenericRuntime(random);
    runtime.load(dodgeGameDefinitionExample);
    runtime.start();
    runtime.update(700, noInput); // spawn (interval=700ms)
    const runtimeState = runtime.update(1388, noInput); // falls to y~306

    expect(dodgeState.status).toBe("lost");
    expect(runtimeState.status).toBe("lost");
  });

  it("both end won once the survival duration is reached", () => {
    const dodgeEngine = new DodgeEngine(
      dodgeGameConfigSchema.parse(defaultDodgeConfig),
      random,
    );
    const dodgeState = dodgeEngine.update(
      defaultDodgeConfig.gameDurationSeconds * 1000,
      noInput,
    );

    const runtime = new GenericRuntime(random);
    runtime.load(dodgeGameDefinitionExample);
    runtime.start();
    const runtimeState = runtime.update(
      defaultDodgeConfig.gameDurationSeconds * 1000,
      noInput,
    );

    expect(dodgeState.status).toBe("won");
    expect(runtimeState.status).toBe("won");
  });
});

describe("collect: CollectEngine vs GenericRuntime(collectGameDefinitionExample)", () => {
  it("both end won once the collection target is reached", () => {
    const collectEngine = new CollectEngine(
      collectGameConfigSchema.parse(defaultCollectConfig),
      random,
    );
    const runtime = new GenericRuntime(random);
    runtime.load(collectGameDefinitionExample);
    runtime.start();

    // Each spawn (random()=0.5) lands exactly on the stationary player for
    // both implementations (identical centering formula), so every
    // spawnIntervalMs tick collects one collectible immediately.
    let collectState = collectEngine.getState();
    let runtimeState = runtime.getState();
    for (let i = 0; i < defaultCollectConfig.targetCollectibleCount; i += 1) {
      collectState = collectEngine.update(
        defaultCollectConfig.collectibleSpawnIntervalMs,
        noInput,
      );
      runtimeState = runtime.update(
        defaultCollectConfig.collectibleSpawnIntervalMs,
        noInput,
      );
    }

    expect(collectState.status).toBe("won");
    expect(runtimeState.status).toBe("won");
  });

  it("both end lost when the duration expires before the target is reached", () => {
    // A single 30s tick only ever triggers one spawn check (shouldSpawn
    // fires at most once per update() call, regardless of deltaMs), worth
    // 10 points — never enough to reach the 100-point target, so both
    // must time out. 5000ms is the schema's max interval; the exact value
    // doesn't matter as long as it's <= the 30s tick.
    const slowSpawnIntervalMs = 5000;
    const noSpawnConfig = collectGameConfigSchema.parse({
      ...defaultCollectConfig,
      collectibleSpawnIntervalMs: slowSpawnIntervalMs,
    });
    const collectEngine = new CollectEngine(noSpawnConfig, random);
    const collectState = collectEngine.update(
      defaultCollectConfig.gameDurationSeconds * 1000,
      noInput,
    );

    const runtime = new GenericRuntime(random);
    runtime.load({
      ...collectGameDefinitionExample,
      entities: [
        {
          ...collectGameDefinitionExample.entities[0]!,
          spawnIntervalMs: slowSpawnIntervalMs,
        },
      ],
    });
    runtime.start();
    const runtimeState = runtime.update(
      defaultCollectConfig.gameDurationSeconds * 1000,
      noInput,
    );

    expect(collectState.status).toBe("lost");
    expect(runtimeState.status).toBe("lost");
  });
});
