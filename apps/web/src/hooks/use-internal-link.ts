import { QueryClientContext } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useCallback, useContext } from "react";
import type { fetchInstanceCapabilities } from "../lib/api-instance";
import { resolveBilibiliShortLink } from "../lib/api-short-link";
import { bilibiliShortCode, resolveInternalLink, unwrapRedirectLink } from "../lib/internal-link";
import { INSTANCE_KEY } from "./use-instance";

type Instance = Awaited<ReturnType<typeof fetchInstanceCapabilities>>;

// Opens a link inside TypeType when it has a page for it, or hands it to `onExternal` (the warning dialog). A
// b23.tv share link is resolved by the server first. Rich text is also rendered outside the app shell, so the router
// and the query client are optional here.
export function useInternalLink(): (href: string, onExternal: (href: string) => void) => void {
  const router = useRouter({ warn: false });
  const queryClient = useContext(QueryClientContext);
  return useCallback(
    (link: string, onExternal: (href: string) => void) => {
      const href = unwrapRedirectLink(link);
      const instance = queryClient?.getQueryData<Instance>(INSTANCE_KEY);
      const options = { twitch: instance?.twitch.enabled === true };
      const path = resolveInternalLink(href, options);
      if (path && router) {
        router.history.push(path);
        return;
      }
      const code = router ? bilibiliShortCode(href) : null;
      if (!code || !router) {
        onExternal(href);
        return;
      }
      resolveBilibiliShortLink(code)
        .then((target) => {
          const resolved = resolveInternalLink(target, options);
          if (resolved) router.history.push(resolved);
          else onExternal(target);
        })
        .catch(() => onExternal(href));
    },
    [router, queryClient],
  );
}
