import type { VideoItem } from "../../apps/web/src/types/api";
import type {
  GroupedSubscription,
  SubscriptionGroup,
} from "../../apps/web/src/types/subscription-groups";

const GROUP_NAMES = [
  "Tech",
  "Video essays",
  "Music",
  "Science",
  "Cooking",
  "Gaming",
  "News",
  "Design",
  "DIY & making",
  "Travel",
  "History",
  "Photography",
  "Podcasts",
  "Fitness",
  "Languages",
  "Space",
  "Weekend watchlist — documentaries and deep dives",
  "To explore",
];
const ORIGINAL_NAMES = [
  "Lemnos Life",
  "Mental Outlaw",
  "Jack Rhysider",
  "Network Chuck",
  "Fireship",
  "Veritasium",
  "Smarter Every Day",
  "Behoops",
  "Red Shirts",
  "Annie Bramley",
  "KEXP",
  "NPR Music",
  "Dorian Me",
  "Arcade Sound",
  "Cooking Comically",
  "Technology Connections",
  "The B1M",
  "Noclip",
  "Asianometry",
  "PBS Space Time",
  "DW News",
];
const SUBJECTS = [
  "Analog",
  "Architecture",
  "Astronomy",
  "Baking",
  "Cinema",
  "Circuit",
  "Design",
  "Ecology",
  "History",
  "Indie Games",
  "Jazz",
  "Language",
  "Ocean",
  "Photography",
  "Robotics",
];
const FORMATS = [
  "Lab",
  "Notebook",
  "Journal",
  "Workshop",
  "Studio",
  "Archive",
  "Field Notes",
  "Weekly",
  "Collective",
];
const SPECIAL_NAMES = [
  "A",
  "Café des idées",
  "京都の小さな工房",
  "서울 디자인 스튜디오",
  "حكايات العلوم",
  "Atlas Workshop — repairing, rebuilding and understanding everyday machines one project at a time",
];
const EPOCH = Date.UTC(2026, 8, 1);

export function makeGroups(): SubscriptionGroup[] {
  return GROUP_NAMES.map((name, index) => ({
    id: `10000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
    name,
    channelCount: 0,
    createdAt: EPOCH,
    updatedAt: EPOCH,
  }));
}

export function makeChannels(groups: SubscriptionGroup[]): GroupedSubscription[] {
  return Array.from({ length: 150 }, (_, index) => {
    const generated = index - ORIGINAL_NAMES.length;
    const name =
      ORIGINAL_NAMES[index] ??
      SPECIAL_NAMES[generated] ??
      `${SUBJECTS[generated % SUBJECTS.length]} ${FORMATS[Math.floor(generated / SUBJECTS.length)]}`;
    const memberships = new Set<number>();
    if (index % 7 !== 0) {
      memberships.add(index % 16);
      if (index % 2 === 0) memberships.add(0);
      if (index % 3 !== 0) memberships.add((index + 5) % 16);
      if (index % 4 === 0) memberships.add((index + 9) % 16);
      if (index % 11 === 0) memberships.add(16);
    }
    if (index === 26) {
      memberships.clear();
      for (let group = 0; group < 10; group++) memberships.add(group);
    }
    return {
      channelUrl: `https://www.youtube.com/channel/UCfixture${String(index).padStart(15, "0")}`,
      name,
      avatarUrl: index % 13 === 0 ? "" : `/api/__qa/avatar/${index}.svg`,
      subscribedAt: EPOCH - index * 86_400_000,
      groupIds: [...memberships].map((group) => groups[group].id),
    };
  });
}

export function makeVideos(channels: GroupedSubscription[]): VideoItem[] {
  return Array.from({ length: 300 }, (_, index) => {
    const channel = channels[index % channels.length];
    const id = `mock${String(index).padStart(7, "0")}`;
    return {
      id,
      url: `https://www.youtube.com/watch?v=${id}`,
      title: `${channel.name}: ${index < channels.length ? "A closer look" : "Behind the scenes"}`,
      thumbnailUrl: `/api/__qa/thumbnail/${index}.svg`,
      uploaderName: channel.name,
      uploaderUrl: channel.channelUrl,
      uploaderAvatarUrl: channel.avatarUrl,
      uploaderVerified: index % 8 === 0,
      duration: 240 + ((index * 137) % 5400),
      viewCount: 850 + index * 12437,
      uploaded: EPOCH - index * 3_600_000,
      uploadDate: "2026-09-01",
      streamType: "VIDEO_STREAM",
      isLive: false,
      isPostLive: false,
      isLiveContent: false,
      requiresMembership: false,
      isShortFormContent: false,
      shortDescription: "Illustrative local fixture video; playback is not available.",
    };
  });
}

export function fixtureImage(kind: string, index: number): Response {
  const hue = (index * 47) % 360;
  const thumbnail = kind === "thumbnail";
  const width = thumbnail ? 640 : 80;
  const height = thumbnail ? 360 : 80;
  const label = thumbnail ? `Preview ${String(index + 1).padStart(3, "0")}` : String(index + 1);
  return new Response(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="hsl(${hue} 30% 24%)"/><text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="sans-serif" font-size="${thumbnail ? 42 : 24}">${label}</text></svg>`,
    { headers: { "Content-Type": "image/svg+xml" } },
  );
}
