import { useEffect, useState } from "react";
import type { Recommender } from "../../hooks/use-recommender";
import { m } from "../../paraglide/messages.js";
import { Toast } from "../toast";
import { AlgorithmGuideCard } from "./algorithm-guide-card";

export function AlgorithmGuide({ recommender }: { recommender: Recommender }) {
  const { algorithms, current, select } = recommender;
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  return (
    <div className="flex flex-col gap-10">
      <p className="max-w-2xl px-1 text-sm leading-6 text-fg-muted">{m.algo_guide_intro()}</p>
      {algorithms.map((algorithm) => (
        <AlgorithmGuideCard
          key={algorithm.id}
          algorithm={algorithm}
          current={algorithm.id === current?.id}
          onChoose={() => {
            select(algorithm.id);
            setToast(m.algo_guide_chosen({ name: algorithm.name }));
          }}
        />
      ))}
      <Toast message={toast} />
    </div>
  );
}
