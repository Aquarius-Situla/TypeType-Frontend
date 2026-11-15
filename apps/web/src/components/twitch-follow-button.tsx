import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { useTwitchFollow } from "../hooks/use-twitch-follow";
import { m } from "../paraglide/messages.js";

type Props = { login: string; returnTo: string; compact?: boolean };

export function TwitchFollowButton({ login, returnTo, compact = false }: Props) {
  const follow = useTwitchFollow(login);
  const base = `inline-flex items-center gap-1.5 rounded-lg font-medium transition-colors ${compact ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm"}`;
  if (!follow.linked) {
    return (
      <Link
        to="/twitch-session"
        search={{ returnTo }}
        title={m.twitch_follow_link_account()}
        className={`${base} bg-[#9146ff] text-white hover:bg-[#772ce8]`}
      >
        <Heart className="size-4" aria-hidden="true" />
        {m.twitch_follow()}
      </Link>
    );
  }
  const label = follow.following ? m.twitch_unfollow() : m.twitch_follow();
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={follow.toggle}
        disabled={follow.loading || follow.pending}
        aria-pressed={follow.following}
        aria-label={label}
        title={label}
        className={`${base} group disabled:opacity-60 ${
          follow.following
            ? "border border-border bg-surface-strong text-fg hover:border-danger hover:text-danger"
            : "bg-[#9146ff] text-white hover:bg-[#772ce8]"
        }`}
      >
        <Heart className={`size-4 ${follow.following ? "fill-current" : ""}`} aria-hidden="true" />
        {follow.following ? (
          <>
            <span className="group-hover:hidden">{m.twitch_following()}</span>
            <span className="hidden group-hover:inline">{m.twitch_unfollow()}</span>
          </>
        ) : (
          m.twitch_follow()
        )}
      </button>
      {follow.failed && (
        <span role="alert" className="text-danger-strong text-xs">
          {m.twitch_follow_failed()}
        </span>
      )}
    </span>
  );
}
