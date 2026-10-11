const MAX_EMPTY_HOME_PAGES_TO_AUTOLOAD = 3;

type EmptyHomePageState = {
  itemCount: number;
  pageCount: number;
  hasNextPage: boolean;
  isLoading: boolean;
  isPreparing: boolean;
  isError: boolean;
  isFetchingNextPage: boolean;
};

export function shouldAutoLoadEmptyHomePage(state: EmptyHomePageState): boolean {
  return (
    state.itemCount === 0 &&
    state.pageCount > 0 &&
    state.pageCount < MAX_EMPTY_HOME_PAGES_TO_AUTOLOAD &&
    state.hasNextPage &&
    !state.isLoading &&
    !state.isPreparing &&
    !state.isError &&
    !state.isFetchingNextPage
  );
}
