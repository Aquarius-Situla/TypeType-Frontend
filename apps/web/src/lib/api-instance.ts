import type { RecommenderCapability } from "../types/recommender";
import type { RssInstanceCapability } from "../types/rss";
import { ApiError, request } from "./api";
import { API_BASE as BASE } from "./env";

export type InstanceCapabilities = {
  guestAllowed: boolean;
  youtubeRemoteLoginEnabled: boolean;
  parentalControlsEnabled: boolean;
  rss: RssInstanceCapability;
  recommender: RecommenderCapability;
};

const RECOMMENDER_ABSENT: RecommenderCapability = {
  installed: false,
  enabled: false,
  experimental: true,
};

function isRecommenderCapability(value: unknown): value is RecommenderCapability {
  if (!value || typeof value !== "object") return false;
  const capability = value as Partial<RecommenderCapability>;
  return typeof capability.installed === "boolean" && typeof capability.enabled === "boolean";
}

const RSS_DISABLED: RssInstanceCapability = {
  enabled: false,
  maxFeedsPerUser: 0,
  maxItems: 0,
  minimumPollMinutes: 0,
  rateLimitPerMinute: 0,
};

function isRssCapability(value: unknown): value is RssInstanceCapability {
  if (!value || typeof value !== "object") return false;
  const rss = value as Partial<RssInstanceCapability>;
  return (
    typeof rss.enabled === "boolean" &&
    typeof rss.maxFeedsPerUser === "number" &&
    typeof rss.maxItems === "number" &&
    typeof rss.minimumPollMinutes === "number" &&
    typeof rss.rateLimitPerMinute === "number"
  );
}

function isInstanceCapabilities(value: unknown): value is {
  guestAllowed: boolean;
  youtubeRemoteLoginEnabled: boolean;
  parentalControlsEnabled?: unknown;
  rss?: unknown;
  recommender?: unknown;
} {
  return (
    !!value &&
    typeof value === "object" &&
    "guestAllowed" in value &&
    typeof value.guestAllowed === "boolean" &&
    "youtubeRemoteLoginEnabled" in value &&
    typeof value.youtubeRemoteLoginEnabled === "boolean"
  );
}

export function normalizeInstanceCapabilities(value: unknown): InstanceCapabilities | null {
  if (!isInstanceCapabilities(value)) return null;
  return {
    ...value,
    parentalControlsEnabled:
      "parentalControlsEnabled" in value && typeof value.parentalControlsEnabled === "boolean"
        ? value.parentalControlsEnabled
        : false,
    rss: isRssCapability(value.rss) ? value.rss : RSS_DISABLED,
    recommender: isRecommenderCapability(value.recommender)
      ? { ...RECOMMENDER_ABSENT, ...value.recommender }
      : RECOMMENDER_ABSENT,
  };
}

export async function fetchInstanceCapabilities(): Promise<InstanceCapabilities> {
  const payload = await request<unknown>(`${BASE}/instance`);
  const capabilities = normalizeInstanceCapabilities(payload);
  if (!capabilities) throw new ApiError("Invalid instance payload", 500);
  return capabilities;
}
