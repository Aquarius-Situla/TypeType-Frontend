const ALGORITHM_SECTIONS = [
  "overview",
  "algorithm",
  "guide",
  "data",
  "profile",
  "backstage",
  "feedback",
] as const;

export type AlgorithmSection = (typeof ALGORITHM_SECTIONS)[number];

export type AlgorithmTarget = { section: AlgorithmSection; category?: string; highlight?: string };

export function isAlgorithmSection(value: unknown): value is AlgorithmSection {
  return ALGORITHM_SECTIONS.some((section) => section === value);
}
