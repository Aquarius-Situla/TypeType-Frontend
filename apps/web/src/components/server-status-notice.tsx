import { CircleCheck, LoaderCircle, Wrench } from "lucide-react";
import { useEffect, useState } from "react";
import { useServerEvents } from "../hooks/use-server-events";
import type { ServerNotice, ServerPhase } from "../lib/server-status";
import { m } from "../paraglide/messages.js";
import { useServerStatusStore } from "../stores/server-status-store";

const BACK_VISIBLE_MS = 3_000;

function noticeText(phase: ServerPhase, notice: ServerNotice | null): string | null {
  if (phase === "unreachable") return m.server_notice_unreachable();
  if (phase === "restarting") return m.server_notice_restarting();
  if (notice?.kind === "update") return m.server_notice_update();
  if (notice?.kind === "maintenance") return m.server_notice_maintenance();
  return null;
}

function useBackOnline(): boolean {
  const resumes = useServerStatusStore((state) => state.resumes);
  const [back, setBack] = useState(false);
  useEffect(() => {
    if (resumes === 0) return;
    setBack(true);
    const timer = setTimeout(() => setBack(false), BACK_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [resumes]);
  return back;
}

export function ServerStatusNotice({ variant }: { variant: "page" | "player" }) {
  const phase = useServerStatusStore((state) => state.phase);
  const notice = useServerStatusStore((state) => state.notice);
  const back = useBackOnline();
  const text = noticeText(phase, notice) ?? (back ? m.server_notice_back() : null);
  if (!text) return null;
  const waiting = phase !== "online";
  const placement =
    variant === "page"
      ? "fixed inset-x-0 bottom-20 z-[70] flex md:bottom-6"
      : "absolute inset-x-0 top-4 z-40 hidden [:fullscreen_&]:flex";
  return (
    <div className={`pointer-events-none justify-center px-4 ${placement}`}>
      <div
        role="status"
        aria-live="polite"
        className="flex max-w-xl items-center gap-2 rounded-full bg-neutral-900 px-4 py-2 text-sm text-white shadow-xl ring-1 ring-white/15"
      >
        {waiting ? (
          <LoaderCircle className="size-4 shrink-0 animate-spin" aria-hidden="true" />
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
