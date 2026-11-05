import { describe, expect, test } from "bun:test";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CommunityPostCard } from "../src/components/community-post-card";
import { channelPathSearch, channelTabOrDefault } from "../src/lib/channel-route-url";
import type { CommunityPost } from "../src/types/community-post";

async function render(element: ReactElement): Promise<string> {
  const router = createRouter({
    history: createMemoryHistory({ initialEntries: ["/"] }),
    routeTree: createRootRoute({ component: () => element }),
  });
  await router.load();
  return renderToStaticMarkup(<RouterProvider router={router} />);
}

const post: CommunityPost = {
  id: "post-1",
  url: "https://www.youtube.com/post/post-1",
  type: "shared_post",
  text: "Layered Actions are taking shape!<br>Read more",
  authorName: "Blender",
  authorUrl: "https://www.youtube.com/@BlenderOfficial",
  authorAvatarUrl: "https://yt3.ggpht.com/avatar=s176",
  publishedTime: "3 days ago",
  textualLikeCount: "98",
  textualCommentCount: "12",
  images: ["https://yt3.ggpht.com/one=s1080", "https://yt3.ggpht.com/two=s1080"],
  poll: {
    type: "text",
    choices: [{ text: "Grease Pencil" }, { text: "Geometry Nodes" }],
    textualVoteCount: "4.5K votes",
  },
  sharedPost: {
    id: "post-0",
    url: "https://www.youtube.com/post/post-0",
    type: "video",
    text: "",
    authorName: "Blender Studio",
    authorUrl: "",
    authorAvatarUrl: "",
    publishedTime: "",
    textualLikeCount: "",
    textualCommentCount: "",
    images: [],
    video: {
      url: "https://www.youtube.com/watch?v=mHrHLqQj7Ts",
      title: "Making of: The Blender Open Movies Exhibition",
      thumbnailUrl: "https://i.ytimg.com/vi/mHrHLqQj7Ts/hq720.jpg",
    },
  },
};

describe("community posts", () => {
  test("the posts tab survives the channel URL", () => {
    expect(channelTabOrDefault("posts")).toBe("posts");
    expect(channelPathSearch("latest", "", "posts")).toEqual({ tab: "posts" });
  });

  test("renders text, proxied images, the poll and the shared video", async () => {
    const html = await render(<CommunityPostCard post={post} locale="en" />);

    expect(html).toContain("Layered Actions are taking shape!");
    expect(html).toContain(encodeURIComponent("https://yt3.ggpht.com/one=s1080"));
    expect(html).toContain("Geometry Nodes");
    expect(html).toContain("4.5K votes");
    expect(html).toContain("Making of: The Blender Open Movies Exhibition");
    expect(html).toContain("/watch?v=mHrHLqQj7Ts");
    expect(html).toContain("98");
  });
});
