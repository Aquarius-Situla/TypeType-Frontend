import { makeChannels, makeGroups, makeVideos } from "./subscription-groups-data";

type FailureRule = { path: string; method: string; count: number; query?: string };
export type Fixture = {
  groups: ReturnType<typeof makeGroups>;
  channels: ReturnType<typeof makeChannels>;
  videos: ReturnType<typeof makeVideos>;
  writes: Array<{ path: string; method: string; body: unknown }>;
  failure: FailureRule | null;
};

export function createFixture(): Fixture {
  const groups = makeGroups();
  const channels = makeChannels(groups);
  return {
    groups,
    channels,
    videos: makeVideos(channels),
    writes: [],
    failure: null,
  };
}

export function groupCounts(state: Fixture): Fixture["groups"] {
  return state.groups.map((group) => ({
    ...group,
    channelCount: state.channels.filter((channel) => channel.groupIds.includes(group.id)).length,
  }));
}

export function filteredChannels(state: Fixture, url: URL): Fixture["channels"] {
  const groupId = url.searchParams.get("groupId");
  return state.channels.filter((channel) =>
    groupId
      ? channel.groupIds.includes(groupId)
      : url.searchParams.get("ungrouped") === "true"
        ? channel.groupIds.length === 0
        : true,
  );
}

function error(message: string, status: number, code?: string): Response {
  return Response.json({ error: message, code }, { status });
}

export async function writeGroup(
  state: Fixture,
  request: Request,
  path: string,
): Promise<Response> {
  const id = path.split("/")[3];
  const group = state.groups.find((item) => item.id === id);
  if (id && !group) return error("Group not found", 404, "subscription_group_not_found");
  const body: unknown =
    request.method === "DELETE" && !path.endsWith("/channels") ? {} : await request.json();
  state.writes.push({ path, method: request.method, body });
  if (!body || typeof body !== "object") return error("Invalid request body", 400);
  if (path.endsWith("/channels")) {
    if (!("channelUrls" in body) || !Array.isArray(body.channelUrls))
      return error("Invalid channels", 400);
    const urls: unknown[] = body.channelUrls;
    if (!urls.length || urls.length > 500 || urls.some((url) => typeof url !== "string")) {
      return error("Specify 1 to 500 channel URLs", 400);
    }
    if (request.method !== "PUT" && request.method !== "DELETE")
      return error("Invalid method", 405);
    if (urls.some((url) => !state.channels.some((channel) => channel.channelUrl === url))) {
      return error("Subscription not found", 404, "subscription_not_found");
    }
    state.channels = state.channels.map((channel) =>
      !urls.includes(channel.channelUrl)
        ? channel
        : {
            ...channel,
            groupIds:
              request.method === "PUT"
                ? [...new Set([...channel.groupIds, id])]
                : channel.groupIds.filter((groupId) => groupId !== id),
          },
    );
  } else if (request.method === "POST" || request.method === "PUT") {
    const name = "name" in body && typeof body.name === "string" ? body.name.trim() : "";
    if (!name || name.length > 100)
      return error("Invalid name", 400, "subscription_group_invalid_name");
    if (
      state.groups.some((item) => item.id !== id && item.name.toLowerCase() === name.toLowerCase())
    ) {
      return error("Duplicate name", 409, "subscription_group_name_conflict");
    }
    if (group) {
      group.name = name;
      group.updatedAt = Date.now();
    } else {
      const created = {
        id: crypto.randomUUID(),
        name,
        channelCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      state.groups.push(created);
      return Response.json(created, { status: 201 });
    }
  } else if (request.method === "DELETE" && group) {
    state.groups = state.groups.filter((item) => item.id !== id);
    state.channels = state.channels.map((channel) => ({
      ...channel,
      groupIds: channel.groupIds.filter((groupId) => groupId !== id),
    }));
  } else return error("Invalid method", 405);
  return new Response(null, { status: 204 });
}
