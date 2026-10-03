import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ChannelAvatar } from "../src/components/channel-avatar";

describe("channel avatar", () => {
  test("renders a skeleton while a remote image is loading", () => {
    const html = renderToStaticMarkup(
      <ChannelAvatar src="/api/proxy?url=https%3A%2F%2Fexample.test%2Favatar.jpg" name="Channel" />,
    );

    expect(html).toContain('data-avatar-state="loading"');
    expect(html).toContain("data-avatar-skeleton");
    expect(html).toContain("animate-pulse");
    expect(html).toContain("bg-fg/15");
    expect(html).toContain('loading="lazy"');
  });

  test("loads primary watch avatars eagerly", () => {
    const html = renderToStaticMarkup(
      <ChannelAvatar
        src="/api/proxy?url=https%3A%2F%2Fexample.test%2Favatar.jpg"
        name="Channel"
        priority
      />,
    );

    expect(html).toContain('loading="eager"');
    expect(html).toContain('fetchPriority="high"');
    expect(html).toContain('rel="preload"');
  });

  test("renders the channel initial when no avatar URL exists", () => {
    const html = renderToStaticMarkup(<ChannelAvatar src="" name="Channel" pending={false} />);

    expect(html).toContain('data-avatar-state="fallback"');
    expect(html).toContain(">C</span>");
    expect(html).not.toContain("<img");
  });

  test("shows a short skeleton before deciding a missing avatar is unavailable", () => {
    const html = renderToStaticMarkup(<ChannelAvatar src="" name="Channel" />);

    expect(html).toContain('data-avatar-state="loading"');
    expect(html).toContain("data-avatar-skeleton");
    expect(html).not.toContain(">C</span>");
  });

  test("keeps the skeleton while a missing avatar is being resolved", () => {
    const html = renderToStaticMarkup(<ChannelAvatar src="" name="OHIOBOSS SATOYU" pending />);

    expect(html).toContain('data-avatar-state="loading"');
    expect(html).toContain("data-avatar-skeleton");
    expect(html).not.toContain(">O</span>");
  });

  test("renders a generic fallback when the channel name is missing", () => {
    const html = renderToStaticMarkup(<ChannelAvatar src="" name="" pending={false} />);

    expect(html).toContain("lucide-user-round");
  });
});
