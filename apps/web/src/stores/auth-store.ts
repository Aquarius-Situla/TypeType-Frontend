import { create } from "zustand";
import { clearLegacyUserCaches, clearUserCaches } from "../lib/settings-cache";
import type { AuthMe, AuthStatus } from "../types/auth";

type StoredAuth = {
  token: string;
  me: AuthMe | null;
};

type AuthStore = {
  token: string | null;
  me: AuthMe | null;
  status: AuthStatus;
  setBootstrapping: () => void;
  setToken: (token: string) => void;
  setSession: (token: string, me: AuthMe) => void;
  setSignedOut: () => void;
};

const STORAGE_KEY = "typed-auth";

function toStatus(me: AuthMe): AuthStatus {
  return me.id.startsWith("guest:") ? "guest" : "authenticated";
}

function normalizeAuthMe(me: AuthMe | null): AuthMe | null {
  if (!me) return null;
  return {
    id: me.id,
    role: me.role,
    publicUsername: me.publicUsername ?? null,
    bio: me.bio ?? null,
    avatarUrl: me.avatarUrl ?? null,
    avatarType: me.avatarType ?? null,
    avatarCode: me.avatarCode ?? null,
  };
}

function readStoredAuth(): StoredAuth | null {
  return parseStoredAuth(localStorage.getItem(STORAGE_KEY));
}

function parseStoredAuth(raw: string | null): StoredAuth | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredAuth;
    if (typeof parsed.token !== "string") return null;
    return { token: parsed.token, me: normalizeAuthMe(parsed.me ?? null) };
  } catch {
    return null;
  }
}

function writeStoredAuth(data: StoredAuth): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

const stored = readStoredAuth();

export const useAuthStore = create<AuthStore>((set, get) => ({
  token: stored?.token ?? null,
  me: stored?.me ?? null,
  status: stored?.token == null ? "signed_out" : "loading",
  setBootstrapping: () =>
    set((state) => ({
      ...state,
      status: state.token === null ? "signed_out" : "loading",
    })),
  setToken: (token) => {
    clearUserCaches(get().me?.id);
    clearLegacyUserCaches();
    writeStoredAuth({ token, me: null });
    set({ token, me: null, status: "loading" });
  },
  setSession: (token, me) => {
    const normalized = normalizeAuthMe(me);
    if (!normalized) return;
    const previousUserId = get().me?.id;
    if (previousUserId && previousUserId !== normalized.id) {
      clearUserCaches(previousUserId);
    }
    clearLegacyUserCaches();
    writeStoredAuth({ token, me: normalized });
    set({ token, me: normalized, status: toStatus(normalized) });
  },
  setSignedOut: () => {
    clearUserCaches(get().me?.id);
    clearLegacyUserCaches();
    localStorage.removeItem(STORAGE_KEY);
    set({ token: null, me: null, status: "signed_out" });
  },
}));

export function syncAuthStoreFromStorage(raw = localStorage.getItem(STORAGE_KEY)): string | null {
  const next = parseStoredAuth(raw);
  if (!next) {
    useAuthStore.setState({ token: null, me: null, status: "signed_out" });
    return null;
  }
  useAuthStore.setState({
    token: next.token,
    me: next.me,
    status: next.me ? toStatus(next.me) : "loading",
  });
  return next.token;
}

export function subscribeAuthStorage(): () => void {
  const sync = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) syncAuthStoreFromStorage(event.newValue);
  };
  window.addEventListener("storage", sync);
  return () => window.removeEventListener("storage", sync);
}
