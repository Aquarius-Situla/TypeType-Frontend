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

const { deleteRecommenderFeedback } = await import("../src/lib/api-recommender");
const { useAuthStore } = await import("../src/stores/auth-store");
const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  useAuthStore.getState().setSignedOut();
});

test("feedback deletion rejects unsuccessful responses", async () => {
  useAuthStore.getState().setToken("test-token");
  globalThis.fetch = mock(async () =>
    Response.json({ error: "Feedback was not deleted" }, { status: 503 }),
  );

  await expect(deleteRecommenderFeedback("feedback-id")).rejects.toMatchObject({
    status: 503,
    message: "Feedback was not deleted",
  });
});
