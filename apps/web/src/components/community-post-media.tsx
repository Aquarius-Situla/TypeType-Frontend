import { Link } from "@tanstack/react-router";
import { BarChart3, Play } from "lucide-react";
import { proxyImage } from "../lib/proxy";
import { watchRouteSearch, youtubeThumbnailUrl } from "../lib/watch-url";
import type { CommunityPostPoll, CommunityPostVideo } from "../types/community-post";

export function PostImages({ images }: { images: string[] }) {
  if (images.length === 0) return null;
  if (images.length === 1) {
    return (
      <img
        src={proxyImage(images[0])}
        alt=""
        className="max-h-[36rem] w-auto max-w-full self-start rounded-xl bg-surface-strong"
        loading="lazy"
        decoding="async"
      />
    );
  }
  return (
    <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 sm:-mx-5 sm:px-5">
      {images.map((url) => (
        <img
          key={url}
          src={proxyImage(url)}
          alt=""
          className="aspect-square w-[78%] shrink-0 snap-start rounded-xl bg-surface-strong object-cover sm:w-[60%]"
          loading="lazy"
          decoding="async"
        />
      ))}
    </div>
  );
}

export function PostPoll({ poll }: { poll: CommunityPostPoll }) {
  const withImages = poll.choices.some((choice) => choice.imageUrl);
  return (
    <div className="flex flex-col gap-2">
      <div className={withImages ? "grid grid-cols-2 gap-2" : "flex flex-col gap-2"}>
        {poll.choices.map((choice) => (
          <div
            key={choice.text}
            className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface-strong/40 text-sm font-medium text-fg"
          >
            {choice.imageUrl && (
              <img
                src={proxyImage(choice.imageUrl)}
                alt=""
                className="aspect-square w-full bg-surface-strong object-cover"
                loading="lazy"
                decoding="async"
              />
            )}
            <span className="px-4 py-3">{choice.text}</span>
          </div>
        ))}
      </div>
      {poll.textualVoteCount && (
        <span className="inline-flex items-center gap-1.5 text-xs text-fg-soft">
          <BarChart3 className="size-3.5" aria-hidden="true" />
          {poll.textualVoteCount}
        </span>
      )}
    </div>
  );
}

export function PostVideo({ video }: { video: CommunityPostVideo }) {
  const thumbnail = youtubeThumbnailUrl(video.url) ?? video.thumbnailUrl;
  return (
    <Link
      to="/watch"
      search={watchRouteSearch(video.url)}
      className="group block overflow-hidden rounded-xl border border-border bg-surface-strong/40 transition-colors hover:bg-surface-strong/70"
    >
      <div className="relative aspect-video bg-surface-strong">
        {thumbnail && (
          <img
            src={proxyImage(thumbnail)}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        )}
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-transform group-hover:scale-110">
            <Play className="ml-0.5 size-5 fill-current" aria-hidden="true" />
          </span>
        </span>
      </div>
      <p className="line-clamp-2 px-4 py-3 text-sm font-medium leading-snug text-fg group-hover:text-fg-strong">
        {video.title}
      </p>
    </Link>
  );
}
