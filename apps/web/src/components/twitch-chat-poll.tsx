import { BarChart3, X } from "lucide-react";
import { useEffect, useState } from "react";
import { clockLabel, pollRemainingSeconds, pollRows, pollRunning } from "../lib/twitch-poll";
import { m } from "../paraglide/messages.js";
import type { TwitchPoll } from "../types/twitch";

type Props = { poll: TwitchPoll; fetchedAt: number; onHide: () => void };

function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const tick = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(tick);
  }, [active]);
  return now;
}

export function TwitchChatPoll({ poll, fetchedAt, onHide }: Props) {
  const running = pollRunning(poll);
  const now = useNow(running);
  const remaining = pollRemainingSeconds(poll, fetchedAt, now);
  const rows = pollRows(poll);
  return (
    <section
      aria-label={m.twitch_poll()}
      className="border-border border-b bg-surface-strong/60 px-3 py-2.5 text-fg"
    >
      <div className="flex items-center gap-2 text-fg-muted text-xs">
        <BarChart3 className="size-3.5 shrink-0 text-[#a970ff]" aria-hidden="true" />
        <span className="font-medium">{running ? m.twitch_poll() : m.twitch_poll_ended()}</span>
        {running && (
          <span className="tabular-nums" role="timer" aria-live="off">
            {clockLabel(remaining)}
          </span>
        )}
        <button
          type="button"
          onClick={onHide}
          aria-label={m.twitch_chat_highlight_hide()}
          title={m.twitch_chat_highlight_hide()}
          className="ml-auto rounded p-0.5 hover:bg-surface-strong hover:text-fg"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      </div>
      <p className="mt-1 break-words font-semibold text-sm">{poll.title}</p>
      <ul className="mt-2 space-y-1.5">
        {rows.map((row) => (
          <li
            key={row.id}
            aria-label={m.twitch_poll_choice({
              title: row.title,
              percent: String(row.percent),
              votes: String(row.votes),
            })}
            className="relative overflow-hidden rounded-md border border-border px-2 py-1 text-xs"
          >
            <span
              aria-hidden="true"
              style={{ width: `${row.percent}%` }}
              className={`absolute inset-y-0 left-0 transition-[width] duration-500 motion-reduce:transition-none ${row.leading && !running ? "bg-[#9146ff]/45" : "bg-[#9146ff]/25"}`}
            />
            <span aria-hidden="true" className="relative flex items-center gap-2">
              <span className={`min-w-0 flex-1 break-words ${row.leading ? "font-semibold" : ""}`}>
                {row.title}
              </span>
              <span className="tabular-nums text-fg-muted">{row.percent}%</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-1.5 text-[11px] text-fg-muted">
        {m.twitch_poll_votes({ votes: String(poll.votes) })}
      </p>
    </section>
  );
}
