import { SOUND_URLS, type SoundName } from "./audio-assets";
import { createHallEcho } from "./hall-echo";
import { createHallReverb } from "./hall-reverb";
import { createMusicPlayer, type MusicTrack } from "./music-player";

type PlayOptions = {
  gain?: number;
  pan?: number;
  rate?: number;
  echo?: number;
  reverb?: number;
  lowpass?: number;
};

export type LoopHandle = {
  set: (gain: number, pan: number, lowpass: number) => void;
  cut: () => void;
  stop: () => void;
};

export type SoundBank = {
  play: (name: SoundName, options?: PlayOptions) => void;
  startHum: (level: number, fadeSeconds: number) => void;
  setHumLevel: (level: number, fadeSeconds: number) => void;
  playMusic: (track: MusicTrack, level: number, fadeSeconds: number) => void;
  preloadMusic: (track: MusicTrack) => void;
  setMusicLevel: (level: number, seconds: number) => void;
  preload: (paths: readonly string[]) => Promise<void>;
  playFile: (path: string, options?: PlayOptions) => () => void;
  playBuffer: (buffer: AudioBuffer, options?: PlayOptions) => () => void;
  loopFile: (path: string) => LoopHandle | null;
  close: (fadeSeconds: number) => Promise<void>;
};

async function decode(context: AudioContext, url: string): Promise<AudioBuffer> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to load ${url}: ${response.status}`);
  return context.decodeAudioData(await response.arrayBuffer());
}

function ramp(context: AudioContext, param: AudioParam, value: number, seconds: number): void {
  const now = context.currentTime;
  param.cancelScheduledValues(now);
  param.setValueAtTime(param.value, now);
  param.linearRampToValueAtTime(value, now + Math.max(0.01, seconds));
}

export async function createSoundBank(): Promise<SoundBank> {
  const context = new AudioContext();
  const master = context.createGain();
  master.connect(context.destination);
  const echo = createHallEcho(context, master);
  const reverb = createHallReverb(context, master);
  const names = Object.keys(SOUND_URLS).filter((key): key is SoundName => key in SOUND_URLS);
  const decoded = await Promise.all(names.map((name) => decode(context, SOUND_URLS[name])));
  const buffers = new Map<SoundName, AudioBuffer>(names.map((name, i) => [name, decoded[i]]));
  const hum = context.createGain();
  hum.gain.value = 0;
  hum.connect(master);
  let humSource: AudioBufferSourceNode | null = null;
  const musicGain = context.createGain();
  musicGain.gain.value = 1;
  musicGain.connect(master);
  const music = createMusicPlayer(context, musicGain);
  const files = new Map<string, AudioBuffer>();

  const send = (from: AudioNode, to: AudioNode, amount: number): void => {
    if (amount <= 0) return;
    const gain = context.createGain();
    gain.gain.value = amount;
    from.connect(gain).connect(to);
  };

  const playBuffer = (
    buffer: AudioBuffer,
    {
      gain = 1,
      pan = 0,
      rate = 1,
      echo: echoSend = 0,
      reverb: reverbSend = 0,
      lowpass = 20000,
    }: PlayOptions = {},
  ): (() => void) => {
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = rate;
    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = lowpass;
    const level = context.createGain();
    level.gain.value = gain;
    const panner = context.createStereoPanner();
    panner.pan.value = pan;
    source.connect(filter).connect(level).connect(panner).connect(master);
    send(panner, echo, echoSend);
    send(panner, reverb, reverbSend);
    source.start();
    return () => {
      try {
        source.stop();
      } catch {
        return;
      }
    };
  };

  return {
    play(name, options) {
      const buffer = buffers.get(name);
      if (buffer) playBuffer(buffer, options);
    },
    playFile(path, options) {
      const buffer = files.get(path);
      return buffer ? playBuffer(buffer, options) : () => undefined;
    },
    playBuffer,
    async preload(paths) {
      const missing = paths.filter((path) => !files.has(path));
      const decodedFiles = await Promise.all(
        missing.map((path) => decode(context, path).catch(() => null)),
      );
      missing.forEach((path, i) => {
        const buffer = decodedFiles[i];
        if (buffer) files.set(path, buffer);
      });
    },
    loopFile(path) {
      const buffer = files.get(path);
      if (!buffer) return null;
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const filter = context.createBiquadFilter();
      filter.type = "lowpass";
      const level = context.createGain();
      level.gain.value = 0;
      const panner = context.createStereoPanner();
      source.connect(filter).connect(level).connect(panner).connect(master);
      send(panner, reverb, 0.25);
      source.start();
      return {
        set(gain, pan, lowpass) {
          const now = context.currentTime;
          level.gain.setTargetAtTime(gain, now, 0.08);
          panner.pan.setTargetAtTime(pan, now, 0.08);
          filter.frequency.setTargetAtTime(lowpass, now, 0.08);
        },
        cut() {
          level.gain.cancelScheduledValues(context.currentTime);
          level.gain.setValueAtTime(0, context.currentTime);
        },
        stop() {
          source.stop();
        },
      };
    },
    startHum(level, fadeSeconds) {
      const buffer = buffers.get("hum");
      if (!buffer || humSource) return;
      humSource = context.createBufferSource();
      humSource.buffer = buffer;
      humSource.loop = true;
      humSource.connect(hum);
      humSource.start();
      ramp(context, hum.gain, level, fadeSeconds);
    },
    setHumLevel(level, fadeSeconds) {
      ramp(context, hum.gain, level, fadeSeconds);
    },
    playMusic(track, level, fadeSeconds) {
      void music.play(track, level, fadeSeconds);
    },
    preloadMusic(track) {
      void music.preload(track);
    },
    setMusicLevel(level, seconds) {
      ramp(context, musicGain.gain, level, seconds);
    },
    async close(fadeSeconds) {
      ramp(context, master.gain, 0, fadeSeconds);
      await new Promise((resolve) => setTimeout(resolve, fadeSeconds * 1000 + 50));
      music.stop();
      await context.close();
    },
  };
}
