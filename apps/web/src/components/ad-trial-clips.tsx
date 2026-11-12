import type { useAdReel } from "../hooks/use-ad-reel";

const LAYER = "absolute inset-0 h-full w-full bg-black object-contain";

// The clips of the trial stacked on each other: the one playing in front, the next ones loading behind.
export function AdTrialClips({ clips }: { clips: ReturnType<typeof useAdReel>["clips"] }) {
  return (
    <div className="absolute inset-0 isolate">
      {clips.map((item) => (
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
          className={`${LAYER} ${item.front ? "z-[1]" : "z-0"}`}
        >
          <track kind="captions" />
        </video>
      ))}
    </div>
  );
}
