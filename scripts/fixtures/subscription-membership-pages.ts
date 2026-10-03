import type { Fixture } from "./subscription-groups-state";

const MAX_PAGE = 1_000_000;
const MAX_SEARCH_LENGTH = 200;
const MAX_LOOKUP_CHANNELS = 500;
const MAX_LOOKUP_URL_LENGTH = 2048;
const MAX_LOOKUP_BODY_BYTES = 1024 * 1024;

type PageFilter = {
  page: number;
  limit: number;
  search: string;
  groupId: string | null;
  ungrouped: boolean;
  excluded: boolean;
};

function error(message: string, status: number, code: string): Response {
  return Response.json({ error: message, code }, { status });
}

function intParam(params: URLSearchParams, name: string, fallback: number): number | null {
  const raw = params.get(name);
  if (raw === null) return fallback;
  return /^[+-]?\d+$/.test(raw) ? Number(raw) : null;
}

function boolParam(params: URLSearchParams, name: string): boolean | null {
  const raw = params.get(name);
  if (raw === null) return false;
  return raw === "true" ? true : raw === "false" ? false : null;
}

function membershipFilter(url: URL): PageFilter | null {
  const params = url.searchParams;
  const page = intParam(params, "page", 0);
  const limit = intParam(params, "limit", 20);
  const ungrouped = boolParam(params, "ungrouped");
  const excluded = boolParam(params, "excluded");
  const groupId = params.get("groupId");
  const search = (params.get("search") ?? "").trim();
  if (page === null || page < 0 || page > MAX_PAGE) return null;
  if (limit === null || limit < 1 || limit > 100) return null;
  if (ungrouped === null || excluded === null || search.length > MAX_SEARCH_LENGTH) return null;
  if ((groupId !== null && groupId.trim() === "") || (groupId !== null && ungrouped)) return null;
  if (excluded && groupId === null) return null;
  return { page, limit, search, groupId, ungrouped, excluded };
}

function validChannelUrl(value: unknown): value is string {
  return (
    typeof value === "string" && value.trim().length > 0 && value.length <= MAX_LOOKUP_URL_LENGTH
  );
}

export function fixtureMembershipPage(state: Fixture, url: URL): Response {
  const filter = membershipFilter(url);
  if (!filter)
    return error("Invalid membership page filter", 400, "subscription_group_invalid_filter");
  const group = filter.groupId;
  if (group && !state.groups.some((item) => item.id === group))
    return error("Subscription group not found", 404, "subscription_group_not_found");
  const search = filter.search.toLowerCase();
  const channels = state.channels
    .filter((channel) => {
      const membership =
        filter.ungrouped || filter.excluded
          ? group === null
            ? channel.groupIds.length === 0
            : !channel.groupIds.includes(group)
          : group === null || channel.groupIds.includes(group);
      return (
        membership &&
        (!search ||
          channel.name.toLowerCase().includes(search) ||
          channel.channelUrl.toLowerCase().includes(search))
      );
    })
    .sort(
      (a, b) =>
        a.name.toLowerCase().localeCompare(b.name.toLowerCase()) ||
        a.channelUrl.localeCompare(b.channelUrl),
    );
  return Response.json({
    items: channels
      .slice(filter.page * filter.limit, (filter.page + 1) * filter.limit)
      .map((channel) => ({ ...channel, groupIds: [...channel.groupIds].sort() })),
    total: channels.length,
    totalSubscriptions: state.channels.length,
    ungroupedCount: state.channels.filter((channel) => channel.groupIds.length === 0).length,
    page: filter.page,
    limit: filter.limit,
  });
}

function membershipChannels(body: unknown): string[] | null {
  if (!body || typeof body !== "object") return null;
  const { channelUrl, channelUrls } = body as { channelUrl?: unknown; channelUrls?: unknown };
  const single = validChannelUrl(channelUrl) ? channelUrl : null;
  const singleMissing = channelUrl === undefined || channelUrl === null;
  const batchMissing = channelUrls === undefined || channelUrls === null;
  if (single !== null && batchMissing) return [single];
  if (
    singleMissing &&
    !batchMissing &&
    Array.isArray(channelUrls) &&
    channelUrls.length >= 1 &&
    channelUrls.length <= MAX_LOOKUP_CHANNELS &&
    channelUrls.every(validChannelUrl)
  )
    return channelUrls;
  return null;
}

export async function fixtureMembershipLookup(state: Fixture, request: Request): Promise<Response> {
  const raw = await request.arrayBuffer().catch(() => null);
  if (raw === null) return error("Invalid request body", 400, "error");
  if (raw.byteLength > MAX_LOOKUP_BODY_BYTES)
    return error("Request body exceeds 1 MiB", 413, "request_body_too_large");
  let body: unknown;
  try {
    body = JSON.parse(new TextDecoder().decode(raw));
  } catch {
    return error("Invalid request body", 400, "error");
  }
  const urls = membershipChannels(body);
  if (urls === null) return error("Invalid request body", 400, "error");
  return Response.json(
    state.channels
      .filter((channel) => urls.includes(channel.channelUrl))
      .map((channel) => ({ ...channel, groupIds: [...channel.groupIds].sort() })),
  );
}
