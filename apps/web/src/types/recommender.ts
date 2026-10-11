export type RecommenderCapability = {
  installed: boolean;
  enabled: boolean;
  experimental: boolean;
};

export type ParameterValue = number | boolean;

export type AlgorithmParameter =
  | {
      id: string;
      group: string;
      label: string;
      type: "number";
      min: number;
      max: number;
      step: number;
      default: number;
      unit?: string | null;
      featured?: boolean;
      help?: string;
    }
  | {
      id: string;
      group: string;
      label: string;
      type: "boolean";
      default: boolean;
      featured?: boolean;
      help?: string;
    };

export type AlgorithmInfo = {
  id: string;
  name: string;
  description: string;
  uses: string[];
  sources: string[];
  random: boolean;
  source_url: string;
  guide: {
    for_you_if: string;
    you_will_see: string;
    good_to_know: string;
    traits: { personal: number; discovery: number; variety: number };
  };
  parameters: AlgorithmParameter[];
};

export type AlgorithmList = {
  default_algorithm: string | null;
  algorithms: AlgorithmInfo[];
};

export type RecommenderSettings = {
  enabled: boolean;
  algorithmId: string | null;
  parameters: Record<string, ParameterValue>;
  mutedGroups: string[];
  ignoredSignals: string[];
  pinnedGroups: string[];
  sessionResetAt: number | null;
  customInterests?: string[];
  unusedData?: string[];
  excludedItems?: string[];
  retentionDays?: Record<string, number>;
};

export type RecommenderDataItem = {
  id: string;
  title: string;
  channel: string | null;
  at: number;
  watchedPercent: number | null;
  excluded: boolean;
  thumbnailUrl?: string | null;
  viewings?: number;
};

export type RecommenderDataCategory = {
  id: string;
  count: number;
  oldestAt: number | null;
  use: boolean;
  retentionDays: number | null;
  collect: boolean | null;
  items: RecommenderDataItem[];
};

export type RecommenderPageTrace = {
  algorithm: string;
  builtAt: number;
  sources: { kind: string; detail: string; received: number }[];
  candidatesReceived: number;
  dropped: Record<string, number>;
  shown: number;
  rows: { id: string; title: string; why: string; videos: number }[];
  scores: {
    url: string;
    title: string;
    channel: string;
    row: string;
    total: number;
    factors: Record<string, number>;
  }[];
};

export type ProfileGroup = {
  id: string;
  label: string;
  weight: number;
  from: string[];
  pinned: boolean;
  muted: boolean;
  examples?: ProfileExample[];
};

type ProfileExample = {
  url: string;
  title?: string;
  channel?: string;
  thumbnailUrl?: string;
};

export type ProfileChannel = {
  id: string;
  name: string;
  weight: number;
  from: string[];
  avatarUrl?: string;
};

type SessionBoost = { ref: string; label: string; strength: number; expires_at: number };

export type AlgorithmProfile = {
  groups: ProfileGroup[];
  channels: ProfileChannel[];
  session_boosts: SessionBoost[];
};

export const VIDEO_REFUSAL_REASONS = ["seen", "channel", "topic", "other"] as const;
export type VideoRefusalReason = (typeof VIDEO_REFUSAL_REASONS)[number];

export const PAGE_REFUSAL_REASONS = ["repetitive", "unrelated", "old", "missing"] as const;
export type PageRefusalReason = (typeof PAGE_REFUSAL_REASONS)[number];

export type RecommenderFeedback = {
  id: string;
  kind: "page" | "video";
  verdict: "good" | "bad" | "not_for_me";
  comment: string | null;
  videoUrl: string | null;
  reason?: VideoRefusalReason | PageRefusalReason | null;
  title?: string | null;
  channelName?: string | null;
  thumbnailUrl?: string | null;
  algorithmId: string;
  parameters: Record<string, ParameterValue>;
  createdAt: number;
};

export type RecommenderFeedbackRequest = Pick<RecommenderFeedback, "kind" | "verdict"> & {
  comment?: string;
  videoUrl?: string;
  reason?: VideoRefusalReason | PageRefusalReason;
  title?: string;
  channelName?: string;
  thumbnailUrl?: string;
};

export type HomeRecommendationRow = {
  id: string;
  title: string;
  reason: string;
  reasonRef: string | null;
  videoUrls: string[];
};
