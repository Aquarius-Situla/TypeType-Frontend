import { useMobile } from "../hooks/use-mobile";
import { useSettings } from "../hooks/use-settings";
import { relatedVideoPanelClassName } from "../lib/layout-preferences";
import { activeStreamCollection, streamCollectionPlaylistItems } from "../lib/stream-collections";
import { streamPartPlaylistItems } from "../lib/stream-parts";
import { toPublicWatchParam } from "../lib/watch-url";
import { m } from "../paraglide/messages.js";
import { useWatchLayoutStore } from "../stores/watch-layout-store";
import type { VideoStream } from "../types/stream";
import { PageSpinner } from "./page-spinner";
import { RelatedCardSkeleton } from "./related-card-skeleton";
import { RelatedVideos } from "./related-videos";
import { WatchCommentSkeleton } from "./watch-comment-skeleton";
import { WatchComments } from "./watch-comments";
import { WatchInfo } from "./watch-info";
import { getWatchLayoutClasses } from "./watch-layout-classes";
import { WatchPlaylistSkeleton } from "./watch-playlist-skeleton";

const RELATED_KEYS = ["related-1", "related-2", "related-3", "related-4", "related-5"];
const COMMENT_KEYS = ["comment-1", "comment-2", "comment-3"];

type Props = {
  stream?: VideoStream;
  relatedStreams?: VideoStream[];
  videoUrl?: string;
  showComments?: boolean;
  showRelated?: boolean;
  list?: string;
  currentParam?: string;
};

export function WatchPageSkeleton({
  stream,
  relatedStreams = [],
  videoUrl,
  showComments = true,
  showRelated = true,
  list,
  currentParam,
}: Props) {
  const isMobile = useMobile();
  const cinemaMode = useWatchLayoutStore((state) => state.cinemaMode);
  const { settings } = useSettings();

  const currentWatchParam = currentParam ?? (stream ? toPublicWatchParam(stream.id) : "");
  const collection = stream?.collections
    ? activeStreamCollection(stream.collections, currentWatchParam)
    : undefined;
  const collectionVideos = streamCollectionPlaylistItems(collection);
  const partVideos = streamPartPlaylistItems(stream?.parts);

  const hasPlaylist = Boolean(
    list || (collection && collectionVideos.length > 0) || partVideos.length > 0,
  );

  const playlistTitle =
    collection?.title ?? (partVideos.length > 0 ? m.ui_video_parts() : undefined);
  const playlistCount =
    collectionVideos.length > 0
      ? collectionVideos.length
      : partVideos.length > 0
        ? partVideos.length
        : undefined;

  const hasSecondaryContent =
    !isMobile && (hasPlaylist || (showRelated && (relatedStreams.length > 0 || !stream)));

  const classes = getWatchLayoutClasses(cinemaMode, hasSecondaryContent);
  const panelClassName = `w-full lg:flex-1 ${relatedVideoPanelClassName(settings.relatedVideoSize)} flex flex-col gap-6`;

  const meta = (
    <>
      {stream ? (
        <WatchInfo stream={stream} />
      ) : (
        <div className="flex animate-pulse flex-col gap-4">
          <div className="h-6 w-3/4 rounded bg-fg/10" />
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 rounded-full bg-fg/10" />
            <div className="flex flex-1 flex-col gap-2">
              <div className="h-4 w-36 rounded bg-fg/10" />
              <div className="h-3 w-24 rounded bg-fg/10" />
            </div>
            <div className="h-9 w-24 rounded bg-fg/10" />
          </div>
          <div className="h-20 w-full rounded bg-fg/10" />
        </div>
      )}
      {showComments &&
        (videoUrl ? (
          <WatchComments videoUrl={videoUrl} />
        ) : (
          <div className="flex flex-col gap-5 pt-2">
            {COMMENT_KEYS.map((key) => (
              <WatchCommentSkeleton key={key} />
            ))}
          </div>
        ))}
    </>
  );

  const secondaryContent = (
    <>
      {hasPlaylist && <WatchPlaylistSkeleton title={playlistTitle} count={playlistCount} />}
      {showRelated &&
        (relatedStreams.length > 0 ? (
          <RelatedVideos streams={relatedStreams} />
        ) : (
          RELATED_KEYS.map((key) => <RelatedCardSkeleton key={key} />)
        ))}
    </>
  );

  if (cinemaMode) {
    return (
      <div className={classes.containerClass}>
        <div className={classes.playerWrapClass}>
          <div className={classes.playerBoxClass}>
            <div className="aspect-video w-full overflow-hidden bg-black flex items-center justify-center">
              <PageSpinner fullScreen={false} />
            </div>
          </div>
        </div>
        <div className="mx-auto flex w-full max-w-[1700px] flex-col gap-6 px-4 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-[2] max-w-[1200px] flex flex-col gap-4">{meta}</div>
          {hasSecondaryContent && <aside className={panelClassName}>{secondaryContent}</aside>}
        </div>
      </div>
    );
  }

  return (
    <div className={classes.containerClass}>
      <div className={classes.playerWrapClass}>
        <div className={classes.playerBoxClass}>
          <div className="aspect-video w-full overflow-hidden rounded-lg bg-black flex items-center justify-center">
            <PageSpinner fullScreen={false} />
          </div>
        </div>
        {meta}
      </div>
      {hasSecondaryContent && <aside className={panelClassName}>{secondaryContent}</aside>}
    </div>
  );
}
