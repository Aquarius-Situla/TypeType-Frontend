type JsonCue = { startTime: number; endTime: number; text: string };

function timestamp(seconds: number): string {
  const ms = Math.max(0, Math.round(seconds * 1000));
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  const rest = ms % 1000;
  const pad = (value: number, size = 2) => String(value).padStart(size, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}.${pad(rest, 3)}`;
}

function isCue(value: unknown): value is JsonCue {
  if (!value || typeof value !== "object") return false;
  const cue = value as Record<string, unknown>;
  return (
    typeof cue.startTime === "number" &&
    typeof cue.endTime === "number" &&
    typeof cue.text === "string"
  );
}

export function toWebVtt(text: string): string | null {
  if (text.trimStart().startsWith("WEBVTT")) return text;
  try {
    const parsed: unknown = JSON.parse(text);
    if (!Array.isArray(parsed)) return null;
    const cues = parsed.filter(isCue);
    if (cues.length === 0) return null;
    const body = cues
      .map(
        (cue) =>
          `${timestamp(cue.startTime)} --> ${timestamp(cue.endTime)}\n${cue.text.replace(/\n/g, " ")}`,
      )
      .join("\n\n");
    return `WEBVTT\n\n${body}\n`;
  } catch {
    return null;
  }
}
