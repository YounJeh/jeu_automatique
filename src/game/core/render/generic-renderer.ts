import { getAssetById } from "../../assets/asset-catalog.js";
import type { AppearanceDefinition } from "../../definition/appearance-definition-schema.js";
import type { GameDefinition } from "../../definition/game-definition-schema.js";
import type { RuntimeState } from "../runtime/runtime-state.js";
import { SpriteCache, type SpriteLoader } from "./sprite-cache.js";

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error(`Impossible de charger le sprite "${src}".`));
    image.src = src;
  });
}

// PHASE 7: canvas renderer driven entirely by a GameDefinition + the
// RuntimeState produced by GenericRuntime.
//
// PHASE 9: appearance.type === "sprite" draws the loaded image once
// SpriteCache reports "loaded"; before that (idle/loading) and on load
// failure ("error") it draws the catalog's fallbackColor instead — a
// broken or slow-loading asset never blocks or crashes the render loop.
export class GenericRenderer {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly definition: GameDefinition;
  private readonly spriteCache = new SpriteCache<HTMLImageElement>();
  private readonly spriteLoader: SpriteLoader<HTMLImageElement>;

  constructor(
    canvas: HTMLCanvasElement,
    definition: GameDefinition,
    spriteLoader: SpriteLoader<HTMLImageElement> = loadImageElement,
  ) {
    canvas.width = definition.world.width;
    canvas.height = definition.world.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Le canvas 2D n'est pas disponible dans ce navigateur.");
    }

    this.ctx = ctx;
    this.definition = definition;
    this.spriteLoader = spriteLoader;
  }

  draw(state: RuntimeState): void {
    this.drawBackground();
    this.drawEntities(state);
    this.drawPlayer(state);
    this.drawScore(state);

    if (state.status !== "playing") {
      this.drawOverlay(state);
    }
  }

  private drawBackground(): void {
    const { width, height } = this.definition.world;
    this.ctx.fillStyle = this.definition.presentation.backgroundColor;
    this.ctx.fillRect(0, 0, width, height);
  }

  private drawPlayer(state: RuntimeState): void {
    this.drawShape(
      this.definition.player.appearance,
      state.player.x,
      state.player.y,
      this.definition.player.size,
    );
  }

  private drawEntities(state: RuntimeState): void {
    for (const entity of state.entities) {
      const entityDef = this.definition.entities.find(
        (def) => def.id === entity.definitionId,
      );
      // No matching EntityDefinition (inconsistent runtime state): skip
      // rather than crash the whole frame.
      if (!entityDef) continue;

      this.drawShape(
        entityDef.appearance,
        entity.position.x,
        entity.position.y,
        entityDef.size,
      );
    }
  }

  private drawShape(
    appearance: AppearanceDefinition,
    x: number,
    y: number,
    size: number,
  ): void {
    if (appearance.type === "sprite") {
      this.drawSprite(appearance.assetId, x, y, size);
      return;
    }

    this.ctx.fillStyle = appearance.color;

    switch (appearance.shape) {
      case "rectangle":
        this.ctx.fillRect(x, y, size, size);
        return;
      case "circle": {
        const radius = size / 2;
        this.ctx.beginPath();
        this.ctx.arc(x + radius, y + radius, radius, 0, Math.PI * 2);
        this.ctx.fill();
        return;
      }
      case "triangle": {
        this.ctx.beginPath();
        this.ctx.moveTo(x + size / 2, y);
        this.ctx.lineTo(x + size, y + size);
        this.ctx.lineTo(x, y + size);
        this.ctx.closePath();
        this.ctx.fill();
        return;
      }
    }
  }

  private drawSprite(
    assetId: string,
    x: number,
    y: number,
    size: number,
  ): void {
    const asset = getAssetById(assetId);

    if (asset) {
      if (this.spriteCache.getStatus(assetId) === "idle") {
        this.spriteCache.request(assetId, asset.src, this.spriteLoader);
      }

      const image = this.spriteCache.getImage(assetId);
      if (image) {
        this.ctx.drawImage(image, x, y, size, size);
        return;
      }
    }

    // Not loaded yet, load failed, or (defensively) unknown assetId:
    // fall back to a plain rectangle rather than leave the entity blank.
    this.ctx.fillStyle = asset?.fallbackColor ?? "#888888";
    this.ctx.fillRect(x, y, size, size);
  }

  private drawScore(state: RuntimeState): void {
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = "16px sans-serif";
    this.ctx.fillText(`Score : ${state.score}`, 12, 24);
  }

  private drawOverlay(state: RuntimeState): void {
    const { width, height } = this.definition.world;
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
    this.ctx.fillRect(0, 0, width, height);

    const message =
      state.status === "won"
        ? this.definition.presentation.victoryMessage
        : this.definition.presentation.defeatMessage;

    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = "24px sans-serif";
    this.ctx.textAlign = "center";
    this.ctx.fillText(message, width / 2, height / 2);
    this.ctx.textAlign = "left";
  }
}
