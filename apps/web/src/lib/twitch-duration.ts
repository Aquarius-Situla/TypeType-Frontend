export function chatDuration(minutes: number, locale: string): string {
  const [value, unit] =
    minutes >= 1440 && minutes % 1440 === 0
      ? [minutes / 1440, "day"]
      : minutes >= 60 && minutes % 60 === 0
        ? [minutes / 60, "hour"]
        : [minutes, "minute"];
  return new Intl.NumberFormat(locale, { style: "unit", unit, unitDisplay: "long" }).format(value);
}
