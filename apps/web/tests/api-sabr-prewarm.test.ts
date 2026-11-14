import { afterEach, beforeEach, expect, mock, test } from "bun:test";
import { setTestOrigin } from "./test-origin";

if (!("window" in globalThis)) {
  Object.defineProperty(globalThis, "window", { value: {}, configurable: true, writable: true });
}
setTestOrigin("https://typetype.test");

const { prewarmSabrPlayback } = await import("../src/lib/api-sabr-prewarm");
const { useAuthStore } = await import("../src/stores/auth-store");

const originalFetch = globalThis.fetch;
const me = {
  id: "user-1",
  role: "USER" as const,
  publicUsername: "tester",
  bio: null,
  avatarUrl: null,
  avatarType: null,
  avatarCode: null,
};

const sampleConfig = {
  key: "video-1:137:251",
  videoId: "video-1",
  videoItag: 137,
  audioItag: 251,
  audioTrackId: null,
  audioOnly: false,
  isLive: false,
};

beforeEach(() => {
  setTestOrigin("https://typetype.test");
  useAuthStore.getState().setSession("stale-token", me);
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  useAuthStore.getState().setSignedOut();
});

test("uses the latest store token and refreshes once when SABR prewarm hits 401", async () => {
  const authHeaders: Array<string | null> = [];
  globalThis.fetch = mock(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.endsWith("/auth/refresh")) {
      return new Response(JSON.stringify({ accessToken: "fresh-token" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (url.endsWith("/auth/me")) {
      return new Response(JSON.stringify(me), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    const auth = new Headers(init?.headers).get("authorization");
    authHeaders.push(auth);
    if (auth === "Bearer fresh-token") {
      return new Response(JSON.stringify({ ready: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(null, { status: 401, statusText: "Unauthorized" });
  });

  useAuthStore.getState().setSession("newer-stale-token", me);
  const controller = new AbortController();

  await prewarmSabrPlayback(sampleConfig, controller.signal, 12_000);

  expect(authHeaders).toEqual(["Bearer newer-stale-token", "Bearer fresh-token"]);
});

test("does not send a stale token or refresh after the user signs out", async () => {
  const authHeaders: Array<string | null> = [];
  let refreshCalls = 0;
  globalThis.fetch = mock(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.endsWith("/auth/refresh")) {
      refreshCalls += 1;
      return new Response(null, { status: 401 });
    }
    authHeaders.push(new Headers(init?.headers).get("authorization"));
    return new Response(null, { status: 401, statusText: "Unauthorized" });
  });

  useAuthStore.getState().setSignedOut();
  const controller = new AbortController();

  await expect(prewarmSabrPlayback(sampleConfig, controller.signal, 0)).rejects.toThrow("401");
  expect(authHeaders).toEqual([null]);
  expect(refreshCalls).toBe(0);
});

test("skips duplicate /auth/refresh when another request refreshes token while prewarm is in flight", async () => {
  const authHeaders: Array<string | null> = [];
  let refreshCalls = 0;
  globalThis.fetch = mock(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.endsWith("/auth/refresh")) {
      refreshCalls += 1;
      return new Response(null, { status: 500 });
    }
    const auth = new Headers(init?.headers).get("authorization");
    authHeaders.push(auth);
    if (auth === "Bearer stale-token") {
      // Simulate another concurrent request finishing refresh before our 401 settles.
      useAuthStore.getState().setSession("already-refreshed-token", me);
      return new Response(null, { status: 401, statusText: "Unauthorized" });
    }
    return new Response(JSON.stringify({ ready: true }), { status: 200 });
  });

  const controller = new AbortController();
  await prewarmSabrPlayback(sampleConfig, controller.signal, 0);

  expect(authHeaders).toEqual(["Bearer stale-token", "Bearer already-refreshed-token"]);
  expect(refreshCalls).toBe(0);
});
