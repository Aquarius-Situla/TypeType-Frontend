import { Star } from "lucide-react";
import { m } from "../paraglide/messages.js";
import type { TwitchSubscription } from "../types/twitch";

function plan(subscription: TwitchSubscription): string {
  if (subscription.prime) return "Prime";
  const tier = Number.parseInt(subscription.tier, 10) / 1000;
  return Number.isInteger(tier) && tier > 0 ? m.twitch_subscription_tier({ tier }) : "";
}

// The viewer's own subscription to the channel, read with the linked Twitch account.
export function TwitchSubBadge({ subscription }: { subscription: TwitchSubscription }) {
  const { months, streak } = subscription;
  const label =
    months > 1
      ? m.twitch_subscribed_months({ months })
      : months === 1
        ? m.twitch_subscribed_one_month()
        : m.twitch_subscribed();
  const detail = [streak > 1 ? m.twitch_subscription_streak({ streak }) : "", plan(subscription)]
    .filter(Boolean)
    .join(" · ");
  const title = detail ? `${label} · ${detail}` : label;
  return (
    <span
      title={title}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#9146ff]/40 bg-[#9146ff]/15 px-2.5 py-1.5 font-medium text-[#bf94ff] text-sm sm:px-3"
    >
      <Star className="size-4 fill-current" aria-hidden="true" />
      <span aria-hidden="true" className="hidden sm:inline">
        {label}
      </span>
      <span aria-hidden="true" className="sm:hidden">
        {months > 0 ? m.twitch_subscription_months_short({ months }) : label}
      </span>
      <span className="sr-only">{title}</span>
    </span>
  );
}
