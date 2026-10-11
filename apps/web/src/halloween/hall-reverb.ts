export type ImpulseOptions = {
  seconds: number;
  decay: number;
  preDelaySeconds: number;
};

export function hallImpulseChannels(
  sampleRate: number,
  { seconds, decay, preDelaySeconds }: ImpulseOptions,
  random: () => number = Math.random,
): [Float32Array, Float32Array] {
  const length = Math.max(1, Math.floor(sampleRate * seconds));
  const preDelay = Math.floor(sampleRate * preDelaySeconds);
  const channels: [Float32Array, Float32Array] = [
    new Float32Array(length),
    new Float32Array(length),
  ];
  for (const data of channels) {
    for (let i = preDelay; i < length; i += 1) {
      const t = (i - preDelay) / Math.max(1, length - preDelay);
      data[i] = (random() * 2 - 1) * (1 - t) ** decay;
    }
  }
  return channels;
}

export function createHallReverb(context: AudioContext, destination: AudioNode): AudioNode {
  const [left, right] = hallImpulseChannels(context.sampleRate, {
    seconds: 2.8,
    decay: 3.2,
    preDelaySeconds: 0.025,
  });
  const impulse = context.createBuffer(2, left.length, context.sampleRate);
  impulse.copyToChannel(new Float32Array(left), 0);
  impulse.copyToChannel(new Float32Array(right), 1);
  const convolver = context.createConvolver();
  convolver.buffer = impulse;
  convolver.connect(destination);
  return convolver;
}
