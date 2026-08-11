import { getAssetById } from "../../assets/asset-catalog.js";
import type { AppearanceDefinition } from "../../definition/appearance-definition-schema.js";
import type { GameDefinition } from "../../definition/game-definition-schema.js";
import type { RuntimeState } from "../runtime/runtime-state.js";

// PHASE 7: canvas renderer driven entirely by a GameDefinition + the
// RuntimeState produced by GenericRuntime.
//
// PHASE 9: appearance.type === "sprite" always draws its catalog
// fallbackColor for now — real image loading with a SpriteCache lands in
// the next increment. This keeps the union exhaustive and the renderer
// compilable/safe at every intermediate step (never blank, never throws).
export class GenericRenderer {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly definition: GameDefinition;

  constructor(canvas: HTMLCanvasElement, definition: GameDefinition) {
    canvas.width = definition.world.width;
    canvas.height = definition.world.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Le canvas 2D n'est pas disponible dans ce navigateur.");
    }

    this.ctx = ctx;
    this.definition = definition;
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
      this.ctx.fillStyle =
        getAssetById(appearance.assetId)?.fallbackColor ?? "#888888";
      this.ctx.fillRect(x, y, size, size);
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
