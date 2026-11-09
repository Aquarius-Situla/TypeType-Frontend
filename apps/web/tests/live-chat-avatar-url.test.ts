import { expect, test } from "bun:test";
import { liveChatAvatarUrl } from "../src/lib/live-chat-author";

test("loads live chat avatars through the instance proxy", () => {
  const avatar = liveChatAvatarUrl("https://yt3.ggpht.com/abc=s64-c-k-no");

  expect(avatar).toContain("/proxy?url=");
  expect(new URL(avatar ?? "", "https://example.test").searchParams.get("url")).toBe(
    "https://yt3.ggpht.com/abc=s64-c-k-no",
  );
});

test("ignores missing and insecure live chat avatars", () => {
  expect(liveChatAvatarUrl(null)).toBeUndefined();
  expect(liveChatAvatarUrl("http://yt3.ggpht.com/abc")).toBeUndefined();
});
