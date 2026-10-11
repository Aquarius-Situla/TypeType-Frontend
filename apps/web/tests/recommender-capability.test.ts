import { describe, expect, test } from "bun:test";

if (!("localStorage" in globalThis)) {
  Object.defineProperty(globalThis, "localStorage", {
    value: {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
    },
  });
}

const { normalizeInstanceCapabilities } = await import("../src/lib/api-instance");
const { isAlgorithmSection } = await import("../src/lib/algorithm-sections");

const base = { guestAllowed: true, youtubeRemoteLoginEnabled: false };

describe("recommender instance capability", () => {
  test("an instance without the service offers nothing", () => {
    expect(normalizeInstanceCapabilities(base)?.recommender).toEqual({
      installed: false,
      enabled: false,
      experimental: true,
    });
  });

  test("a malformed capability counts as absent", () => {
    const capabilities = normalizeInstanceCapabilities({
      ...base,
      recommender: { enabled: "yes" },
    });
    expect(capabilities?.recommender.enabled).toBe(false);
  });

  test("an installed and switched-on service is offered", () => {
    const capabilities = normalizeInstanceCapabilities({
      ...base,
      recommender: { installed: true, enabled: true, experimental: true },
    });
    expect(capabilities?.recommender).toEqual({
      installed: true,
      enabled: true,
      experimental: true,
    });
  });
});

describe("algorithm page sections", () => {
  test("only known sections are accepted from the address bar", () => {
    expect(isAlgorithmSection("guide")).toBe(true);
    expect(isAlgorithmSection("data")).toBe(true);
    expect(isAlgorithmSection("elsewhere")).toBe(false);
    expect(isAlgorithmSection(undefined)).toBe(false);
  });
});
