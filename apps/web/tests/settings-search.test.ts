import { expect, test } from "bun:test";
import { searchSettings } from "../src/lib/settings-search";
import { settingsSearchEntries } from "../src/settings/settings-search-index";

const sections = [
  { key: "playback" as const, label: "Playback", description: "Autoplay, speed and quality" },
  { key: "home" as const, label: "Interface", description: "Layout and what pages show" },
];

test("finds a setting by any of its words, in any order and without accents", () => {
  const entries = [
    {
      section: "home" as const,
      sectionLabel: "Interface",
      title: "Shorts dans la recherche",
      detail: "",
    },
    {
      section: "playback" as const,
      sectionLabel: "Lecture",
      title: "Vitesse par défaut",
      detail: "",
    },
  ];
  expect(searchSettings(entries, "recherche shorts").map((entry) => entry.title)).toEqual([
    "Shorts dans la recherche",
  ]);
  expect(searchSettings(entries, "VITESSE defaut").map((entry) => entry.title)).toEqual([
    "Vitesse par défaut",
  ]);
  expect(searchSettings(entries, "   ")).toEqual([]);
});

test("puts matches on the title before matches on the explanation", () => {
  const entries = [
    {
      section: "home" as const,
      sectionLabel: "Interface",
      title: "Theme",
      detail: "Dark or light",
    },
    { section: "home" as const, sectionLabel: "Interface", title: "Dark mode helper", detail: "" },
  ];
  expect(searchSettings(entries, "dark")[0].title).toBe("Dark mode helper");
});

test("indexes the sections it is given and their settings only", () => {
  const entries = settingsSearchEntries(sections);
  expect(
    entries.some((entry) => entry.title === "Shorts in search" && entry.section === "home"),
  ).toBe(true);
  expect(
    entries.some((entry) => entry.title === "Default quality" && entry.section === "playback"),
  ).toBe(true);
  expect(entries.every((entry) => entry.section === "playback" || entry.section === "home")).toBe(
    true,
  );
  expect(entries.every((entry) => entry.title.trim().length > 0)).toBe(true);
});
