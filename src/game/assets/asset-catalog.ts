// Catalogue d'assets fermé et contrôlé par l'application (CLAUDE.md §16.3).
// Le LLM référence un asset uniquement par `assetId` (cf. Task 4,
// appearance-definition-schema.ts) — jamais par un chemin ou une URL
// arbitraire. `fallbackColor` n'est jamais exposé au LLM : il n'existe
// que pour garantir un repli visuel si le sprite ne charge pas
// (Task 5/6, sprite-cache.ts + generic-renderer.ts).
export const ASSET_CATALOG = [
  {
    id: "crystal-purple",
    type: "sprite",
    src: "/assets/sprites/crystal-purple.svg",
    width: 32,
    height: 32,
    fallbackColor: "#a855f7",
  },
  {
    id: "meteor-small",
    type: "sprite",
    src: "/assets/sprites/meteor-small.svg",
    width: 32,
    height: 32,
    fallbackColor: "#78716c",
  },
  {
    id: "alien-green",
    type: "sprite",
    src: "/assets/sprites/alien-green.svg",
    width: 32,
    height: 32,
    fallbackColor: "#22c55e",
  },
] as const;

export type AssetCatalogItem = (typeof ASSET_CATALOG)[number];

export type AssetId = AssetCatalogItem["id"];

export const ASSET_IDS = ASSET_CATALOG.map((item) => item.id) as [
  AssetId,
  ...AssetId[],
];

export function getAssetById(id: string): AssetCatalogItem | undefined {
  return ASSET_CATALOG.find((item) => item.id === id);
}
