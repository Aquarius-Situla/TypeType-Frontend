type ServerNoticeKind = "restart" | "update" | "maintenance";

export type ServerNotice = {
  kind: ServerNoticeKind;
  message: string | null;
  resumeInSeconds: number | null;
  issuedAt: number;
};

export type ServerHello = {
  bootId: string;
  notice: ServerNotice | null;
};

export type ServerPhase = "online" | "restarting" | "unreachable";

export type ServerStatus = {
  connected: boolean;
  phase: ServerPhase;
  notice: ServerNotice | null;
  bootId: string | null;
  resumes: number;
};

export const INITIAL_SERVER_STATUS: ServerStatus = {
  connected: true,
  phase: "online",
  notice: null,
  bootId: null,
  resumes: 0,
};

const KINDS = new Set<string>(["restart", "update", "maintenance"]);

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

export function parseServerNotice(value: unknown): ServerNotice | null {
  const raw = record(value);
  if (!raw || typeof raw.kind !== "string" || !KINDS.has(raw.kind)) return null;
  return {
    kind: raw.kind as ServerNoticeKind,
    message: typeof raw.message === "string" && raw.message.trim() ? raw.message.trim() : null,
    resumeInSeconds: typeof raw.resumeInSeconds === "number" ? raw.resumeInSeconds : null,
    issuedAt: typeof raw.issuedAt === "number" ? raw.issuedAt : 0,
  };
}

export function parseServerHello(value: unknown): ServerHello | null {
  const raw = record(value);
  if (!raw || typeof raw.bootId !== "string" || !raw.bootId) return null;
  return { bootId: raw.bootId, notice: parseServerNotice(raw.notice) };
}

export function isServerAvailable(status: ServerStatus): boolean {
  return status.connected && status.phase === "online";
}

export function serverGreeted(status: ServerStatus, hello: ServerHello): ServerStatus {
  const restarting = hello.notice?.kind === "restart";
  const recovered =
    status.phase !== "online" || (status.bootId !== null && status.bootId !== hello.bootId);
  return {
    connected: true,
    bootId: hello.bootId,
    notice: hello.notice,
    phase: restarting ? "restarting" : "online",
    resumes: !restarting && recovered ? status.resumes + 1 : status.resumes,
  };
}

export function serverAnnounced(status: ServerStatus, notice: ServerNotice): ServerStatus {
  return { ...status, notice, phase: notice.kind === "restart" ? "restarting" : status.phase };
}

export function serverNoticeCleared(status: ServerStatus): ServerStatus {
  return { ...status, notice: null };
}

export function serverLost(status: ServerStatus): ServerStatus {
  return status.connected ? { ...status, connected: false } : status;
}

export function serverLossConfirmed(status: ServerStatus): ServerStatus {
  if (status.connected || status.phase !== "online") return status;
  return { ...status, phase: "unreachable" };
}

// The event stream answered but no hello came through: a proxy that buffers the stream holds it back. Every other
// request reaches the server, so the loss is over, and players that failed on it get their resume.
export function serverReached(status: ServerStatus): ServerStatus {
  if (status.connected) return status;
  const wasUnreachable = status.phase === "unreachable";
  return {
    ...status,
    connected: true,
    phase: wasUnreachable ? "online" : status.phase,
    resumes: wasUnreachable ? status.resumes + 1 : status.resumes,
  };
}
