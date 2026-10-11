import { Clock, Tags, Users } from "lucide-react";
import { useState } from "react";
import type { Recommender } from "../../hooks/use-recommender";
import { proxyImage } from "../../lib/proxy";
import { m } from "../../paraglide/messages.js";
import { useAlgorithmHighlightStore } from "../../stores/algorithm-highlight-store";
import type { ProfileChannel } from "../../types/recommender";
import { ChannelAvatar } from "../channel-avatar";
import { AlgorithmAddInterest } from "./algorithm-add-interest";
import { AlgorithmChannelModal } from "./algorithm-channel-modal";
import { TEXT_ACTION } from "./algorithm-classes";
import { Group } from "./algorithm-group";
import { AlgorithmInterestRow } from "./algorithm-interest-row";
import { Row } from "./algorithm-row";
import { SectionLabel } from "./algorithm-section-label";
import { Unavailable } from "./algorithm-unavailable";

const MINUTE_MS = 60_000;
const INTERESTS_SHOWN = 12;

export function AlgorithmProfile({ recommender }: { recommender: Recommender }) {
  const { profile, profileLoading, settings, toggleIgnored, forgetRecent } = recommender;
  const highlight = useAlgorithmHighlightStore((state) => state.highlight);
  const [selected, setSelected] = useState<ProfileChannel | null>(null);
  const [allInterests, setAllInterests] = useState(false);
  if (!settings.enabled) {
    return <p className="px-1 text-sm leading-6 text-fg-muted">{m.algo_overview_off()}</p>;
  }
  if (!profile) {
    if (profileLoading)
      return <p className="px-1 text-sm leading-6 text-fg-muted">{m.ui_loading()}</p>;
    return (
      <Unavailable onRetry={recommender.retryProfile} retrying={recommender.profileRetrying} />
    );
  }
  const ignored = (id: string) => settings.ignoredSignals.includes(id);
  const kept = (id: string) =>
    id.startsWith("custom:") ||
    settings.pinnedGroups.includes(id) ||
    settings.mutedGroups.includes(id) ||
    highlight === id;
  const ranked = [...profile.groups].sort((a, b) => b.weight - a.weight);
  const interests = allInterests
    ? ranked
    : ranked.filter((group, index) => index < INTERESTS_SHOWN || kept(group.id));
  const hiddenInterests = ranked.length - interests.length;

  return (
    <div className="flex flex-col gap-8">
      <Group label={m.algo_interests_label()} icon={Tags} help={m.algo_help_interests()}>
        <AlgorithmAddInterest recommender={recommender} />
        {profile.groups.length === 0 && (
          <p className="py-3 text-xs text-fg-soft">{m.algo_profile_empty()}</p>
        )}
        {interests.map((group) => (
          <AlgorithmInterestRow key={group.id} group={group} recommender={recommender} />
        ))}
        {hiddenInterests > 0 && (
          <div className="py-3">
            <button type="button" onClick={() => setAllInterests(true)} className={TEXT_ACTION}>
              {m.algo_interests_more({ count: hiddenInterests })}
            </button>
          </div>
        )}
      </Group>

      {profile.channels.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionLabel
            label={m.algo_channels_label()}
            icon={Users}
            help={m.algo_help_channels()}
            className="min-h-7"
          />
          <div className="flex flex-wrap gap-3 px-1">
            {profile.channels.map((channel) => (
              <button
                key={channel.id}
                type="button"
                onClick={() => setSelected(channel)}
                className={`flex w-24 flex-col items-center gap-1.5 rounded-md focus:outline-none focus:ring-2 focus:ring-border-strong ${ignored(channel.id) ? "opacity-40" : ""}`}
              >
                <ChannelAvatar
                  src={channel.avatarUrl ? proxyImage(channel.avatarUrl) : ""}
                  pending={false}
                  name={channel.name}
                  className="h-12 w-12 opacity-80 transition-opacity hover:opacity-100"
                />
                <span className="w-full truncate text-center text-xs text-fg-muted">
                  {channel.name}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      <Group label={m.algo_recent_label()} icon={Clock} help={m.algo_help_recent()}>
        {profile.session_boosts.length === 0 && (
          <p className="py-3 text-xs text-fg-soft">{m.algo_recent_empty()}</p>
        )}
        {profile.session_boosts.map((boost) => {
          const minutes = Math.max(0, Math.round((boost.expires_at - Date.now()) / MINUTE_MS));
          return (
            <Row
              key={boost.ref}
              label={boost.label}
              description={minutes > 0 ? m.algo_counts_for({ minutes }) : m.algo_no_longer_counts()}
            />
          );
        })}
        {profile.session_boosts.length > 0 && (
          <Row label={m.algo_forget_recent()} description={m.algo_forget_recent_description()}>
            <button type="button" onClick={forgetRecent} className={TEXT_ACTION}>
              {m.algo_forget()}
            </button>
          </Row>
        )}
      </Group>

      {selected && (
        <AlgorithmChannelModal
          channel={selected}
          ignored={ignored(selected.id)}
          onToggleIgnored={() => toggleIgnored(selected.id)}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
