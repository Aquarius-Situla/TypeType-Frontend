import type { ReactNode } from "react";
import { ApiError } from "../lib/api";
import { m } from "../paraglide/messages.js";

export function TwitchWatchMessage({ text }: { text: string }) {
  return <p className="py-24 text-center text-fg-muted text-sm">{text}</p>;
}

function errorText(error: unknown): string {
  if (error instanceof ApiError && error.status === 404) return m.twitch_offline();
  if (error instanceof ApiError && error.status === 403) return m.twitch_restricted();
  return m.twitch_load_error();
}

type Props = { loading: boolean; error: unknown; ready: boolean; children?: ReactNode };

// A failed refetch keeps what is already on screen: the stream does not go through the API that failed.
export function TwitchWatchStage({ loading, error, ready, children }: Props) {
  if (error && !ready) return <TwitchWatchMessage text={errorText(error)} />;
  if (loading || !ready)
    return <div className="aspect-video w-full animate-pulse rounded-xl bg-surface-strong" />;
  return <div className="flex min-w-0 flex-1 flex-col gap-3">{children}</div>;
}
