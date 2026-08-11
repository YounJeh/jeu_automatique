import { describe, expect, it, vi } from "vitest";
import { SpriteCache } from "../../game/core/render/sprite-cache.js";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("SpriteCache", () => {
  it("starts idle for an assetId never requested", () => {
    const cache = new SpriteCache<string>();
    expect(cache.getStatus("crystal-purple")).toBe("idle");
    expect(cache.getImage("crystal-purple")).toBeUndefined();
  });

  it("moves to loading synchronously on request", () => {
    const cache = new SpriteCache<string>();
    const { promise } = deferred<string>();
    cache.request("crystal-purple", "/x.svg", () => promise);
    expect(cache.getStatus("crystal-purple")).toBe("loading");
  });

  it("moves to loaded once the loader resolves, and exposes the image", async () => {
    const cache = new SpriteCache<string>();
    const { promise, resolve } = deferred<string>();
    cache.request("crystal-purple", "/x.svg", () => promise);

    resolve("fake-image");
    await promise;
    await Promise.resolve();

    expect(cache.getStatus("crystal-purple")).toBe("loaded");
    expect(cache.getImage("crystal-purple")).toBe("fake-image");
  });

  it("moves to error once the loader rejects, without throwing", async () => {
    const cache = new SpriteCache<string>();
    const { promise, reject } = deferred<string>();
    cache.request("crystal-purple", "/x.svg", () => promise);

    reject(new Error("network error"));
    await promise.catch(() => {});
    await Promise.resolve();

    expect(cache.getStatus("crystal-purple")).toBe("error");
    expect(cache.getImage("crystal-purple")).toBeUndefined();
  });

  it("moves to error, without throwing, when the loader throws synchronously", () => {
    const cache = new SpriteCache<string>();
    const loader = vi.fn(() => {
      throw new Error("boom");
    });

    expect(() =>
      cache.request("crystal-purple", "/x.svg", loader),
    ).not.toThrow();

    expect(cache.getStatus("crystal-purple")).toBe("error");
  });

  it("dedupes repeated requests for the same assetId", () => {
    const cache = new SpriteCache<string>();
    const loader = vi.fn(() => new Promise<string>(() => {}));

    cache.request("crystal-purple", "/x.svg", loader);
    cache.request("crystal-purple", "/x.svg", loader);
    cache.request("crystal-purple", "/x.svg", loader);

    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("tracks independent statuses per assetId", () => {
    const cache = new SpriteCache<string>();
    cache.request("crystal-purple", "/a.svg", () => new Promise(() => {}));

    expect(cache.getStatus("crystal-purple")).toBe("loading");
    expect(cache.getStatus("meteor-small")).toBe("idle");
  });
});
