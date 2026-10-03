import { afterEach, beforeEach, expect, test } from "bun:test";
import { QueryClient, QueryObserver } from "@tanstack/react-query";
import { ApiError } from "../src/lib/api";
import { fetchSubscriptionGroups } from "../src/lib/api-subscription-groups";
import { fetchSubscriptions } from "../src/lib/api-user";
import { subscriptionsQueryOptions } from "../src/lib/subscription-queries";
import { useAuthStore } from "../src/stores/auth-store";

const originalFetch = globalThis.fetch;
beforeEach(() => useAuthStore.getState().setToken("subscription-request-test"));
afterEach(() => {
  globalThis.fetch = originalFetch;
  useAuthStore.getState().setSignedOut();
});

test.each(["all", "ungrouped", "deleted-group"])(
  "%s reads preserve structured errors and request IDs",
  async (filter) => {
    globalThis.fetch = async () =>
      Response.json(
        {
          error: "Subscription group not found",
          code: "subscription_group_not_found",
          requestId: "body-id",
        },
        { status: 404, headers: { "x-request-id": "header-id" } },
      );
    try {
      await fetchSubscriptions(filter);
      throw new Error("Expected missing group");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      if (!(error instanceof ApiError)) throw error;
      expect(error.code).toBe("subscription_group_not_found");
      expect(error.status).toBe(404);
      expect(error.requestId).toBe("header-id");
    }
  },
);

test("request IDs fall back to the body; non-JSON failures keep their status", async () => {
  globalThis.fetch = async () =>
    Response.json({ error: "Unavailable", requestId: "body-id" }, { status: 503 });
  await expect(fetchSubscriptions()).rejects.toMatchObject({ status: 503, requestId: "body-id" });
  globalThis.fetch = async () =>
    new Response("Unavailable", { status: 502, statusText: "Bad Gateway" });
  await expect(fetchSubscriptions()).rejects.toMatchObject({ status: 502, message: "Bad Gateway" });
});

test("every subscription list read forwards cancellation to fetch", async () => {
  for (const read of [
    fetchSubscriptionGroups,
    (signal: AbortSignal) => fetchSubscriptions("tech", signal),
  ]) {
    const controller = new AbortController();
    const reason = new DOMException("Navigation", "AbortError");
    globalThis.fetch = async (_input, init) => {
      expect(init?.signal).toBe(controller.signal);
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(init.signal?.reason), { once: true });
      });
    };
    const pending = read(controller.signal);
    controller.abort(reason);
    await expect(pending).rejects.toBe(reason);
  }
});

test("unsubscribing from a query aborts its pending subscription request", async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  let signal: AbortSignal | null | undefined;
  globalThis.fetch = async (_input, init) => {
    signal = init?.signal;
    return new Promise<Response>((_resolve, reject) => {
      signal?.addEventListener("abort", () => reject(signal?.reason), { once: true });
    });
  };
  const observer = new QueryObserver(client, subscriptionsQueryOptions("tech"));
  const unsubscribe = observer.subscribe(() => {});
  expect(signal?.aborted).toBe(false);
  unsubscribe();
  expect(signal?.aborted).toBe(true);
  client.clear();
});
