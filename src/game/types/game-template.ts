export const GAME_TEMPLATES = ["dodge", "collect"] as const;

export type GameTemplate = (typeof GAME_TEMPLATES)[number];
