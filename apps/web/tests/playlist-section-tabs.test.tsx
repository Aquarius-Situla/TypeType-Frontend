import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { PlaylistSectionTabs } from "../src/components/playlist-section-tabs";
import type { SubscribedCollectionSectionMeta } from "../src/lib/stream-collections";

const sampleSections: SubscribedCollectionSectionMeta[] = [
  {
    id: "sec1",
    title: "Section 1",
    videoUrls: ["url1", "url2"],
    episodes: [
      { videoId: "v1", title: "Video 1", url: "url1" },
      { videoId: "v2", title: "Video 2", url: "url2" },
    ],
  },
  {
    id: "sec2",
    title: "Section 2",
    videoUrls: ["url3", "url4", "url5"],
    episodes: [
      { videoId: "v3", title: "Video 3", url: "url3" },
      { videoId: "v4", title: "Video 4", url: "url4" },
      { videoId: "v5", title: "Video 5", url: "url5" },
    ],
  },
];

test("displays full section counts when videoUrls is omitted", () => {
  const html = renderToStaticMarkup(
    <PlaylistSectionTabs
      sections={sampleSections}
      activeSectionId="sec1"
      onSelectSection={() => {}}
      totalCount={5}
    />,
  );

  expect(html).toContain("Section 1");
  expect(html).toContain("(2)");
  expect(html).toContain("Section 2");
  expect(html).toContain("(3)");
  expect(html).not.toContain("(0)");
});

test("filters section counts against provided videoUrls for saved playlists", () => {
  const html = renderToStaticMarkup(
    <PlaylistSectionTabs
      sections={sampleSections}
      activeSectionId="sec1"
      onSelectSection={() => {}}
      totalCount={99}
      videoUrls={["url1", "url4"]}
    />,
  );

  expect(html).toContain("Section 1");
  expect(html).toContain("Section 2");
  expect(html).toContain("(99)");
  expect(html).toContain("(1)");
  expect(html).not.toContain("(2)");
  expect(html).not.toContain("(3)");
});

test("returns null if only one section is provided", () => {
  const sections: SubscribedCollectionSectionMeta[] = [
    {
      id: "single",
      title: "Single Section",
      videoUrls: ["url1"],
    },
  ];

  const html = renderToStaticMarkup(
    <PlaylistSectionTabs
      sections={sections}
      activeSectionId="single"
      onSelectSection={() => {}}
      totalCount={1}
    />,
  );

  expect(html).toBe("");
});
