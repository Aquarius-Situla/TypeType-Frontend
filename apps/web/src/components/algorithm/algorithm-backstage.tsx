import { House, RotateCcw, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import type { Recommender } from "../../hooks/use-recommender";
import { m } from "../../paraglide/messages.js";
import { ConfirmModal } from "../confirm-modal";
import { GROUP, TEXT_ACTION } from "./algorithm-classes";
import { formatParameter, ParameterControl } from "./algorithm-controls";
import { AlgorithmFold } from "./algorithm-fold";
import { Group } from "./algorithm-group";
import { changedCount, groupText, settingsCount } from "./algorithm-labels";
import { AlgorithmLastHome } from "./algorithm-last-home";
import { Row } from "./algorithm-row";

const LAST_HOME = "last-home";

export function AlgorithmBackstage({ recommender }: { recommender: Recommender }) {
  const { current, valueFor, setValue, resetValues } = recommender;
  const [confirming, setConfirming] = useState(false);
  const [open, setOpen] = useState<Set<string>>(new Set());
  if (!current) return null;
  const groups = [...new Set(current.parameters.map((parameter) => parameter.group))];
  const toggle = (id: string) =>
    setOpen((before) => {
      const next = new Set(before);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="flex flex-col gap-8">
      <Group label={m.algo_all_settings_of({ name: current.name })} icon={SlidersHorizontal}>
        {groups.map((group) => {
          const parameters = current.parameters.filter((parameter) => parameter.group === group);
          const changed = parameters.filter((p) => (valueFor(p.id) ?? p.default) !== p.default);
          const text = groupText(group);
          return (
            <AlgorithmFold
              key={group}
              icon={text.icon}
              label={text.label}
              description={text.help}
              summary={
                changed.length > 0 ? (
                  <span className="text-accent">{changedCount(changed.length)}</span>
                ) : (
                  settingsCount(parameters.length)
                )
              }
              open={open.has(group)}
              onToggle={() => toggle(group)}
            >
              {parameters.map((parameter) => {
                const value = valueFor(parameter.id) ?? parameter.default;
                return (
                  <Row
                    key={parameter.id}
                    label={parameter.label}
                    help={parameter.help}
                    description={m.algo_default({
                      value: formatParameter(parameter, parameter.default),
                    })}
                  >
                    <div className="flex shrink-0 items-center gap-4">
                      {value !== parameter.default && (
                        <button
                          type="button"
                          onClick={() => setValue(parameter.id, parameter.default)}
                          className={`${TEXT_ACTION} algorithm-enter`}
                        >
                          {m.algo_restore()}
                        </button>
                      )}
                      <ParameterControl
                        parameter={parameter}
                        value={value}
                        onChange={(next) => setValue(parameter.id, next)}
                      />
                    </div>
                  </Row>
                );
              })}
            </AlgorithmFold>
          );
        })}
      </Group>

      <Group label={m.algo_last_home_label()} icon={House} help={m.algo_help_last_home()}>
        <AlgorithmLastHome
          recommender={recommender}
          open={open.has(LAST_HOME)}
          onToggle={() => toggle(LAST_HOME)}
        />
      </Group>

      <div className={GROUP}>
        <Row
          icon={RotateCcw}
          label={m.algo_reset_all({ name: current.name })}
          description={m.algo_reset_description()}
        >
          <button type="button" onClick={() => setConfirming(true)} className={TEXT_ACTION}>
            {m.algo_restore()}
          </button>
        </Row>
      </div>
      {confirming && (
        <ConfirmModal
          title={m.algo_reset_question({ name: current.name })}
          description={m.algo_reset_description()}
          confirmLabel={m.algo_restore()}
          onConfirm={() => {
            resetValues();
            setConfirming(false);
          }}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  );
}
