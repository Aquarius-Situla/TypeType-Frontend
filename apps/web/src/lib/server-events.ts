import { toApiUrl } from "./env";
import {
  parseServerHello,
  parseServerNotice,
  type ServerHello,
  type ServerNotice,
} from "./server-status";

const MAX_RETRY_MS = 5_000;
const HELLO_WAIT_MS = 3_000;

export type ServerEventHandlers = {
  onHello: (hello: ServerHello) => void;
  onNotice: (notice: ServerNotice) => void;
  onCleared: () => void;
  onLost: () => void;
  onReachable: () => void;
};

export function parseServerEventBlock(block: string): { event: string; data: string } | null {
  let event = "";
  const data: string[] = [];
  for (const line of block.split("\n")) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
  }
  return event ? { event, data: data.join("\n") } : null;
}

function dispatch(block: string, handlers: ServerEventHandlers): void {
  const parsed = parseServerEventBlock(block);
  if (!parsed) return;
  if (parsed.event === "clear") {
    handlers.onCleared();
    return;
  }
  let payload: unknown;
  try {
    payload = JSON.parse(parsed.data);
  } catch {
    return;
  }
  if (parsed.event === "hello") {
    const hello = parseServerHello(payload);
    if (hello) handlers.onHello(hello);
  } else if (parsed.event === "notice") {
    const notice = parseServerNotice(payload);
    if (notice) handlers.onNotice(notice);
  }
}

async function readServerEvents(handlers: ServerEventHandlers, signal: AbortSignal) {
  const response = await fetch(toApiUrl("/server/events"), {
    headers: { Accept: "text/event-stream" },
    signal,
  });
  if (response.status === 404) return "unsupported";
  if (!response.ok || !response.body) throw new Error(`server events failed: ${response.status}`);
  const silent = setTimeout(handlers.onReachable, HELLO_WAIT_MS);
  signal.addEventListener("abort", () => clearTimeout(silent), { once: true });
  const greet = handlers.onHello;
  handlers = {
    ...handlers,
    onHello: (hello) => {
      clearTimeout(silent);
      greet(hello);
    },
  };
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  while (!signal.aborted) {
    const { value, done } = await reader.read();
    if (done) break;
    const blocks = (buffer + value).replace(/\r\n/g, "\n").split("\n\n");
    buffer = blocks.pop() ?? "";
    for (const block of blocks) dispatch(block, handlers);
  }
  clearTimeout(silent);
  return "closed";
}

// A server without this endpoint answers 404: the watch stops and the client behaves as before.
export function watchServerEvents(handlers: ServerEventHandlers): () => void {
  const controller = new AbortController();
  let attempt = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const run = async () => {
    try {
      const greeted = (hello: ServerHello) => {
        attempt = 0;
        handlers.onHello(hello);
      };
      const outcome = await readServerEvents({ ...handlers, onHello: greeted }, controller.signal);
      if (outcome === "unsupported") return;
    } catch {
      // Falls through to the reconnect below: a dropped stream and a refused one are handled alike.
    }
    if (controller.signal.aborted) return;
    handlers.onLost();
    timer = setTimeout(run, Math.min(MAX_RETRY_MS, 1_000 * 2 ** attempt));
    attempt += 1;
  };
  void run();
  return () => {
    controller.abort();
    if (timer) clearTimeout(timer);
  };
}
