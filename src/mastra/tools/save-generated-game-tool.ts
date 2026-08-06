import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { getProjectRoot } from "../project-root.js";
import {
  generatedGameCatalogItemSchema,
  type GeneratedGameCatalogItem,
} from "../schemas/generated-game-catalog-item-schema.js";

const DEFAULT_GENERATED_GAMES_FILE =
  "public/generated-games/generated-games.json";

function getGeneratedGamesFilePath(): string {
  return resolve(
    getProjectRoot(),
    process.env.GENERATED_GAMES_FILE ?? DEFAULT_GENERATED_GAMES_FILE,
  );
}

async function readGeneratedGames(
  filePath: string,
): Promise<GeneratedGameCatalogItem[]> {
  let raw: string;
  try {
    raw = await readFile(filePath, "utf-8");
  } catch {
    return [];
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch {
    console.error(
      `[saveGeneratedGameTool] Fichier JSON illisible, ignoré : ${filePath}`,
    );
    return [];
  }

  const result = z.array(generatedGameCatalogItemSchema).safeParse(parsedJson);
  if (!result.success) {
    console.error(
      `[saveGeneratedGameTool] Contenu invalide dans ${filePath}, fichier ignoré.`,
    );
    return [];
  }

  return result.data;
}

async function writeGeneratedGames(
  filePath: string,
  games: GeneratedGameCatalogItem[],
): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.${randomUUID()}.tmp`;
  await writeFile(tempPath, JSON.stringify(games, null, 2), "utf-8");
  await rename(tempPath, filePath);
}

/**
 * Enregistre un jeu généré dans le stockage JSON autorisé. Le chemin vient
 * uniquement de GENERATED_GAMES_FILE (jamais du modèle), l'identifiant est
 * toujours régénéré ici en cas de collision, et les jeux existants (y
 * compris les jeux intégrés, qui ne vivent pas dans ce fichier) ne sont
 * jamais écrasés.
 */
export const saveGeneratedGameTool = createTool({
  id: "save-generated-game",
  description:
    "Enregistre un jeu généré dans le stockage JSON autorisé, sans jamais accepter de chemin fourni par le modèle.",
  inputSchema: generatedGameCatalogItemSchema,
  outputSchema: generatedGameCatalogItemSchema,
  execute: async (item) => {
    const filePath = getGeneratedGamesFilePath();
    const existingGames = await readGeneratedGames(filePath);

    let id = item.id;
    while (existingGames.some((game) => game.id === id)) {
      id = `generated-${randomUUID()}`;
    }

    const savedItem: GeneratedGameCatalogItem = { ...item, id };
    await writeGeneratedGames(filePath, [...existingGames, savedItem]);

    return savedItem;
  },
});
