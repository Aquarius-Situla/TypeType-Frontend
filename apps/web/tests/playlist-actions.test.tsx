import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { PlaylistActions } from "../src/components/playlist-actions";

describe("PlaylistActions", () => {
  test("renders both play all and shuffle buttons when onShuffle is provided", () => {
    const html = renderToStaticMarkup(
      <PlaylistActions onPlayAll={() => {}} onShuffle={() => {}} />,
    );

    expect(html).toContain("Play all");
    expect(html).toContain("Shuffle");
  });

  test("hides shuffle button when onShuffle is omitted", () => {
    const html = renderToStaticMarkup(<PlaylistActions onPlayAll={() => {}} />);

    expect(html).toContain("Play all");
    expect(html).not.toContain("Shuffle");
  });
});
