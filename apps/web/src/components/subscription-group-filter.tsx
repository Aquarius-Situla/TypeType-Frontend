import { useEffect } from "react";
import { useSubscriptionGroups } from "../hooks/use-subscription-groups";
import { ApiError } from "../lib/api";
import { m } from "../paraglide/messages.js";

type Props = {
  value: string;
  error?: Error | null;
  onChange: (value: string, replace?: boolean) => void;
};

export function SubscriptionGroupFilter({ value, error, onChange }: Props): React.JSX.Element {
  const query = useSubscriptionGroups();
  const groups = [...(query.data ?? [])].sort((a, b) => a.name.localeCompare(b.name));
  const requestMissing = error instanceof ApiError && error.code === "subscription_group_not_found";
  const missing =
    value !== "all" &&
    value !== "ungrouped" &&
    (requestMissing ||
      (query.isSuccess &&
        query.isFetchedAfterMount &&
        !query.isFetching &&
        !groups.some((group) => group.id === value)));
  const { refetch } = query;
  useEffect(() => {
    if (!missing) return;
    onChange("all", true);
    if (requestMissing) void refetch();
  }, [missing, requestMissing, onChange, refetch]);
  return (
    <select
      aria-label={m.sg_feed_filter()}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-9 max-w-64 border border-border-strong bg-app px-3 text-sm text-fg focus-visible:outline-2 focus-visible:outline-accent"
    >
      <option value="all">{m.sg_all_subscriptions()}</option>
      <option value="ungrouped">{m.sg_ungrouped()}</option>
      {groups.map((group) => (
        <option key={group.id} value={group.id}>
          {group.name}
        </option>
      ))}
      {value !== "all" && value !== "ungrouped" && !groups.some((group) => group.id === value) && (
        <option value={value}>{m.sg_groups()}</option>
      )}
    </select>
  );
}
