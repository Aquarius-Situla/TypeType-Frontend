import { keepPreviousData, type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useEffect, useLayoutEffect, useState } from "react";
import { groupMembershipPageOptions } from "../lib/group-membership-queries";
import { type GroupPage, groupPage } from "../lib/group-pagination";
import type { GroupedSubscription, MembershipPage } from "../types/subscription-groups";
import { useAuth } from "./use-auth";
import { useDebouncedValue } from "./use-debounced-value";

export function useGroupChannelPage(
  filter: string,
  excluded: boolean,
  search: string,
  selected: GroupedSubscription[] | null,
): {
  query: UseQueryResult<MembershipPage>;
  channels: GroupedSubscription[];
  pagination: GroupPage & {
    total: number;
    viewport: (element: HTMLDivElement | null) => void;
    onPage: (page: number) => void;
  };
} {
  const { me, authReady, isAuthed } = useAuth();
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const [size, setSize] = useState(10);
  const debounced = useDebouncedValue(search.trim(), 250);
  const key = JSON.stringify([filter, excluded, debounced, selected !== null]);
  const [position, setPosition] = useState({ key, start: 0 });
  const page = position.key === key ? Math.floor(position.start / size) : 0;
  const query = useQuery({
    ...groupMembershipPageOptions(me?.id, {
      page: selected ? 0 : page,
      limit: size,
      filter,
      excluded,
      search: debounced,
    }),
    enabled: authReady && isAuthed && selected === null,
    placeholderData: keepPreviousData,
  });
  const total = selected?.length ?? query.data?.total ?? 0;
  const pagination = groupPage(total, size, page);
  useEffect(() => {
    if (
      (selected !== null || (query.isSuccess && !query.isPlaceholderData)) &&
      page !== pagination.page
    )
      setPosition({ key, start: pagination.start });
  }, [
    key,
    page,
    pagination.page,
    pagination.start,
    selected,
    query.isSuccess,
    query.isPlaceholderData,
  ]);
  useLayoutEffect(() => {
    if (!element) return;
    const desktop = window.matchMedia("(min-width: 1024px) and (min-height: 600px)");
    function measure(): void {
      const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
      setSize(
        desktop.matches
          ? Math.max(1, Math.min(100, Math.floor(((element?.clientHeight ?? 0) / rem - 4.5) / 3.5)))
          : 10,
      );
    }
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    desktop.addEventListener("change", measure);
    return () => {
      observer.disconnect();
      desktop.removeEventListener("change", measure);
    };
  }, [element]);
  return {
    query,
    channels: selected
      ? [...selected]
          .sort((a, b) => a.name.localeCompare(b.name))
          .slice(pagination.start, pagination.end)
      : (query.data?.items ?? []),
    pagination: {
      ...pagination,
      total,
      viewport: setElement,
      onPage: (next) => setPosition({ key, start: next * size }),
    },
  };
}
