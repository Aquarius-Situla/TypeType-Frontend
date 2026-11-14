import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useSettings } from "../hooks/use-settings";
import { allowHideEverything } from "../lib/hide-everything";
import { m } from "../paraglide/messages.js";
import type { SettingsItem } from "../types/user";
import { HideEverythingToggle } from "./hide-everything-toggle";
import { SettingsDeArrowOptions } from "./settings-dearrow-options";
import { ROW, ToggleSwitch } from "./settings-toggle-switch";

const HIDE_KEYS = [
  "hideContinueWatching",
  "hideHomeRecommendations",
  "hideRelatedVideos",
  "hideEndScreens",
  "hideComments",
  "hideShorts",
  "hideSubscriptionLiveStreams",
  "hideMembersOnlyContent",
] as const;

function useHideEverythingTrigger() {
  const { settings } = useSettings();
  const navigate = useNavigate();
  const allHidden = HIDE_KEYS.every((key) => settings[key]);
  const wasAllHidden = useRef(allHidden);
  useEffect(() => {
    if (allHidden && !wasAllHidden.current) {
      allowHideEverything();
      navigate({ to: "/hide-everything" });
    }
    wasAllHidden.current = allHidden;
  }, [allHidden, navigate]);
}

type ToggleKey = Extract<
  keyof SettingsItem,
  | "autoplay"
  | "autoplayOnOpen"
  | "deArrowEnabled"
  | "hideContinueWatching"
  | "hideHomeRecommendations"
  | "hideRelatedVideos"
  | "hideEndScreens"
  | "hideComments"
  | "hideShorts"
  | "hideSubscriptionLiveStreams"
  | "hideMembersOnlyContent"
>;

type ToggleOption = {
  key: ToggleKey;
  label: string;
  description: string;
  area?: string;
};

function watchOptions(): ToggleOption[] {
  return [
    {
      key: "autoplay",
      label: m.ui_autoplay_next_video(),
      description: m.ui_automatically_continue_with_the_first_item_in_the_suggestions_column(),
    },
    {
      key: "autoplayOnOpen",
      label: m.ui_autoplay_on_open(),
      description: m.ui_automatically_start_playback_when_a_video_is_opened(),
    },
  ];
}

function discoveryOptions(): ToggleOption[] {
  return [
    {
      key: "deArrowEnabled",
      label: m.ui_dearrow_titles_and_thumbnails(),
      description: m.ui_use_community_written_titles_and_representative_thumbnails_for_youtub(),
      area: "YouTube",
    },
    {
      key: "hideContinueWatching",
      label: m.ui_continue_watching(),
      description: m.ui_hide_in_progress_videos_from_the_home_page(),
      area: m.nav_home(),
    },
    {
      key: "hideHomeRecommendations",
      label: m.ui_home_recommendations(),
      description: m.ui_hide_personalized_recommendations_from_the_home_page(),
      area: m.nav_home(),
    },
    {
      key: "hideRelatedVideos",
      label: m.ui_related_videos(),
      description: m.ui_hide_the_suggestions_column_on_watch_pages(),
      area: m.ui_watch_page(),
    },
    {
      key: "hideEndScreens",
      label: m.ui_end_screens(),
      description: m.ui_hide_the_creator_cards_shown_at_the_end_of_youtube_videos(),
      area: m.ui_watch_page(),
    },
    {
      key: "hideComments",
      label: m.ui_comments_and_danmaku(),
      description: m.ui_stop_loading_watch_comments_shorts_comments_and_bullet_comments(),
      area: m.ui_watch_and_shorts(),
    },
    {
      key: "hideShorts",
      label: m.ui_shorts_surface(),
      description: m.ui_hide_shorts_navigation_and_block_the_shorts_page(),
      area: m.nav_shorts(),
    },
    {
      key: "hideSubscriptionLiveStreams",
      label: m.ui_live_streams(),
      description: m.ui_hide_active_and_scheduled_live_streams_from_the_subscriptions_feed(),
      area: m.nav_subscriptions(),
    },
    {
      key: "hideMembersOnlyContent",
      label: m.ui_members_only_videos(),
      description: m.ui_hide_videos_that_require_a_paid_youtube_channel_membership(),
      area: m.ui_discovery_surfaces(),
    },
  ];
}

function ToggleRows({ options }: { options: ToggleOption[] }) {
  const { settings, update } = useSettings();
  return options.map((option) => (
    <div key={option.key} className={ROW}>
      <div className="typetype-adaptive-label flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-fg text-sm">{option.label}</span>
          {option.area && <span className="text-[10px] uppercase text-fg-soft">{option.area}</span>}
        </div>
        <span className="text-fg-soft text-xs">{option.description}</span>
      </div>
      <ToggleSwitch
        checked={settings[option.key]}
        onClick={() => update.mutate({ [option.key]: !settings[option.key] })}
      />
    </div>
  ));
}

export function SettingsWatchToggles() {
  useHideEverythingTrigger();
  return (
    <>
      <div className="py-2 font-medium text-[11px] text-fg-soft uppercase tracking-wider">
        {m.ui_watch_page()}
      </div>
      <ToggleRows options={watchOptions()} />
    </>
  );
}

export function SettingsDiscoveryToggles() {
  useHideEverythingTrigger();
  return (
    <>
      <div className="py-2 font-medium text-[11px] text-fg-soft uppercase tracking-wider">
        {m.ui_discovery_surfaces()}
      </div>
      <ToggleRows options={discoveryOptions()} />
      <SettingsDeArrowOptions />
      <HideEverythingToggle />
    </>
  );
}
