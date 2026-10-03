import { fixtureImage } from "./subscription-groups-data";
import {
  createFixture,
  filteredChannels,
  groupCounts,
  writeGroup,
} from "./subscription-groups-state";
import { fixtureMembershipLookup, fixtureMembershipPage } from "./subscription-membership-pages";

let state = createFixture();
const me = {
  id: "fixture-user",
  role: "user",
  publicUsername: "Local fixture · 150 channels",
  bio: null,
  avatarUrl: null,
  avatarType: null,
  avatarCode: null,
};
const empty = (): Response => new Response(null, { status: 204 });

Bun.serve({
  hostname: "127.0.0.1",
  port: 9876,
  async fetch(request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    if (path === "/__qa/state") {
      return Response.json({
        ...state,
        groups: groupCounts(state),
        summary: {
          channels: state.channels.length,
          groups: state.groups.length,
          videos: state.videos.length,
          ungrouped: state.channels.filter((channel) => channel.groupIds.length === 0).length,
          multipleGroups: state.channels.filter((channel) => channel.groupIds.length > 1).length,
        },
      });
    }
    if (path === "/__qa/reset" && method === "POST") {
      state = createFixture();
      return empty();
    }
    if (path === "/__qa/fail" && method === "POST") {
      const rule: unknown = await request.json();
      if (
        !rule ||
        typeof rule !== "object" ||
        !("path" in rule) ||
        typeof rule.path !== "string" ||
        !("method" in rule) ||
        typeof rule.method !== "string" ||
        !("count" in rule) ||
        !Number.isInteger(rule.count) ||
        Number(rule.count) < 0
      ) {
        return Response.json(
          { error: "Expected path, method and nonnegative count" },
          { status: 400 },
        );
      }
      state.failure = {
        path: rule.path,
        method: rule.method,
        count: Number(rule.count),
        query: "query" in rule && typeof rule.query === "string" ? rule.query : undefined,
      };
      return empty();
    }
    const failure = state.failure;
    if (
      failure &&
      failure.count > 0 &&
      method === failure.method &&
      path.includes(failure.path) &&
      (!failure.query || url.search.includes(failure.query))
    ) {
      failure.count--;
      return Response.json({ error: "Simulated fixture failure" }, { status: 503 });
    }
    const image = path.match(/^\/__qa\/(avatar|thumbnail)\/(\d+)\.svg$/);
    if (image) return fixtureImage(image[1], Number(image[2]));
    if (path === "/instance")
      return Response.json({
        guestAllowed: true,
        youtubeRemoteLoginEnabled: false,
        parentalControlsEnabled: false,
      });
    if (path === "/auth/register/status")
      return Response.json({ allowRegistration: false, bootstrapAvailable: false });
    if (path === "/auth/oidc/status")
      return Response.json({
        enabled: false,
        providerName: null,
        localLoginEnabled: true,
        autoRedirect: false,
      });
    if (path === "/auth/login" || path === "/auth/refresh")
      return Response.json({ accessToken: "local-fixture-only" });
    if (path === "/auth/me") return Response.json(me);
    if (path === "/profiles")
      return Response.json({
        profiles: [
          { ...me, name: me.publicUsername, isActive: true, isDefault: true, lastUsedAt: 0 },
        ],
        activeProfileId: me.id,
        defaultProfileId: me.id,
      });
    if (path === "/subscriptions/group-memberships/page") return fixtureMembershipPage(state, url);
    if (path === "/subscriptions/group-memberships/lookup" && method === "POST")
      return fixtureMembershipLookup(state, request);
    if (path === "/subscriptions/group-memberships") return Response.json(state.channels);
    if (path === "/subscriptions/groups" && method === "GET")
      return Response.json(groupCounts(state));
    if (path.startsWith("/subscriptions/groups") && method !== "GET")
      return writeGroup(state, request, path);
    const groupId = url.searchParams.get("groupId");
    if (
      path.startsWith("/subscriptions") &&
      groupId &&
      !state.groups.some((group) => group.id === groupId)
    ) {
      return Response.json(
        { error: "Group not found", code: "subscription_group_not_found" },
        { status: 404 },
      );
    }
    if (path === "/subscriptions") return Response.json(filteredChannels(state, url));
    if (path === "/subscriptions/feed") {
      const channels = new Set(filteredChannels(state, url).map((channel) => channel.channelUrl));
      const videos = state.videos.filter((video) => channels.has(video.uploaderUrl));
      const offset = Math.max(0, Number(url.searchParams.get("cursor")) || 0);
      const limit = Math.max(1, Math.min(30, Number(url.searchParams.get("limit")) || 30));
      return Response.json({
        videos: videos.slice(offset, offset + limit),
        nextpage: offset + limit < videos.length ? String(offset + limit) : null,
        generation: 1,
        generatedAt: Date.now(),
        refreshing: false,
      });
    }
    if (path === "/settings")
      return Response.json({
        captionStyles: {},
        sponsorBlockCategoryActions: {},
        defaultService: 0,
        defaultLandingPage: "/",
        volume: 1,
        hideSubscriptionLiveStreams: false,
        deArrowEnabled: false,
      });
    if (path.startsWith("/streams"))
      return Response.json({ error: "Fixture videos cannot be played" }, { status: 404 });
    if (path.includes("notifications"))
      return Response.json({ items: [], unreadCount: 0, nextCursor: null });
    if (path === "/progress/batch") return Response.json([]);
    if (method === "POST" || method === "PUT") return empty();
    return Response.json([]);
  },
});
console.log(
  "Local subscription fixture: http://127.0.0.1:9876 (150 channels, 18 groups, 300 videos)",
);
