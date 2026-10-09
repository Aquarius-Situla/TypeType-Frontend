import { beforeEach, describe, expect, it } from "bun:test";
import { applyTheme } from "../src/lib/theme";
import {
  getNextTheme,
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
      (globalThis as unknown as { window: unknown }).window = globalThis;
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

  it("cycles through light -> dark -> system -> light with cycleTheme and toggleTheme", () => {
    useThemeStore.getState().setTheme("light");
    expect(useThemeStore.getState().theme).toBe("light");

    useThemeStore.getState().cycleTheme();
    expect(useThemeStore.getState().theme).toBe("dark");

    useThemeStore.getState().toggleTheme();
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

  it("getNextTheme cycles through system -> light -> dark -> system", () => {
    expect(getNextTheme("system")).toBe("light");
    expect(getNextTheme("light")).toBe("dark");
    expect(getNextTheme("dark")).toBe("system");
  });

  it("updates DOM theme when OS system theme change event fires in system mode", () => {
    let isDarkOS = true;
    const listeners = new Set<(e: MediaQueryListEvent) => void>();

    window.matchMedia = (query: string) =>
      ({
        get matches() {
          return query.includes("dark") ? isDarkOS : !isDarkOS;
        },
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: (_type: string, handler: (e: MediaQueryListEvent) => void) => {
          listeners.add(handler);
        },
        removeEventListener: (_type: string, handler: (e: MediaQueryListEvent) => void) => {
          listeners.delete(handler);
        },
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      applyTheme("system");
    };
    mediaQuery.addEventListener("change", handleChange);

    applyTheme("system");
    expect(mockDataset.theme).toBe("dark");
    expect(mockStyle.colorScheme).toBe("dark");

    isDarkOS = false;
    for (const listener of listeners) {
      listener({ matches: false } as MediaQueryListEvent);
    }

    expect(mockDataset.theme).toBe("light");
    expect(mockStyle.colorScheme).toBe("light");

    isDarkOS = true;
    for (const listener of listeners) {
      listener({ matches: true } as MediaQueryListEvent);
    }

    expect(mockDataset.theme).toBe("dark");
    expect(mockStyle.colorScheme).toBe("dark");

    mediaQuery.removeEventListener("change", handleChange);
    expect(listeners.size).toBe(0);
  });
});
