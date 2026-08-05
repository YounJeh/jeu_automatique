import type { GameCatalogItem } from "../../game/types/game-catalog-item.js";

export type GameSidebarOptions = {
  listElement: HTMLElement;
  createButton: HTMLButtonElement;
  onSelectGame: (item: GameCatalogItem) => void;
  onCreateGame: () => void;
};

export type GameSidebarController = {
  render: (items: GameCatalogItem[], activeId?: string) => void;
  setActive: (id: string) => void;
};

export function initGameSidebar({
  listElement,
  createButton,
  onSelectGame,
  onCreateGame,
}: GameSidebarOptions): GameSidebarController {
  let currentItems: GameCatalogItem[] = [];
  let activeId: string | undefined;

  function renderList(): void {
    listElement.replaceChildren();

    for (const item of currentItems) {
      const listItem = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "game-list__item";
      button.classList.toggle("game-list__item--active", item.id === activeId);
      button.dataset.gameId = item.id;

      const title = document.createElement("span");
      title.className = "game-list__title";
      title.textContent = item.title;

      const badge = document.createElement("span");
      badge.className = "game-list__badge";
      badge.textContent =
        item.source === "generated" ? "généré" : item.template;

      button.append(title, badge);
      button.addEventListener("click", () => onSelectGame(item));

      listItem.append(button);
      listElement.append(listItem);
    }
  }

  createButton.addEventListener("click", () => onCreateGame());

  return {
    render(items, nextActiveId) {
      currentItems = items;
      if (nextActiveId) activeId = nextActiveId;
      renderList();
    },
    setActive(id) {
      activeId = id;
      renderList();
    },
  };
}
