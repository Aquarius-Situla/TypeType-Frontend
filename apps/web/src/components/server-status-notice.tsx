import { CircleCheck, LoaderCircle, Wrench } from "lucide-react";
import { useEffect, useReducer } from "react";
import { useServerEvents } from "../hooks/use-server-events";
import {
  backNoticeRemaining,
  type ServerNoticeVariant,
  serverNoticeText,
} from "../lib/server-notice-text";
import { useServerStatusStore } from "../stores/server-status-store";

function useBackOnline(): boolean {
  const resumedAt = useServerStatusStore((state) => state.resumedAt);
  const [, expire] = useReducer((count: number) => count + 1, 0);
  const remaining = backNoticeRemaining(resumedAt, Date.now());
  useEffect(() => {
    if (remaining === 0) return;
    const timer = setTimeout(expire, remaining);
    return () => clearTimeout(timer);
  }, [remaining]);
  return remaining > 0;
}

export function ServerStatusNotice({ variant }: { variant: ServerNoticeVariant }) {
  const phase = useServerStatusStore((state) => state.phase);
  const notice = useServerStatusStore((state) => state.notice);
  const back = useBackOnline();
  const text = serverNoticeText(phase, notice, variant, back);
  if (!text) return null;
  const waiting = phase !== "online";
  const placement =
    variant === "page"
      ? "fixed inset-x-0 bottom-20 z-[70] flex md:bottom-6"
      : "absolute inset-x-0 top-4 z-40 flex";
  return (
    <div
      data-server-notice={variant}
      className={`pointer-events-none justify-center px-4 ${placement}`}
    >
      <div
        role="status"
        aria-live="polite"
        className="flex max-w-xl items-center gap-2 rounded-full bg-neutral-900 px-4 py-2 text-sm text-white shadow-xl ring-1 ring-white/15"
      >
        {waiting ? (
          <LoaderCircle className="size-4 shrink-0 motion-safe:animate-spin" aria-hidden="true" />
        ) : notice ? (
          <Wrench className="size-4 shrink-0" aria-hidden="true" />
        ) : (
          <CircleCheck className="size-4 shrink-0 text-emerald-400" aria-hidden="true" />
        )}
        <span>
          {text}
          {notice?.message ? ` ${notice.message}` : ""}
        </span>
      </div>
    </div>
  );
}

export function ServerStatusHost() {
  useServerEvents();
  return <ServerStatusNotice variant="page" />;
}
