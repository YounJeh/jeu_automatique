import type { GameCatalogItem } from "../../game/types/game-catalog-item.js";

export type GameSelectorOptions = {
  select: HTMLSelectElement;
  items: GameCatalogItem[];
  onSelect: (item: GameCatalogItem) => void;
};

export function initGameSelector({
  select,
  items,
  onSelect,
}: GameSelectorOptions): void {
  select.replaceChildren();

  for (const item of items) {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = `${item.title} (${item.template})`;
    select.append(option);
  }

  select.addEventListener("change", () => {
    const item = items.find((candidate) => candidate.id === select.value);
    if (item) onSelect(item);
  });

  const first = items[0];
  if (first) onSelect(first);
}

export function addSelectorOption(
  select: HTMLSelectElement,
  item: GameCatalogItem,
): void {
  const existing = Array.from(select.options).find(
    (option) => option.value === item.id,
  );
  if (existing) return;

  const option = document.createElement("option");
  option.value = item.id;
  option.textContent = `${item.title} (${item.template})`;
  select.append(option);
}
