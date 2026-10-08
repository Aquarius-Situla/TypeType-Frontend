import { useRef, useState } from "react";
import { useAuth } from "../hooks/use-auth";
import { useFavoriteStatus } from "../hooks/use-favorite-status";
import { useInterfaceLocale } from "../hooks/use-interface-locale";
import { useShareUrl } from "../hooks/use-share-url";
import type { WatchAudioOnlyControls } from "../hooks/use-watch-audio-only-playback";
import { prepareAudioSpectrum } from "../lib/audio-spectrum";
import { detectProvider, supportsBulletComments } from "../lib/provider";
import { goto } from "../lib/route-redirect";
import { toPublicWatchUrl } from "../lib/watch-url";
import { m } from "../paraglide/messages.js";
import { useB2YStore } from "../stores/b2y-store";
import type { VideoStream } from "../types/stream";
import { B2YModal } from "./b2y-modal";
import { DanmakuControls } from "./danmaku-controls";
import { DownloadSheet } from "./download-sheet";
import { PlaylistAddDropdown } from "./playlist-add-dropdown";
import { ReportBugModal } from "./report-bug-modal";
import { ShareSheet } from "./share-sheet";
import { Toast } from "./toast";
import { WatchActionButton } from "./watch-action-button";
import {
  BugIcon,
  DownloadIcon,
  HeadphonesIcon,
  ListPlusIcon,
  ShareIcon,
  StarIcon,
} from "./watch-icons";
import { WatchMoreActions } from "./watch-more-actions";

