import { m } from "../paraglide/messages.js";
import type { AdminSettings, RecommenderAdminStatus } from "../types/admin";
import { ToggleSwitch } from "./toggle-switch";

type Props = {
  value: AdminSettings;
  saved: AdminSettings;
  algorithms: RecommenderAdminStatus["algorithms"];
  pending: boolean;
  onChange: (value: AdminSettings) => void;
  onSave: () => void;
};

const INPUT =
  "h-10 w-full rounded-md border border-border-strong bg-surface px-3 text-sm text-fg outline-none focus:border-fg-soft";

export function AdminRecommenderPolicy({
  value,
  saved,
  algorithms,
  pending,
  onChange,
  onSave,
}: Props) {
  const changed = JSON.stringify(value) !== JSON.stringify(saved);
  const allowed = value.recommenderAllowedAlgorithms ?? [];
  const offered = (id: string) => allowed.length === 0 || allowed.includes(id);
  const toggle = (id: string) => {
    const now = algorithms.map((a) => a.id).filter((other) => offered(other) !== (other === id));
    const all = now.length === algorithms.length;
    onChange({ ...value, recommenderAllowedAlgorithms: all || now.length === 0 ? [] : now });
  };
  const numbers = [
    ["recommenderTimeoutMs", m.admin_recommender_timeout(), 60_000],
    ["recommenderStreamRequestsPerMinute", m.admin_recommender_stream_limit(), 600],
  ] as const;

  return (
    <section className="space-y-4 border-y border-border py-4">
      <div className="flex items-center justify-between gap-4 px-1">
        <div>
          <h2 className="text-sm font-semibold text-fg">{m.admin_recommender_enable()}</h2>
          <p className="mt-1 text-xs text-fg-soft">{m.admin_recommender_enable_description()}</p>
        </div>
        <ToggleSwitch
          checked={value.recommenderEnabled === true}
          ariaLabel={m.admin_recommender_enable()}
          onClick={() => onChange({ ...value, recommenderEnabled: !value.recommenderEnabled })}
        />
      </div>
      <div className="flex items-center justify-between gap-4 px-1">
        <div>
          <h2 className="text-sm font-semibold text-fg">{m.admin_recommender_default_on()}</h2>
          <p className="mt-1 text-xs text-fg-soft">
            {m.admin_recommender_default_on_description()}
          </p>
        </div>
        <ToggleSwitch
          checked={value.recommenderDefaultOn === true}
          ariaLabel={m.admin_recommender_default_on()}
          onClick={() => onChange({ ...value, recommenderDefaultOn: !value.recommenderDefaultOn })}
        />
      </div>
      <fieldset className="space-y-2 px-1">
        <legend className="text-xs font-medium text-fg-muted">
          {m.admin_recommender_offered()}
        </legend>
        {algorithms.map((algorithm) => (
          <label key={algorithm.id} className="flex items-center gap-2 text-sm text-fg">
            <input
              type="checkbox"
              checked={offered(algorithm.id)}
              onChange={() => toggle(algorithm.id)}
              className="size-4 accent-[var(--color-accent)]"
            />
            {algorithm.name}
          </label>
        ))}
      </fieldset>
      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-fg-muted">{m.admin_recommender_default()}</span>
        <select
          value={value.recommenderDefaultAlgorithm ?? ""}
          onChange={(event) =>
            onChange({ ...value, recommenderDefaultAlgorithm: event.target.value || null })
          }
          className={INPUT}
        >
          <option value="">{m.admin_recommender_default_auto()}</option>
          {algorithms
            .filter((algorithm) => offered(algorithm.id))
            .map((algorithm) => (
              <option key={algorithm.id} value={algorithm.id}>
                {algorithm.name}
              </option>
            ))}
        </select>
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        {numbers.map(([key, label, max]) => (
          <label key={key} className="space-y-1.5">
            <span className="text-xs font-medium text-fg-muted">{label}</span>
            <input
              type="number"
              min={0}
              max={max}
              value={value[key] ?? 0}
              onChange={(event) => {
                const next = event.target.valueAsNumber;
                if (Number.isInteger(next) && next >= 0 && next <= max) {
                  onChange({ ...value, [key]: next });
                }
              }}
              className={INPUT}
            />
          </label>
        ))}
      </div>
      <p className="px-1 text-xs text-fg-soft">{m.admin_recommender_zero_hint()}</p>
      <div className="flex justify-end">
        <button
          type="button"
          disabled={!changed || pending}
          onClick={onSave}
          className="h-9 rounded-md bg-fg px-4 text-sm font-medium text-app hover:bg-fg-strong disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending ? m.ui_saving() : m.ui_save_policy()}
        </button>
      </div>
    </section>
  );
}
