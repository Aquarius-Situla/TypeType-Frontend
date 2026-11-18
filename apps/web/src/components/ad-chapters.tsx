import { RotateCcw, X } from "lucide-react";
import { useEffect } from "react";
import { useAdEntrance } from "../hooks/use-ad-entrance";
import { trialThumbnailUrl } from "../lib/ad-media";
import {
  endingTitle,
  lastChoiceBefore,
  TRIAL_CHAPTERS,
  TRIAL_ENDINGS,
  TRIAL_SCENES,
  TRIAL_START,
} from "../lib/ad-trial";
import { m } from "../paraglide/messages.js";

type Props = {
  // Clips watched to their end in any session: a choice is reached once the clip before it was.
  known: ReadonlySet<string>;
  endings: readonly number[];
  onJump: (scene: string, witness?: string) => void;
  onRestart: () => void;
  onClose: () => void;
};

function Row({ picture, title, onClick }: { picture: string; title: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-lg p-1.5 text-left transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-400"
    >
      <img
        src={trialThumbnailUrl(picture)}
        alt=""
        className="aspect-video w-20 shrink-0 rounded-md object-cover opacity-80 ring-1 ring-white/15 transition group-hover:opacity-100 group-hover:ring-yellow-400"
      />
      <span className="min-w-0 text-xs font-medium leading-snug text-white sm:text-sm">
        {title}
      </span>
    </button>
  );
}

// The chapter list of the trial, a panel along the left edge of the player while the ad keeps
// playing. It only lists what the viewer unlocked: the choices already reached and the endings
// already found, each one a way straight back.
export function AdChapters({ known, endings, onJump, onRestart, onClose }: Props) {
  const shown = useAdEntrance();
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      onClose();
    }
    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true });
  }, [onClose]);

  const chapters = TRIAL_CHAPTERS.filter((scene) => scene === TRIAL_START || known.has(scene));
  const found = Object.entries(TRIAL_ENDINGS).filter(([number]) =>
    endings.includes(Number(number)),
  );

  return (
    <aside
      aria-label={m.ad_chapters()}
      className={`absolute bottom-[4.75rem] left-0 top-0 z-50 flex w-72 max-w-[78%] flex-col rounded-br-2xl bg-black/80 text-white shadow-2xl backdrop-blur-md transition-transform duration-300 ease-out ${shown ? "translate-x-0" : "-translate-x-full"}`}
    >
      <div className="flex items-center justify-between gap-2 px-3 pb-1 pt-3">
        <p className="text-sm font-bold sm:text-base">{m.ad_chapters()}</p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onRestart}
            aria-label={m.ad_restart()}
            title={m.ad_restart()}
            className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-white/15"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label={m.ad_close()}
            className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-white/15"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-1.5 pb-3">
        {chapters.map((scene) => {
          const value = TRIAL_SCENES[scene];
          if (!value || !("ask" in value)) return null;
          return (
            <Row
              key={scene}
              picture={value.ask.answers[0]?.to ?? scene}
              title={value.ask.question()}
              onClick={() => onJump(scene)}
            />
          );
        })}
        {found.length > 0 && (
          <>
            <p className="px-1.5 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-widest text-yellow-300">
              {m.ad_agency_endings({ n: String(found.length) })}
            </p>
            {found.map(([number, ending]) => (
              <Row
                key={number}
                picture={ending.picture}
                title={endingTitle(Number(number))}
                onClick={() => onJump(lastChoiceBefore(ending.scene), ending.witness)}
              />
            ))}
          </>
        )}
      </div>
    </aside>
  );
}
