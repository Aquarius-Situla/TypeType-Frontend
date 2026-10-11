import { AMBIENCE } from "./ambience-assets";
import type { Crack } from "./corridor/nursery";
import type { LoopHandle, SoundBank } from "./sound-bank";
import { fallSamples, thudSamples } from "./synth-samples";

export type NurserySounds = {
  floor: (crack: Crack) => void;
  land: () => void;
  crying: (level: number, pan: number) => void;
  hushCrying: () => void;
  ave: (gain: number, pan: number, lowpass: number) => void;
  muffleAve: () => void;
  trailAve: () => void;
  endAve: () => void;
  tvOn: () => void;
};

const RATE = 44100;

function toBuffer(samples: Float32Array<ArrayBuffer>): AudioBuffer {
  const buffer = new AudioBuffer({ length: samples.length, sampleRate: RATE, numberOfChannels: 1 });
  buffer.copyToChannel(samples, 0);
  return buffer;
}

export function createNurserySounds(sounds: SoundBank): NurserySounds {
  const whoosh = toBuffer(fallSamples(RATE));
  const thud = toBuffer(thudSamples(RATE));
  let cry: LoopHandle | null = null;
  let ave: LoopHandle | null = null;

  return {
    floor(crack) {
      if (crack === "creak")
        sounds.playFile(AMBIENCE.floorCreak, { gain: 0.8, rate: 0.85, reverb: 0.4 });
      if (crack === "break")
        setTimeout(() => sounds.playBuffer(whoosh, { gain: 0.75, rate: 0.8, reverb: 0.2 }), 600);
    },
    land() {
      sounds.playBuffer(thud, { gain: 1, reverb: 0.5, echo: 0.2 });
    },
    crying(level, pan) {
      cry ??= sounds.loopFile(AMBIENCE.babyCry);
      cry?.set(0.75 * level, pan, 1500 + 6500 * level);
    },
    hushCrying() {
      cry?.cut();
      cry?.stop();
      cry = null;
    },
    ave(gain, pan, lowpass) {
      ave ??= sounds.loopFile(AMBIENCE.aveMaria);
      ave?.set(gain, pan, lowpass);
    },
    muffleAve() {
      ave?.set(0.3, 0, 600);
    },
    trailAve() {
      ave?.set(0.067, 0, 800);
    },
    tvOn() {
      sounds.playFile(AMBIENCE.screenOn, { gain: 0.8, rate: 1.2, reverb: 0.5 });
    },
    endAve() {
      ave?.set(0, 0, 800);
      const fading = ave;
      ave = null;
      setTimeout(() => fading?.stop(), 600);
    },
  };
}
