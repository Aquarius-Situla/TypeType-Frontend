import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { useSubscriptionFeed } from "../../src/hooks/use-subscription-feed";
import type { VideoItem } from "../../src/types/api";

export function readFeed(
  client: QueryClient,
  filter = "all",
): ReturnType<typeof useSubscriptionFeed> {
  let state: ReturnType<typeof useSubscriptionFeed> | undefined;
  function ReadFeed(): null {
    state = useSubscriptionFeed(filter);
    return null;
  }
  renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <ReadFeed />
    </QueryClientProvider>,
  );
  if (!state) throw new Error("Feed hook did not render");
  return state;
}

export function video(id: string): VideoItem {
  return {
    id,
    url: `https://www.youtube.com/watch?v=${id}`,
    title: id,
    thumbnailUrl: "",
    uploaderName: "Test channel",
    uploaderUrl: "",
    uploaderAvatarUrl: "",
    uploaderVerified: false,
    duration: 100,
    viewCount: 1,
    uploadDate: "",
    uploaded: 0,
    streamType: "VIDEO_STREAM",
    isLive: false,
    isPostLive: false,
    isLiveContent: false,
    requiresMembership: false,
    isShortFormContent: false,
    shortDescription: null,
  };
}
