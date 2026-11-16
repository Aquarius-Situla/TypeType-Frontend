import { Menu } from "@videojs/react";
import { Accessibility, Keyboard, Megaphone } from "lucide-react";
import { BAR_MENU_ITEM } from "../lib/videojs-menu-classes";
import { m } from "../paraglide/messages.js";
import { usePlayerAccessibilityStore } from "../stores/player-accessibility-store";
import { MenuGroupSubmenu, MenuSwitch, RowLabel } from "./videojs-menu-section";

// The accessibility page of the Vidstack settings: spoken status changes and the shortcut feedback badge.
export function VideoJsAccessibilitySubmenu() {
  const { announcements, keyboardAnimations, setAnnouncements, setKeyboardAnimations } =
    usePlayerAccessibilityStore();
  return (
    <MenuGroupSubmenu icon={Accessibility} label={m.player_accessibility()}>
      <Menu.CheckboxItem
        checked={announcements}
        onCheckedChange={(checked: boolean) => setAnnouncements(checked)}
        className={`${BAR_MENU_ITEM} min-h-12`}
      >
        <RowLabel icon={Megaphone} label={m.player_announcements()} />
        <MenuSwitch on={announcements} />
      </Menu.CheckboxItem>
      <Menu.CheckboxItem
        checked={keyboardAnimations}
        onCheckedChange={(checked: boolean) => setKeyboardAnimations(checked)}
        className={`${BAR_MENU_ITEM} min-h-12`}
      >
        <RowLabel icon={Keyboard} label={m.player_keyboard_animations()} />
        <MenuSwitch on={keyboardAnimations} />
      </Menu.CheckboxItem>
    </MenuGroupSubmenu>
  );
}
