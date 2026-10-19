import { Link } from "@tanstack/react-router";
import { memo } from "react";
import { useClientLocale } from "../hooks/use-client-locale";
import { useDeArrowBranding } from "../hooks/use-dearrow";
import { formatDuration, formatPublishedDate, formatViews } from "../lib/format";
import { relatedVideoThumbnailClassName } from "../lib/layout-preferences";
import { isVideoWatched } from "../lib/watch-progress";
import { watchRouteSearch } from "../lib/watch-url";
import { useWatchNavigationStore } from "../stores/watch-navigation-store";
import type { VideoStream } from "../types/stream";
import { ChannelAvatar } from "./channel-avatar";
import { ChannelRouteLink } from "./channel-route-link";
import { VideoCardFeedbackMenu } from "./video-card-feedback-menu";
import { VideoMembershipBadge } from "./video-membership-badge";
import { VideoProgressBar } from "./video-progress-bar";
import { VideoStatusBadge } from "./video-status-badge";
import { VerifiedBadgeIcon } from "./watch-icons";
import { WatchedBadge } from "./watched-badge";

type Props = {
  stream: VideoStream;
  relatedStreams?: VideoStream[];
  size?: "default" | "large";
  progressMs?: number;
};

function RelatedCardComponent({ stream, relatedStreams, size = "default", progressMs = 0 }: Props) {
  const locale = useClientLocale();
  const thumbnailClassName = relatedVideoThumbnailClassName(size);
  const setNavigation = useWatchNavigationStore((state) => state.setNavigation);
  const { title, thumbnail } = useDeArrowBranding(
    stream.id,
    stream.title,
    stream.thumbnail,
    stream.duration,
  );
  const publishedText = formatPublishedDate(stream.publishedAt, undefined, locale);
  const metadata = [formatViews(stream.views), publishedText].filter(Boolean).join(" · ");
  const progressSeconds = Math.max(0, progressMs / 1_000);
  const watched = !stream.isLive && isVideoWatched(progressSeconds, stream.duration);

  return (
    <article className="flex gap-2 group">
      <Link
        to="/watch"
        search={watchRouteSearch(stream.id)}
        preload="intent"
        className={`relative ${thumbnailClassName} aspect-video rounded-md overflow-hidden bg-surface-strong flex-shrink-0`}
        onClick={() => setNavigation(stream, relatedStreams)}
      >
        <img
          src={thumbnail}
          alt={title}
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-200 ${watched ? "grayscale opacity-60" : ""}`}
          loading="lazy"
          decoding="async"
        />
        {stream.requiresMembership && (
          <span className="absolute left-1.5 top-1.5">
            <VideoMembershipBadge compact />
          </span>
        )}
        {(stream.isLive || stream.isPostLive) && (
          <span className="absolute bottom-1 left-1">
            <VideoStatusBadge stream={stream} compact />
          </span>
        )}
        {watched && (
          <span className="absolute right-1.5 top-1.5">
            <WatchedBadge />
          </span>
        )}
        {!stream.isLive && stream.duration > 0 && (
          <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 rounded">
            {formatDuration(stream.duration)}
          </span>
        )}
        {!stream.isLive && (
          <VideoProgressBar progress={progressSeconds} duration={stream.duration} />
        )}
      </Link>
      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
        <Link
          to="/watch"
          search={watchRouteSearch(stream.id)}
          preload="intent"
          className="text-sm font-medium text-fg line-clamp-2 leading-snug hover:text-fg-strong"
          onClick={() => setNavigation(stream, relatedStreams)}
        >
          {title}
        </Link>
        {stream.channelUrl ? (
          <ChannelRouteLink
            url={stream.channelUrl}
            className="flex min-w-0 max-w-full items-center gap-1.5 mt-0.5 w-fit group/channel"
          >
            <ChannelAvatar
              src={stream.channelAvatar}
              name={stream.channelName}
              className="w-4 h-4"
            />
            <span className="min-w-0 text-sm text-fg-muted group-hover/channel:text-fg truncate flex items-center gap-1">
              {stream.channelName}
              {stream.uploaderVerified && <VerifiedBadgeIcon />}
            </span>
          </ChannelRouteLink>
        ) : (
          <div className="flex min-w-0 max-w-full items-center gap-1.5 mt-0.5">
            <ChannelAvatar
              src={stream.channelAvatar}
              name={stream.channelName}
              className="w-4 h-4"
            />
            <span className="min-w-0 text-sm text-fg-muted truncate flex items-center gap-1">
              {stream.channelName}
              {stream.uploaderVerified && <VerifiedBadgeIcon />}
            </span>
          </div>
        )}
        <p className="text-xs text-fg-soft">{metadata}</p>
      </div>
      <VideoCardFeedbackMenu stream={stream} />
    </article>
  );
}

export const RelatedCard = memo(RelatedCardComponent);
