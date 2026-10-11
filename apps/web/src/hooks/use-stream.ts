import { keepPreviousData, queryOptions, useQuery } from "@tanstack/react-query";
import { ApiError } from "../lib/api";
import { fetchSabrBootstrap, fetchStream } from "../lib/api-stream";
import { mapStreamResponse } from "../lib/mappers";
import {
  isMemberOnlyApiError as isMemberOnlyApiResponse,
  MEMBER_ONLY_MESSAGE,
} from "../lib/member-only";
import {
  sabrBootstrapEndpoint,
  sabrBootstrapQueryKey,
  streamQueryKey,
} from "../lib/stream-request";
import { useAuthStore } from "../stores/auth-store";

export function streamQueryOptions(
  url: string,
  useAuthenticatedStream = false,
  enabled = true,
  knownLive = false,
  preview = false,
) {
  const ownerId = useAuthenticatedStream ? useAuthStore.getState().me?.id : null;
  return queryOptions({
    queryKey: streamQueryKey(url, useAuthenticatedStream, ownerId, knownLive),
    queryFn: ({ signal }) =>
      fetchStream(
        url,
        useAuthenticatedStream ? "authenticated_first" : "anonymous_first",
        signal,
        knownLive,
        preview,
      ).then((r) => mapStreamResponse(r, url)),
    enabled: enabled && url.startsWith("http"),
    staleTime: 3 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: (count, error) => {
      if (
        error instanceof ApiError &&
        (error.status === 400 ||
          error.status === 403 ||
          error.status === 404 ||
          // A live event that has not started yet: asking again at once changes nothing.
          error.status === 409 ||
          error.status === 422)
      ) {
        return false;
      }
      return count < 2;
    },
    retryDelay: (attempt) => Math.min(250 * 2 ** attempt, 1500),
    refetchOnWindowFocus: false,
  });
}

export function isStreamUnavailableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.message.includes("Error occurs when fetching the page") ||
    error.message.includes(MEMBER_ONLY_MESSAGE) ||
    error.message.includes("No suitable stream")
  );
}

export function isMemberOnlyApiError(error: unknown): boolean {
  return isMemberOnlyApiResponse(error);
}

export function useStream(
  url: string,
  useAuthenticatedStream = false,
  enabled = true,
  knownLive = false,
) {
  return useQuery({
    ...streamQueryOptions(url, useAuthenticatedStream, enabled, knownLive),
    placeholderData: keepPreviousData,
  });
}

export function useSabrBootstrap(url: string, useAuthenticatedStream = false, enabled = true) {
  const authenticatedOwnerId = useAuthStore((state) => state.me?.id);
  const ownerId = useAuthenticatedStream ? authenticatedOwnerId : null;
  return useQuery({
    queryKey: sabrBootstrapQueryKey(url, useAuthenticatedStream, ownerId),
    queryFn: ({ signal }) =>
      fetchSabrBootstrap(
        url,
        useAuthenticatedStream ? "authenticated_first" : "anonymous_first",
        signal,
      ).then((response) => mapStreamResponse(response, url)),
    enabled: enabled && url.startsWith("http") && !!sabrBootstrapEndpoint(url),
    staleTime: 3 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: (count, error) => {
      if (error instanceof ApiError && [400, 403, 404, 409, 422].includes(error.status))
        return false;
      return count < 2;
    },
    retryDelay: (attempt) => Math.min(250 * 2 ** attempt, 1500),
    refetchOnWindowFocus: false,
  });
}
