import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { m } from "../../paraglide/messages.js";
import { type BreakGameProps, type BreakPiece, PieceView, pick } from "./pieces";

const COLS = 14;
const ROWS = 10;
const STEP_MS = 160;

type Cell = { x: number; y: number };
type Dir = Cell;
type Game = { snake: Cell[]; food: Cell; piece: BreakPiece; over: boolean };

const DIRS: Record<string, Dir> = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
};

function freeCell(snake: Cell[]): Cell {
  for (;;) {
    const cell = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
    if (!snake.some((part) => part.x === cell.x && part.y === cell.y)) return cell;
  }
}

function start(pieces: BreakPiece[]): Game {
  const snake = [
    { x: 4, y: 5 },
    { x: 3, y: 5 },
    { x: 2, y: 5 },
  ];
  return { snake, food: freeCell(snake), piece: pick(pieces), over: false };
}

function step(game: Game, dir: Dir, pieces: BreakPiece[]): Game {
  if (game.over) return game;
  const head = { x: game.snake[0].x + dir.x, y: game.snake[0].y + dir.y };
  const out = head.x < 0 || head.y < 0 || head.x >= COLS || head.y >= ROWS;
  if (out || game.snake.some((part) => part.x === head.x && part.y === head.y))
    return { ...game, over: true };
  const ate = head.x === game.food.x && head.y === game.food.y;
  const snake = [head, ...(ate ? game.snake : game.snake.slice(0, -1))];
  return ate
    ? { snake, food: freeCell(snake), piece: pick(pieces), over: false }
    : { ...game, snake };
}

export function SnakeGame({ pieces }: BreakGameProps) {
  const [game, setGame] = useState(() => start(pieces));
  const dir = useRef<Dir>(DIRS.ArrowRight);
  const queued = useRef<Dir>(DIRS.ArrowRight);
  // The snake waits for the first arrow: the page opens on its own, and a game lost before a touch is no game.
  const [started, setStarted] = useState(false);
  useEffect(() => {
    if (!started) return;
    const tick = setInterval(() => {
      dir.current = queued.current;
      setGame((current) => step(current, dir.current, pieces));
    }, STEP_MS);
    return () => clearInterval(tick);
  }, [pieces, started]);
  const turn = useCallback((next: Dir) => {
    setStarted(true);
    if (next.x === -dir.current.x && next.y === -dir.current.y) return;
    queued.current = next;
  }, []);
  const restart = () => {
    dir.current = DIRS.ArrowRight;
    queued.current = DIRS.ArrowRight;
    setGame(start(pieces));
    setStarted(false);
  };
  const score = game.snake.length - 3;
  const body = new Set(game.snake.map((part) => part.y * COLS + part.x));

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-sm text-white/70" aria-live="polite">
        {game.over
          ? m.twitch_game_snake_over({ score: String(score) })
          : started
            ? m.twitch_game_score({ score: String(score) })
            : m.twitch_game_snake_start()}
      </p>
      <div
        role="application"
        aria-label={m.twitch_game_snake()}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: the board takes the arrow keys
        tabIndex={0}
        onKeyDown={(event) => {
          const next = DIRS[event.key];
          if (!next) return;
          event.preventDefault();
          turn(next);
        }}
        className="grid gap-px rounded-lg bg-white/5 p-1 outline-none focus-visible:ring-2 focus-visible:ring-white"
        style={{
          gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
          width: "min(22rem, 80vw)",
        }}
      >
        {Array.from({ length: COLS * ROWS }, (_, index) => {
          const food = index === game.food.y * COLS + game.food.x;
          return (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: cells are the fixed board squares
              key={index}
              className={`aspect-square rounded-sm ${body.has(index) ? "bg-[#9146ff]" : ""}`}
            >
              {food && <PieceView piece={game.piece} className="size-full" />}
            </span>
          );
        })}
      </div>
      <div className="flex items-center gap-1">
        {(
          [
            ["ArrowLeft", ArrowLeft, m.twitch_game_left()],
            ["ArrowUp", ArrowUp, m.twitch_game_up()],
            ["ArrowDown", ArrowDown, m.twitch_game_down()],
            ["ArrowRight", ArrowRight, m.twitch_game_right()],
          ] as const
        ).map(([key, Icon, label]) => (
          <button
            key={key}
            type="button"
            onPointerDown={() => turn(DIRS[key])}
            aria-label={label}
            className="cursor-pointer rounded-md bg-white/10 p-2 hover:bg-white/20"
          >
            <Icon className="size-4" aria-hidden="true" />
          </button>
        ))}
        {game.over && (
          <button
            type="button"
            onClick={restart}
            className="ml-2 cursor-pointer rounded-lg bg-white/15 px-3 py-1.5 text-sm hover:bg-white/25"
          >
            {m.twitch_game_restart()}
          </button>
        )}
      </div>
    </div>
  );
}
