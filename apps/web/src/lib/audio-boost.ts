type BoostGraph = { context: AudioContext; gain: GainNode };

// A media element can be routed into Web Audio only once, and stays routed for its whole life, so the graph is kept
// per element and only built the first time a viewer asks for a boost.
const graphs = new WeakMap<HTMLMediaElement, BoostGraph>();

export function canBoost(video: HTMLVideoElement | null): video is HTMLVideoElement {
  // Only media fed through MediaSource is safe: a cross-origin file without CORS headers would play silent.
  return Boolean(video?.currentSrc.startsWith("blob:")) && typeof AudioContext !== "undefined";
}

export function currentBoost(video: HTMLVideoElement | null): number {
  return (video && graphs.get(video)?.gain.gain.value) ?? 1;
}

export function setBoost(video: HTMLVideoElement, value: number): void {
  let graph = graphs.get(video);
  if (!graph) {
    if (value === 1) return;
    const context = new AudioContext();
    const gain = context.createGain();
    context.createMediaElementSource(video).connect(gain).connect(context.destination);
    graph = { context, gain };
    graphs.set(video, graph);
  }
  if (graph.context.state === "suspended") void graph.context.resume();
  graph.gain.gain.value = value;
}
