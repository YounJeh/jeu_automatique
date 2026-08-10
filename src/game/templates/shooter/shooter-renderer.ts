import type { ShooterGameConfig } from "../../../mastra/schemas/shooter-game-config-schema.js";
import type { ShooterEngineState } from "./shooter-engine.js";
import {
  SHOOTER_CANVAS_HEIGHT,
  SHOOTER_CANVAS_WIDTH,
  SHOOTER_ENEMY_SIZE,
  SHOOTER_PLAYER_SIZE,
  SHOOTER_PROJECTILE_SIZE,
} from "./shooter-config.js";

export type ShooterSprites = {
  player: string;
  enemy: string;
  projectile: string;
};

export class ShooterRenderer {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly config: ShooterGameConfig;
  private readonly sprites: ShooterSprites | undefined;

  constructor(
    canvas: HTMLCanvasElement,
    config: ShooterGameConfig,
    sprites?: ShooterSprites,
  ) {
    canvas.width = SHOOTER_CANVAS_WIDTH;
    canvas.height = SHOOTER_CANVAS_HEIGHT;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Le canvas 2D n'est pas disponible dans ce navigateur.");
    }

    this.ctx = ctx;
    this.config = config;
    this.sprites = sprites;
  }

  draw(state: ShooterEngineState): void {
    this.drawBackground();
    this.drawEnemies(state);
    this.drawProjectiles(state);
    this.drawPlayer(state);
    this.drawHud(state);

    if (state.status !== "playing") {
      this.drawOverlay(state);
    }
  }

  private drawBackground(): void {
    this.ctx.fillStyle = this.config.backgroundColor;
    this.ctx.fillRect(0, 0, SHOOTER_CANVAS_WIDTH, SHOOTER_CANVAS_HEIGHT);
  }

  private drawPlayer(state: ShooterEngineState): void {
    if (this.sprites) {
      this.drawSprite(
        this.sprites.player,
        state.player.x,
        state.player.y,
        SHOOTER_PLAYER_SIZE,
      );
      return;
    }

    this.ctx.fillStyle = this.config.playerColor;
    this.ctx.fillRect(
      state.player.x,
      state.player.y,
      SHOOTER_PLAYER_SIZE,
      SHOOTER_PLAYER_SIZE,
    );
  }

  private drawEnemies(state: ShooterEngineState): void {
    if (this.sprites) {
      for (const enemy of state.enemies) {
        this.drawSprite(
          this.sprites.enemy,
          enemy.x,
          enemy.y,
          SHOOTER_ENEMY_SIZE,
        );
      }
      return;
    }

    this.ctx.fillStyle = this.config.enemyColor;
    for (const enemy of state.enemies) {
      this.ctx.fillRect(
        enemy.x,
        enemy.y,
        SHOOTER_ENEMY_SIZE,
        SHOOTER_ENEMY_SIZE,
      );
    }
  }

  private drawProjectiles(state: ShooterEngineState): void {
    if (this.sprites) {
      for (const projectile of state.projectiles) {
        this.drawSprite(
          this.sprites.projectile,
          projectile.x,
          projectile.y,
          SHOOTER_PROJECTILE_SIZE,
        );
      }
      return;
    }

    this.ctx.fillStyle = this.config.projectileColor;
    for (const projectile of state.projectiles) {
      this.ctx.fillRect(
        projectile.x,
        projectile.y,
        SHOOTER_PROJECTILE_SIZE,
        SHOOTER_PROJECTILE_SIZE,
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

  private drawHud(state: ShooterEngineState): void {
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = "16px sans-serif";
    this.ctx.fillText(`Score : ${state.score}`, 12, 24);
    this.ctx.fillText(`Vie : ${state.health}`, 12, 44);
  }

  private drawOverlay(state: ShooterEngineState): void {
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
    this.ctx.fillRect(0, 0, SHOOTER_CANVAS_WIDTH, SHOOTER_CANVAS_HEIGHT);

    const message =
      state.status === "won"
        ? this.config.victoryMessage
        : this.config.defeatMessage;

    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = "24px sans-serif";
    this.ctx.textAlign = "center";
    this.ctx.fillText(
      message,
      SHOOTER_CANVAS_WIDTH / 2,
      SHOOTER_CANVAS_HEIGHT / 2,
    );
    this.ctx.textAlign = "left";
  }
}
