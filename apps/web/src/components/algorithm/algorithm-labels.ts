import {
  Ban,
  Bell,
  Clapperboard,
  Compass,
  Database,
  Dices,
  Heart,
  Hourglass,
  Inbox,
  LayoutList,
  ListVideo,
  type LucideIcon,
  Radar,
  Scale,
  SlidersHorizontal,
  ThumbsDown,
  Tv,
} from "lucide-react";
import { m } from "../../paraglide/messages.js";
import { getLocale } from "../../paraglide/runtime.js";

type Text = () => string;

const DATA_LABEL: Record<string, Text> = {
  history: m.algo_cat_history,
  shorts_history: m.algo_cat_shorts_history,
  events: m.algo_cat_events,
  search: m.algo_cat_search,
  favorites: m.algo_cat_favorites,
  watch_later: m.algo_cat_watch_later,
  subscriptions: m.algo_cat_subscriptions,
  blocked: m.algo_cat_blocked,
  not_interested: m.algo_cat_not_interested,
  shown: m.algo_cat_shown,
};

const DATA_ICON: Record<string, LucideIcon> = {
  history: Tv,
  shorts_history: Clapperboard,
  favorites: Heart,
  subscriptions: Bell,
  blocked: Ban,
  not_interested: ThumbsDown,
};

const DROP_LABEL: Record<string, (inputs: { count: number }) => string> = {
  seen: m.algo_drop_seen,
  blocked: m.algo_drop_blocked,
  channel_cap: m.algo_drop_channel_cap,
  muted: m.algo_drop_muted,
  excluded: m.algo_drop_excluded,
  not_interested: m.algo_drop_not_interested,
  short: m.algo_drop_short,
  obscure: m.algo_drop_obscure,
};

const GROUP_TEXT: Record<string, { label: Text; help: Text; icon: LucideIcon }> = {
  sources: { label: m.algo_group_sources, help: m.algo_group_sources_help, icon: Inbox },
  weights: { label: m.algo_group_weights, help: m.algo_group_weights_help, icon: Scale },
  decay: { label: m.algo_group_decay, help: m.algo_group_decay_help, icon: Hourglass },
  rows: { label: m.algo_group_rows, help: m.algo_group_rows_help, icon: LayoutList },
  exploration: {
    label: m.algo_group_exploration,
    help: m.algo_group_exploration_help,
    icon: Compass,
  },
  randomness: { label: m.algo_group_randomness, help: m.algo_group_randomness_help, icon: Dices },
};

const REASON_LABEL: Record<string, Text> = {
  watched: m.algo_part_recent,
  same_channel: m.algo_part_recent,
  continue: m.algo_part_continue,
  watch_again: m.algo_part_watch_again,
  subscriptions: m.algo_part_subscriptions,
  new_from_subscriptions: m.algo_part_subscriptions,
  topic: m.algo_part_topics,
  discovery: m.algo_part_discovery,
  trending: m.algo_part_trending,
  recommended: m.algo_part_recommended,
};

export function dataLabel(id: string): string {
  return DATA_LABEL[id]?.() ?? id;
}

export function dataIcon(id: string): LucideIcon {
  return DATA_ICON[id] ?? Database;
}

export function dropLabel(why: string, count: number): string {
  return DROP_LABEL[why]?.({ count }) ?? `${count} ${why}`;
}

export function ago(at: number): string {
  const hours = Math.max(0, Math.round((Date.now() - at) / 3_600_000));
  if (at <= 0) return "";
  if (hours < 1) return m.algo_ago_now();
  if (hours < 48) return m.algo_ago_hours({ hours });
  return m.algo_ago_days({ days: Math.round(hours / 24) });
}

export function retentionShort(days: number | null): string {
  if (days === null) return m.algo_retention_forever();
  if (days === 365) return m.algo_retention_year();
  if (days >= 180) return m.algo_retention_months({ months: Math.round(days / 30) });
  return m.algo_retention_days_short({ days });
}

export function itemCount(count: number): string {
  const value = formatNumber(count);
  return isOne(count) ? m.algo_count_one({ count: value }) : m.algo_count({ count: value });
}

export function groupText(id: string): { label: string; help: string; icon: LucideIcon } {
  const known = GROUP_TEXT[id];
  return known
    ? { label: known.label(), help: known.help(), icon: known.icon }
    : { label: id, help: "", icon: SlidersHorizontal };
}

export function reasonLabel(kind: string): string {
  return REASON_LABEL[kind]?.() ?? m.algo_part_recommended();
}

export function algorithmIcon(algorithm: { uses: string[]; sources: string[] }): LucideIcon {
  if (algorithm.uses.includes("history")) return Radar;
  if (algorithm.sources.includes("trending")) return Compass;
  if (algorithm.uses.includes("subscriptions")) return Bell;
  return ListVideo;
}

export const LEVEL_LABEL: Text[] = [
  m.algo_level_none,
  m.algo_level_low,
  m.algo_level_medium,
  m.algo_level_high,
];

function isOne(count: number): boolean {
  return new Intl.PluralRules(getLocale()).select(count) === "one";
}

export function settingsCount(count: number): string {
  return isOne(count) ? m.algo_settings_count_one({ count }) : m.algo_settings_count({ count });
}

export function changedCount(count: number): string {
  return isOne(count) ? m.algo_changed_count_one({ count }) : m.algo_changed_count({ count });
}

export function basedOn(count: number): string {
  return isOne(count) ? m.algo_based_on_one({ count }) : m.algo_based_on({ count });
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat(getLocale(), { maximumFractionDigits: 2 }).format(value);
}

export function formatPercent(share: number): string {
  return new Intl.NumberFormat(getLocale(), { style: "percent", maximumFractionDigits: 0 }).format(
    share,
  );
}
