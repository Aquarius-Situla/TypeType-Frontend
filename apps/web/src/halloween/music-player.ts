export type MusicTrack = {
  url: string;
  loopStart: number;
  loopEnd: number;
};

export type MusicPlayer = {
  preload: (track: MusicTrack) => Promise<void>;
  play: (track: MusicTrack, level: number, fadeSeconds: number) => Promise<void>;
  stop: () => void;
};

const CROSSFADE = 4;
const CURVE_STEPS = 64;
const FADE_IN = Float32Array.from({ length: CURVE_STEPS }, (_, i) =>
  Math.sin(((i / (CURVE_STEPS - 1)) * Math.PI) / 2),
);
const FADE_OUT = Float32Array.from({ length: CURVE_STEPS }, (_, i) =>
  Math.cos(((i / (CURVE_STEPS - 1)) * Math.PI) / 2),
);

type Playing = { gain: GainNode; sources: Set<AudioBufferSourceNode>; timer: number };

export function createMusicPlayer(context: AudioContext, output: AudioNode): MusicPlayer {
  const buffers = new Map<string, Promise<AudioBuffer>>();
  let current: Playing | null = null;

  const load = (url: string): Promise<AudioBuffer> => {
    const cached = buffers.get(url);
    if (cached) return cached;
    const loading = fetch(url)
      .then((response) => response.arrayBuffer())
      .then((data) => context.decodeAudioData(data));
    buffers.set(url, loading);
    return loading;
  };

  const fadeOut = (playing: Playing, seconds: number): void => {
    const now = context.currentTime;
    window.clearTimeout(playing.timer);
    playing.gain.gain.cancelScheduledValues(now);
    playing.gain.gain.setValueAtTime(playing.gain.gain.value, now);
    playing.gain.gain.linearRampToValueAtTime(0, now + seconds);
    for (const source of playing.sources) source.stop(now + seconds + 0.05);
  };

  const start = (buffer: AudioBuffer, track: MusicTrack, playing: Playing): void => {
    const end = Math.min(track.loopEnd, buffer.duration);
    const pass = (offset: number, at: number, fadeIn: boolean): void => {
      const source = context.createBufferSource();
      source.buffer = buffer;
      const voice = context.createGain();
      source.connect(voice).connect(playing.gain);
      if (fadeIn) voice.gain.setValueCurveAtTime(FADE_IN, at, CROSSFADE);
      const endsAt = at + (end - offset);
      voice.gain.setValueCurveAtTime(FADE_OUT, endsAt - CROSSFADE, CROSSFADE);
      source.start(at, offset);
      source.stop(endsAt + 0.05);
      playing.sources.add(source);
      source.onended = () => playing.sources.delete(source);
      const nextAt = endsAt - CROSSFADE;
      const wait = Math.max(0, (nextAt - context.currentTime - 2) * 1000);
      playing.timer = window.setTimeout(() => pass(track.loopStart, nextAt, true), wait);
    };
    pass(0, context.currentTime + 0.05, false);
  };

  return {
    async preload(track) {
      await load(track.url);
    },
    async play(track, level, fadeSeconds) {
      const buffer = await load(track.url);
      if (current) fadeOut(current, fadeSeconds);
      const gain = context.createGain();
      gain.connect(output);
      gain.gain.setValueAtTime(0, context.currentTime);
      gain.gain.linearRampToValueAtTime(level, context.currentTime + fadeSeconds);
      const playing: Playing = { gain, sources: new Set(), timer: 0 };
      current = playing;
      start(buffer, track, playing);
    },
    stop() {
      if (current) fadeOut(current, 0.3);
      current = null;
    },
  };
}
