import { AMBIENCE } from "./ambience-assets";
import { HEART_FROM } from "./corridor/tension";
import type { SoundBank } from "./sound-bank";
import type { SpatialMix } from "./spatial";
import { BREATH_SECONDS, breathSamples, heartbeatSamples } from "./synth-samples";

export type CloseSounds = {
  tension: (level: number, now: number) => void;
  alarm: () => () => void;
  powerCut: () => void;
  toyDrop: (mix: SpatialMix) => void;
  lampFlicker: () => void;
};

const RATE = 44100;

function toBuffer(samples: Float32Array<ArrayBuffer>): AudioBuffer {
  const buffer = new AudioBuffer({ length: samples.length, sampleRate: RATE, numberOfChannels: 1 });
  buffer.copyToChannel(samples, 0);
  return buffer;
}

export function createCloseSounds(sounds: SoundBank): CloseSounds {
  const breath = toBuffer(breathSamples(RATE));
  const heart = toBuffer(heartbeatSamples(RATE));
  let felt = 0;
  let last = 0;
  let nextBreath = 0;
  let nextBeat = 0;

  return {
    tension(level, now) {
      const dt = last === 0 ? 0 : Math.min(0.1, (now - last) / 1000);
      last = now;
      felt += (level - felt) * Math.min(1, dt * (level > felt ? 1.2 : 0.25));
      if (now >= nextBreath) {
        const rate = 1 + 0.18 * felt;
        sounds.playBuffer(breath, {
          gain: 0.008 + 0.022 * felt,
          rate: rate * (0.97 + Math.random() * 0.06),
          lowpass: 1800 + 2200 * felt,
          reverb: 0.05,
        });
        const length = (BREATH_SECONDS / rate) * 1000;
        nextBreath =
          now + Math.max(length + 250, 5400 - 2600 * felt) * (0.92 + Math.random() * 0.16);
      }
      if (felt > HEART_FROM && now >= nextBeat) {
        const fear = (felt - HEART_FROM) / (1 - HEART_FROM);
        sounds.playBuffer(heart, { gain: 0.12 + 0.3 * fear, lowpass: 240 });
        nextBeat = now + 60000 / (66 + 54 * fear);
      }
    },
    alarm() {
      return sounds.playFile(AMBIENCE.easAlarm, { gain: 0.9, reverb: 0.6, echo: 0.2 });
    },
    powerCut() {
      sounds.play("powerDie", { gain: 0.8, reverb: 0.5, echo: 0.3 });
    },
    toyDrop({ gain, pan, lowpass }) {
      sounds.playFile(AMBIENCE.plushDrop, {
        gain: 0.25 + 0.55 * gain,
        pan,
        lowpass: Math.max(900, lowpass),
        rate: 0.9 + Math.random() * 0.12,
        reverb: 0.35,
      });
    },
    lampFlicker() {
      sounds.playFile(AMBIENCE.lampFlicker, { gain: 0.55 });
      sounds.play("flashlight", { gain: 0.35, rate: 1.1 });
    },
  };
}
