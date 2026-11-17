import { type ComponentType, useEffect, useState } from "react";
import { formatDuration } from "../lib/format";
import { m } from "../paraglide/messages.js";
import { useLiveBreakStore } from "../stores/live-break-store";
import { CatchGame } from "./twitch-break-games/catch-game";
import { MemoryGame } from "./twitch-break-games/memory-game";
import { type BreakGameProps, useBreakPieces } from "./twitch-break-games/pieces";
import { ReflexGame } from "./twitch-break-games/reflex-game";
import { SnakeGame } from "./twitch-break-games/snake-game";

const GAMES: ComponentType<BreakGameProps>[] = [CatchGame, SnakeGame, ReflexGame, MemoryGame];

function useSecondsLeft(endsAt: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(tick);
  }, []);
  return Math.max(0, Math.ceil((endsAt - now) / 1000));
}

function BreakPage({ login, endsAt }: { login: string; endsAt: number }) {
  const [Game] = useState(() => GAMES[Math.floor(Math.random() * GAMES.length)]);
  const pieces = useBreakPieces(login);
  const left = useSecondsLeft(endsAt);
  return (
    <section
      aria-label={m.twitch_ad_break_title()}
      className="pointer-events-auto absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 overflow-y-auto bg-neutral-950/95 p-4 text-center text-white"
    >
      <div>
        <p role="status" className="font-semibold">
          {m.twitch_ad_break_title()}
        </p>
        <p className="text-sm text-white/70 tabular-nums">
          {left > 0
            ? m.twitch_ad_break_back({ time: formatDuration(left) })
            : m.twitch_ad_break_soon()}
        </p>
      </div>
      <Game pieces={pieces} />
    </section>
  );
}

// While the live service skips the ads Twitch stitched in, the live has no picture: a short game fills the wait, and
// the live comes back on its own when the break ends.
export function TwitchAdBreak({ login }: { login: string }) {
  const endsAt = useLiveBreakStore((state) => state.endsAt);
  if (endsAt === null) return null;
  return <BreakPage login={login} endsAt={endsAt} />;
}
