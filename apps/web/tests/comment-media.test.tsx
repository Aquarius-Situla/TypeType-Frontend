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
import { WatchReply } from "../src/components/watch-reply";
import { InterfaceLocaleProvider } from "../src/hooks/use-interface-locale";
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

  test("a voice reply shows its duration and transcript", async () => {
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
    expect(html).not.toContain("/watch");
    expect(html).toContain('aria-label="Play the voice reply"');
  });

  test("an unplayable voice reply explains why", async () => {
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
  });

  test("creator voice replies show up in reply threads", async () => {
    const reply = mapCommentItem({
      ...comment,
      text: "",
      voiceReply: {
        url: "https://www.youtube.com/watch?v=AGIzexZDwVE",
        durationMs: 5_456,
        transcript: "Hello, Nathan.",
        playable: true,
      },
    });
    const html = await render(
      <InterfaceLocaleProvider>
        <WatchReply reply={reply} videoUrl="https://www.youtube.com/shorts/x" />
      </InterfaceLocaleProvider>,
    );

    expect(html).toContain("Voice reply");
    expect(html).toContain("Hello, Nathan.");
  });
});
