import { useQuery } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { fetchSuggestions } from "../lib/api-suggestions";
import { buildSearchOverlayItems } from "../lib/search-overlay-items";
import {
  resolveInitialSearchOverlayQuery,
  writeSearchOverlayQuery,
} from "../lib/search-overlay-query";
import type { ServiceId } from "../types/user";
import { useDebouncedValue } from "./use-debounced-value";
import { useSearchHistory } from "./use-search-history";
import { useSearchOverlayNavigation } from "./use-search-overlay-navigation";

export function useSearchPanel(onClose: () => void, open: boolean, restoreDraft = false) {
  const location = useRouterState({ select: (state) => state.location });
  const { service: defaultService, navigateAndClose } = useSearchOverlayNavigation({ onClose });
  const params = new URLSearchParams(location.searchStr);
  const routeQuery = location.pathname === "/search" ? (params.get("q") ?? "") : "";
  const requestedService =
    location.pathname === "/search" && params.has("service")
      ? Number(params.get("service"))
      : defaultService;
  const routeService = requestedService === 5 || requestedService === 6 ? requestedService : 0;
  const [query, setQuery] = useState(() =>
    restoreDraft
      ? resolveInitialSearchOverlayQuery(location.pathname, location.searchStr)
      : routeQuery,
  );
  const [service, setService] = useState<ServiceId>(routeService);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const history = useSearchHistory();
  const debounced = useDebouncedValue(query.trim(), 300);
  const suggestions = useQuery({
    queryKey: ["search-suggestions", service, debounced],
    queryFn: ({ signal }) => fetchSuggestions(debounced, service, signal),
    enabled: open && Boolean(debounced),
    staleTime: 60_000,
    gcTime: 120_000,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const items = buildSearchOverlayItems(
    query,
    history.visibleItems,
    query.trim() === debounced ? (suggestions.data ?? []) : [],
  );
  const showHistory = !query.trim();
  useEffect(() => {
    if (!restoreDraft) setQuery(routeQuery);
  }, [routeQuery, restoreDraft]);
  useEffect(() => {
    setService(routeService);
  }, [routeService]);
  useEffect(() => {
    if (selectedIndex >= items.length) setSelectedIndex(-1);
    listRef.current
      ?.querySelector<HTMLButtonElement>(`button[data-item-index="${selectedIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex, items.length]);
  function changeQuery(value: string) {
    setQuery(value);
    writeSearchOverlayQuery(value);
    setSelectedIndex(-1);
  }
  function changeService(value: ServiceId) {
    setService(value);
    setSelectedIndex(-1);
  }
  function selectTerm(term: string) {
    changeQuery(term);
    navigateAndClose(term, service);
  }
  function submit(event: React.FormEvent) {
    event.preventDefault();
    selectTerm(items[selectedIndex]?.label ?? query);
  }
  function keyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "Escape") {
      event.preventDefault();
      event.currentTarget.blur();
      onClose();
      return;
    }
    if (!items.length || !open) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex((index) =>
        event.key === "ArrowDown"
          ? (index + 1) % items.length
          : index <= 0
            ? items.length - 1
            : index - 1,
      );
    }
  }
  function scroll(event: React.UIEvent<HTMLUListElement>) {
    const target = event.currentTarget;
    if (
      showHistory &&
      history.canLoadMore &&
      target.scrollHeight - target.scrollTop - target.clientHeight < 24
    )
      history.loadMore();
  }
  async function clearHistory() {
    try {
      await history.clear.mutateAsync();
      setConfirmClearOpen(false);
    } catch {
      setConfirmClearOpen(false);
    }
  }
  return {
    query,
    service,
    items,
    showHistory,
    selectedIndex,
    inputRef,
    listRef,
    history,
    suggestions,
    confirmClearOpen,
    setConfirmClearOpen,
    changeQuery,
    changeService,
    selectTerm,
    submit,
    keyDown,
    scroll,
    clearHistory,
  };
}

export type SearchPanelState = ReturnType<typeof useSearchPanel>;
