import type { AccessMode } from "./user";

export type AdminSettings = {
  name: string;
  tagline: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  minAndroidClientVersion: string | null;
  allowRegistration: boolean;
  allowGuest: boolean;
  forceEmailVerification: boolean;
  activeSessionsEnabled: boolean;
  localLoginEnabled: boolean;
  oidcAutoRedirect: boolean;
  youtubeRemoteLoginEnabled: boolean;
  accessMode: AccessMode;
  rssEnabled: boolean;
  rssPublicBaseUrl: string | null;
  rssMaxFeedsPerUser: number;
  rssMaxItems: number;
  rssMinimumPollMinutes: number;
  rssRateLimitPerMinute: number;
  recommenderEnabled?: boolean;
  recommenderDefaultOn?: boolean;
  recommenderDefaultAlgorithm?: string | null;
  recommenderAllowedAlgorithms?: string[];
  recommenderTimeoutMs?: number;
  recommenderStreamRequestsPerMinute?: number;
};

type AdminSessionNowPlaying = {
  videoUrl: string;
  title: string;
  thumbnail?: string | null;
  channelName?: string | null;
  positionMs: number;
  durationMs?: number | null;
  paused: boolean;
  updatedAt: number;
};

export type AdminSession = {
  id: string;
  userId?: string | null;
  username?: string | null;
  clientName?: string | null;
  clientVersion?: string | null;
  deviceId?: string | null;
  deviceName?: string | null;
  deviceType?: string | null;
  userAgent?: string | null;
  remoteAddress?: string | null;
  lastActivityAt: number;
  lastPlaybackAt?: number | null;
  nowPlaying?: AdminSessionNowPlaying | null;
};

export type RecommenderAdminStatus = {
  installed: boolean;
  enabled: boolean;
  reachable: boolean;
  healthMs: number | null;
  algorithms: { id: string; name: string }[];
  defaultAlgorithm: string | null;
  pagesBuilt: number;
  pagesFromCache: number;
  fallbacks: number;
  averageBuildMs: number;
  averageRecommenderMs?: number;
  averageSourcesMs?: number;
  sourceRequests: number;
  sourceCacheHits: number;
  streamRequests: number;
  streamRequestsRefused: number;
  streamRequestsThisMinute: number;
  streamRequestsPerMinuteLimit: number;
  requestTimeoutMs: number;
};

export type RecommenderAdminFeedback = {
  usersEnabled: number;
  usersByAlgorithm: Record<string, number>;
  verdicts: { algorithmId: string; good: number; bad: number; notForMe: number }[];
  comments: { verdict: string; comment: string | null; algorithmId: string; createdAt: number }[];
};
