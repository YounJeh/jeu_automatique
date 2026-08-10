import type { GameStatus } from "../game-state.js";
import type {
  GameRule,
  RuleEvent,
} from "../../definition/rule-definition-schema.js";
import type { RuntimeEntity } from "./runtime-state.js";

export type RuleTrigger = {
  event: RuleEvent;
  hitEntities: RuntimeEntity[];
};

export type RuleOutcome = {
  scoreDelta: number;
  healthDelta: number;
  removedEntityIds: Set<string>;
  spawnEntityIds: string[];
  status: GameStatus | null;
};

function emptyOutcome(): RuleOutcome {
  return {
    scoreDelta: 0,
    healthDelta: 0,
    removedEntityIds: new Set(),
    spawnEntityIds: [],
    status: null,
  };
}

export function applyRules(
  rules: readonly GameRule[],
  triggers: readonly RuleTrigger[],
): RuleOutcome {
  const outcome = emptyOutcome();

  for (const trigger of triggers) {
    for (const rule of rules) {
      if (rule.when !== trigger.event) continue;

      for (const action of rule.then) {
        switch (action.type) {
          case "increase-score":
            outcome.scoreDelta += action.amount;
            break;
          case "damage-player":
            outcome.healthDelta += action.amount;
            break;
          case "remove-entity":
            for (const entity of trigger.hitEntities) {
              outcome.removedEntityIds.add(entity.id);
            }
            break;
          case "spawn-entity":
            outcome.spawnEntityIds.push(action.entityId);
            break;
          case "win-game":
            outcome.status = "won";
            break;
          case "lose-game":
            outcome.status = "lost";
            break;
        }
      }
    }
  }

  return outcome;
}
