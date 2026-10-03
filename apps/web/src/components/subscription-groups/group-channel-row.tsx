import { useId, useRef } from "react";
import { proxyImage } from "../../lib/proxy";
import { m } from "../../paraglide/messages.js";
import type { GroupedSubscription, SubscriptionGroup } from "../../types/subscription-groups";
import { ChannelAvatar } from "../channel-avatar";
import { ChannelRouteLink } from "../channel-route-link";
import { ChannelGroupEditor } from "./channel-group-editor";

type Props = {
  channel: GroupedSubscription;
  groups: SubscriptionGroup[];
  selected: boolean;
  editing: boolean;
  draft: ReadonlySet<string> | undefined;
  disabled: boolean;
  busy: boolean;
  onSelect: () => void;
  onDraft: (ids: Set<string>) => void;
  onCancel: () => void;
  onSave: (ids: Set<string>) => Promise<boolean>;
};

export function GroupChannelRow(props: Props): React.JSX.Element {
  const { channel, groups, editing } = props;
  const selectionId = useId();
  const checkbox = useRef<HTMLInputElement>(null);
  const memberships = groups.filter((group) => channel.groupIds.includes(group.id));
  function cancel(): void {
    props.onCancel();
    checkbox.current?.focus();
  }
  return (
    <li
      data-selected={props.selected}
      className={`relative flex min-h-14 items-center border-b border-border px-3 py-2 last:border-b-0 ${props.selected ? "bg-surface-strong" : "hover:bg-surface-strong/50"}`}
    >
      <label
        htmlFor={selectionId}
        title={memberships.map((group) => group.name).join(", ")}
        className={`absolute inset-0 ${props.disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span className="sr-only">{m.ui_select_named_channel({ name: channel.name })}</span>
      </label>
      <div className="pointer-events-none relative flex w-full min-w-0 flex-wrap items-center gap-2 sm:flex-nowrap">
        <input
          ref={checkbox}
          id={selectionId}
          type="checkbox"
          checked={props.selected}
          disabled={props.disabled}
          onChange={props.onSelect}
          aria-label={m.ui_select_named_channel({ name: channel.name })}
          className="pointer-events-auto h-4 w-4 shrink-0 cursor-pointer accent-accent disabled:cursor-not-allowed"
        />
        <ChannelAvatar
          src={proxyImage(channel.avatarUrl)}
          name={channel.name}
          className="h-8 w-8 shrink-0"
        />
        <div className="min-w-0 flex-1" title={channel.name}>
          <ChannelRouteLink
            url={channel.channelUrl}
            className="pointer-events-auto block w-fit max-w-full truncate text-sm font-medium hover:underline"
          >
            {channel.name}
          </ChannelRouteLink>
          <p className="truncate text-xs text-fg-muted">
            {channel.channelUrl.replace(/^https?:\/\/(www\.)?/, "")}
          </p>
        </div>
        {editing ? (
          <ChannelGroupEditor
            channel={channel}
            groups={groups}
            desired={props.draft ?? new Set(channel.groupIds)}
            onChange={props.onDraft}
            busy={props.busy}
            disabled={props.disabled}
            onCancel={cancel}
            onSave={async (ids) => {
              if (await props.onSave(ids)) cancel();
            }}
          />
        ) : (
          <div
            className="flex min-w-0 max-w-[45%] items-center justify-end gap-1 text-xs"
            title={memberships.map((group) => group.name).join(", ")}
          >
            {memberships.length > 0 ? (
              <>
                {memberships.slice(0, 2).map((group) => (
                  <span
                    key={group.id}
                    className="sg-chip min-w-0 max-w-32 truncate"
                    title={group.name}
                  >
                    {group.name}
                  </span>
                ))}
                {memberships.length > 2 && (
                  <span className="sg-chip shrink-0">
                    <span aria-hidden="true">+{memberships.length - 2}</span>
                    <span className="sr-only">
                      {m.sg_more_groups({ count: memberships.length - 2 })}:{" "}
                      {memberships
                        .slice(2)
                        .map((group) => group.name)
                        .join(", ")}
                    </span>
                  </span>
                )}
              </>
            ) : (
              <span className="sg-chip border-dashed">{m.sg_add_groups()}</span>
            )}
          </div>
        )}
      </div>
    </li>
  );
}
