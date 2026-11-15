import { VolumeX } from "lucide-react";
import { type RefObject, useEffect, useRef, useState } from "react";
import { m } from "../paraglide/messages.js";

type Props = {
  blocked: number;
  paused: boolean | undefined;
  muted: boolean | undefined;
  policyMuted: RefObject<boolean>;
  play: () => Promise<unknown> | undefined;
  setMuted: (muted: boolean) => void;
};

// Playback starts with sound. When the browser refuses sound before any gesture on the page, playback starts muted
// and the first click or key press anywhere turns the sound on, since only a user gesture lifts that rule. The
// cover sits above the player's own click layer: a click reaching that layer would pause the video.
export function StartWithSound({ blocked, paused, muted, policyMuted, play, setMuted }: Props) {
  const [silenced, setSilenced] = useState(false);
  const cover = useRef<HTMLButtonElement>(null);
  const mutedSeen = useRef(false);
  const actions = useRef({ play, setMuted, paused });
  actions.current = { play, setMuted, paused };

  useEffect(() => {
    if (blocked === 0) return;
    policyMuted.current = true;
    mutedSeen.current = false;
    setSilenced(true);
    actions.current.setMuted(true);
    void actions.current.play()?.catch(() => undefined);
  }, [blocked, policyMuted]);

  // The player reports the forced mute a render later; only a mute seen and then lifted means the viewer unmuted.
  useEffect(() => {
    if (!silenced) return;
    if (muted === true) {
      mutedSeen.current = true;
      return;
    }
    if (!mutedSeen.current) return;
    policyMuted.current = false;
    setSilenced(false);
  }, [silenced, muted, policyMuted]);

  useEffect(() => {
    if (!silenced) return;
    const unmute = (event: Event) => {
      if (event.target instanceof Node && cover.current?.contains(event.target)) return;
      turnSoundOn();
    };
    document.addEventListener("click", unmute, { capture: true });
    document.addEventListener("keyup", unmute, { capture: true });
    return () => {
      document.removeEventListener("click", unmute, { capture: true });
      document.removeEventListener("keyup", unmute, { capture: true });
    };
  });

  function turnSoundOn() {
    policyMuted.current = false;
    setSilenced(false);
    actions.current.setMuted(false);
    if (actions.current.paused !== false) void actions.current.play()?.catch(() => undefined);
  }

  if (!silenced) return null;
  return (
    <button
      ref={cover}
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        turnSoundOn();
      }}
      className="group absolute inset-0 z-30 flex cursor-pointer flex-col items-center justify-center gap-3"
    >
      <span className="flex size-16 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors group-hover:bg-black/75">
        <VolumeX className="size-7" aria-hidden="true" />
      </span>
      <span className="rounded-full bg-black/60 px-3 py-1 font-medium text-sm text-white backdrop-blur-sm">
        {m.player_unmute_hint()}
      </span>
    </button>
  );
}
