export type VttCue = {
  startSeconds: number;
  endSeconds: number;
  text: string;
};

export function formatVttTimestamp(seconds: number): string {
  const s = Math.max(0, seconds);
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const secs = Math.floor(s % 60);
  const ms = Math.floor((s % 1) * 1000);

  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  const ss = String(secs).padStart(2, "0");
  const mmm = String(ms).padStart(3, "0");

  return `${hh}:${mm}:${ss}.${mmm}`;
}

export function parseVttTimestamp(timestamp: string): number {
  const parts = timestamp.trim().split(":");
  if (parts.length === 2) {
    const [m, s] = parts;
    return Number.parseFloat(m) * 60 + Number.parseFloat(s);
  }
  if (parts.length === 3) {
    const [h, m, s] = parts;
    return Number.parseFloat(h) * 3600 + Number.parseFloat(m) * 60 + Number.parseFloat(s);
  }
  return 0;
}

export function buildWebVtt(cues: VttCue[]): string {
  const lines = ["WEBVTT", ""];
  for (let i = 0; i < cues.length; i++) {
    const cue = cues[i];
    lines.push(String(i + 1));
    lines.push(`${formatVttTimestamp(cue.startSeconds)} --> ${formatVttTimestamp(cue.endSeconds)}`);
    lines.push(cue.text.trim());
    lines.push("");
  }
  return lines.join("\n");
}

export function parseWebVtt(vttContent: string): VttCue[] {
  const cues: VttCue[] = [];
  const lines = vttContent.replace(/\r\n/g, "\n").split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();
    if (line.includes("-->")) {
      const [startStr, endStr] = line.split("-->").map((s) => s.trim().split(" ")[0]);
      const startSeconds = parseVttTimestamp(startStr);
      const endSeconds = parseVttTimestamp(endStr);
      i++;
      const textLines: string[] = [];
      while (i < lines.length && lines[i].trim().length > 0 && !lines[i].includes("-->")) {
        textLines.push(lines[i].trim());
        i++;
      }
      if (textLines.length > 0) {
        cues.push({
          startSeconds,
          endSeconds,
          text: textLines.join(" "),
        });
      }
    } else {
      i++;
    }
  }

  return cues;
}

export function vttToDataUrl(vtt: string): string {
  return `data:text/vtt;charset=utf-8,${encodeURIComponent(vtt)}`;
}

export async function callLlmChat(
  endpoint: string,
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[],
): Promise<string> {
  const url = endpoint.endsWith("/")
    ? `${endpoint}chat/completions`
    : `${endpoint}/chat/completions`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`LLM API error (${response.status}): ${errorBody.slice(0, 200)}`);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from LLM API");
  }

  return content;
}
