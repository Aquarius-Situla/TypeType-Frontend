import type { SettingsSearchEntry } from "../lib/settings-search";
import type { SettingsSection } from "../lib/settings-section";
import { m } from "../paraglide/messages.js";
import { discoveryOptions, watchOptions } from "./settings-content-toggles";

type Row = { title: string; detail?: string };
type SectionLabel = { key: SettingsSection; label: string; description: string };

// The settings each section shows, by the same messages its rows use. A new setting needs its line here to be found.
function sectionRows(): Record<SettingsSection, Row[]> {
  const toggles = (options: ReturnType<typeof watchOptions>) =>
    options.map((option) => ({ title: option.label, detail: option.description }));
  return {
    playback: [
      { title: m.settings_player_engine_label() },
      { title: m.watch_autoplay() },
      { title: m.ui_autoplay_countdown() },
      { title: m.ui_skip_playlist_autoplay_screen() },
      { title: m.ui_hide_upcoming_playlist_videos() },
      { title: m.ui_audio_only_playback() },
      { title: m.ui_ambient_light(), detail: m.ui_ambient_light_description() },
      { title: m.ui_default_playback_speed() },
      { title: m.ui_hold_playback_speed(), detail: m.ui_hold_playback_speed_description() },
      { title: m.ui_default_quality() },
      { title: m.settings_bilibili_buffer_label() },
      { title: m.settings_watched_threshold_title() },
    ],
    video: [{ title: m.ui_sponsorblock_behavior() }, ...toggles(watchOptions())],
    home: [
      { title: m.ui_default_landing_page() },
      {
        title: m.settings_layout_video_grid_columns(),
        detail: m.settings_layout_video_grid_columns_description(),
      },
      { title: m.settings_layout_theme_label() },
      {
        title: m.settings_layout_related_video_size(),
        detail: m.settings_layout_related_video_size_description(),
      },
      { title: m.settings_player_color_label() },
      { title: m.settings_seekbar_icon_label() },
      ...toggles(discoveryOptions()),
      { title: m.ui_titles(), detail: m.ui_dearrow_titles() },
      { title: m.ui_thumbnails(), detail: m.ui_dearrow_thumbnails() },
      { title: m.ui_confidence(), detail: m.ui_dearrow_confidence() },
    ],
    language: [
      { title: m.settings_ui_language_label() },
      { title: m.settings_subtitle_default_label() },
      { title: m.settings_subtitle_language_label() },
      { title: m.settings_audio_language_label() },
      { title: m.settings_original_audio_label() },
    ],
    service: [{ title: m.ui_default_service() }],
    notifications: [{ title: m.ui_notification_popups() }],
    import: [
      { title: m.ui_typetype_backup() },
      { title: m.ui_move_data_between_supported_apps() },
      { title: m.data_portability_title() },
    ],
    api: [{ title: m.presence_title() }],
    privacy: [
      { title: m.ui_watch_history_tracking() },
      { title: m.portability_category_history() },
      { title: m.portability_category_search_history() },
    ],
    blocked: [
      { title: m.ui_blocked_keywords() },
      { title: m.ui_blocked_channels() },
      { title: m.ui_blocked_videos() },
    ],
    focus: [
      { title: m.focus_group() },
      { title: m.focus_study_group() },
      { title: m.focus_strict_blocking() },
      { title: m.focus_transition() },
      { title: m.focus_archive() },
      { title: m.focus_schedule() },
      { title: m.focus_grayscale_thumbnails() },
    ],
    rss: [{ title: m.ui_private_rss_link() }],
    about: [],
  };
}

export function settingsSearchEntries(
  sections: SectionLabel[],
): SettingsSearchEntry<SettingsSection>[] {
  const rows = sectionRows();
  return sections.flatMap((section) => [
    {
      section: section.key,
      sectionLabel: section.label,
      title: section.label,
      detail: section.description,
    },
    ...rows[section.key].map((row) => ({
      section: section.key,
      sectionLabel: section.label,
      title: row.title,
      detail: row.detail ?? "",
    })),
  ]);
}
