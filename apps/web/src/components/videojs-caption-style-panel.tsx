import { Menu } from "@videojs/react";
import { RotateCcw } from "lucide-react";
import { EMPTY_CAPTION_STYLES } from "../lib/caption-styles";
import { BAR_MENU_ITEM } from "../lib/videojs-menu-classes";
import { m } from "../paraglide/messages.js";
import type { CaptionStyles } from "../types/user";
import { type MenuOption, MenuRadioSection, RowLabel } from "./videojs-menu-section";

const option = (value: string, label: string): MenuOption => ({ value, label, disabled: false });

const SIZES = ["50%", "75%", "100%", "150%", "200%", "300%"] as const;
const OPACITIES = ["25%", "50%", "75%", "100%"] as const;
const BACKGROUND_OPACITIES = ["0%", "25%", "50%", "75%", "100%"] as const;

const colors = () => [
  option("#ffffff", m.player_color_white()),
  option("#ffff00", m.player_color_yellow()),
  option("#00ff00", m.player_color_green()),
  option("#00ffff", m.player_color_cyan()),
  option("#0000ff", m.player_color_blue()),
  option("#ff0000", m.player_color_red()),
  option("#ff00ff", m.player_color_magenta()),
  option("#000000", m.player_color_black()),
];

const fonts = () => [
  option("pro-sans", m.player_caption_font_pro_sans()),
  option("pro-serif", m.player_caption_font_pro_serif()),
  option("mono-sans", m.player_caption_font_mono_sans()),
  option("mono-serif", m.player_caption_font_mono_serif()),
  option("casual", m.player_caption_font_casual()),
  option("cursive", m.player_caption_font_cursive()),
  option("capitals", m.player_caption_font_capitals()),
];

const shadows = () => [
  option("none", m.player_caption_shadow_none()),
  option("raised", m.player_caption_shadow_raised()),
  option("depressed", m.player_caption_shadow_depressed()),
  option("outline", m.player_caption_shadow_outline()),
  option("drop shadow", m.player_caption_shadow_drop()),
];

const percents = (values: readonly string[]) => values.map((value) => option(value, value));

type Props = { styles: CaptionStyles; onChange: (styles: CaptionStyles) => void };

// The caption styles of the Vidstack menu, applied to the browser cues through videojs-captions.css. The window colour
// relies on a Chromium pseudo-element and has no effect in Firefox.
export function VideoJsCaptionStylePanel({ styles, onChange }: Props) {
  const section = (
    key: keyof CaptionStyles,
    label: string,
    fallback: string,
    options: MenuOption[],
  ) => (
    <MenuRadioSection
      label={label}
      value={styles[key] || fallback}
      options={options}
      onChange={(value) => onChange({ ...styles, [key]: value })}
    />
  );
  return (
    <>
      {section("fontFamily", m.player_caption_font(), "pro-sans", fonts())}
      {section("fontSize", m.player_caption_size(), "100%", percents(SIZES))}
      {section("textColor", m.player_caption_color(), "#ffffff", colors())}
      {section("textOpacity", m.player_caption_text_opacity(), "100%", percents(OPACITIES))}
      {section("textShadow", m.player_caption_shadow(), "none", shadows())}
      {section("textBg", m.player_caption_background(), "#000000", colors())}
      {section(
        "textBgOpacity",
        m.player_caption_background_opacity(),
        "100%",
        percents(BACKGROUND_OPACITIES),
      )}
      {section("displayBg", m.player_caption_window(), "#000000", colors())}
      {section(
        "displayBgOpacity",
        m.player_caption_window_opacity(),
        "0%",
        percents(BACKGROUND_OPACITIES),
      )}
      <Menu.Separator className="my-1 h-px bg-white/10" />
      <Menu.Item className={BAR_MENU_ITEM} onClick={() => onChange({ ...EMPTY_CAPTION_STYLES })}>
        <RowLabel icon={RotateCcw} label={m.player_reset()} />
      </Menu.Item>
    </>
  );
}
