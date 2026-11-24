import { useCallback, useEffect, useRef, useState } from "react";

const MAX_EMPTY_PAGES = 3;

export function nextEmptyPageStreak(streak: number, visibleBefore: number, visibleAfter: number) {
  return visibleAfter > visibleBefore ? 0 : streak + 1;
}

export function keepsAutoLoading(streak: number): boolean {
  return streak < MAX_EMPTY_PAGES;
}

// When a filter hides almost everything, the end of the list stays in view and every page loads the next one, until
// the server refuses. After a few pages that add nothing visible, the next page waits for the user.
export function useFeedAutoLoad(loaded: number, visible: number, settled: boolean) {
  const [streak, setStreak] = useState(0);
  const last = useRef({ loaded: 0, visible: 0 });
  useEffect(() => {
    if (!settled || loaded === last.current.loaded) return;
    const before = last.current;
    last.current = { loaded, visible };
    setStreak((current) =>
      loaded < before.loaded ? 0 : nextEmptyPageStreak(current, before.visible, visible),
    );
  }, [loaded, visible, settled]);
  const resume = useCallback(() => setStreak(0), []);
  return { active: keepsAutoLoading(streak), resume };
}
