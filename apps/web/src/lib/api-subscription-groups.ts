import type { MembershipChange, SubscriptionGroup } from "../types/subscription-groups";
import { apiErrorFromResponse } from "./api";
import { authed, authedJson } from "./authed";
import { API_BASE } from "./env";
import { membershipBatches } from "./membership-batches";

const GROUPS_URL = `${API_BASE}/subscriptions/groups`;
const MAX_CONCURRENT_MEMBERSHIP_REQUESTS = 3;

export function fetchSubscriptionGroups(signal?: AbortSignal): Promise<SubscriptionGroup[]> {
  return authedJson(GROUPS_URL, { signal });
}

async function groupRequest(path: string, method: string, body?: unknown): Promise<Response> {
  const response = await authed(`${GROUPS_URL}${path}`, {
    method,
    ...(body === undefined
      ? {}
      : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
  });
  if (!response.ok) {
    throw apiErrorFromResponse(response, await response.json().catch(() => null));
  }
  return response;
}

export async function createSubscriptionGroup(name: string): Promise<SubscriptionGroup> {
  const response = await groupRequest("", "POST", { name: name.trim() });
  return response.json();
}

export async function renameSubscriptionGroup(id: string, name: string): Promise<void> {
  await groupRequest(`/${encodeURIComponent(id)}`, "PUT", { name: name.trim() });
}

export async function deleteSubscriptionGroup(id: string): Promise<void> {
  await groupRequest(`/${encodeURIComponent(id)}`, "DELETE");
}

export class MembershipUpdateError extends Error {
  readonly failedUrls: string[];
  constructor(failedUrls: string[]) {
    super("Some subscription group changes could not be saved");
    this.failedUrls = failedUrls;
  }
}

export async function updateGroupMemberships(changes: MembershipChange[]): Promise<void> {
  const failed = new Set<string>();
  for (const change of changes) {
    const { batches, invalid } = membershipBatches(change.channelUrls);
    for (const url of invalid) failed.add(url);
    for (let offset = 0; offset < batches.length; offset += MAX_CONCURRENT_MEMBERSHIP_REQUESTS) {
      await Promise.all(
        batches
          .slice(offset, offset + MAX_CONCURRENT_MEMBERSHIP_REQUESTS)
          .map(async (channelUrls) => {
            try {
              await groupRequest(
                `/${encodeURIComponent(change.groupId)}/channels`,
                change.action === "add" ? "PUT" : "DELETE",
                { channelUrls },
              );
            } catch {
              for (const url of channelUrls) failed.add(url);
            }
          }),
      );
    }
  }
  if (failed.size > 0) throw new MembershipUpdateError([...failed]);
}
