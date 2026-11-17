import { useMemo, useState } from "react";
import { useTwitchChatAssets } from "../../hooks/use-twitch-chat-assets";
import { proxyImage } from "../../lib/proxy";
import { stillEmoteUrl } from "../../lib/twitch-emote-still";

// A game piece: an emote of the channel, or a glyph when the channel has none.
export type BreakPiece = { name: string; src?: string; glyph?: string };

export type BreakGameProps = { pieces: BreakPiece[] };

const GLYPHS = ["🍕", "🐸", "⭐", "🎮", "🍩", "👾", "🐱", "🔥", "🍉", "🚀", "🎲", "🦊"];
const MAX = 12;

// Still frames only: animated emotes are what pile up decoding threads on WebKit.
export function useBreakPieces(login: string): BreakPiece[] {
  const { emotes } = useTwitchChatAssets(login);
  return useMemo(() => {
    const picked: BreakPiece[] = [];
    // Emotes that never move first: they need no still frame, which not every CDN has for every emote.
    const ordered = [...emotes.values()].sort(
      (a, b) => Number(Boolean(a.animated)) - Number(Boolean(b.animated)),
    );
    for (const emote of ordered) {
      if (emote.zeroWidth) continue;
      const url = emote.animated ? stillEmoteUrl(emote.url) : emote.url;
      picked.push({ name: emote.name, src: proxyImage(url, "card") });
      if (picked.length === MAX) break;
    }
    return picked.length >= 6 ? picked : GLYPHS.map((glyph) => ({ name: glyph, glyph }));
  }, [emotes]);
}

export function PieceView({
  piece,
  className = "size-8",
}: {
  piece: BreakPiece;
  className?: string;
}) {
  const [broken, setBroken] = useState(false);
  if (piece.src && !broken)
    return (
      <img
        src={piece.src}
        alt=""
        draggable={false}
        onError={() => setBroken(true)}
        className={`${className} object-contain`}
      />
    );
  return (
    <span
      aria-hidden="true"
      className={`${className} flex items-center justify-center truncate ${piece.glyph ? "text-2xl" : "text-[10px]"}`}
    >
      {piece.glyph ?? piece.name}
    </span>
  );
}

export const pick = <T,>(list: T[]): T => list[Math.floor(Math.random() * list.length)];
