import { ListVideo } from "lucide-react";
import { useMemo } from "react";
import { useAdBed } from "../hooks/use-ad-bed";
import { useAdReel } from "../hooks/use-ad-reel";
import { useAdTrialRun } from "../hooks/use-ad-trial-run";
import { bedFor } from "../lib/ad-bed";
import { trialClipUrl } from "../lib/ad-media";
import { AD_CHIP, type AdPlayerProps } from "../lib/ad-player";
import { upcomingClips } from "../lib/ad-trial-clips";
import { m } from "../paraglide/messages.js";
import { AdChapters } from "./ad-chapters";
import { AdChoices } from "./ad-choices";
import { AdFrame } from "./ad-frame";
import { AdTrialClips } from "./ad-trial-clips";
import { AdTrialEnd } from "./ad-trial-end";
import { AdTrialTools } from "./ad-trial-tools";

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
  const run = useAdTrialRun(progress, onFinish);
  const { state, asking, ending, known, endings, chapters, setChapters, unlocked, reached } = run;
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
    onEnded: run.clipEnded,
    onFailed: onFinish,
    onSoundBlocked,
  });
  const bed = useMemo(() => bedFor(state.scene, state.waiting), [state.scene, state.waiting]);
  useAdBed(bed, volume, muted, !reel.blocked && !reel.paused);

  const playing = !asking && !ending;

  function seek(seconds: number) {
    const limit = reached.current.scene === state.scene ? reached.current.time : 0;
    reel.seek(known.has(state.scene) ? seconds : Math.min(seconds, limit));
  }
  const canSkip = playing && known.has(state.scene);
  const tools = (
    <AdTrialTools
      canSkip={canSkip}
      onSkip={reel.skip}
      onChapters={() => setChapters((open) => !open)}
    />
  );

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
      <AdTrialClips clips={reel.clips} />
      {asking && (
        <AdChoices
          key={state.scene}
          ask={asking}
          seen={state.seen}
          onPick={(to) => run.play(to, state.scene)}
        />
      )}
      {ending && (
        <AdTrialEnd
          ending={ending.ending}
          title={ending.title()}
          found={endings.includes(ending.ending) ? endings : [...endings, ending.ending]}
          fresh={run.freshEnding}
          onBack={run.backToChoice}
          onRestart={run.restart}
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
          onJump={run.jumpTo}
          onRestart={run.restart}
          onClose={() => setChapters(false)}
        />
      )}
    </AdFrame>
  );
}
