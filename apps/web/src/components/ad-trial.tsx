import { ListVideo, SkipForward } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAdBed } from "../hooks/use-ad-bed";
import { useAdReel } from "../hooks/use-ad-reel";
import { bedFor } from "../lib/ad-bed";
import { trialClipUrl } from "../lib/ad-media";
import { AD_CHIP, type AdPlayerProps } from "../lib/ad-player";
import { lastChoiceBefore, TRIAL_CHAPTERS, TRIAL_SCENES, TRIAL_START } from "../lib/ad-trial";
import { readAdVault, rememberEnding, rememberScene } from "../lib/ad-vault";
import { m } from "../paraglide/messages.js";
import { AdChapters } from "./ad-chapters";
import { AdChoices } from "./ad-choices";
import { AD_BUTTON, AdFrame } from "./ad-frame";
import { AdTrialEnd } from "./ad-trial-end";

type TrialState = {
  scene: string;
  seen: ReadonlySet<string>;
  // The clip of the scene is over: its choice or its ending is on screen.
  waiting: boolean;
  // The scene of the last choice made, to come back to from an ending.
  lastAsk: string | null;
};

// Every clip the current scene can lead to, so that it is loaded before it is needed.
function upcomingClips(scene: string): string[] {
  const current = TRIAL_SCENES[scene];
  if (!current) return [];
  if ("next" in current) return [trialClipUrl(current.next)];
  if ("ask" in current) {
    return [
      trialClipUrl(current.ask.wait),
      ...current.ask.answers.map((answer) => trialClipUrl(answer.to)),
    ];
  }
  return [];
}

