import type { useGroupChannelPage } from "../../hooks/use-group-channel-page";
import { m } from "../../paraglide/messages.js";
import type { GroupedSubscription, SubscriptionGroup } from "../../types/subscription-groups";
import { GroupChannelRow } from "./group-channel-row";
import { GroupPagination } from "./group-pagination";

type Props = {
  channels: GroupedSubscription[];
  pagination: ReturnType<typeof useGroupChannelPage>["pagination"];
  label: string;
  groups: SubscriptionGroup[];
  selected: ReadonlySet<string>;
  editing: string | null;
  drafts: ReadonlyMap<string, ReadonlySet<string>>;
  busy: boolean;
  disabled: boolean;
  onToggle: (url: string) => void;
  onDraft: (url: string, ids: Set<string>) => void;
  onCancel: () => void;
  onSave: (channel: GroupedSubscription, ids: Set<string>) => Promise<boolean>;
};

export function GroupChannelList(props: Props): React.JSX.Element {
  const { pagination } = props;
  return (
    <div className="flex min-h-0 flex-1 flex-col border border-border bg-surface">
      <div ref={pagination.viewport} className="min-h-0 flex-1">
        {props.channels.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm font-medium">{m.sg_no_channel_match()}</p>
            <p className="mt-2 text-xs text-fg-muted">{m.sg_change_filters()}</p>
          </div>
        ) : (
          <ul aria-label={m.sg_channels()}>
            {props.channels.map((channel) => (
              <GroupChannelRow
                key={channel.channelUrl}
                channel={channel}
                groups={props.groups}
                selected={props.selected.has(channel.channelUrl)}
                editing={props.editing === channel.channelUrl}
                draft={props.drafts.get(channel.channelUrl)}
                busy={props.busy}
                disabled={props.disabled}
                onSelect={() => {
                  props.onToggle(channel.channelUrl);
                }}
                onDraft={(ids) => props.onDraft(channel.channelUrl, ids)}
                onCancel={props.onCancel}
                onSave={(ids) => props.onSave(channel, ids)}
              />
            ))}
          </ul>
        )}
      </div>
      <GroupPagination
        {...pagination}
        label={props.label}
        total={pagination.total}
        disabled={props.disabled}
      />
    </div>
  );
}
