import { useQuery } from "@tanstack/react-query";
import { createContext, type ReactNode, useContext } from "react";
import { useAuth } from "../hooks/use-auth";
import { fetchBiliBiliSessionStatus } from "../lib/api-bilibili-session";

type BiliBiliSessionGate = {
  connectHref: string;
  requiresConnection: boolean;
};

const DEFAULT_GATE: BiliBiliSessionGate = {
  connectHref: "/bilibili-session",
  requiresConnection: false,
};

const BiliBiliSessionGateContext = createContext<BiliBiliSessionGate>(DEFAULT_GATE);

export function BiliBiliSessionGateProvider({
  sourceUrl,
  returnTo,
  children,
}: {
  sourceUrl: string;
  returnTo: string;
  children: ReactNode;
}) {
  const { authReady, isAuthed } = useAuth();
  const isBiliBili = sourceUrl.includes("bilibili.com") || sourceUrl.includes("b23.tv");
  const enabled = authReady && isAuthed && isBiliBili;
  const { data: status } = useQuery({
    queryKey: ["bilibili-session"],
    queryFn: fetchBiliBiliSessionStatus,
    enabled,
    staleTime: 5 * 60 * 1000,
  });
  const requiresConnection = enabled && status !== undefined && status.status !== "connected";
  const connectHref = `/bilibili-session?redirect=${encodeURIComponent(returnTo)}`;

  return (
    <BiliBiliSessionGateContext.Provider value={{ connectHref, requiresConnection }}>
      {children}
    </BiliBiliSessionGateContext.Provider>
  );
}

export function useBiliBiliSessionGate(): BiliBiliSessionGate {
  return useContext(BiliBiliSessionGateContext);
}
