export function normalizeLanguageTag(value: string | null | undefined): string {
  if (!value) return "";
  const [base] = value.toLowerCase().split("-");
  return base ?? "";
}

export function includesOriginal(value: string | undefined): boolean {
  if (!value) return false;
  return value.toLowerCase().includes("original");
}

export function hasMultipleLanguageTracks(
  options: readonly { track: { language?: string | null } }[],
): boolean {
  const languages = new Set<string>();
  for (const option of options) {
    const language = normalizeLanguageTag(option.track.language);
    if (language) languages.add(language);
    if (languages.size > 1) return true;
  }
  return false;
}
