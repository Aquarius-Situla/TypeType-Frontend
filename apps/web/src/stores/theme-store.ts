import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type AppTheme = "system" | "dark" | "light";
export type ResolvedTheme = "dark" | "light";

const THEME_STORAGE_KEY = "typed-theme";

export function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined" || !window.matchMedia) return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function resolveEffectiveTheme(theme: AppTheme): ResolvedTheme {
  if (theme === "system") {
    return getSystemTheme();
  }
  return theme;
}

function resolveInitialTheme(): AppTheme {
  if (typeof window === "undefined") return "dark";
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const stored = parsed?.state?.theme;
      if (stored === "system" || stored === "dark" || stored === "light") {
        return stored;
      }
    }
  } catch {}
  if (typeof document !== "undefined" && document.documentElement.dataset.theme === "light") {
    return "light";
  }
  return "dark";
}

export function getNextTheme(current: AppTheme): AppTheme {
  if (current === "system") return "light";
  if (current === "light") return "dark";
  return "system";
}

function getSafeStorage() {
  if (typeof window === "undefined") {
    return {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
    };
  }
  try {
    const storage = window.localStorage;
    const testKey = "__theme_storage_test__";
    storage.setItem(testKey, testKey);
    storage.removeItem(testKey);
    return storage;
  } catch {
    return {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
    };
  }
}

type ThemeStore = {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  cycleTheme: () => void;
  toggleTheme: () => void;
};

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: resolveInitialTheme(),
      setTheme: (theme) => set({ theme }),
      cycleTheme: () => set((state) => ({ theme: getNextTheme(state.theme) })),
      toggleTheme: () => set((state) => ({ theme: getNextTheme(state.theme) })),
    }),
    {
      name: THEME_STORAGE_KEY,
      storage: createJSONStorage(() => getSafeStorage()),
      partialize: (state) => ({ theme: state.theme }),
    },
  ),
);
