import { Captions, CaptionsOff } from "lucide-react";
import { useEffect, useState } from "react";
import { adSubtitlesUrl } from "../lib/ad-media";
import { m } from "../paraglide/messages.js";
import { getLocale } from "../paraglide/runtime.js";

const KEY = "typetype-ad-subtitles";

// One file per interface language: for each clip, its lines as [start, end, text] in seconds.
type Cue = [number, number, string];
type Track = Record<string, Cue[]>;

// Fetched once per language, and only when subtitles are on.
const tracks = new Map<string, Promise<Track>>();

function loadTrack(locale: string): Promise<Track> {
  const known = tracks.get(locale);
  if (known) return known;
  const loading = fetch(adSubtitlesUrl(locale))
    .then((response) => (response.ok ? (response.json() as Promise<Track>) : {}))
    .catch(() => ({}));
  tracks.set(locale, loading);
  return loading;
}

// The ads are spoken in English: subtitles start on for every other language.
function wantedAtStart(locale: string): boolean {
  try {
    const stored = window.localStorage.getItem(KEY);
    if (stored) return stored === "on";
  } catch {
    // Storage is unavailable: fall back to the default below.
  }
  return locale !== "en";
}

export type AdSubtitles = { on: boolean; line: string | null; toggle: () => void };

// The line to show for a clip at a given time, and the switch that turns subtitles on and off.
export function useAdSubtitles(clip: string, time: number): AdSubtitles {
  const locale = getLocale();
  const [on, setOn] = useState(() => wantedAtStart(locale));
  const [track, setTrack] = useState<Track>({});

  useEffect(() => {
    let alive = true;
    if (on) void loadTrack(locale).then((loaded) => alive && setTrack(loaded));
    return () => {
      alive = false;
    };
  }, [on, locale]);

  function toggle() {
    const next = !on;
    setOn(next);
    try {
      window.localStorage.setItem(KEY, next ? "on" : "off");
    } catch {
      // Storage is unavailable: the choice lasts for this ad only.
    }
  }

  const cue = on ? track[clip]?.find(([from, to]) => time >= from && time <= to) : undefined;
  return { on, line: cue?.[2] ?? null, toggle };
}

// `raised` lifts the line above the control bar while it is shown.
export function AdCaption({ line, raised }: { line: string | null; raised: boolean }) {
  if (!line) return null;
  return (
    <p
      className={`pointer-events-none absolute inset-x-0 z-30 flex justify-center px-4 transition-[bottom] duration-300 ${raised ? "bottom-20" : "bottom-6"}`}
    >
      <span className="max-w-[86%] rounded-md bg-black/75 px-3 py-1.5 text-center text-sm font-medium leading-snug text-white sm:text-xl">
        {line}
      </span>
    </p>
  );
}

export function AdSubtitlesButton({ on, toggle, className }: AdSubtitles & { className: string }) {
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={m.ad_subtitles()}
      aria-pressed={on}
      className={className}
    >
      {on ? (
        <Captions className="h-4 w-4" aria-hidden="true" />
      ) : (
        <CaptionsOff className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  );
}
