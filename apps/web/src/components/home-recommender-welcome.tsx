import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useRecommenderAvailable } from "../hooks/use-recommender";
import { fetchRecommenderData } from "../lib/api-recommender";
import { m } from "../paraglide/messages.js";
import { useHomeWelcomeStore } from "../stores/home-welcome-store";

const FEW_WATCHES = 10;
const FEW_SUBSCRIPTIONS = 3;

const ACTION = "flex h-9 items-center rounded-sm px-4 text-sm font-medium transition-colors";

export function HomeRecommenderWelcome() {
  const available = useRecommenderAvailable();
  const done = useHomeWelcomeStore((state) => state.done);
  const finish = useHomeWelcomeStore((state) => state.finish);
  const data = useQuery({
    queryKey: ["recommender", "welcome"],
    queryFn: fetchRecommenderData,
    enabled: available && !done,
    staleTime: 10 * 60 * 1000,
  });
  const count = (id: string) => data.data?.find((category) => category.id === id)?.count ?? 0;
  const empty =
    data.data !== undefined &&
    count("history") < FEW_WATCHES &&
    count("subscriptions") < FEW_SUBSCRIPTIONS;
  useEffect(() => {
    if (data.data !== undefined && !empty) finish();
  }, [data.data, empty, finish]);

  if (done || !available || !empty) return null;

  return (
    <section className="algorithm-enter mt-3 flex flex-col gap-4 rounded-md border border-border bg-surface/70 p-5 sm:mt-5 sm:p-6">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-base font-semibold text-fg">{m.home_welcome_title()}</h2>
        <p className="max-w-2xl text-sm leading-6 text-fg-muted">{m.home_welcome_text()}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Link to="/import" className={`${ACTION} bg-accent text-white hover:bg-accent-strong`}>
          {m.home_welcome_import()}
        </Link>
        <Link
          to="/algorithm"
          search={{ section: "guide" }}
          className={`${ACTION} border border-border-strong text-fg hover:bg-surface-strong`}
        >
          {m.home_welcome_choose()}
        </Link>
        <button type="button" onClick={finish} className={`${ACTION} text-fg-muted hover:text-fg`}>
          {m.home_welcome_later()}
        </button>
      </div>
    </section>
  );
}
