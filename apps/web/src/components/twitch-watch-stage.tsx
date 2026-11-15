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

type Props = { loading: boolean; error: unknown; children?: ReactNode };

export function TwitchWatchStage({ loading, error, children }: Props) {
  if (error) return <TwitchWatchMessage text={errorText(error)} />;
  if (loading || !children)
    return <div className="aspect-video w-full animate-pulse rounded-xl bg-surface-strong" />;
  return <div className="flex min-w-0 flex-1 flex-col gap-3">{children}</div>;
}
