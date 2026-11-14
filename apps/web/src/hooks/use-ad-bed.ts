import { useEffect, useRef } from "react";
import type { AdBed, AdMonitor } from "../lib/ad-bed";
import { trialAudioUrl } from "../lib/ad-media";
import { clampVolume } from "../lib/ad-player";

const MONITORS: Exclude<AdMonitor, "off">[] = ["normal", "rapide", "panique", "plat"];
// Level of the heart monitor in the linear edit of the ad.
const MONITOR_GAIN = 0.29;

// One gain line per sound, all feeding a master gain that follows the player volume.
type Deck = {
  context: AudioContext;
  master: GainNode;
  gains: Record<string, GainNode>;
  buffers: Record<string, AudioBuffer>;
  sources: Record<string, AudioBufferSourceNode | undefined>;
};

async function load(context: AudioContext, file: string): Promise<AudioBuffer> {
  const response = await fetch(trialAudioUrl(file));
  return context.decodeAudioData(await response.arrayBuffer());
}

function line(deck: Deck, name: string): GainNode {
  const gain = deck.context.createGain();
  gain.gain.value = 0;
  gain.connect(deck.master);
  deck.gains[name] = gain;
  return gain;
}

// Starts a sound once it is loaded, unless it is already running.
function ensure(deck: Deck, name: string, loop: boolean) {
  const buffer = deck.buffers[name];
  const gain = deck.gains[name];
  if (deck.sources[name] || !buffer || !gain) return;
  const source = deck.context.createBufferSource();
  source.buffer = buffer;
  source.loop = loop;
  source.connect(gain);
  source.start();
  source.onended = () => {
    if (deck.sources[name] === source) deck.sources[name] = undefined;
  };
  deck.sources[name] = source;
}

function fade(deck: Deck, name: string, level: number, seconds: number) {
  const gain = deck.gains[name];
  if (!gain) return;
  const now = deck.context.currentTime;
  gain.gain.cancelScheduledValues(now);
  gain.gain.setTargetAtTime(level, now, seconds / 3);
}

// Every change of bed is a fade: the sound never cuts with the picture.
function apply(deck: Deck, bed: AdBed) {
  if (bed.tirade > 0) ensure(deck, "tirade", false);
  if (bed.outro > 0) ensure(deck, "musique", true);
  fade(deck, "tirade", bed.tirade, bed.tirade > 0 ? 1.2 : 2);
  fade(deck, "musique", bed.outro, 1.5);
  for (const monitor of MONITORS) {
    ensure(deck, monitor, true);
    fade(deck, monitor, bed.monitor === monitor ? MONITOR_GAIN * bed.monitorLevel : 0, 0.5);
  }
}

// Runs the sound bed of the trial beside the clips, which only carry voices and effects.
export function useAdBed(bed: AdBed, volume: number, muted: boolean, playing: boolean): void {
  const deck = useRef<Deck | null>(null);
  const bedRef = useRef(bed);
  bedRef.current = bed;
  const playingRef = useRef(playing);
  playingRef.current = playing;

  useEffect(() => {
    const context = new AudioContext();
    const master = context.createGain();
    master.connect(context.destination);
    const made: Deck = { context, master, gains: {}, buffers: {}, sources: {} };
    deck.current = made;
    const files = ["tirade.mp3", "musique.mp3", ...MONITORS.map((name) => `moniteur_${name}.wav`)];
    const names = ["tirade", "musique", ...MONITORS];
    for (const name of names) line(made, name);
    void Promise.all(
      files.map(async (file, index) => {
        const name = names[index];
        if (name) made.buffers[name] = await load(context, file);
      }),
    )
      .then(() => {
        if (deck.current === made) apply(made, bedRef.current);
      })
      .catch(() => undefined);
    // An audio context created before the first gesture starts suspended.
    const wake = () => {
      if (playingRef.current) void context.resume().catch(() => undefined);
    };
    window.addEventListener("pointerdown", wake, { capture: true });
    window.addEventListener("keydown", wake, { capture: true });
    return () => {
      window.removeEventListener("pointerdown", wake, { capture: true });
      window.removeEventListener("keydown", wake, { capture: true });
      deck.current = null;
      void context.close();
    };
  }, []);

  useEffect(() => {
    const current = deck.current;
    if (current) apply(current, bed);
  }, [bed]);

  useEffect(() => {
    const current = deck.current;
    if (!current) return;
    const level = muted || !playing ? 0 : clampVolume(volume);
    current.master.gain.setTargetAtTime(level, current.context.currentTime, 0.05);
    // A paused ad freezes its music where it is, like its picture.
    if (playing) void current.context.resume().catch(() => undefined);
    else void current.context.suspend().catch(() => undefined);
  }, [volume, muted, playing]);
}
