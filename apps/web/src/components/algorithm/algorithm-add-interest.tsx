import { useState } from "react";
import { MAX_INTEREST_CHARS, MAX_INTERESTS, type Recommender } from "../../hooks/use-recommender";
import { m } from "../../paraglide/messages.js";
import { TEXT_ACTION } from "./algorithm-classes";

export function AlgorithmAddInterest({ recommender }: { recommender: Recommender }) {
  const [text, setText] = useState("");
  const added = recommender.settings.customInterests ?? [];
  const full = added.length >= MAX_INTERESTS;
  const submit = () => {
    recommender.addInterest(text);
    setText("");
  };
  return (
    <form
      className="flex flex-col gap-2 py-3"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={text}
          maxLength={MAX_INTEREST_CHARS}
          disabled={full}
          onChange={(event) => setText(event.target.value)}
          placeholder={m.algo_interest_add_placeholder()}
          aria-label={m.algo_interest_add()}
          className="h-9 min-w-0 flex-1 rounded-sm border border-border-strong bg-app px-3 text-sm text-fg placeholder:text-fg-soft focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:cursor-not-allowed"
        />
        <button type="submit" disabled={full || text.trim().length === 0} className={TEXT_ACTION}>
          {m.algo_interest_add()}
        </button>
      </div>
      <p className="text-xs text-fg-soft">
        {full ? m.algo_interest_full({ count: MAX_INTERESTS }) : m.algo_interest_add_hint()}
      </p>
    </form>
  );
}
