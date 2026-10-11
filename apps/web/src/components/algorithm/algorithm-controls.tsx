import { m } from "../../paraglide/messages.js";
import { ToggleSwitch } from "../../settings/settings-toggle-switch";
import type { AlgorithmParameter, ParameterValue } from "../../types/recommender";
import { formatNumber } from "./algorithm-labels";
import { Stepper } from "./algorithm-stepper";

export function formatParameter(parameter: AlgorithmParameter, value: ParameterValue): string {
  if (typeof value === "boolean") return value ? m.algo_on() : m.algo_off();
  if (parameter.type === "number" && parameter.unit === "%") return `${Math.round(value * 100)} %`;
  if (parameter.type === "number" && parameter.unit === "min")
    return m.algo_minutes({ minutes: value });
  return formatNumber(value);
}

export function ParameterControl({
  parameter,
  value,
  onChange,
}: {
  parameter: AlgorithmParameter;
  value: ParameterValue;
  onChange: (value: ParameterValue) => void;
}) {
  if (parameter.type === "boolean") {
    return (
      <ToggleSwitch
        checked={value === true}
        ariaLabel={parameter.label}
        onClick={() => onChange(value !== true)}
      />
    );
  }
  return (
    <Stepper
      label={parameter.label}
      value={Number(value)}
      min={parameter.min}
      max={parameter.max}
      step={parameter.step}
      unit={parameter.unit}
      format={(next) => formatParameter(parameter, next)}
      onChange={onChange}
    />
  );
}
