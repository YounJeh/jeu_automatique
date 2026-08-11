import { defaultDodgeConfig } from "../templates/dodge/dodge-config.js";
import { defaultCollectConfig } from "../templates/collect/collect-config.js";
import { defaultShooterConfig } from "../templates/shooter/shooter-config.js";
import { getGamePreset } from "../presets/registry.js";
import { isGenericRuntimeEnabled } from "../core/feature-flags.js";
import type { GameCatalogItem } from "../types/game-catalog-item.js";

// PHASE 10: "survival" has no legacy config (GameDefinition-only preset,
// specs/phase10-top-down-survival.md §5) — GameController.loadGame() only
// falls back to a legacy engine when `config` is present, so a config-less
// item is playable only when GenericRuntime is enabled. Computed fresh
// (not a frozen top-level array) so it only ever exposes "survival" when
// it's actually playable, and so tests can exercise both flag states
// without a module reset.
export function getBuiltInGames(): GameCatalogItem[] {
  const games: GameCatalogItem[] = [
    {
      id: "dodge-game",
      title: defaultDodgeConfig.title,
      description: defaultDodgeConfig.description,
      template: "dodge",
      source: "built-in",
      config: defaultDodgeConfig,
      definition: getGamePreset("dodge").definition,
    },
    {
      id: "collect-game",
      title: defaultCollectConfig.title,
      description: defaultCollectConfig.description,
      template: "collect",
      source: "built-in",
      config: defaultCollectConfig,
      definition: getGamePreset("collect").definition,
    },
    {
      id: "shooter-game",
      title: defaultShooterConfig.title,
      description: defaultShooterConfig.description,
      template: "shooter",
      source: "built-in",
      config: defaultShooterConfig,
      definition: getGamePreset("shooter").definition,
    },
  ];

  if (isGenericRuntimeEnabled()) {
    const survival = getGamePreset("survival").definition;
    games.push({
      id: "survival-game",
      title: survival.metadata.title,
      description: survival.metadata.description,
      template: "survival",
      source: "built-in",
      definition: survival,
    });
  }

  return games;
}
