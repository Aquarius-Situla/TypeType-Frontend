import { FlaskConical } from "lucide-react";
import type { Recommender } from "../../hooks/use-recommender";
import { m } from "../../paraglide/messages.js";
import { ToggleSwitch } from "../../settings/settings-toggle-switch";
import { GROUP } from "./algorithm-classes";
import { Row } from "./algorithm-row";
import { SectionLabel } from "./algorithm-section-label";

export function AlgorithmExperimental({ recommender }: { recommender: Recommender }) {
  const { settings, setEnabled } = recommender;
  return (
    <section className="flex flex-col gap-3">
      <div className="flex min-h-7 flex-wrap items-center gap-3">
        <SectionLabel label={m.algo_experimental_label()} icon={FlaskConical} />
        <span className="rounded-sm border border-accent/50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
          {m.algo_experimental_badge()}
        </span>
      </div>
      <div className={GROUP}>
        <Row
          label={m.algo_experimental_toggle()}
          description={
            settings.enabled ? m.algo_experimental_on_hint() : m.algo_experimental_off_hint()
          }
        >
          <ToggleSwitch
            checked={settings.enabled}
            ariaLabel={m.algo_experimental_toggle()}
            onClick={() => setEnabled(!settings.enabled)}
          />
        </Row>
      </div>
    </section>
  );
}
