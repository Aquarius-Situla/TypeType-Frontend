import type {
  TwitchAccountStatus,
  TwitchChannel,
  TwitchChatAssets,
  TwitchChatHighlights,
  TwitchClip,
  TwitchClipPlayback,
  TwitchDeviceCode,
  TwitchFollowState,
  TwitchGame,
  TwitchGameStreams,
  TwitchLive,
  TwitchPage,
  TwitchPollResult,
  TwitchSearchType,
  TwitchStream,
  TwitchUserEmotes,
  TwitchVideo,
  TwitchVideoChapter,
  TwitchVideoComment,
  TwitchVideoPlayback,
} from "../types/twitch";
import { authed, authedJson } from "./authed";
import { API_BASE as BASE } from "./env";
import { requestWithSession } from "./session-request";

const PAGE_SIZE = 24;

function pageQuery(after?: string, extra: Record<string, string> = {}): string {
  const params = new URLSearchParams({ first: String(PAGE_SIZE), ...extra });
  if (after) params.set("after", after);
  return params.toString();
}

const get = <T>(path: string) => requestWithSession<T>(`${BASE}/twitch${path}`);

export const fetchTwitchStreams = (after?: string) =>
  get<TwitchPage<TwitchStream>>(`/streams?${pageQuery(after)}`);

export const fetchTwitchGames = (after?: string) =>
  get<TwitchPage<TwitchGame>>(`/games?${pageQuery(after)}`);

export const fetchTwitchGameStreams = (slug: string, after?: string) =>
  get<TwitchGameStreams>(`/games/${encodeURIComponent(slug)}/streams?${pageQuery(after)}`);

export const fetchTwitchTagStreams = (tag: string, after?: string) =>
  get<TwitchPage<TwitchStream>>(`/tags/${encodeURIComponent(tag)}/streams?${pageQuery(after)}`);

export const fetchTwitchVideoChapters = (id: string) =>
  get<TwitchVideoChapter[]>(`/videos/${encodeURIComponent(id)}/chapters`);

export const fetchTwitchVideoComments = (id: string, at: { offset?: number; cursor?: string }) => {
  const params = new URLSearchParams();
  if (at.cursor) params.set("cursor", at.cursor);
  else params.set("offset", String(Math.max(0, Math.floor(at.offset ?? 0))));
  return get<TwitchPage<TwitchVideoComment>>(
    `/videos/${encodeURIComponent(id)}/comments?${params}`,
  );
};

export const fetchTwitchChannel = (login: string) =>
  get<TwitchChannel>(`/channels/${encodeURIComponent(login)}`);

export const fetchTwitchChannelVideos = (login: string, after?: string) =>
  get<TwitchPage<TwitchVideo>>(`/channels/${encodeURIComponent(login)}/videos?${pageQuery(after)}`);

export const fetchTwitchChannelClips = (login: string, after?: string) =>
  get<TwitchPage<TwitchClip>>(`/channels/${encodeURIComponent(login)}/clips?${pageQuery(after)}`);

export const fetchTwitchLive = (login: string) =>
  get<TwitchLive>(`/live/${encodeURIComponent(login)}`);

export const fetchTwitchVideo = (id: string) =>
  get<TwitchVideoPlayback>(`/videos/${encodeURIComponent(id)}`);

export const fetchTwitchClip = (slug: string) =>
  get<TwitchClipPlayback>(`/clips/${encodeURIComponent(slug)}`);

export function fetchTwitchSearch<T>(query: string, type: TwitchSearchType, after?: string) {
  return get<TwitchPage<T>>(`/search?${pageQuery(after, { q: query, type })}`);
}

export const fetchTwitchAccount = () => authedJson<TwitchAccountStatus>(`${BASE}/twitch/account`);

export const startTwitchDevice = () =>
  authedJson<TwitchDeviceCode>(`${BASE}/twitch/account/device`, { method: "POST" });

export const pollTwitchDevice = (deviceCode: string) =>
  authedJson<TwitchPollResult>(`${BASE}/twitch/account/poll`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deviceCode }),
  });

export async function unlinkTwitchAccount(): Promise<void> {
  await authed(`${BASE}/twitch/account`, { method: "DELETE" });
}

export const fetchTwitchFollowedLive = (after?: string) =>
  authedJson<TwitchPage<TwitchStream>>(`${BASE}/twitch/me/live?${pageQuery(after)}`);

export const fetchTwitchGlobalChatAssets = () => get<TwitchChatAssets>("/chat/assets");

export const fetchTwitchChannelChatAssets = (login: string) =>
  get<TwitchChatAssets>(`/chat/${encodeURIComponent(login)}/assets`);

export const fetchTwitchChatHighlights = (login: string) =>
  get<TwitchChatHighlights>(`/chat/${encodeURIComponent(login)}/highlights`);

export const fetchTwitchUserEmotes = (login: string) =>
  authedJson<TwitchUserEmotes>(`${BASE}/twitch/me/emotes/${encodeURIComponent(login)}`);

export const fetchTwitchFollow = (login: string) =>
  authedJson<TwitchFollowState>(`${BASE}/twitch/me/follows/${encodeURIComponent(login)}`);

export async function setTwitchFollow(login: string, follow: boolean): Promise<TwitchFollowState> {
  const res = await authed(`${BASE}/twitch/me/follows/${encodeURIComponent(login)}`, {
    method: follow ? "PUT" : "DELETE",
  });
  if (!res.ok) throw new Error(`follow failed: ${res.status}`);
  return (await res.json()) as TwitchFollowState;
}

export type TwitchChatSendResult = { ok: true } | { ok: false; rejected: boolean; reason?: string };

export async function sendTwitchChatMessage(
  login: string,
  message: string,
): Promise<TwitchChatSendResult> {
  const res = await authed(`${BASE}/twitch/chat/${encodeURIComponent(login)}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  if (res.ok) return { ok: true };
  const body = (await res.json().catch(() => ({}))) as { error?: string; reason?: string };
  return { ok: false, rejected: body.error === "chat_rejected", reason: body.reason };
}

// Twitch answers TOKENS_REQUIRED once the free vote is spent: further votes cost channel points.
export async function voteTwitchPoll(
  pollId: string,
  choiceId: string,
): Promise<"counted" | "already" | "failed"> {
  const res = await authed(`${BASE}/twitch/polls/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pollId, choiceId }),
  });
  if (res.ok) return "counted";
  const body = (await res.json().catch(() => ({}))) as { code?: string };
  return body.code === "TOKENS_REQUIRED" ? "already" : "failed";
}

export const twitchChatEventsUrl = (login: string) =>
  `${BASE}/twitch/chat/${encodeURIComponent(login)}/events`;
