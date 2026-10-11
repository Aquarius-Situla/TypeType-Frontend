import { AMBIENCE, DISTANT_FILES, DISTANT_POOL } from "./ambience-assets";
import { MUSIC, MUSIC_LEVEL } from "./audio-assets";
import { type CloseSounds, createCloseSounds } from "./close-sounds";
import { createNurserySounds, type NurserySounds } from "./nursery-sounds";
import type { LoopHandle, SoundBank } from "./sound-bank";
import { spatialMix } from "./spatial";

type Listener = { x: number; z: number; yaw: number };

const CRT_SNAP_MS = 430;

export type DistantSounds = {
  update: (
    listener: Listener,
    tv: { x: number; z: number; open: boolean } | null,
    now: number,
  ) => void;
  focus: (level: number) => void;
  isolate: (on: boolean) => void;
  tvOff: (pan: number, gain: number, now: number) => void;
  stretch: (pan: number) => void;
  neckCrack: (pan: number, index: number) => void;
  neckSnap: (pan: number) => void;
  torchDies: () => void;
  slam: (pan: number) => void;
  doorCreak: (pan: number) => void;
  draft: (gain: number, pan: number) => void;
  enterStairs: () => void;
  seal: () => void;
  hush: (seconds: number) => void;
  neonBuzz: (gain: number) => void;
  screenOn: () => void;
  credits: () => void;
  close: CloseSounds;
  nursery: NurserySounds;
  stop: () => void;
};

export function createDistantSounds(sounds: SoundBank, startedAt: number): DistantSounds {
  let tv: LoopHandle | null = null;
  let draft: LoopHandle | null = null;
  let buzz: LoopHandle | null = null;
  let nextAt = startedAt + 50000;
  let tvDeadAt = Number.POSITIVE_INFINITY;
  let focused = 0;
  let hushed = false;
  let isolated = false;
  void sounds.preload(DISTANT_FILES).then(() => {
    tv = sounds.loopFile(AMBIENCE.tvStatic);
    draft = sounds.loopFile(AMBIENCE.stairDraft);
    buzz = sounds.loopFile(AMBIENCE.neonBuzz);
  });

  return {
    close: createCloseSounds(sounds),
    nursery: createNurserySounds(sounds),
    update(listener, source, now) {
      if (isolated) return;
      if (!source) {
        tvDeadAt = Number.POSITIVE_INFINITY;
        tv?.set(0, 0, 400);
      } else if (now >= tvDeadAt) {
        tv?.cut();
      } else {
        const mix = spatialMix(listener, source, 450);
        tv?.set(
          mix.gain * (source.open ? 0.4 : 0.08),
          mix.pan,
          source.open ? Math.min(mix.lowpass, 2400) : 380,
        );
      }
      if (focused > 0.05) nextAt = Math.max(nextAt, now + 20000);
      if (now < nextAt) return;
      nextAt = now + 45000 + Math.random() * 45000;
      const path = DISTANT_POOL[Math.floor(Math.random() * DISTANT_POOL.length)];
      if (!path) return;
      const angle = Math.random() * Math.PI * 2;
      const at = { x: listener.x + Math.sin(angle) * 5000, z: listener.z - Math.cos(angle) * 5000 };
      const mix = spatialMix(listener, at, 900);
      sounds.playFile(path, {
        gain: 0.05 + Math.random() * 0.03,
        pan: mix.pan * 0.7,
        lowpass: 650,
        reverb: 1,
      });
    },
    isolate(on) {
      if (on === isolated) return;
      isolated = on;
      if (on) {
        tv?.set(0, 0, 400);
        draft?.set(0, 0, 1500);
        buzz?.set(0, 0, 5000);
      }
      if (!hushed) sounds.setMusicLevel(on ? 0 : 1 - 0.92 * focused, on ? 0.5 : 2.5);
    },
    focus(level) {
      if (hushed || isolated) return;
      if (Math.abs(level - focused) < 0.02 && level !== 0 && level !== 1) return;
      if (level === focused) return;
      const fallingAway = level > focused;
      focused = level;
      sounds.setMusicLevel(1 - 0.92 * level, fallingAway ? 0.4 : 1.2);
    },
    tvOff(pan, gain, now) {
      sounds.playFile(AMBIENCE.crtOff, { gain, pan, reverb: 0.2 });
      tvDeadAt = now + CRT_SNAP_MS;
    },
    neckCrack(pan, index) {
      const path = AMBIENCE.neckCracks[index % AMBIENCE.neckCracks.length] ?? "";
      sounds.playFile(path, {
        gain: 0.3 + index * 0.06,
        pan,
        rate: 0.9 + Math.random() * 0.06,
        reverb: 0.25,
        lowpass: 7000,
      });
    },
    torchDies() {
      sounds.play("flashlight", { gain: 0.5, rate: 0.9 });
    },
    neckSnap(pan) {
      sounds.playFile(AMBIENCE.neckSnap, {
        gain: 0.75,
        pan,
        rate: 0.86,
        reverb: 0.35,
        lowpass: 6000,
      });
    },
    stretch(pan) {
      sounds.playFile(AMBIENCE.skinStretch, { gain: 0.85, pan, rate: 0.92, reverb: 0.15 });
    },
    slam(pan) {
      sounds.playFile(AMBIENCE.door[0] ?? "", { gain: 1, pan, reverb: 0.45 });
    },
    doorCreak(pan) {
      sounds.playFile(AMBIENCE.doorCreak, { gain: 0.7, pan, reverb: 0.35 });
    },
    draft(gain, pan) {
      draft?.set(isolated ? 0 : gain, pan, 1500);
    },
    enterStairs() {
      sounds.playMusic(MUSIC.sickness, MUSIC_LEVEL, 14);
      sounds.preloadMusic(MUSIC.credits);
    },
    seal() {
      sounds.playFile(AMBIENCE.stoneSeal, { gain: 0.95, reverb: 0.55, echo: 0.2 });
    },
    hush(seconds) {
      hushed = true;
      nextAt = Number.POSITIVE_INFINITY;
      sounds.setMusicLevel(0, seconds);
    },
    neonBuzz(gain) {
      buzz?.set(isolated ? 0 : gain, 0, 5000);
    },
    screenOn() {
      sounds.playFile(AMBIENCE.screenOn, { gain: 1, reverb: 0.8, echo: 0.35 });
    },
    credits() {
      sounds.setMusicLevel(1, 0.2);
      sounds.playMusic(MUSIC.credits, 0.85, 0.6);
    },
    stop() {
      tv?.stop();
      draft?.stop();
      buzz?.stop();
    },
  };
}
