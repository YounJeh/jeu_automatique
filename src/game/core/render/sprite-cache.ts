// Injectable image loading, same philosophy as RandomSource (CLAUDE.md
// §13.4): the loading/loaded/error state machine is pure TypeScript and
// unit-testable without a DOM (this repo has no jsdom/happy-dom, see
// vitest.config.ts). The real browser loader (new Image()) is wired in by
// GenericRenderer; tests inject a fake one instead.
export type SpriteStatus = "idle" | "loading" | "loaded" | "error";

export type SpriteLoader<TImage> = (src: string) => Promise<TImage>;

export class SpriteCache<TImage> {
  private readonly statuses = new Map<string, SpriteStatus>();
  private readonly images = new Map<string, TImage>();

  getStatus(assetId: string): SpriteStatus {
    return this.statuses.get(assetId) ?? "idle";
  }

  getImage(assetId: string): TImage | undefined {
    return this.images.get(assetId);
  }

  /** Starts loading `assetId` at most once; later calls for the same id are no-ops. */
  request(assetId: string, src: string, loader: SpriteLoader<TImage>): void {
    if (this.statuses.has(assetId)) return;

    this.statuses.set(assetId, "loading");

    let result: Promise<TImage>;
    try {
      result = loader(src);
    } catch {
      // A loader that throws synchronously is treated the same as one
      // that rejects — request() must never let an exception escape.
      this.statuses.set(assetId, "error");
      return;
    }

    result
      .then((image) => {
        this.images.set(assetId, image);
        this.statuses.set(assetId, "loaded");
      })
      .catch(() => {
        this.statuses.set(assetId, "error");
      });
  }
}
