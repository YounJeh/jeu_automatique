import { z } from "zod";

const CSS_COLOR_PATTERN =
  /^(#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(?:,\s*(?:0|1|0?\.\d+)\s*)?\))$/;

export const cssColorSchema = z
  .string()
  .regex(CSS_COLOR_PATTERN, "Couleur CSS invalide");

export const baseGameConfigShape = {
  id: z.string().min(1),
  title: z.string().min(3).max(60),
  description: z.string().min(10).max(240),
  theme: z.string().min(2).max(80),
  playerColor: cssColorSchema,
  backgroundColor: cssColorSchema,
  playerSpeed: z.number().min(100).max(600),
  gameDurationSeconds: z.number().min(10).max(120),
  victoryMessage: z.string().min(2).max(160),
  defeatMessage: z.string().min(2).max(160),
};
