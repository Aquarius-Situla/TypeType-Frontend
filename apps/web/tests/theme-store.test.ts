import { beforeEach, describe, expect, it } from "bun:test";
import { applyTheme } from "../src/lib/theme";
import {
  getSystemTheme,
  resolveEffectiveTheme,
  useThemeStore,
} from "../src/stores/theme-store";

describe("Theme system and system theme following", () => {
  const mockDataset: Record<string, string> = {};
  const mockStyle: Record<string, string> = {};
  const mockMetaAttrs: Record<string, string> = {};

  beforeEach(() => {
    mockDataset.theme = "dark";
    mockStyle.colorScheme = "dark";
    mockMetaAttrs.content = "#09090b";

    const docMock = {
      documentElement: {
        dataset: mockDataset,
        style: mockStyle,
      },
      querySelector: (selector: string) => {
        if (selector.includes("theme-color")) {
          return {
            setAttribute: (name: string, val: string) => {
              mockMetaAttrs[name] = val;
            },
            getAttribute: (name: string) => mockMetaAttrs[name],
          };
        }
        return null;
      },
    };

    Object.defineProperty(globalThis, "document", {
      value: docMock,
      configurable: true,
      writable: true,
    });

    if (!("window" in globalThis)) {
      Object.defineProperty(globalThis, "window", {
        value: globalThis,
        configurable: true,
        writable: true,
      });
    } else {
      (globalThis as any).window = globalThis;
    }
  });

  it("resolves static light and dark themes directly", () => {
    expect(resolveEffectiveTheme("dark")).toBe("dark");
    expect(resolveEffectiveTheme("light")).toBe("light");
  });

  it("resolves system theme matching prefers-color-scheme", () => {
    window.matchMedia = (query: string) =>
      ({
        matches: query.includes("dark"),
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList;

    expect(getSystemTheme()).toBe("dark");
    expect(resolveEffectiveTheme("system")).toBe("dark");

    window.matchMedia = (query: string) =>
      ({
        matches: !query.includes("dark"),
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList;

    expect(getSystemTheme()).toBe("light");
    expect(resolveEffectiveTheme("system")).toBe("light");
  });

  it("cycles through light -> dark -> system -> light", () => {
    useThemeStore.getState().setTheme("light");
    expect(useThemeStore.getState().theme).toBe("light");

    useThemeStore.getState().cycleTheme();
    expect(useThemeStore.getState().theme).toBe("dark");

    useThemeStore.getState().cycleTheme();
    expect(useThemeStore.getState().theme).toBe("system");

    useThemeStore.getState().cycleTheme();
    expect(useThemeStore.getState().theme).toBe("light");
  });

  it("applies theme properly to DOM and meta tags", () => {
    applyTheme("light");
    expect(mockDataset.theme).toBe("light");
    expect(mockStyle.colorScheme).toBe("light");
    expect(mockMetaAttrs.content).toBe("#f4f4f5");

    applyTheme("dark");
    expect(mockDataset.theme).toBe("dark");
    expect(mockStyle.colorScheme).toBe("dark");
    expect(mockMetaAttrs.content).toBe("#09090b");
  });

  it("applies resolved theme when system mode is selected", () => {
    window.matchMedia = (query: string) =>
      ({
        matches: query.includes("dark"),
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList;

    applyTheme("system");
    expect(mockDataset.theme).toBe("dark");
    expect(mockStyle.colorScheme).toBe("dark");
  });
});
