import { Code, Database, SlidersHorizontal } from "lucide-react";
import type { Recommender } from "../../hooks/use-recommender";
import type { AlgorithmSection } from "../../lib/algorithm-sections";
import { m } from "../../paraglide/messages.js";
import { AlgorithmChoiceList } from "./algorithm-choice-list";
import { TEXT_ACTION } from "./algorithm-classes";
import { ParameterControl } from "./algorithm-controls";
import { AlgorithmExperimental } from "./algorithm-experimental";
import { Group } from "./algorithm-group";
import { dataLabel } from "./algorithm-labels";
import { Row } from "./algorithm-row";

type Props = { recommender: Recommender; onOpen: (section: AlgorithmSection) => void };

export function AlgorithmChoice({ recommender, onOpen }: Props) {
  const { current, valueFor, setValue } = recommender;
  if (!current) return null;
  const featured = current.parameters.filter((parameter) => parameter.featured);
  const uses = current.uses.map(dataLabel).join(", ");

  return (
    <div className="flex flex-col gap-8">
      <AlgorithmExperimental recommender={recommender} />
      <AlgorithmChoiceList recommender={recommender} onOpenGuide={() => onOpen("guide")} />

      <Group label={m.algo_settings_of({ name: current.name })} icon={SlidersHorizontal}>
        {featured.map((parameter) => (
          <Row
            key={parameter.id}
            label={parameter.label}
            help={parameter.help}
            highlightId={`param:${parameter.id}`}
          >
            <ParameterControl
              parameter={parameter}
              value={valueFor(parameter.id) ?? parameter.default}
              onChange={(next) => setValue(parameter.id, next)}
            />
          </Row>
        ))}
        <Row
          label={m.algo_all_settings()}
          description={m.algo_all_settings_description({ count: current.parameters.length })}
        >
          <button type="button" onClick={() => onOpen("backstage")} className={TEXT_ACTION}>
            {m.algo_open_backstage()}
          </button>
        </Row>
      </Group>

      <Group label={m.algo_transparency_label()} icon={Code}>
        <Row
          icon={Database}
          label={m.algo_uses_label()}
          description={uses || m.algo_uses_nothing()}
        />
        <Row icon={Code} label={m.algo_code_label()} description={m.algo_code_description()}>
          <a href={current.source_url} target="_blank" rel="noreferrer" className={TEXT_ACTION}>
            {m.algo_view_code()}
          </a>
        </Row>
      </Group>
    </div>
  );
}
