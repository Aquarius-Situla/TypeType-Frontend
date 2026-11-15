import { QueryClientContext } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useCallback, useContext } from "react";
import type { fetchInstanceCapabilities } from "../lib/api-instance";
import { resolveInternalLink } from "../lib/internal-link";
import { INSTANCE_KEY } from "./use-instance";

type Instance = Awaited<ReturnType<typeof fetchInstanceCapabilities>>;

// Rich text is also rendered outside the app shell, so the router and the query client are optional here.
export function useInternalLink(): (href: string) => boolean {
  const router = useRouter({ warn: false });
  const queryClient = useContext(QueryClientContext);
  return useCallback(
    (href: string) => {
      const instance = queryClient?.getQueryData<Instance>(INSTANCE_KEY);
      const path = resolveInternalLink(href, { twitch: instance?.twitch.enabled === true });
      if (!path || !router) return false;
      router.history.push(path);
      return true;
    },
    [router, queryClient],
  );
}
