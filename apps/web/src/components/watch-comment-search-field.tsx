import { Search, X } from "lucide-react";
import { useState } from "react";
import { m } from "../paraglide/messages.js";

type Props = {
  query: string;
  onSearch: (query: string) => void;
};

export function WatchCommentSearchField({ query, onSearch }: Props) {
  const [draft, setDraft] = useState(query);

  return (
    <search className="w-full max-w-72">
      <form
        className="flex h-9 w-full items-center gap-2 rounded-full border border-border bg-surface-soft px-3 focus-within:border-border-strong"
        onSubmit={(event) => {
          event.preventDefault();
          onSearch(draft.trim());
        }}
      >
        <Search className="h-4 w-4 shrink-0 text-fg-soft" aria-hidden="true" />
        <input
          type="search"
          value={draft}
          maxLength={200}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={m.watch_comments_search_placeholder()}
          aria-label={m.watch_comments_search_label()}
          className="min-w-0 flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-fg-soft [&::-webkit-search-cancel-button]:hidden"
        />
        {draft.length > 0 && (
          <button
            type="button"
            className="text-fg-soft hover:text-fg"
            aria-label={m.watch_comments_search_clear()}
            onClick={() => {
              setDraft("");
              onSearch("");
            }}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </form>
    </search>
  );
}
