import { useAuthStore } from "../stores/auth-store";

export function splitEvents(buffer: string): { events: string[]; rest: string } {
  const normalized = buffer.replace(/\r\n/g, "\n");
  const blocks = normalized.split("\n\n");
  const rest = blocks.pop() ?? "";
  const events: string[] = [];
  for (const block of blocks) {
    const data = block
      .split("\n")
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trimStart())
      .join("\n");
    if (data) events.push(data);
  }
  return { events, rest };
}

export async function readEventStream(
  url: string,
  onData: (data: string) => void,
  signal: AbortSignal,
): Promise<void> {
  const headers = new Headers({ Accept: "text/event-stream" });
  const token = useAuthStore.getState().token;
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(url, { headers, signal });
  if (!response.ok || !response.body) throw new Error(`event stream failed: ${response.status}`);
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  while (!signal.aborted) {
    const { value, done } = await reader.read();
    if (done) return;
    buffer += value;
    const { events, rest } = splitEvents(buffer);
    buffer = rest;
    for (const data of events) onData(data);
  }
}
