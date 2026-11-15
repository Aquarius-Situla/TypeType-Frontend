// YouTube WebVTT lists manual captions twice (one copy per styling pass) and pins auto captions to the left
// (align:start position:0%). Vidstack merged the copies and drew every cue centred; the browser renderer follows the
// file, so a loaded track drops the repeated cues and centres the rest at the bottom.
export function normalizeTextTrackCues(track: TextTrack): void {
  const cues = track.cues;
  if (!cues) return;
  const seen = new Set<string>();
  const repeated: TextTrackCue[] = [];
  for (const cue of Array.from(cues)) {
    const vtt = cue as VTTCue;
    const key = `${cue.startTime}|${cue.endTime}|${"text" in cue ? String(vtt.text) : ""}`;
    if (seen.has(key)) {
      repeated.push(cue);
      continue;
    }
    seen.add(key);
    if ("align" in cue) {
      vtt.line = "auto";
      vtt.position = "auto";
      vtt.size = 100;
      vtt.align = "center";
    }
  }
  for (const cue of repeated) track.removeCue(cue);
}

const watched = new WeakSet<HTMLTrackElement>();

export function normalizeTrackOnLoad(element: HTMLTrackElement | null): void {
  if (!element || watched.has(element)) return;
  watched.add(element);
  element.addEventListener("load", () => normalizeTextTrackCues(element.track));
}
