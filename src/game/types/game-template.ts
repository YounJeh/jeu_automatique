export const GAME_TEMPLATES = ["dodge", "collect", "shooter"] as const;

export type GameTemplate = (typeof GAME_TEMPLATES)[number];
