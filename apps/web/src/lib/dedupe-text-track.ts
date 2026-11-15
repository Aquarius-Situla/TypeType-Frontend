// YouTube WebVTT lists every caption twice (one copy per styling pass). The Vidstack renderer merged them; the
// browser draws both, so a loaded track drops cues that repeat another one's start, end and text.
export function dedupeTextTrackCues(track: TextTrack): void {
  const cues = track.cues;
  if (!cues) return;
  const seen = new Set<string>();
  const repeated: TextTrackCue[] = [];
  for (const cue of Array.from(cues)) {
    const text = "text" in cue ? String((cue as VTTCue).text) : "";
    const key = `${cue.startTime}|${cue.endTime}|${text}`;
    if (seen.has(key)) repeated.push(cue);
    else seen.add(key);
  }
  for (const cue of repeated) track.removeCue(cue);
}

const watched = new WeakSet<HTMLTrackElement>();

export function dedupeTrackOnLoad(element: HTMLTrackElement | null): void {
  if (!element || watched.has(element)) return;
  watched.add(element);
  element.addEventListener("load", () => dedupeTextTrackCues(element.track));
}
