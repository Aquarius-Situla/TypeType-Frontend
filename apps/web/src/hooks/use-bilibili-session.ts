import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "../lib/api";
import {
  disconnectBiliBiliSession,
  fetchBiliBiliSessionStatus,
  pollBiliBiliQrLogin,
  startBiliBiliQrLogin,
} from "../lib/api-bilibili-session";
import { m } from "../paraglide/messages.js";
import { useAuth } from "./use-auth";

const BILIBILI_SESSION_KEY = ["bilibili-session"];

export type BiliBiliQrPhase =
  | "idle"
  | "generating"
  | "waiting"
  | "scanned"
  | "confirmed"
  | "expired"
  | "error";

function getQrErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 503 || error.code === "bilibili_session_unavailable") {
      return m.ui_bilibili_session_not_configured();
    }
    if (error.status === 429 || error.code === "bilibili_rate_limited") {
      return m.ui_bilibili_session_rate_limited();
    }
  }
  return m.ui_bilibili_session_qr_unavailable();
}

export function useBiliBiliSession() {
  const qc = useQueryClient();
  const { authReady, isAuthed } = useAuth();
  const [qrPhase, setQrPhase] = useState<BiliBiliQrPhase>("idle");
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const qrcodeKeyRef = useRef<string | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const status = useQuery({
    queryKey: BILIBILI_SESSION_KEY,
    queryFn: fetchBiliBiliSessionStatus,
    enabled: authReady && isAuthed,
    staleTime: 60_000,
  });

  const disconnect = useMutation({
    mutationFn: disconnectBiliBiliSession,
    onSuccess: () => qc.invalidateQueries({ queryKey: BILIBILI_SESSION_KEY }),
  });

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const startQr = useCallback(async () => {
    setQrPhase("generating");
    setQrError(null);
    setQrUrl(null);
    stopPolling();
    try {
      const result = await startBiliBiliQrLogin();
      qrcodeKeyRef.current = result.qrcodeKey;
      setQrUrl(result.qrUrl);
      setQrPhase("waiting");
      const expiresAt = result.expiresAt;
      pollTimerRef.current = setInterval(async () => {
        if (Date.now() > expiresAt) {
          stopPolling();
          setQrPhase("expired");
          return;
        }
        const key = qrcodeKeyRef.current;
        if (!key) return;
        try {
          const poll = await pollBiliBiliQrLogin(key);
          if (poll.status === "scanned") setQrPhase("scanned");
          if (poll.status === "confirmed") {
            stopPolling();
            setQrPhase("confirmed");
            qc.invalidateQueries({ queryKey: BILIBILI_SESSION_KEY });
            setTimeout(() => setQrPhase("idle"), 2000);
          }
          if (poll.status === "expired") {
            stopPolling();
            setQrPhase("expired");
          }
          if (poll.status === "error") {
            stopPolling();
            setQrError(poll.message ?? m.ui_bilibili_session_qr_poll_error());
            setQrPhase("error");
          }
        } catch {
          // transient network failure, keep polling
        }
      }, 2000);
    } catch (error) {
      setQrError(getQrErrorMessage(error));
      setQrPhase("error");
    }
  }, [qc, stopPolling]);

  const cancelQr = useCallback(() => {
    stopPolling();
    qrcodeKeyRef.current = null;
    setQrUrl(null);
    setQrPhase("idle");
    setQrError(null);
  }, [stopPolling]);

  useEffect(() => stopPolling, [stopPolling]);

  return {
    status,
    disconnect,
    qrPhase,
    qrUrl,
    qrError,
    startQr,
    cancelQr,
  };
}
