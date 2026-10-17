import { useCallback, useMemo } from "react";
import {
  type BlockableVideo,
  type BlockedChannelIdentity,
  createBlockedContentMatcher,
} from "../lib/blocked-content";
import {
  filterMembersOnlyContent,
  filterShortFormContent,
  isMembersOnlyContentHidden,
  isShortFormContentHidden,
} from "../lib/video-visibility";
import type { ChannelResultItem } from "../types/api";
import type { PublicPlaylistInfo } from "../types/playlist";
import { useAuth } from "./use-auth";
import { useBlocked } from "./use-blocked";
import { useSettings } from "./use-settings";

export function useBlockedFilter() {
  const { isAuthed } = useAuth();
  const { channels, videos, keywords } = useBlocked();
  const { settings, settingsReady } = useSettings();

  const matcher = useMemo(
    () =>
      createBlockedContentMatcher(
        isAuthed ? (channels.data ?? []) : [],
        isAuthed ? (videos.data ?? []) : [],
        isAuthed ? (keywords.data ?? []).map((item) => item.keyword) : [],
      ),
    [channels.data, isAuthed, keywords.data, videos.data],
  );

  const isBlocked = useCallback(
    (stream: BlockableVideo): boolean => matcher.isVideoBlocked(stream),
    [matcher],
  );

  const filter = useCallback(
    <T extends BlockableVideo>(streams: T[]): T[] =>
      filterShortFormContent(
        filterMembersOnlyContent(matcher.filterVideos(streams), settings.hideMembersOnlyContent),
        settings.hideShorts,
      ),
    [matcher, settings.hideMembersOnlyContent, settings.hideShorts],
  );

  const isHidden = useCallback(
    (stream: BlockableVideo): boolean =>
      matcher.isVideoBlocked(stream) ||
      isMembersOnlyContentHidden(stream, settings.hideMembersOnlyContent) ||
      isShortFormContentHidden(stream, settings.hideShorts),
    [matcher, settings.hideMembersOnlyContent, settings.hideShorts],
  );

  const isChannelIdentityBlocked = useCallback(
    (channel: BlockedChannelIdentity): boolean => matcher.isChannelBlocked(channel),
    [matcher],
  );

  const findBlockedChannel = useCallback(
    (channel: BlockedChannelIdentity) => matcher.findBlockedChannel(channel),
    [matcher],
  );

  const isChannelBlocked = useCallback(
    (channel: ChannelResultItem): boolean => isChannelIdentityBlocked(channel),
    [isChannelIdentityBlocked],
  );

  const isVideoExplicitlyBlocked = useCallback(
    (video: Pick<BlockableVideo, "id" | "url">): boolean => matcher.isVideoExplicitlyBlocked(video),
    [matcher],
  );

  const findBlockedVideo = useCallback(
    (video: Pick<BlockableVideo, "id" | "url">) => matcher.findBlockedVideo(video),
    [matcher],
  );

  const isPlaylistBlocked = useCallback(
    (playlist: PublicPlaylistInfo): boolean => {
      return isChannelIdentityBlocked({ name: playlist.uploaderName });
    },
    [isChannelIdentityBlocked],
  );

  return {
    filter,
    findBlockedChannel,
    findBlockedVideo,
    isBlocked,
    isHidden,
    isChannelBlocked,
    isChannelIdentityBlocked,
    isPlaylistBlocked,
    isVideoExplicitlyBlocked,
    blockedChannelUrls: matcher.channelUrls,
    blockedKeywords: matcher.normalizedKeywords,
    blockedVideoUrls: matcher.videoUrls,
    ready: settingsReady && channels.isSuccess && videos.isSuccess && keywords.isSuccess,
  };
}
