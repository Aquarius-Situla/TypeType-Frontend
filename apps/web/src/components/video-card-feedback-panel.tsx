import { useState } from "react";
import { useAuth } from "../hooks/use-auth";
import { useBlocked } from "../hooks/use-blocked";
import { useBlockedFilter } from "../hooks/use-blocked-filter";
import { usePlaybackQueueActions } from "../hooks/use-playback-queue-actions";
import { useProgress, useSaveProgress } from "../hooks/use-progress";
import { useWatchLaterPlaylist } from "../hooks/use-watch-later-playlist";
import { goto } from "../lib/route-redirect";
import { videoProgressUrl } from "../lib/video-progress";
import { watchLaterResultLabel } from "../lib/watch-later-labels";
import { toWatchLaterPayload } from "../lib/watch-later-mappers";
import { isVideoWatched } from "../lib/watch-progress";
import { m } from "../paraglide/messages.js";
import type { VideoStream } from "../types/stream";
import { PlaylistAddDropdown } from "./playlist-add-dropdown";
import { VideoBlockActionsDropdown } from "./video-block-actions-dropdown";

type Props = {
  stream: VideoStream;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onSaved: (message: string) => void;
};

export function VideoCardFeedbackPanel({ stream, anchorEl, onClose, onSaved }: Props) {
  const { isAuthed } = useAuth();
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const watchLater = useWatchLaterPlaylist();
  const queueVideo = usePlaybackQueueActions();
  const { addChannel, removeChannel, addVideo, removeVideo } = useBlocked();
  const { findBlockedChannel, findBlockedVideo } = useBlockedFilter();
  const blockedChannel = findBlockedChannel({
    url: stream.channelUrl,
    name: stream.channelName,
  });
  const blockedVideo = findBlockedVideo(stream);
  const channelBlocked = blockedChannel !== undefined;
  const videoBlocked = blockedVideo !== undefined;
  const progressUrl = videoProgressUrl(stream);
  const progress = useProgress(progressUrl);
  const saveProgress = useSaveProgress(progressUrl);
  const canMarkWatched = !stream.isLive && stream.duration > 0;
  const watched = isVideoWatched((progress.data?.position ?? 0) / 1_000, stream.duration);

  function requireAuth(): boolean {
    if (isAuthed) return false;
    goto("/");
    return true;
  }

  function toggleVideoBlock() {
    if (requireAuth()) return;
    if (videoBlocked) {
      removeVideo.mutate(blockedVideo?.url ?? stream.id);
      return;
    }
    addVideo.mutate({ url: stream.id, global: false });
  }

  function toggleChannelBlock() {
    if (!stream.channelUrl || requireAuth()) return;
    if (channelBlocked) {
      removeChannel.mutate(blockedChannel?.url ?? stream.channelUrl);
      return;
    }
    addChannel.mutate({
      url: stream.channelUrl,
      name: stream.channelName,
      thumbnailUrl: stream.channelAvatar,
      global: false,
    });
  }

  function openPlaylist() {
    if (requireAuth()) return;
    setPlaylistOpen(true);
  }

  function toggleWatched() {
    saveProgress.mutate({ position: watched ? 0 : stream.duration * 1_000, keepalive: false });
    onSaved(watched ? m.ui_marked_as_unwatched() : m.ui_marked_as_watched());
  }

  async function toggleWatchLater() {
    if (requireAuth()) return;
    try {
      const saved = await watchLater.toggle(toWatchLaterPayload(stream));
      onSaved(watchLaterResultLabel(saved));
    } catch {
      onSaved(m.ui_watch_later_update_failed());
    }
  }

  return (
    <>
      {playlistOpen ? (
        <PlaylistAddDropdown
          stream={stream}
          anchorEl={anchorEl}
          onClose={onClose}
          onSaved={onSaved}
        />
      ) : (
        <VideoBlockActionsDropdown
          anchorEl={anchorEl}
          onClose={onClose}
          onPlayNext={() => onSaved(queueVideo(stream, true))}
          onAddToQueue={() => onSaved(queueVideo(stream, false))}
          onToggleWatchLater={() => void toggleWatchLater()}
          onToggleWatched={canMarkWatched ? toggleWatched : undefined}
          onSaveToPlaylist={openPlaylist}
          onToggleVideoBlock={toggleVideoBlock}
          onToggleChannelBlock={stream.channelUrl ? toggleChannelBlock : undefined}
          watchLaterSaved={watchLater.isInWatchLater(stream.id)}
          watchLaterPending={watchLater.isPending}
          watched={watched}
          videoBlocked={videoBlocked}
          channelBlocked={channelBlocked}
        />
      )}
    </>
  );
}
