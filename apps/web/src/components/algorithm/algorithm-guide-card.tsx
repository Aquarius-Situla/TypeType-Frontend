import { Check, ChevronDown, Database, Eye, Lightbulb } from "lucide-react";
import { useState } from "react";
import { m } from "../../paraglide/messages.js";
import type { AlgorithmInfo } from "../../types/recommender";
import { Collapse } from "./algorithm-collapse";
import { Entry } from "./algorithm-guide-entry";
import { Meter } from "./algorithm-guide-meter";
import { algorithmIcon, dataLabel } from "./algorithm-labels";

const TRAITS = [
  { id: "personal", label: m.algo_trait_personal, help: m.algo_trait_personal_help },
  { id: "discovery", label: m.algo_trait_discovery, help: m.algo_trait_discovery_help },
  { id: "variety", label: m.algo_trait_variety, help: m.algo_trait_variety_help },
] as const;

type Props = { algorithm: AlgorithmInfo; current: boolean; onChoose: () => void };

export function AlgorithmGuideCard({ algorithm, current, onChoose }: Props) {
  const [details, setDetails] = useState(false);
  const Icon = algorithmIcon(algorithm);
  const reads = algorithm.uses.map(dataLabel).join(", ");

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-1">
        <div className="flex min-w-0 items-center gap-2.5">
          <Icon
            className={`size-5 shrink-0 transition-colors duration-300 ${current ? "text-accent" : "text-fg-muted"}`}
            aria-hidden="true"
          />
          <h3 className="text-base font-semibold text-fg">{algorithm.name}</h3>
        </div>
        {current ? (
          <span className="algorithm-enter flex items-center gap-1.5 text-xs font-medium text-accent">
            <Check className="size-3.5" aria-hidden="true" />
            {m.algo_guide_current()}
          </span>
        ) : (
          <button
            type="button"
            onClick={onChoose}
            className="h-8 rounded-sm border border-border-strong px-3 text-xs font-medium text-fg transition-colors hover:bg-surface-strong"
          >
            {m.algo_guide_choose()}
          </button>
        )}
      </div>

      <div
        className={`flex flex-col gap-6 border-y border-border px-1 py-5 transition-colors duration-300 ${
          current ? "border-l-2 border-l-accent pl-4" : ""
        }`}
      >
        <p className="text-sm leading-6 text-fg">{algorithm.guide.for_you_if}</p>
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {TRAITS.map((trait) => (
            <Meter
              key={trait.id}
              label={trait.label()}
              help={trait.help()}
              level={algorithm.guide.traits[trait.id]}
            />
          ))}
        </div>
        <div>
          <button
            type="button"
            onClick={() => setDetails(!details)}
            aria-expanded={details}
            className="group flex items-center gap-1 text-xs text-fg-muted transition-colors hover:text-fg"
          >
            {details ? m.algo_guide_less() : m.algo_guide_details()}
            <ChevronDown
              className={`size-3.5 transition-transform duration-300 ${details ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </button>
          <Collapse open={details}>
            <dl className="mt-2 divide-y divide-border">
              <Entry icon={Eye} term={m.algo_guide_you_see()}>
                {algorithm.guide.you_will_see}
              </Entry>
              <Entry icon={Lightbulb} term={m.algo_guide_good_to_know()}>
                {algorithm.guide.good_to_know}
              </Entry>
              <Entry icon={Database} term={m.algo_guide_data()}>
                {reads || m.algo_uses_nothing()}
              </Entry>
            </dl>
          </Collapse>
        </div>
      </div>
    </section>
  );
}
