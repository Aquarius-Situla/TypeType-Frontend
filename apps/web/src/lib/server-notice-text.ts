import { m } from "../paraglide/messages.js";
import type { ServerNotice, ServerPhase } from "./server-status";

export type ServerNoticeVariant = "page" | "player";

const BACK_VISIBLE_MS = 3_000;

// A notice mounted later, such as the one in a new player, must not replay a return that happened before it.
export function backNoticeRemaining(resumedAt: number | null, now: number): number {
  return resumedAt === null ? 0 : Math.max(0, resumedAt + BACK_VISIBLE_MS - now);
}

export function serverNoticeText(
  phase: ServerPhase,
  notice: ServerNotice | null,
  variant: ServerNoticeVariant,
  back: boolean,
): string | null {
  if (phase === "unreachable") return m.server_notice_unreachable();
  if (phase === "restarting") return m.server_notice_restarting();
  if (notice?.kind === "update") return m.server_notice_update();
  if (notice?.kind === "maintenance") return m.server_notice_maintenance();
  return back && variant === "page" ? m.server_notice_back() : null;
}
