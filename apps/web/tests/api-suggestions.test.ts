import { afterEach, expect, mock, test } from "bun:test";

if (!("localStorage" in globalThis)) {
  Object.defineProperty(globalThis, "localStorage", {
    value: {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
    },
  });
}

const { fetchSuggestions } = await import("../src/lib/api-suggestions");
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

afterEach(() => {
  globalThis.fetch = originalFetch;
  useAuthStore.getState().setSignedOut();
});

test("suggestions carry the session so closed instances answer them", async () => {
  useAuthStore.getState().setSession("user-token", me);
  const auths: (string | null)[] = [];
  globalThis.fetch = mock(async (_input: RequestInfo | URL, init?: RequestInit) => {
    const auth = new Headers(init?.headers).get("Authorization");
    auths.push(auth);
    return auth
      ? new Response(JSON.stringify(["apple"]), { headers: { "Content-Type": "application/json" } })
      : new Response(JSON.stringify({ error: "Authentication required" }), { status: 401 });
  }) as unknown as typeof fetch;

  await expect(fetchSuggestions("app", 0)).resolves.toEqual(["apple"]);
  expect(auths).toEqual(["Bearer user-token"]);
});
