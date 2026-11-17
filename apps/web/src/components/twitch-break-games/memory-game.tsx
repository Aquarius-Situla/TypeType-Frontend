import { useEffect, useRef, useState } from "react";
import { m } from "../../paraglide/messages.js";
import { type BreakGameProps, type BreakPiece, PieceView } from "./pieces";

const PAIRS = 6;

function shuffle<T>(list: T[]): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const deal = (pieces: BreakPiece[]) => {
  const chosen = shuffle(pieces).slice(0, PAIRS);
  return shuffle([...chosen, ...chosen]);
};

export function MemoryGame({ pieces }: BreakGameProps) {
  const [cards, setCards] = useState(() => deal(pieces));
  const [open, setOpen] = useState<number[]>([]);
  const [found, setFound] = useState<ReadonlySet<string>>(() => new Set());
  const [moves, setMoves] = useState(0);
  const hide = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(hide.current), []);
  const won = found.size === PAIRS;

  const flip = (index: number) => {
    if (open.length === 2 || open.includes(index) || found.has(cards[index].name)) return;
    const next = [...open, index];
    setOpen(next);
    if (next.length < 2) return;
    setMoves((value) => value + 1);
    if (cards[next[0]].name === cards[next[1]].name) {
      setFound((current) => new Set(current).add(cards[index].name));
      setOpen([]);
    } else {
      hide.current = setTimeout(() => setOpen([]), 700);
    }
  };
  const restart = () => {
    setCards(deal(pieces));
    setOpen([]);
    setFound(new Set());
    setMoves(0);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-sm text-white/70" aria-live="polite">
        {won
          ? m.twitch_game_memory_won({ moves: String(moves) })
          : m.twitch_game_memory_moves({ moves: String(moves) })}
      </p>
      <div className="grid grid-cols-4 gap-2">
        {cards.map((card, index) => {
          const shown = open.includes(index) || found.has(card.name);
          return (
            <button
              // biome-ignore lint/suspicious/noArrayIndexKey: a card is its place in the dealt grid
              key={index}
              type="button"
              onClick={() => flip(index)}
              aria-label={shown ? card.name : m.twitch_game_memory_card({ n: String(index + 1) })}
              className={`flex size-12 cursor-pointer items-center justify-center rounded-lg transition-colors sm:size-14 ${shown ? "bg-white/15" : "bg-[#9146ff] hover:bg-[#772ce8]"}`}
            >
              {shown && <PieceView piece={card} />}
            </button>
          );
        })}
      </div>
      {won && (
        <button
          type="button"
          onClick={restart}
          className="cursor-pointer rounded-lg bg-white/15 px-3 py-1.5 text-sm hover:bg-white/25"
        >
          {m.twitch_game_restart()}
        </button>
      )}
    </div>
  );
}
