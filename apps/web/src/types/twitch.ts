export type TwitchPage<T> = {
  items: T[];
  cursor?: string;
  hasMore: boolean;
};

export type TwitchGame = {
  id: string;
  name: string;
  slug: string;
  boxArtUrl?: string;
  viewers?: number;
  channels?: number;
};

export type TwitchUser = {
  id: string;
  login: string;
  displayName: string;
  avatarUrl: string;
};

export type TwitchStream = {
  id: string;
  title: string;
  user: TwitchUser;
  game?: TwitchGame;
  viewers: number;
  previewUrl: string;
  startedAt: string;
  tags?: string[];
};

export type TwitchChannel = TwitchUser & {
  description: string;
  bannerUrl?: string;
  followers: number;
  partner: boolean;
  live?: TwitchStream;
};

export type TwitchVideo = {
  id: string;
  title: string;
  owner: TwitchUser;
  game?: TwitchGame;
  lengthSeconds: number;
  views: number;
  previewUrl: string;
  createdAt: string;
  type: string;
};

export type TwitchClip = {
  slug: string;
  title: string;
  broadcaster: TwitchUser;
  game?: TwitchGame;
  durationSeconds: number;
  views: number;
  thumbnailUrl: string;
  createdAt: string;
};

type TwitchClipQuality = {
  quality: string;
  frameRate: number;
  url: string;
};

export type TwitchLive = { channel: TwitchChannel; hlsUrl: string };
export type TwitchVideoPlayback = { video: TwitchVideo; hlsUrl: string };
export type TwitchClipPlayback = { clip: TwitchClip; qualities: TwitchClipQuality[] };
export type TwitchGameStreams = { game: TwitchGame | null; streams: TwitchPage<TwitchStream> };

export type TwitchAccountStatus = {
  linked: boolean;
  login?: string;
  displayName?: string;
  avatarUrl?: string;
};

export type TwitchDeviceCode = {
  deviceCode: string;
  userCode: string;
  verificationUri: string;
  interval: number;
  expiresIn: number;
};

export type TwitchPollResult = {
  status: "pending" | "slow_down" | "ok";
  account?: TwitchAccountStatus;
};

export type TwitchChatEmote = { id: string; start: number; end: number };

export type TwitchRoomState = {
  followersOnly: number;
  slow: number;
  emoteOnly: boolean;
  subsOnly: boolean;
  uniqueChat: boolean;
};

export type TwitchThirdPartyEmote = {
  name: string;
  url: string;
  url2x?: string;
  provider: "7tv" | "bttv" | "ffz";
  animated?: boolean;
  zeroWidth?: boolean;
};

export type TwitchChatBadge = { title: string; url: string; url2x?: string };

export type TwitchChatAssets = {
  channelId?: string;
  badges: Record<string, TwitchChatBadge>;
  emotes: TwitchThirdPartyEmote[];
};

type TwitchUserEmote = { id: string; name: string; type: string; ownerId?: string };

export type TwitchUserEmotes = { channelId: string; emotes: TwitchUserEmote[] };

export type TwitchSubscription = { tier: string; prime: boolean; months: number; streak: number };

export type TwitchFollowState = {
  channelId: string;
  following: boolean;
  followedAt?: string;
  subscription?: TwitchSubscription;
};

export type TwitchChatEvent = {
  type: "message" | "notice" | "delete" | "clear" | "room";
  id?: string;
  login?: string;
  displayName?: string;
  color?: string;
  text?: string;
  system?: string;
  emotes?: TwitchChatEmote[];
  badges?: string[];
  time: string;
  action?: boolean;
  targetId?: string;
  room?: TwitchRoomState;
  deleted?: boolean;
};

export type TwitchVideoChapter = { start: number; title: string; game?: TwitchGame };

export type TwitchVideoComment = {
  id: string;
  offset: number;
  login?: string;
  displayName?: string;
  color?: string;
  text: string;
  emotes?: TwitchChatEmote[];
  badges?: string[];
};

export type TwitchSearchType = "channels" | "games" | "streams";

type TwitchPollChoice = { id: string; title: string; votes: number };

export type TwitchPoll = {
  id: string;
  title: string;
  status: string;
  startedAt: string;
  endedAt?: string;
  durationSeconds: number;
  remainingMs: number;
  voters: number;
  votes: number;
  choices: TwitchPollChoice[];
};

export type TwitchPinnedMessage = {
  id: string;
  text: string;
  login: string;
  displayName: string;
  pinnedBy?: string;
  endsAt?: string;
};

export type TwitchChatHighlights = { poll: TwitchPoll | null; pinned: TwitchPinnedMessage | null };