type Props = {
  stream: VideoStream;
  audioOnly: WatchAudioOnlyControls;
};
export function WatchActions({ stream, audioOnly }: Props) {
  const { locale } = useInterfaceLocale();
  const { copied, share } = useShareUrl();
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [b2yOpen, setB2yOpen] = useState(false);
  const [toastLabel, setToastLabel] = useState<string | null>(null);
  const saveAnchorRef = useRef<HTMLButtonElement>(null);
  const shareAnchorRef = useRef<HTMLButtonElement>(null);
  const b2yLink = useB2YStore((s) => s.links[stream.id]);
  const { authReady, isAuthed } = useAuth();
  const {
    add: addFavorite,
    remove: removeFavorite,
    isFavorite: favorited,
    isPending: favPending,
  } = useFavoriteStatus(stream.id);
  const isLive = stream.streamType === "live_stream" || stream.streamType === "audio_live_stream";
  const audioOnlyAvailable = !isLive;
  const audioOnlyDisabled = !authReady || audioOnly.loading;

  function handleSaved(label: string) {
    setToastLabel(label);
    setTimeout(() => setToastLabel(null), 2000);
  }
  async function handleFavorite() {
    if (!isAuthed) {
      goto("/");
      return;
    }
    if (favorited) {
      await removeFavorite();
      handleSaved(m.watch_removed_favorites({}, { locale }));
    } else {
      await addFavorite();
      handleSaved(m.watch_saved_favorites({}, { locale }));
    }
  }

  function handleDownloadMock() {
    setDownloadOpen(true);
  }

  function handleAudioOnly() {
    if (!audioOnly.active) prepareAudioSpectrum();
    audioOnly.onToggle();
  }

  const showSave = true;
  const showReport = true;
  const isYouTube = detectProvider(stream.id) === "youtube";
  const showDanmaku = supportsBulletComments(stream.id) || Boolean(b2yLink);
  const showB2Y = isYouTube || Boolean(b2yLink);

  return (
    <div className="flex items-center gap-1 flex-wrap">
      <WatchActionButton
        onClick={handleFavorite}
        disabled={favPending || !isAuthed}
        pressed={favorited}
        active={favorited}
      >
        <StarIcon filled={favorited} />
        <span className="typetype-adaptive-label">
          {favPending
            ? m.watch_saving({}, { locale })
            : favorited
              ? m.watch_favorited({}, { locale })
              : m.watch_favorite({}, { locale })}
        </span>
      </WatchActionButton>
      <WatchActionButton onClick={handleDownloadMock}>
        <DownloadIcon />
        <span className="typetype-adaptive-label">{m.watch_download({}, { locale })}</span>
      </WatchActionButton>
      {audioOnlyAvailable && (
        <WatchActionButton
          onClick={handleAudioOnly}
          disabled={audioOnlyDisabled}
          pressed={audioOnly.active}
          active={audioOnly.active}
        >
          <HeadphonesIcon />
          <span className="typetype-adaptive-label">
            {audioOnly.loading
              ? m.watch_audio_loading({}, { locale })
              : m.watch_audio_only({}, { locale })}
          </span>
        </WatchActionButton>
      )}
      <WatchActionButton buttonRef={shareAnchorRef} onClick={() => setShareOpen(true)}>
        <ShareIcon />
        <span className="typetype-adaptive-label">{m.watch_share({}, { locale })}</span>
      </WatchActionButton>
      <Toast message={copied ? m.watch_link_copied({}, { locale }) : toastLabel} />
      {shareOpen && (
        <ShareSheet
          anchorEl={shareAnchorRef.current}
          sourceUrl={stream.id}
          typetypeUrl={toPublicWatchUrl(stream.id, window.location.origin)}
          title={stream.title}
          onShare={(url, title) => void share(url, title)}
          onClose={() => setShareOpen(false)}
        />
      )}
      {showSave && (
        <button
          ref={saveAnchorRef}
          type="button"
          onClick={() => setPlaylistOpen((o) => !o)}
          disabled={!isAuthed}
          className={`typetype-adaptive-control inline-flex min-h-8 min-w-0 max-w-full flex-wrap items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-center text-sm leading-tight transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            playlistOpen
              ? "text-fg bg-surface-strong"
              : "text-fg-muted hover:text-fg hover:bg-surface-strong"
          }`}
        >
          <ListPlusIcon />
          <span className="typetype-adaptive-label">{m.watch_save({}, { locale })}</span>
        </button>
      )}
      <WatchMoreActions
        stream={stream}
        isAuthed={isAuthed}
        onSaved={handleSaved}
        className="typetype-adaptive-control inline-flex min-h-8 min-w-0 max-w-full flex-wrap items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-center text-sm leading-tight text-fg-muted transition-colors hover:bg-surface-strong hover:text-fg"
      />
      {showB2Y && (
        <WatchActionButton
          onClick={() => setB2yOpen(true)}
          pressed={Boolean(b2yLink)}
          active={Boolean(b2yLink)}
        >
          <span className="text-xs font-bold text-pink-500">B2Y</span>
          <span className="typetype-adaptive-label">
            {b2yLink ? "B2Y 弹幕 (已联动)" : "B2Y 弹幕"}
          </span>
        </WatchActionButton>
      )}
      {showDanmaku && <DanmakuControls />}
      {showReport && isAuthed && (
        <WatchActionButton onClick={() => setReportOpen(true)}>
          <BugIcon />
          <span className="typetype-adaptive-label">{m.watch_report({}, { locale })}</span>
        </WatchActionButton>
      )}
      {playlistOpen && (
        <PlaylistAddDropdown
          stream={stream}
          anchorEl={saveAnchorRef.current}
          onClose={() => setPlaylistOpen(false)}
          onSaved={handleSaved}
        />
      )}
      {downloadOpen && (
        <DownloadSheet
          stream={stream}
          onClose={() => setDownloadOpen(false)}
          onDone={(message) => handleSaved(message)}
        />
      )}
      {reportOpen && <ReportBugModal videoUrl={stream.id} onClose={() => setReportOpen(false)} />}
      {b2yOpen && (
        <B2YModal
          isOpen={b2yOpen}
          onClose={() => setB2yOpen(false)}
          streamId={stream.id}
          streamTitle={stream.title}
          onSuccessToast={handleSaved}
        />
      )}
    </div>
  );
}
