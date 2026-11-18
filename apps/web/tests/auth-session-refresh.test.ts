import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";

if (!("localStorage" in globalThis)) {
  Object.defineProperty(globalThis, "localStorage", {
    value: {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
    },
  });
}

const { authed, extractBearerToken, resolveUnauthorizedRetryToken } = await import(
  "../src/lib/authed"
);
const { fetchChannel } = await import("../src/lib/api-discovery");
const { bootstrapSession, refreshSession } = await import("../src/lib/auth-session");
const { syncAuthStoreFromStorage, useAuthStore } = await import("../src/stores/auth-store");

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

function jsonResponse(status: number, body: object): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  useAuthStore.getState().setSession("stale-token", me);
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  useAuthStore.getState().setSignedOut();
});

describe("session refresh failures", () => {
  test("keeps the cached session when bootstrap refresh is temporarily unavailable", async () => {
    globalThis.fetch = mock(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/auth/me")) return jsonResponse(401, { error: "Unauthorized" });
      if (url.endsWith("/auth/refresh")) {
        return jsonResponse(503, { error: "Temporarily unavailable" });
      }
      throw new Error(`Unexpected request: ${url}`);
    });

    await bootstrapSession();

    expect(useAuthStore.getState()).toMatchObject({
      token: "stale-token",
      me,
      status: "authenticated",
    });
  });

  test("preserves the session and propagates a temporary refresh error", async () => {
    globalThis.fetch = mock(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === "/api/settings") return new Response(null, { status: 401 });
      if (url.endsWith("/auth/refresh")) {
        return jsonResponse(503, { error: "Temporarily unavailable" });
      }
      throw new Error(`Unexpected request: ${url}`);
    });

    await expect(authed("/api/settings")).rejects.toEqual(expect.objectContaining({ status: 503 }));
    expect(useAuthStore.getState()).toMatchObject({
      token: "stale-token",
      me,
      status: "authenticated",
    });
  });

  test("preserves the session when the refresh request loses connectivity", async () => {
    globalThis.fetch = mock(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === "/api/settings") return new Response(null, { status: 401 });
      if (url.endsWith("/auth/refresh")) throw new Error("Connection lost");
      throw new Error(`Unexpected request: ${url}`);
    });

    await expect(authed("/api/settings")).rejects.toEqual(
      expect.objectContaining({ message: "Connection lost" }),
    );
    expect(useAuthStore.getState()).toMatchObject({
      token: "stale-token",
      me,
      status: "authenticated",
    });
  });

  test("gives up a refresh that never answers so the next request can refresh again", async () => {
    const originalTimeout = AbortSignal.timeout;
    const timeouts: AbortController[] = [];
    AbortSignal.timeout = mock(() => {
      const controller = new AbortController();
      timeouts.push(controller);
      return controller.signal;
    });
    let refreshRequests = 0;
    globalThis.fetch = mock(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/auth/refresh")) {
        refreshRequests += 1;
        if (refreshRequests === 1) {
          return new Promise<Response>((_, reject) => {
            init?.signal?.addEventListener("abort", () => reject(init.signal?.reason));
          });
        }
        return jsonResponse(200, { accessToken: "fresh-token" });
      }
      if (url.endsWith("/auth/me")) return jsonResponse(200, me);
      throw new Error(`Unexpected request: ${url}`);
    });

    try {
      const hanging = refreshSession();
      for (let tick = 0; tick < 50 && timeouts.length === 0; tick += 1) await Promise.resolve();
      timeouts[0]?.abort(new DOMException("The operation timed out.", "TimeoutError"));

      await expect(hanging).rejects.toThrow("timed out");
      await expect(refreshSession()).resolves.toBe("fresh-token");
      expect(refreshRequests).toBe(2);
      expect(useAuthStore.getState()).toMatchObject({
        token: "fresh-token",
        status: "authenticated",
      });
    } finally {
      AbortSignal.timeout = originalTimeout;
    }
  });

  test("keeps the refreshed session when the retried request loses connectivity", async () => {
    let settingsRequests = 0;
    globalThis.fetch = mock(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === "/api/settings") {
        settingsRequests += 1;
        if (settingsRequests === 1) return new Response(null, { status: 401 });
        throw new Error("Connection lost after refresh");
      }
      if (url.endsWith("/auth/refresh")) {
        return jsonResponse(200, { accessToken: "fresh-token" });
      }
      if (url.endsWith("/auth/me")) return jsonResponse(200, me);
      throw new Error(`Unexpected request: ${url}`);
    });

    await expect(authed("/api/settings")).rejects.toEqual(
      expect.objectContaining({ message: "Connection lost after refresh" }),
    );
    expect(useAuthStore.getState()).toMatchObject({
      token: "fresh-token",
      me,
      status: "authenticated",
    });
  });

  test("signs out only when the refresh session is rejected", async () => {
    globalThis.fetch = mock(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === "/api/settings") return new Response(null, { status: 401 });
      if (url.endsWith("/auth/refresh")) return jsonResponse(401, { error: "Unauthorized" });
      throw new Error(`Unexpected request: ${url}`);
    });

    await expect(authed("/api/settings")).rejects.toEqual(
      expect.objectContaining({ status: 401, message: "Session expired" }),
    );
    expect(useAuthStore.getState()).toMatchObject({
      token: null,
      me: null,
      status: "signed_out",
    });
  });

  test("refreshes an expired bearer before fetching a channel", async () => {
    let channelRequests = 0;
    globalThis.fetch = mock(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === "/api/channel/page") {
        channelRequests += 1;
        const expectedToken = channelRequests === 1 ? "stale-token" : "fresh-token";
        expect(new Headers(init?.headers).get("Authorization")).toBe(`Bearer ${expectedToken}`);
        return channelRequests === 1
          ? jsonResponse(401, { error: "Invalid token" })
          : jsonResponse(200, {
              name: "Test Channel",
              description: "",
              avatarUrl: "",
              bannerUrl: "",
              subscriberCount: 0,
              isVerified: false,
              videos: [],
              nextpage: null,
            });
      }
      if (url.endsWith("/auth/refresh")) {
        return jsonResponse(200, { accessToken: "fresh-token" });
      }
      if (url.endsWith("/auth/me")) return jsonResponse(200, me);
      throw new Error(`Unexpected request: ${url}`);
    });

    await expect(fetchChannel("https://space.bilibili.com/546195")).resolves.toMatchObject({
      name: "Test Channel",
    });
    expect(channelRequests).toBe(2);
    expect(useAuthStore.getState().token).toBe("fresh-token");
  });

  test("adopts a refreshed session from another browser context", async () => {
    const fresh = { token: "fresh-tab-token", me };
    const getItem = localStorage.getItem;
    const navigatorDescriptor = Object.getOwnPropertyDescriptor(globalThis, "navigator");
    localStorage.getItem = () => JSON.stringify(fresh);
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: {
        locks: {
          request: async (_name: string, callback: () => Promise<string>) => callback(),
        },
      },
    });
    globalThis.fetch = mock(async () => {
      throw new Error("Refresh should not reach the network");
    });

    try {
      await expect(refreshSession()).resolves.toBe("fresh-tab-token");
      expect(useAuthStore.getState()).toMatchObject({
        token: "fresh-tab-token",
        me,
        status: "authenticated",
      });
    } finally {
      localStorage.getItem = getItem;
      if (navigatorDescriptor) {
        Object.defineProperty(globalThis, "navigator", navigatorDescriptor);
      } else {
        Reflect.deleteProperty(globalThis, "navigator");
      }
    }
  });

  test("applies session changes received from storage", () => {
    syncAuthStoreFromStorage(JSON.stringify({ token: "other-tab-token", me }));

    expect(useAuthStore.getState()).toMatchObject({
      token: "other-tab-token",
      me,
      status: "authenticated",
    });
  });

  test("preserves authenticated status during setBootstrapping when me is cached", () => {
    useAuthStore.getState().setSession("cached-token", me);
    expect(useAuthStore.getState().status).toBe("authenticated");

    useAuthStore.getState().setBootstrapping();
    expect(useAuthStore.getState().status).toBe("authenticated");
  });

  test("extractBearerToken parses bearer headers and resolveUnauthorizedRetryToken avoids guest and staggered refreshes", async () => {
    expect(extractBearerToken("Bearer abc-123")).toBe("abc-123");
    expect(extractBearerToken(null)).toBeNull();

    let refreshCalls = 0;
    globalThis.fetch = mock(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/auth/refresh")) {
        refreshCalls += 1;
        return jsonResponse(200, { accessToken: "refreshed-token" });
      }
      if (url.endsWith("/auth/me")) return jsonResponse(200, me);
      throw new Error(`Unexpected request: ${url}`);
    });

    // Guest 401 must not trigger /auth/refresh.
    useAuthStore.getState().setSignedOut();
    await expect(
      resolveUnauthorizedRetryToken(null, "SABR", "/sabr/playback/v1"),
    ).resolves.toBeNull();
    expect(refreshCalls).toBe(0);

    // Staggered concurrent 401 after another request already updated the store must reuse store token.
    useAuthStore.getState().setSession("new-token", me);
    await expect(
      resolveUnauthorizedRetryToken("old-token", "SABR", "/sabr/playback/v1"),
    ).resolves.toBe("new-token");
    expect(refreshCalls).toBe(0);

    // Matching stale token triggers /auth/refresh once.
    await expect(
      resolveUnauthorizedRetryToken("new-token", "SABR", "/sabr/playback/v1"),
    ).resolves.toBe("refreshed-token");
    expect(refreshCalls).toBe(1);

    // Mid-flight sign-out with failed token does not trigger /auth/refresh.
    useAuthStore.getState().setSignedOut();
    await expect(
      resolveUnauthorizedRetryToken("refreshed-token", "SABR", "/sabr/playback/v1"),
    ).resolves.toBeNull();
    expect(refreshCalls).toBe(1);
  });
});
