import { useRef } from "react";
import { useInterfaceLocale } from "../hooks/use-interface-locale";
import { useSettings } from "../hooks/use-settings";
import { supportsBulletComments } from "../lib/provider";
import type { DefaultLayoutIcon, MenuInstance } from "../lib/vidstack";
import { DefaultMenuButton, DefaultMenuRadioGroup, Menu } from "../lib/vidstack";
import { toWatchSourceUrl } from "../lib/watch-url";
import { m } from "../paraglide/messages.js";
import { useDanmakuStore } from "../stores/danmaku-store";
import { DanmakuIcon } from "./watch-icons";

const danmakuIcon: DefaultLayoutIcon = (props) => <DanmakuIcon {...props} />;

const MENU_ITEMS_CLASS =
  "vds-menu-items max-h-[44svh] overflow-y-auto overscroll-y-contain pr-0.5 md:max-h-72 [scrollbar-width:thin] [scrollbar-color:var(--color-zinc-500)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-surface-soft/80 [&::-webkit-scrollbar-thumb:hover]:bg-surface-soft [&::-webkit-scrollbar-track]:bg-transparent";

type Props = {
  supported?: boolean;
};

export function DanmakuSelector({ supported }: Props) {
  const { settings } = useSettings();
  const { locale } = useInterfaceLocale();
  const menuRef = useRef<MenuInstance>(null);
  const { on, speed, size, setSpeed, setSize } = useDanmakuStore();

  const isSupported =
    supported ??
    (typeof window !== "undefined"
      ? supportsBulletComments(window.location.href) ||
        supportsBulletComments(window.location.search) ||
        supportsBulletComments(toWatchSourceUrl(window.location.href)) ||
        Boolean(new URLSearchParams(window.location.search).get("v")?.match(/^BV|^sm\d+/i))
      : true);

  if (settings.hideComments || !isSupported) return null;

  const speedStr = speed <= 0.85 ? "0.75" : speed >= 1.15 ? "1.25" : "1";
  const sizeStr = size <= 0.85 ? "0.8" : size >= 1.15 ? "1.25" : "1";

  const speedHint =
    speedStr === "0.75"
      ? m.danmaku_speed_slow({}, { locale })
      : speedStr === "1.25"
        ? m.danmaku_speed_fast({}, { locale })
        : m.danmaku_speed_normal({}, { locale });

  const sizeHint =
    sizeStr === "0.8"
      ? m.danmaku_size_small({}, { locale })
      : sizeStr === "1.25"
        ? m.danmaku_size_large({}, { locale })
        : m.danmaku_size_normal({}, { locale });

  const danmakuHint = on ? `${speedHint} · ${sizeHint}` : m.player_off({}, { locale });

  return (
    <Menu.Root ref={menuRef} className="vds-danmaku-menu vds-menu">
      <DefaultMenuButton
        label={m.ui_danmaku({}, { locale })}
        hint={danmakuHint}
        Icon={danmakuIcon}
      />
      <Menu.Items className={MENU_ITEMS_CLASS}>
        <Menu.Root className="vds-menu">
          <DefaultMenuButton label={m.ui_speed({}, { locale })} hint={speedHint} />
          <Menu.Items className={MENU_ITEMS_CLASS}>
            <DefaultMenuRadioGroup
              value={speedStr}
              options={[
                { label: m.danmaku_speed_slow({}, { locale }), value: "0.75" },
                { label: m.danmaku_speed_normal({}, { locale }), value: "1" },
                { label: m.danmaku_speed_fast({}, { locale }), value: "1.25" },
              ]}
              onChange={(val) => {
                setSpeed(Number(val));
                menuRef.current?.close();
              }}
            />
          </Menu.Items>
        </Menu.Root>

        <Menu.Root className="vds-menu">
          <DefaultMenuButton label={m.ui_size({}, { locale })} hint={sizeHint} />
          <Menu.Items className={MENU_ITEMS_CLASS}>
            <DefaultMenuRadioGroup
              value={sizeStr}
              options={[
                { label: m.danmaku_size_small({}, { locale }), value: "0.8" },
                { label: m.danmaku_size_normal({}, { locale }), value: "1" },
                { label: m.danmaku_size_large({}, { locale }), value: "1.25" },
              ]}
              onChange={(val) => {
                setSize(Number(val));
                menuRef.current?.close();
              }}
            />
          </Menu.Items>
        </Menu.Root>
      </Menu.Items>
    </Menu.Root>
  );
}
