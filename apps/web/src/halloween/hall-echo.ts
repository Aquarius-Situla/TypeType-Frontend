const ECHO_DELAY_SECONDS = 0.31;
const ECHO_FEEDBACK = 0.36;
const ECHO_TONE_HZ = 2200;

export function createHallEcho(context: AudioContext, destination: AudioNode): AudioNode {
  const input = context.createGain();
  const delay = context.createDelay(2);
  delay.delayTime.value = ECHO_DELAY_SECONDS;
  const tone = context.createBiquadFilter();
  tone.type = "lowpass";
  tone.frequency.value = ECHO_TONE_HZ;
  const feedback = context.createGain();
  feedback.gain.value = ECHO_FEEDBACK;
  input.connect(delay);
  delay.connect(tone);
  tone.connect(feedback);
  feedback.connect(delay);
  tone.connect(destination);
  return input;
}
