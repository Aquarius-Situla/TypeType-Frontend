import { expect, test } from "bun:test";
import { getBilibiliQueryVariations, pickTopBilibiliChannels } from "../src/hooks/use-search";
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

test("picks creator with pinyin handle and signature mention (HuangFuRen for 黄夫人)", () => {
  const huangfuren: ChannelResultItem = {
    name: "HuangFuRen",
    url: "https://space.bilibili.com/23630128",
    thumbnailUrl: "https://example.com/hfr.jpg",
    subscriberCount: 12744054,
    description: "讲义在主页橱窗  公众号：黄夫人物理  小作文邮箱hfr0812@qq.com",
    isVerified: false,
  };
  const fanAccount: ChannelResultItem = {
    name: "为了黄夫人学物理",
    url: "https://space.bilibili.com/999111",
    thumbnailUrl: "https://example.com/fan_hfr.jpg",
    subscriberCount: 782,
    description: "",
    isVerified: false,
  };
  const lowSubAccount: ChannelResultItem = {
    name: "黄夫人物理课_",
    url: "https://space.bilibili.com/999222",
    thumbnailUrl: "https://example.com/hfr_lesson.jpg",
    subscriberCount: 1152,
    description: "",
    isVerified: false,
  };

  const result = pickTopBilibiliChannels([huangfuren, fanAccount, lowSubAccount], "黄夫人");
  expect(result.length).toBe(1);
  expect(result[0].name).toBe("HuangFuRen");
  expect(result[0].url).toBe("https://space.bilibili.com/23630128");
});

test("picks algorithmic top creator for community alias (LexBurner for 蕾丝)", () => {
  const lexBurner: ChannelResultItem = {
    name: "LexBurner",
    url: "https://space.bilibili.com/777536",
    thumbnailUrl: "https://example.com/lex.jpg",
    subscriberCount: 6079545,
    description: "商务vx:hyqiuqiu19；商务q:445591408 合作邮箱：lexkaixin@163.com",
    isVerified: false,
  };
  const anleisi: ChannelResultItem = {
    name: "安蕾丝丝",
    url: "https://space.bilibili.com/554433",
    thumbnailUrl: "https://example.com/anleisi.jpg",
    subscriberCount: 152617,
    description: "这个不是大哥，是萌妹子！",
    isVerified: false,
  };

  const result = pickTopBilibiliChannels([lexBurner, anleisi], "蕾丝");
  expect(result.length).toBe(1);
  expect(result[0].name).toBe("LexBurner");
  expect(result[0].url).toBe("https://space.bilibili.com/777536");
});

test("picks official foreign idol creator for Chinese translation (FRUITSZIPPER_公式 for 水果拉链)", () => {
  const officialGroup: ChannelResultItem = {
    name: "FRUITSZIPPER_公式",
    url: "https://space.bilibili.com/3546857915550439",
    thumbnailUrl: "https://example.com/fz.jpg",
    subscriberCount: 37298,
    description:
      "FRUITS ZIPPER “FRUITS”（“成果”）“ZIP”（“注入能量”） 让我们一同从原宿走向更广阔的世界",
    isVerified: false,
  };
  const subtitleGroup: ChannelResultItem = {
    name: "水果拉链字幕组",
    url: "https://space.bilibili.com/3546666741270925",
    thumbnailUrl: "https://example.com/sub.jpg",
    subscriberCount: 12823,
    description: "内容请勿转载至其他平台",
    isVerified: false,
  };
  const fanAccount: ChannelResultItem = {
    name: "水果拉链可爱征服世界",
    url: "https://space.bilibili.com/19063822",
    thumbnailUrl: "https://example.com/fan.jpg",
    subscriberCount: 113,
    description: "KAWAII LAB姐妹团向世界传递可爱",
    isVerified: false,
  };

  const result = pickTopBilibiliChannels([officialGroup, subtitleGroup, fanAccount], "水果拉链");
  expect(result.length).toBe(1);
  expect(result[0].name).toBe("FRUITSZIPPER_公式");
  expect(result[0].url).toBe("https://space.bilibili.com/3546857915550439");
});

test("generates plural and joined variations for English query (fruit zipper)", () => {
  const vars = getBilibiliQueryVariations("fruit zipper");
  expect(vars).toContain("fruits zipper");
  expect(vars).toContain("fruitzipper");
  expect(vars).toContain("fruitszipper");
});

test("matches official account when searching fruit zipper through candidate fallback", () => {
  const officialGroup: ChannelResultItem = {
    name: "FRUITSZIPPER_公式",
    url: "https://space.bilibili.com/3546857915550439",
    thumbnailUrl: "https://example.com/fz.jpg",
    subscriberCount: 37298,
    description: "FRUITS ZIPPER【Official】",
    isVerified: false,
  };
  const fanGroup: ChannelResultItem = {
    name: "Fruits_Zipper",
    url: "https://space.bilibili.com/3546387696323480",
    thumbnailUrl: "https://example.com/fz2.jpg",
    subscriberCount: 25,
    description: "",
    isVerified: false,
  };

  const result = pickTopBilibiliChannels([officialGroup, fanGroup], "fruit zipper");
  expect(result.length).toBe(1);
  expect(result[0].name).toBe("FRUITSZIPPER_公式");
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
