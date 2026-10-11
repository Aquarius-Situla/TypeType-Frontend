import { ListVideo, Signpost } from "lucide-react";
import type { Recommender } from "../../hooks/use-recommender";
import { m } from "../../paraglide/messages.js";
import { ROW } from "../../settings/settings-toggle-switch";
import { GROUP, TEXT_ACTION } from "./algorithm-classes";
import { InfoTip } from "./algorithm-info";
import { algorithmIcon } from "./algorithm-labels";
import { Row } from "./algorithm-row";
import { SectionLabel } from "./algorithm-section-label";

type Props = { recommender: Recommender; onOpenGuide: () => void };

export function AlgorithmChoiceList({ recommender, onOpenGuide }: Props) {
  const { algorithms, current, select } = recommender;
  return (
    <section className="flex flex-col gap-3">
      <SectionLabel
        label={m.algo_choice_label()}
        icon={ListVideo}
        help={m.algo_help_choice()}
        className="min-h-7"
      />
      <fieldset className={GROUP}>
        <legend className="sr-only">{m.algo_choice_label()}</legend>
        {algorithms.map((algorithm) => {
          const checked = algorithm.id === current?.id;
          const Icon = algorithmIcon(algorithm);
          return (
            // htmlFor points the row at its radio: without it, a click on the row would go
            // to the first control inside the label, which is the "i" button.
            <label
              key={algorithm.id}
              htmlFor={`home-algorithm-${algorithm.id}`}
              className={`${ROW} cursor-pointer`}
            >
              <Icon
                className={`mt-0.5 size-4 shrink-0 self-start transition-colors duration-300 ${checked ? "text-accent" : "text-fg-muted"}`}
                aria-hidden="true"
              />
              <span className="typetype-adaptive-label flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-sm text-fg">
                  {algorithm.name}
                  <span className="ml-1 inline-flex align-[-5px]">
                    <InfoTip
                      label={algorithm.name}
                      text={`${algorithm.guide.for_you_if} ${algorithm.guide.good_to_know}`}
                    />
                  </span>
                </span>
                <span className="text-xs text-fg-soft">{algorithm.description}</span>
              </span>
              <input
                type="radio"
                id={`home-algorithm-${algorithm.id}`}
                name="home-algorithm"
                value={algorithm.id}
                checked={checked}
                onChange={() => select(algorithm.id)}
                className="peer sr-only"
              />
              <span
                aria-hidden="true"
                className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-300 peer-focus-visible:ring-2 peer-focus-visible:ring-accent/50 ${
                  checked ? "border-accent" : "border-border-strong"
                }`}
              >
                <span
                  className={`size-2.5 rounded-full bg-accent transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                    checked ? "scale-100" : "scale-0"
                  }`}
                />
              </span>
            </label>
          );
        })}
        <Row
          icon={Signpost}
          label={m.algo_guide_link()}
          description={m.algo_guide_link_description()}
        >
          <button type="button" onClick={onOpenGuide} className={TEXT_ACTION}>
            {m.algo_open_backstage()}
          </button>
        </Row>
      </fieldset>
    </section>
  );
}
