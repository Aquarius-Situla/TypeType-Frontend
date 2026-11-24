import { expect, test } from "bun:test";
import { QueryClient, QueryObserver } from "@tanstack/react-query";
import {
  clearInactiveStreamCache,
  sabrBootstrapQueryKey,
  streamQueryKey,
} from "../src/lib/stream-request";

test("clearInactiveStreamCache removes inactive stream and bootstrap queries for the target URL", () => {
  const client = new QueryClient();
  const targetUrl = "https://www.youtube.com/watch?v=rY9ACFdZNbI";
  const otherUrl = "https://www.youtube.com/watch?v=jNQXAC9IVRw";

  const targetStreamKey = streamQueryKey(targetUrl, true, "u1", false);
  const targetLiveStreamKey = streamQueryKey(targetUrl, true, "u1", true);
  const targetBootstrapKey = sabrBootstrapQueryKey(targetUrl, true, "u1");
  const otherStreamKey = streamQueryKey(otherUrl, true, "u1", false);
  const otherBootstrapKey = sabrBootstrapQueryKey(otherUrl, true, "u1");

  client.setQueryData(targetStreamKey, { id: targetUrl });
  client.setQueryData(targetLiveStreamKey, { id: targetUrl });
  client.setQueryData(targetBootstrapKey, { id: targetUrl });
  client.setQueryData(otherStreamKey, { id: otherUrl });
  client.setQueryData(otherBootstrapKey, { id: otherUrl });

  clearInactiveStreamCache(client, targetUrl);

  expect(client.getQueryData(targetStreamKey)).toBeUndefined();
  expect(client.getQueryData(targetLiveStreamKey)).toBeUndefined();
  expect(client.getQueryData(targetBootstrapKey)).toBeUndefined();
  expect(client.getQueryData(otherStreamKey)).toEqual({ id: otherUrl });
  expect(client.getQueryData(otherBootstrapKey)).toEqual({ id: otherUrl });
});

test("clearInactiveStreamCache preserves active stream queries", () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const targetUrl = "https://www.youtube.com/watch?v=rY9ACFdZNbI";
  const targetStreamKey = streamQueryKey(targetUrl, true, "u1", false);
  const targetBootstrapKey = sabrBootstrapQueryKey(targetUrl, true, "u1");

  client.setQueryData(targetStreamKey, { id: targetUrl });
  client.setQueryData(targetBootstrapKey, { id: targetUrl });

  const observer = new QueryObserver(client, {
    queryKey: targetStreamKey,
    queryFn: async () => ({ id: targetUrl }),
    staleTime: Infinity,
  });
  const unsubscribe = observer.subscribe(() => undefined);

  clearInactiveStreamCache(client, targetUrl);

  expect(client.getQueryData(targetStreamKey)).toEqual({ id: targetUrl });
  expect(client.getQueryData(targetBootstrapKey)).toBeUndefined();

  unsubscribe();
});
