import { m } from "../paraglide/messages.js";
import type { SubscriptionFeedOrder } from "../types/api";

type Props = {
  value: SubscriptionFeedOrder;
  onChange: (value: SubscriptionFeedOrder) => void;
};

export function SubscriptionFeedOrderSelect({ value, onChange }: Props) {
  return (
    <select
      aria-label={m.subscriptions_feed_order()}
      value={value}
      onChange={(event) => onChange(event.target.value === "oldest" ? "oldest" : "newest")}
      className="h-9 border border-border-strong bg-app px-3 text-sm text-fg focus-visible:outline-2 focus-visible:outline-accent"
    >
      <option value="newest">{m.subscriptions_feed_newest_first()}</option>
      <option value="oldest">{m.subscriptions_feed_oldest_first()}</option>
    </select>
  );
}