// The interactive ad: clips chained by the choices of the viewer, down to one of five endings.
export function AdTrial({
  brand,
  progress,
  volume,
  muted,
  soundBlocked = false,
  replay = false,
  onToggleMute,
  onVolume,
  onSoundBlocked,
  onFinish,
}: AdPlayerProps) {
  const [state, setState] = useState<TrialState>(() => ({
    scene: progress.scene,
    seen: new Set(progress.seen),
    waiting: progress.waiting,
    lastAsk: null,
  }));
  const current = TRIAL_SCENES[state.scene];
  // Remembered across sessions, unlike `seen`: what can be skipped and what the chapters open.
  const [known, setKnown] = useState<ReadonlySet<string>>(() => new Set(readAdVault().scenes));
  const [endings, setEndings] = useState<readonly number[]>(() => readAdVault().endings);
  const [chapters, setChapters] = useState(false);
  // Counts the chapters unlocked in this session: each one shows the note again.
  const [unlocked, setUnlocked] = useState(0);
  const [freshEnding, setFreshEnding] = useState(false);
  // How far the viewer got in the current clip: a clip seen for the first time can be rewound,
  // not skipped ahead. Only clips already watched to the end are free to seek and skip.
  const reached = useRef({ scene: progress.scene, time: progress.time });

  // Mirror the state into the shared progress object, which the ad break saves.
  useEffect(() => {
    progress.scene = state.scene;
    progress.seen = [...state.seen];
    progress.waiting = state.waiting;
  }, [progress, state]);

  function play(scene: string, from: string | null = null) {
    progress.time = 0;
    setState((before) => ({
      scene,
      seen: new Set([...before.seen, scene]),
      waiting: false,
      lastAsk: from ?? before.lastAsk,
    }));
  }

  function clipEnded() {
    if (!state.waiting) {
      const isNewChapter =
        !known.has(state.scene) &&
        state.scene !== TRIAL_START &&
        (TRIAL_CHAPTERS as readonly string[]).includes(state.scene);
      setKnown(new Set(rememberScene(state.scene).scenes));
      if (isNewChapter) setUnlocked((count) => count + 1);
    }
    if (!current) return onFinish();
    if ("next" in current) return play(current.next);
    setState((before) => ({ ...before, waiting: true }));
  }

  const asking = current && "ask" in current && state.waiting ? current.ask : null;
  const ending = current && "ending" in current && state.waiting ? current : null;
  const upcoming = useMemo(() => upcomingClips(state.scene), [state.scene]);
  const reel = useAdReel({
    src: trialClipUrl(asking ? asking.wait : state.scene),
    upcoming,
    volume,
    muted,
    loop: Boolean(asking),
    startAt: asking ? 0 : progress.time,
    onTime: (seconds) => {
      if (asking) return;
      progress.time = seconds;
      if (reached.current.scene !== state.scene) reached.current = { scene: state.scene, time: 0 };
      reached.current.time = Math.max(reached.current.time, seconds);
    },
    onEnded: clipEnded,
    onFailed: onFinish,
    onSoundBlocked,
  });
  const bed = useMemo(() => bedFor(state.scene, state.waiting), [state.scene, state.waiting]);
  useAdBed(bed, volume, muted, !reel.blocked && !reel.paused);

  useEffect(() => {
    if (!ending) return;
    setFreshEnding(!readAdVault().endings.includes(ending.ending));
    setEndings(rememberEnding(ending.ending).endings);
  }, [ending]);

  function backToChoice() {
    const scene = state.lastAsk ?? lastChoiceBefore(state.scene);
    progress.time = 0;
    setState((before) => ({ ...before, scene, waiting: true }));
  }

  function restart() {
    progress.time = 0;
    setChapters(false);
    setState({ scene: TRIAL_START, seen: new Set([TRIAL_START]), waiting: false, lastAsk: null });
  }

  // Straight to a choice from the chapter menu.
  // `witness` is the scene that unlocks the answer of an ending reached back from the chapter list.
  function jumpTo(scene: string, witness?: string) {
    progress.time = 0;
    setChapters(false);
    setState({
      scene,
      // A jump from the menu starts a new run from there: no witness called before counts, only
      // the one of the ending gone back to.
      seen: new Set([scene, ...(witness ? [witness] : [])]),
      waiting: true,
      lastAsk: scene,
    });
  }

  const playing = !asking && !ending;

  function seek(seconds: number) {
    const limit = reached.current.scene === state.scene ? reached.current.time : 0;
    reel.seek(known.has(state.scene) ? seconds : Math.min(seconds, limit));
  }
  const canSkip = playing && known.has(state.scene);
  const tools = (
    <>
      {canSkip && (
        <button
          type="button"
          onClick={reel.skip}
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
        onClick={() => setChapters((open) => !open)}
        aria-label={m.ad_chapters()}
        title={m.ad_chapters()}
        className={AD_BUTTON}
      >
        <ListVideo className="h-4 w-4" aria-hidden="true" />
      </button>
    </>
  );

  const layer = "absolute inset-0 h-full w-full bg-black object-contain";
  return (
    <AdFrame
      label={m.ad_interactive()}
      brand={brand}
      clip={asking ? asking.wait : state.scene}
      elapsed={reel.elapsed}
      duration={playing ? reel.duration : 0}
      blocked={reel.blocked}
      paused={reel.paused}
      muted={muted}
      volume={volume}
      soundBlocked={soundBlocked}
      replay={replay}
      tools={tools}
      covered={!playing || chapters}
      onStart={reel.start}
      onTogglePause={playing ? reel.togglePause : undefined}
      onToggleMute={onToggleMute}
      onVolume={onVolume}
      onSeek={playing ? seek : undefined}
    >
      <div className="absolute inset-0 isolate">
        {reel.clips.map((item) => (
          <video
            key={item.src}
            ref={item.attach}
            src={item.src}
            preload="auto"
            playsInline
            onPlaying={item.onPlaying}
            onTimeUpdate={item.onTimeUpdate}
            onEnded={item.onEnded}
            onError={item.onError}
            className={`${layer} ${item.front ? "z-[1]" : "z-0"}`}
          >
            <track kind="captions" />
          </video>
        ))}
      </div>
      {asking && (
        <AdChoices
          key={state.scene}
          ask={asking}
          seen={state.seen}
          onPick={(to) => play(to, state.scene)}
        />
      )}
      {ending && (
        <AdTrialEnd
          ending={ending.ending}
          title={ending.title()}
          found={endings.includes(ending.ending) ? endings : [...endings, ending.ending]}
          fresh={freshEnding}
          onBack={backToChoice}
          onRestart={restart}
          onFinish={onFinish}
        />
      )}
      {unlocked > 0 && (
        <p
          key={unlocked}
          className={`typetype-ad-unlock pointer-events-none absolute left-1/2 top-4 z-50 flex items-center gap-2 whitespace-nowrap px-3 py-1.5 text-sm font-semibold ${AD_CHIP}`}
        >
          <ListVideo className="h-4 w-4 text-yellow-300" aria-hidden="true" />
          {m.ad_new_chapter()}
        </p>
      )}
      {chapters && (
        <AdChapters
          known={known}
          endings={endings}
          onJump={jumpTo}
          onRestart={restart}
          onClose={() => setChapters(false)}
        />
      )}
    </AdFrame>
  );
}
