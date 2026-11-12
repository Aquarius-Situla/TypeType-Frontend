import { ListVideo, SkipForward } from "lucide-react";
import { AD_BUTTON } from "../lib/ad-player";
import { m } from "../paraglide/messages.js";

type Props = { canSkip: boolean; onSkip: () => void; onChapters: () => void };

// The buttons the trial adds to the control bar: skip a scene already seen, open the chapters.
export function AdTrialTools({ canSkip, onSkip, onChapters }: Props) {
  return (
    <>
      {canSkip && (
        <button
          type="button"
          onClick={onSkip}
          aria-label={m.ad_skip_scene()}
          title={m.ad_skip_scene()}
          className={`${AD_BUTTON} w-auto gap-2 px-3 text-sm font-medium`}
        >
          <SkipForward className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">{m.ad_skip_scene()}</span>
        </button>
      )}
      <button
        type="button"
        onClick={onChapters}
        aria-label={m.ad_chapters()}
        title={m.ad_chapters()}
        className={AD_BUTTON}
      >
        <ListVideo className="h-4 w-4" aria-hidden="true" />
      </button>
    </>
  );
}
