import { Undo2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useCompactPlayer } from "../hooks/use-compact-player";
import { currentDanmakuAirdrop, type DanmakuAirdrop } from "../lib/danmaku-airdrop";
import { formatDuration } from "../lib/format";
import { seekSponsorBlockSegment } from "../lib/sponsorblock-seek";
import { useMediaRemote } from "../lib/vidstack";
import { m } from "../paraglide/messages.js";
import type { BulletCommentItem } from "../types/api";
import { ParachuteIcon } from "./parachute-icon";

const CHECK_INTERVAL_MS = 250;
const UNDO_MS = 5000;
const SHELL =
  "pointer-events-auto absolute bottom-20 left-3 z-40 flex items-center gap-2 rounded-full border border-white/15 bg-black/75 px-3 py-1.5 text-xs text-white shadow-lg backdrop-blur";
const OFFER = `${SHELL} font-medium transition-colors hover:bg-black/90`;
const ACTION =
  "inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[11px] font-medium text-white transition-colors hover:bg-accent-strong";

type Jump = { from: number; to: number };

function playerVideo(root: HTMLElement | null): HTMLVideoElement | null {
  return root?.closest("[data-media-player]")?.querySelector("video") ?? null;
}

export function DanmakuAirdropPrompt({ comments }: { comments: BulletCommentItem[] }) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const usedRef = useRef(new Set<string>());
  const remote = useMediaRemote();
  const compact = useCompactPlayer();
  const [offer, setOffer] = useState<DanmakuAirdrop | null>(null);
  const [jump, setJump] = useState<Jump | null>(null);

  useEffect(() => {
    let key = "";
    usedRef.current.clear();
    const update = () => {
      const video = playerVideo(rootRef.current);
      const found = video
        ? currentDanmakuAirdrop(comments, video.currentTime * 1000, video.duration)
        : null;
      const next = found && !usedRef.current.has(found.key) ? found : null;
      const nextKey = next?.key ?? "";
      if (nextKey === key) return;
      key = nextKey;
      setOffer(next);
    };
    update();
    const timer = window.setInterval(update, CHECK_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [comments]);

  useEffect(() => {
    if (!jump) return;
    const timer = window.setTimeout(() => setJump(null), UNDO_MS);
    return () => window.clearTimeout(timer);
  }, [jump]);

  const seek = (seconds: number) =>
    seekSponsorBlockSegment(playerVideo(rootRef.current), (target) => remote.seek(target), seconds);

  const airdrop = (target: DanmakuAirdrop) => {
    usedRef.current.add(target.key);
    setJump({ from: playerVideo(rootRef.current)?.currentTime ?? 0, to: target.seconds });
    setOffer(null);
    seek(target.seconds);
  };

  const undo = (done: Jump) => {
    setJump(null);
    seek(done.from);
  };

  return (
    <div ref={rootRef} className="pointer-events-none absolute inset-0">
      {!compact && jump && (
        <div role="status" className={SHELL}>
          <ParachuteIcon className="h-4 w-4 flex-shrink-0" />
          <span>{m.ui_danmaku_airdrop_done({ time: formatDuration(jump.to) })}</span>
          <button type="button" onClick={() => undo(jump)} className={ACTION}>
            <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
            {m.ui_danmaku_airdrop_undo()}
          </button>
        </div>
      )}
      {!compact && !jump && offer && (
        <button type="button" onClick={() => airdrop(offer)} className={OFFER}>
          <ParachuteIcon className="h-4 w-4 flex-shrink-0" />
          {m.ui_danmaku_airdrop({ time: formatDuration(offer.seconds) })}
        </button>
      )}
    </div>
  );
}
