import { afterEach, beforeEach, expect, test } from "bun:test";
import { ApiError } from "../src/lib/api";
import {
  createSubscriptionGroup,
  deleteSubscriptionGroup,
  MembershipUpdateError,
  renameSubscriptionGroup,
  updateGroupMemberships,
} from "../src/lib/api-subscription-groups";
import { useAuthStore } from "../src/stores/auth-store";

const originalFetch = globalThis.fetch;
type Call = { url: string; method: string; body: Record<string, unknown> };
let calls: Call[] = [];
let failGroup = "";
beforeEach(() => {
  calls = [];
  failGroup = "";
  useAuthStore.getState().setToken("subscription-groups-test");
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    calls.push({
      url,
      method: init?.method ?? "GET",
      body: typeof init?.body === "string" ? JSON.parse(init.body) : {},
    });
    if (failGroup && url.includes(failGroup))
      return Response.json(
        { error: "Conflict", code: "subscription_group_name_conflict" },
        { status: 409 },
      );
    if (!init?.method) return Response.json([]);
    if (init.method === "POST") return Response.json({ id: "new", name: "Tech" }, { status: 201 });
    return new Response(null, { status: 204 });
  };
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  useAuthStore.getState().setSignedOut();
});

test("batch writes deduplicate and split at the 500-channel API limit", async () => {
  const urls = Array.from({ length: 1001 }, (_, index) => `https://youtube.com/channel/${index}`);
  await updateGroupMemberships([
    { groupId: "tech", action: "add", channelUrls: [...urls, urls[0]] },
  ]);
  expect(calls.map((call) => (call.body.channelUrls as string[]).length)).toEqual([500, 500, 1]);
  expect(calls.every((call) => call.method === "PUT" && call.url.endsWith("/tech/channels"))).toBe(
    true,
  );
});

test("failed groups report affected channels while other groups are attempted", async () => {
  failGroup = "/failed/";
  try {
    await updateGroupMemberships([
      { groupId: "failed", action: "remove", channelUrls: ["one", "two"] },
      { groupId: "ok", action: "remove", channelUrls: ["two"] },
    ]);
    throw new Error("Expected a partial failure");
  } catch (error) {
    expect(error).toBeInstanceOf(MembershipUpdateError);
    if (error instanceof MembershipUpdateError) expect(error.failedUrls).toEqual(["one", "two"]);
  }
  expect(calls.length).toBe(2);
  expect(calls.every((call) => call.method === "DELETE" && call.url.includes("/groups/"))).toBe(
    true,
  );
});

test("empty membership changes do not make requests", async () => {
  await updateGroupMemberships([{ groupId: "tech", action: "add", channelUrls: [] }]);
  expect(calls).toEqual([]);
});

test("group CRUD handles bodyless success and preserves backend error codes", async () => {
  await createSubscriptionGroup(" Tech ");
  await renameSubscriptionGroup("new", " Science ");
  await deleteSubscriptionGroup("new");
  expect(calls.map((call) => call.method)).toEqual(["POST", "PUT", "DELETE"]);
  expect(calls[0].body).toEqual({ name: "Tech" });
  expect(calls[1].body).toEqual({ name: "Science" });
  failGroup = "/groups";
  try {
    await createSubscriptionGroup("Tech");
    throw new Error("Expected a duplicate-name failure");
  } catch (error) {
    expect(error).toBeInstanceOf(ApiError);
    if (error instanceof ApiError) expect(error.code).toBe("subscription_group_name_conflict");
  }
});
