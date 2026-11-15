import { Link } from "@tanstack/react-router";
import { m } from "../paraglide/messages.js";

export function TwitchLiveEnded({ login }: { login: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface-strong text-center">
      <p className="font-semibold text-fg">{m.twitch_live_ended()}</p>
      <Link
        to="/twitch/channel/$login"
        params={{ login }}
        className="rounded-lg bg-[#9146ff] px-3 py-1.5 font-medium text-sm text-white hover:bg-[#772ce8]"
      >
        {m.twitch_live_ended_videos()}
      </Link>
    </div>
  );
}
