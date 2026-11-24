import { describe, expect, it } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { LanguageFlag } from "../src/components/language-flags/language-flag";
import type { Locale } from "../src/paraglide/runtime.js";

function decodeFlagSvg(html: string): string {
  const match = html.match(/src="data:image\/svg\+xml;charset=utf-8,([^"]+)"/);
  expect(match).not.toBeNull();
  return decodeURIComponent(match?.[1] ?? "");
}

describe("LanguageFlag", () => {
  const cases: { locale: Locale; expectedColors: string[] }[] = [
    { locale: "en", expectedColors: ["#ffffff", "#d62828"] },
    { locale: "fr", expectedColors: ["#1b4fa3", "#ffffff", "#e33a3a"] },
    { locale: "de", expectedColors: ["#1f1f1f", "#d21f26", "#f5c542"] },
    { locale: "zh-Hans-CN", expectedColors: ["#de2910", "#ffde00"] },
  ];

  for (const { locale, expectedColors } of cases) {
    it(`renders ${locale} as an SVG data-URI image without CSS background spans`, () => {
      const html = renderToStaticMarkup(<LanguageFlag locale={locale} />);
      expect(html.startsWith("<img ")).toBe(true);
      expect(html).toContain('aria-hidden="true"');
      expect(html).toContain('alt=""');
      expect(html).not.toContain("bg-white");

      const svg = decodeFlagSvg(html);
      expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
      for (const color of expectedColors) {
        expect(svg).toContain(`fill="${color}"`);
      }
    });
  }
});
