export type SettingsSearchEntry<Section extends string> = {
  section: Section;
  sectionLabel: string;
  title: string;
  detail: string;
};

function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase();
}

// Every word typed must appear in the title, its explanation or its section, in any order and without accents, so
// "shorts recherche" finds "Shorts dans la recherche". Matches on the title come first.
export function searchSettings<Section extends string>(
  entries: SettingsSearchEntry<Section>[],
  query: string,
): SettingsSearchEntry<Section>[] {
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const scored = entries.flatMap((entry) => {
    const title = fold(entry.title);
    const haystack = `${title} ${fold(entry.detail)} ${fold(entry.sectionLabel)}`;
    if (!words.every((word) => haystack.includes(word))) return [];
    const inTitle = words.filter((word) => title.includes(word)).length;
    return [{ entry, inTitle }];
  });
  return scored.sort((a, b) => b.inTitle - a.inTitle).map(({ entry }) => entry);
}
