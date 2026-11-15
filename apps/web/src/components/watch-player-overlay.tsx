import type { RefObject } from "react";
import { getOriginalAudioTrackId, getPreferredDefaultAudioTrackId } from "../lib/audio-track";
import { usePlayerMedia } from "../lib/player-media";
import type { BulletCommentItem } from "../types/api";
import type { VideoStream } from "../types/stream";
import type { SettingsItem } from "../types/user";
import { DanmakuAirdropPrompt } from "./danmaku-airdrop-prompt";
import { DanmakuOverlay } from "./danmaku-overlay";
import { EndScreenOverlay } from "./end-screen-overlay";
import { VideoJsWatchDefaults } from "./videojs-watch-defaults";
import { WatchPlayerDefaults } from "./watch-player-defaults";

type Props = {
  canLoadBulletComments: boolean;
  hideComments: boolean;
  bulletCommentsOn: boolean;
  bulletComments: BulletCommentItem[] | undefined;
  positionRef: RefObject<number>;
  stream: VideoStream;
  settings: SettingsItem;
  qualityFailed: boolean;
  originalAudioLocale: string | null;
  onOriginalLanguageUnavailable: () => void;
};

export function WatchPlayerOverlay({
  canLoadBulletComments,
  hideComments,
  bulletCommentsOn,
  bulletComments,
  positionRef,
  stream,
  settings,
  qualityFailed,
  originalAudioLocale,
  onOriginalLanguageUnavailable,
}: Props) {
  const { engine } = usePlayerMedia();
  const defaults = {
    settings,
    qualityFailed,
    onOriginalLanguageUnavailable,
    originalAudioTrackId: getOriginalAudioTrackId(stream),
    preferredDefaultAudioTrackId: getPreferredDefaultAudioTrackId(stream),
    originalAudioLocale,
  };
  return (
    <>
      {canLoadBulletComments && !hideComments && bulletCommentsOn && bulletComments && (
        <>
          <DanmakuOverlay comments={bulletComments} positionRef={positionRef} />
          <DanmakuAirdropPrompt comments={bulletComments} />
        </>
      )}
      {!settings.hideEndScreens && stream.endScreenElements && (
        <EndScreenOverlay elements={stream.endScreenElements} />
      )}
      {engine === "videojs" ? (
        <VideoJsWatchDefaults {...defaults} />
      ) : (
        <WatchPlayerDefaults {...defaults} />
      )}
    </>
  );
}
