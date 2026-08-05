import type { DodgeGameConfig } from "../../../mastra/schemas/dodge-game-config-schema.js";
import type { DodgeEngineState } from "./dodge-engine.js";
import {
  DODGE_CANVAS_HEIGHT,
  DODGE_CANVAS_WIDTH,
  DODGE_OBSTACLE_SIZE,
  DODGE_PLAYER_SIZE,
} from "./dodge-config.js";

export type DodgeSprites = {
  player: string;
  obstacle: string;
};

export class DodgeRenderer {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly config: DodgeGameConfig;
  private readonly sprites: DodgeSprites | undefined;

  constructor(
    canvas: HTMLCanvasElement,
    config: DodgeGameConfig,
    sprites?: DodgeSprites,
  ) {
    canvas.width = DODGE_CANVAS_WIDTH;
    canvas.height = DODGE_CANVAS_HEIGHT;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Le canvas 2D n'est pas disponible dans ce navigateur.");
    }

    this.ctx = ctx;
    this.config = config;
    this.sprites = sprites;
  }

  draw(state: DodgeEngineState): void {
    this.drawBackground();
    this.drawObstacles(state);
    this.drawPlayer(state);
    this.drawScore(state);

    if (state.status !== "playing") {
      this.drawOverlay(state);
    }
  }

  private drawBackground(): void {
    this.ctx.fillStyle = this.config.backgroundColor;
    this.ctx.fillRect(0, 0, DODGE_CANVAS_WIDTH, DODGE_CANVAS_HEIGHT);
  }

  private drawPlayer(state: DodgeEngineState): void {
    if (this.sprites) {
      this.drawSprite(
        this.sprites.player,
        state.player.x,
        state.player.y,
        DODGE_PLAYER_SIZE,
      );
      return;
    }

    this.ctx.fillStyle = this.config.playerColor;
    this.ctx.fillRect(
      state.player.x,
      state.player.y,
      DODGE_PLAYER_SIZE,
      DODGE_PLAYER_SIZE,
    );
  }

  private drawObstacles(state: DodgeEngineState): void {
    if (this.sprites) {
      for (const obstacle of state.obstacles) {
        this.drawSprite(
          this.sprites.obstacle,
          obstacle.x,
          obstacle.y,
          DODGE_OBSTACLE_SIZE,
        );
      }
      return;
    }

    this.ctx.fillStyle = this.config.obstacleColor;
    for (const obstacle of state.obstacles) {
      this.ctx.fillRect(
        obstacle.x,
        obstacle.y,
        DODGE_OBSTACLE_SIZE,
        DODGE_OBSTACLE_SIZE,
      );
    }
  }

  private drawSprite(emoji: string, x: number, y: number, size: number): void {
    this.ctx.font = `${size}px sans-serif`;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(emoji, x + size / 2, y + size / 2);
    this.ctx.textAlign = "left";
    this.ctx.textBaseline = "alphabetic";
  }

  private drawScore(state: DodgeEngineState): void {
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = "16px sans-serif";
    this.ctx.fillText(`Score : ${state.score}`, 12, 24);
  }

  private drawOverlay(state: DodgeEngineState): void {
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
    this.ctx.fillRect(0, 0, DODGE_CANVAS_WIDTH, DODGE_CANVAS_HEIGHT);

    const message =
      state.status === "won"
        ? this.config.victoryMessage
        : this.config.defeatMessage;

    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = "24px sans-serif";
    this.ctx.textAlign = "center";
    this.ctx.fillText(message, DODGE_CANVAS_WIDTH / 2, DODGE_CANVAS_HEIGHT / 2);
    this.ctx.textAlign = "left";
  }
}
