import { expect, test } from "bun:test";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PlaylistCard } from "../src/components/playlist-card";
import type { PlaylistItem, PlaylistVideoItem } from "../src/types/user";

async function render(element: ReactElement): Promise<string> {
  const router = createRouter({
    history: createMemoryHistory({ initialEntries: ["/"] }),
    routeTree: createRootRoute({ component: () => element }),
  });
  await router.load();
  return renderToStaticMarkup(<RouterProvider router={router} />);
}

function playlistWith(thumbnail: string): PlaylistItem {
  const video = { url: "https://www.youtube.com/watch?v=abc", title: "Clip", thumbnail };
  return {
    id: "list",
    name: "Mix",
    description: "",
    videos: [video as PlaylistVideoItem],
    videoCount: 1,
    createdAt: 0,
  };
}

function imageSource(html: string): string | null {
  return html.match(/<img[^>]*src="([^"]*)"/)?.[1]?.replaceAll("&amp;", "&") ?? null;
}

test("loads the cover thumbnail through the instance proxy", async () => {
  const html = await render(
    <PlaylistCard
      playlist={playlistWith("https://i.ytimg.com/vi/abc/hqdefault.jpg")}
      onDeleteRequest={() => undefined}
    />,
  );

  expect(imageSource(html)).toEndWith(
    `/proxy?url=${encodeURIComponent("https://i.ytimg.com/vi/abc/hqdefault.jpg")}`,
  );
});

test("reroutes a cover saved through another instance to this instance's proxy", async () => {
  const saved = `https://other.example/api/proxy?url=${encodeURIComponent("https://i.ytimg.com/vi/abc/hq720.jpg")}`;
  const html = await render(
    <PlaylistCard playlist={playlistWith(saved)} onDeleteRequest={() => undefined} />,
  );

  expect(imageSource(html)).not.toContain("other.example");
  expect(imageSource(html)).toEndWith(
    `/proxy?url=${encodeURIComponent("https://i.ytimg.com/vi/abc/hq720.jpg")}`,
  );
});

test("shows the empty cover when the first video has no thumbnail", async () => {
  const html = await render(
    <PlaylistCard playlist={playlistWith("  ")} onDeleteRequest={() => undefined} />,
  );

  expect(imageSource(html)).toBeNull();
});
