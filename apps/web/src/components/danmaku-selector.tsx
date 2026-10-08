import { MessageSquareShare } from "lucide-react";
import { useRef, useState } from "react";
import { useInterfaceLocale } from "../hooks/use-interface-locale";
import { supportsBulletComments } from "../lib/provider";
import type { DefaultLayoutIcon, MenuInstance } from "../lib/vidstack";
import { DefaultMenuButton, DefaultMenuRadioGroup, Menu } from "../lib/vidstack";
import { toWatchSourceUrl } from "../lib/watch-url";
import { m } from "../paraglide/messages.js";
import { useB2YStore } from "../stores/b2y-store";
import { useDanmakuStore } from "../stores/danmaku-store";
import { B2YModal } from "./b2y-modal";
import { DanmakuIcon } from "./watch-icons";

const danmakuIcon: DefaultLayoutIcon = (props) => <DanmakuIcon {...props} />;

const MENU_ITEMS_CLASS =
  "vds-menu-items max-h-[44svh] overflow-y-auto overscroll-y-contain pr-0.5 md:max-h-72 [scrollbar-width:thin] [scrollbar-color:var(--color-zinc-500)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-surface-soft/80 [&::-webkit-scrollbar-thumb:hover]:bg-surface-soft [&::-webkit-scrollbar-track]:bg-transparent";

type Props = {
  supported?: boolean;
};

export function DanmakuSelector({ supported }: Props) {
  const { locale } = useInterfaceLocale();
  const menuRef = useRef<MenuInstance>(null);
  const [b2yModalOpen, setB2yModalOpen] = useState(false);
  const { on, speed, size, setSpeed, setSize } = useDanmakuStore();
  const b2yLinks = useB2YStore((s) => s.links);
  const currentVideoId =
    typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("v") : null;
  const isB2YLinked = currentVideoId ? Boolean(b2yLinks[currentVideoId]) : false;

  const isSupported =
    supported ??
    (isB2YLinked ||
      (typeof window !== "undefined"
        ? supportsBulletComments(window.location.href) ||
          supportsBulletComments(window.location.search) ||
          supportsBulletComments(toWatchSourceUrl(window.location.href)) ||
          Boolean(new URLSearchParams(window.location.search).get("v")?.match(/^BV|^sm\d+/i))
        : true));

  if (!isSupported) return null;

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
    <>
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

          {currentVideoId && (
            <button
              type="button"
              onClick={() => {
                menuRef.current?.close();
                setB2yModalOpen(true);
              }}
              className="vds-menu-item flex w-full items-center justify-between gap-3 px-3 py-2 text-xs text-left hover:bg-surface-strong transition-colors rounded-lg text-fg"
            >
              <div className="flex items-center gap-2">
                <MessageSquareShare className="h-3.5 w-3.5 text-fg-muted" aria-hidden="true" />
                <span>{m.watch_b2y_danmaku({}, { locale })}</span>
              </div>
              <span className="text-[11px] text-fg-soft font-mono">
                {isB2YLinked
                  ? m.watch_b2y_danmaku_linked({}, { locale })
                  : m.b2y_modal_link_action({}, { locale })}
              </span>
            </button>
          )}
        </Menu.Items>
      </Menu.Root>
      {b2yModalOpen && currentVideoId && (
        <B2YModal
          isOpen={b2yModalOpen}
          onClose={() => setB2yModalOpen(false)}
          streamId={currentVideoId}
          streamTitle={
            typeof document !== "undefined" ? document.title.replace(/ - TypeType$/, "") : ""
          }
        />
      )}
    </>
  );
}
