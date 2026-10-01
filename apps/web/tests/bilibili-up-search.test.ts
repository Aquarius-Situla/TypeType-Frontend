import { expect, test } from "bun:test";
import { pickTopBilibiliChannels } from "../src/hooks/use-search";
import { toCanonicalChannelRoute } from "../src/lib/channel-route-url";
import { searchFilterLabel } from "../src/lib/search-filter-selection";
import type { ChannelResultItem } from "../src/types/api";

const ch1: ChannelResultItem = {
  name: "影视飓风",
  url: "https://space.bilibili.com/946974",
  thumbnailUrl: "https://example.com/avatar1.jpg",
  subscriberCount: 18476000,
  description: "无限进步",
  isVerified: true,
};

const ch2: ChannelResultItem = {
  name: "影视飓风录屏组",
  url: "https://space.bilibili.com/491949875",
  thumbnailUrl: "https://example.com/avatar2.jpg",
  subscriberCount: 98000,
  description: "搬运录屏",
  isVerified: false,
};

const ch3: ChannelResultItem = {
  name: "猫屎影视飓风",
  url: "https://space.bilibili.com/3546924808407197",
  thumbnailUrl: "https://example.com/avatar3.jpg",
  subscriberCount: 2200,
  description: "粉丝",
  isVerified: false,
};

const irrelevantCh: ChannelResultItem = {
  name: "其他无关博主",
  url: "https://space.bilibili.com/12345678",
  thumbnailUrl: "https://example.com/avatar_other.jpg",
  subscriberCount: 500000,
  description: "分享生活",
  isVerified: false,
};

test("prioritizes authentic creator over copycat and fan accounts for UP search", () => {
  const candidates = [ch3, ch2, ch1];
  const top = pickTopBilibiliChannels(candidates, "影视飓风");

  expect(top.length).toBe(1);
  expect(top[0].name).toBe("影视飓风");
  expect(top[0].url).toBe("https://space.bilibili.com/946974");
});

test("prioritizes dominant creator over low-subscriber exact name squatter (e.g. 极客湾)", () => {
  const squatter: ChannelResultItem = {
    name: "极客湾",
    url: "https://space.bilibili.com/494949",
    thumbnailUrl: "https://example.com/squatter.jpg",
    subscriberCount: 49,
    isVerified: false,
  };
  const authenticGeeker: ChannelResultItem = {
    name: "极客湾Geekerwan",
    url: "https://space.bilibili.com/1792712",
    thumbnailUrl: "https://example.com/geekerwan.jpg",
    subscriberCount: 5572000,
    isVerified: true,
  };
  const fanRecording: ChannelResultItem = {
    name: "极客湾测试录像",
    url: "https://space.bilibili.com/998877",
    thumbnailUrl: "https://example.com/fan.jpg",
    subscriberCount: 11500,
    isVerified: false,
  };

  const top = pickTopBilibiliChannels([squatter, fanRecording, authenticGeeker], "极客湾");
  expect(top.length).toBe(1);
  expect(top[0].name).toBe("极客湾Geekerwan");
  expect(top[0].url).toBe("https://space.bilibili.com/1792712");
});

test("rejects low-subscriber squatters when searching general topic keywords", () => {
  const lowSubAccount: ChannelResultItem = {
    name: "黑神话悟空攻略",
    url: "https://space.bilibili.com/112233",
    thumbnailUrl: "https://example.com/guide.jpg",
    subscriberCount: 9,
    isVerified: false,
  };
  const result = pickTopBilibiliChannels([lowSubAccount], "黑神话悟空攻略");
  expect(result).toEqual([]);
});

test("matches partial channel names and ignores irrelevant channels", () => {
  const heTongxue1: ChannelResultItem = {
    name: "老师好我叫何同学",
    url: "https://space.bilibili.com/163637592",
    thumbnailUrl: "https://example.com/he1.jpg",
    subscriberCount: 13030000,
    description: "何同学主账号",
    isVerified: true,
  };

  const heTongxue2: ChannelResultItem = {
    name: "何同学工作室",
    url: "https://space.bilibili.com/1459278",
    thumbnailUrl: "https://example.com/he2.jpg",
    subscriberCount: 1450000,
    description: "工作室",
    isVerified: true,
  };

  const result = pickTopBilibiliChannels([irrelevantCh, heTongxue2, heTongxue1], "何同学");
  expect(result.length).toBe(1);
  expect(result[0].name).toBe("老师好我叫何同学");
});

test("returns empty list when no candidate matches the query", () => {
  const result = pickTopBilibiliChannels([irrelevantCh], "Vue 3 教程", 2);
  expect(result).toEqual([]);
});

test("handles whitespace and case insensitivity in channel query", () => {
  const testv: ChannelResultItem = {
    name: "TESTV官方频道",
    url: "https://space.bilibili.com/712345",
    thumbnailUrl: "https://example.com/testv.jpg",
    subscriberCount: 3000000,
    description: "什么值得吃",
    isVerified: true,
  };

  const result = pickTopBilibiliChannels([testv], "  testv  ", 2);
  expect(result.length).toBe(1);
  expect(result[0].name).toBe("TESTV官方频道");
});

test("resolves canonical channel routes from space URLs with or without protocol", () => {
  expect(toCanonicalChannelRoute("https://space.bilibili.com/946974")).toEqual({
    provider: "bilibili",
    id: "946974",
  });
  expect(toCanonicalChannelRoute("space.bilibili.com/946974")).toEqual({
    provider: "bilibili",
    id: "946974",
  });
  expect(toCanonicalChannelRoute("https://www.bilibili.com/space/946974")).toEqual({
    provider: "bilibili",
    id: "946974",
  });
  expect(toCanonicalChannelRoute("youtube.com/@MrBeast")).toEqual({
    provider: "youtube",
    id: "@MrBeast",
  });
});

test("formats content filter labels cleanly", () => {
  expect(searchFilterLabel("channels")).toBe("Channels");
  expect(searchFilterLabel("lives")).toBe("Live");
  expect(searchFilterLabel("videos")).toBe("Videos");
});
