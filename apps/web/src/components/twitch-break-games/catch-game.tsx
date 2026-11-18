import { useEffect, useRef, useState } from "react";
import { m } from "../../paraglide/messages.js";
import { type BreakGameProps, type BreakPiece, PieceView, pick } from "./pieces";

type Drop = { id: number; piece: BreakPiece; x: number; duration: number };

const SPAWN_MS = 750;
const MAX_DROPS = 7;

function Falling({
  drop,
  onCatch,
  onMiss,
}: {
  drop: Drop;
  onCatch: () => void;
  onMiss: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const miss = useRef(onMiss);
  miss.current = onMiss;
  useEffect(() => {
    const element = ref.current;
    const height = element?.parentElement?.clientHeight ?? 220;
    const fall = element?.animate(
      [{ transform: "translateY(-48px)" }, { transform: `translateY(${height}px)` }],
      { duration: drop.duration, easing: "linear", fill: "forwards" },
    );
    if (fall) fall.onfinish = () => miss.current();
    return () => fall?.cancel();
  }, [drop.duration]);
  return (
    <button
      ref={ref}
      type="button"
      onPointerDown={onCatch}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onCatch();
      }}
      aria-label={m.twitch_game_catch_item({ name: drop.piece.name })}
      style={{ left: `${drop.x}%` }}
      className="absolute top-0 cursor-pointer rounded-md p-1 hover:bg-white/10"
    >
      <PieceView piece={drop.piece} className="size-9" />
    </button>
  );
}

export function CatchGame({ pieces }: BreakGameProps) {
  const [drops, setDrops] = useState<Drop[]>([]);
  const [caught, setCaught] = useState(0);
  const [missed, setMissed] = useState(0);
  const next = useRef(0);
  useEffect(() => {
    const spawn = setInterval(() => {
      setDrops((current) =>
        current.length >= MAX_DROPS
          ? current
          : [
              ...current,
              {
                id: next.current++,
                piece: pick(pieces),
                x: 4 + Math.random() * 84,
                duration: 2_400 + Math.random() * 1_800,
              },
            ],
      );
    }, SPAWN_MS);
    return () => clearInterval(spawn);
  }, [pieces]);
  const drop = (id: number) => setDrops((current) => current.filter((item) => item.id !== id));
  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <p className="flex justify-between text-sm text-white/70">
        <span>{m.twitch_game_score({ score: String(caught) })}</span>
        <span>{m.twitch_game_missed({ missed: String(missed) })}</span>
      </p>
      <div className="relative h-56 w-full overflow-hidden rounded-xl bg-white/5">
        {drops.map((item) => (
          <Falling
            key={item.id}
            drop={item}
            onCatch={() => {
              drop(item.id);
              setCaught((value) => value + 1);
            }}
            onMiss={() => {
              drop(item.id);
              setMissed((value) => value + 1);
            }}
          />
        ))}
      </div>
    </div>
  );
}
