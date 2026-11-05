import { describe, expect, test } from "bun:test";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CommentMedia } from "../src/components/comment-media";
import { mapCommentItem } from "../src/lib/mappers";
import type { CommentItem } from "../src/types/api";

async function render(element: ReactElement): Promise<string> {
  const router = createRouter({
    history: createMemoryHistory({ initialEntries: ["/"] }),
    routeTree: createRootRoute({ component: () => element }),
  });
  await router.load();
  return renderToStaticMarkup(<RouterProvider router={router} />);
}

const comment: CommentItem = {
  id: "c1",
  text: "nice",
  author: "@viewer",
  authorUrl: "",
  authorAvatarUrl: "",
  likeCount: 3,
  textualLikeCount: "3",
  publishedTime: "1 day ago",
  isHeartedByUploader: false,
  isPinned: false,
  uploaderVerified: false,
  replyCount: 0,
  repliesPage: null,
};

describe("comment media", () => {
  test("old comment responses without media still map", () => {
    const mapped = mapCommentItem(comment);
    expect(mapped.image).toBeNull();
    expect(mapped.voiceReply).toBeNull();
  });

  test("proxies a GIF and labels it", async () => {
    const mapped = mapCommentItem({
      ...comment,
      image: { url: "https://yt3.ggpht.com/gif=s352?anim=1", animated: true },
    });
    const html = await render(
      <CommentMedia image={mapped.image} voiceReply={mapped.voiceReply} locale="en" />,
    );

    expect(mapped.image?.url).toContain("/proxy?url=");
    expect(html).toContain('alt="GIF in comment"');
  });

  test("a voice reply shows its transcript and opens in TypeType", async () => {
    const html = await render(
      <CommentMedia
        image={null}
        voiceReply={{
          url: "https://www.youtube.com/watch?v=abcdefghijk",
          durationMs: 13_049,
          transcript: "Thanks for watching",
          playable: true,
        }}
        locale="en"
      />,
    );

    expect(html).toContain("Voice reply");
    expect(html).toContain("0:13");
    expect(html).toContain("Thanks for watching");
    expect(html).toContain("/watch?v=abcdefghijk");
    expect(html).toContain('target="_blank"');
  });

  test("an unplayable voice reply explains why and offers no link", async () => {
    const html = await render(
      <CommentMedia
        image={null}
        voiceReply={{
          url: "",
          durationMs: 0,
          transcript: "Thanks",
          playable: false,
          unavailableText: "Voice replies are not available",
        }}
        locale="en"
      />,
    );

    expect(html).toContain("Voice replies are not available");
    expect(html).not.toContain("/watch");
  });
});
