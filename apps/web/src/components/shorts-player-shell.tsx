import { Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ShortsPlayerStage } from "../components/shorts-player-stage";
import { ShortsShellLoader } from "../components/shorts-shell-loader";
import { useAuth } from "../hooks/use-auth";
import { useInstance } from "../hooks/use-instance";
import { useSettings } from "../hooks/use-settings";
import { useShortsActiveStream } from "../hooks/use-shorts-active-stream";
import { useShortsFeed } from "../hooks/use-shorts-feed";
import { useShortsPrefetch } from "../hooks/use-shorts-prefetch";
import { useShortsRouteFeed } from "../hooks/use-shorts-route-feed";
import { useShortsRouteSync } from "../hooks/use-shorts-route-sync";
import { useVolumeSync } from "../hooks/use-volume-sync";
import {
  getOriginalAudioLocale,
  getOriginalAudioTrackId,
  getPreferredDefaultAudioTrackId,
} from "../lib/audio-track";
import { useShortsNavigation } from "../lib/shorts-navigation";
import { toPublicWatchParam } from "../lib/watch-url";
import { youtubeSessionReturnToForShorts } from "../lib/youtube-session-route";
import { m } from "../paraglide/messages.js";

type Props = {
  targetUrl?: string;
};

export function ShortsPlayerShell({ targetUrl }: Props) {
  const feed = useShortsFeed();
  const shorts = useShortsRouteFeed(feed.shorts, targetUrl);
  const { authReady, isAuthed } = useAuth();
  const { isPending: instancePending } = useInstance();
  const { settings, update, settingsReady } = useSettings();
  const playerRef = useRef<HTMLDivElement>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const useAuthenticatedStream = isAuthed;
  const streamEnabled = authReady && !instancePending && (!isAuthed || settingsReady);

  const handleAutoNext = () => {
    moveBy(1, "auto");
  };
  const { index, moveBy, moveTo, onWheel, onTouchStart, onTouchEnd } = useShortsNavigation(
    shorts.length,
    feed.hasNextPage,
    feed.isFetchingNextPage,
    feed.fetchNextPage,
  );
  const {
    active,
    activeId,
    stream,
    current,
    streamLoading,
    streamError,
    retry,
    errorMessage,
    isMemberOnlyShort,
    youtubeSessionAction,
  } = useShortsActiveStream({
    shorts,
    index,
    useAuthenticatedStream,
    enabled: streamEnabled,
  });
  const originalAudioTrackId = getOriginalAudioTrackId(stream);
  const preferredDefaultAudioTrackId = getPreferredDefaultAudioTrackId(stream);
  const originalAudioLocale = getOriginalAudioLocale(stream);
  const onVolumeChange = useVolumeSync(update.mutate, settings);
  useShortsPrefetch(
    shorts.map((item) => item.id),
    index,
  );

  useShortsRouteSync({
    targetUrl,
    shorts,
    index,
    moveTo,
    activeId,
    onActiveChange: () => setCommentsOpen(false),
  });

  const sectionClass = "shorts-viewport overflow-hidden p-2 sm:p-3 lg:p-4";
  if (feed.isLoading && shorts.length === 0) {
    return <ShortsShellLoader sectionClass={sectionClass} />;
  }
  if (!active) {
    return (
      <section className="flex min-h-[45vh] items-center justify-center px-4 pt-12">
        <div className="w-full max-w-md rounded-xl border border-border bg-surface/80 px-6 py-8 text-center">
          <h1 className="text-base font-semibold text-fg">{m.nav_shorts()}</h1>
          <p className="mt-2 text-sm leading-6 text-fg-muted">
            {m.ui_no_shorts_available_right_now()}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <Link
              to="/subscriptions/channels"
              className="rounded-lg bg-fg px-4 py-2 text-sm font-medium text-app transition-opacity hover:opacity-90"
            >
              {m.groups_preview_open_subscriptions()}
            </Link>
            <Link
              to="/import"
              className="rounded-lg border border-border-strong px-4 py-2 text-sm font-medium text-fg transition-colors hover:bg-surface-strong"
            >
              {m.ui_import_from_youtube()}
            </Link>
          </div>
        </div>
      </section>
    );
  }
  const hasPrev = index > 0;
  const hasNext = index < shorts.length - 1 || feed.hasNextPage;

  const handleWheel = (e: React.WheelEvent) => {
    const target = e.target as HTMLElement;
    const isMenu = target.closest("[role='menu'], .vds-menu-items") !== null;
    if (!isMenu) onWheel(e.deltaY);
  };

  const handleTouchStart = (clientY: number | null, target: EventTarget | null) => {
    onTouchStart(clientY, target);
  };

  const handleTouchEnd = (clientY: number | null, target: EventTarget | null) => {
    onTouchEnd(clientY, target);
  };

  return (
    <ShortsPlayerStage
      key={active.id}
      sectionClass={sectionClass}
      playerRef={playerRef}
      commentsOpen={commentsOpen}
      active={active}
      current={current}
      stream={stream}
      streamLoading={streamLoading}
      streamError={streamError}
      errorMessage={errorMessage}
      isMemberOnlyShort={isMemberOnlyShort}
      youtubeSessionAction={youtubeSessionAction ?? undefined}
      youtubeSessionReturnTo={
        youtubeSessionAction
          ? youtubeSessionReturnToForShorts(toPublicWatchParam(activeId))
          : undefined
      }
      hasPrev={hasPrev}
      hasNext={hasNext}
      settingsReady={settingsReady}
      autoplay={settings.autoplay}
      initialVolume={settings.volume}
      initialMuted={settings.muted}
      defaultQuality={settings.defaultQuality}
      defaultPlaybackSpeed={settings.defaultPlaybackSpeed}
      defaultAudioLanguage={settings.defaultAudioLanguage || undefined}
      preferOriginalLanguage={settings.preferOriginalLanguage}
      originalAudioTrackId={originalAudioTrackId}
      preferredDefaultAudioTrackId={preferredDefaultAudioTrackId}
      originalAudioLocale={originalAudioLocale}
      defaultSubtitleLanguage={settings.defaultSubtitleLanguage || undefined}
      subtitlesEnabled={settings.subtitlesEnabled}
      showComments={!settings.hideComments}
      onOpenComments={() => setCommentsOpen(true)}
      onCloseComments={() => setCommentsOpen(false)}
      onRetry={retry}
      onNext={() => moveBy(1, "user")}
      onAutoNext={handleAutoNext}
      onPrev={() => moveBy(-1, "user")}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onVolumeChange={onVolumeChange}
    />
  );
}
