import { z } from "zod";

export const RULE_EVENTS = [
  "player-collides-obstacle",
  "player-collides-collectible",
  "player-collides-enemy",
  "projectile-collides-enemy",
  "timer-expired",
  "score-reached",
  "health-zero",
] as const;

export type RuleEvent = (typeof RULE_EVENTS)[number];

export const ruleEventSchema = z.enum(RULE_EVENTS);

export const ruleActionSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("increase-score"),
      amount: z.number().positive(),
    })
    .strict(),
  z.object({ type: z.literal("remove-entity") }).strict(),
  z
    .object({ type: z.literal("damage-player"), amount: z.number().positive() })
    .strict(),
  z.object({ type: z.literal("win-game") }).strict(),
  z.object({ type: z.literal("lose-game") }).strict(),
  z
    .object({ type: z.literal("spawn-entity"), entityId: z.string().min(1) })
    .strict(),
]);

export type RuleAction = z.infer<typeof ruleActionSchema>;

export const gameRuleSchema = z
  .object({
    when: ruleEventSchema,
    then: z.array(ruleActionSchema).min(1),
  })
  .strict();

export type GameRule = z.infer<typeof gameRuleSchema>;
