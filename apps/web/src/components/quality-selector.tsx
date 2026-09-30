import type * as dashjs from "dashjs";
import { ArrowUpRight, LockKeyhole } from "lucide-react";
import { useRef } from "react";
import { useInterfaceLocale } from "../hooks/use-interface-locale";
import { useDashPlayerSnapshot } from "../lib/dash-player-store";
import { dashQualityOptions, selectDashTrack, selectedDashHeight } from "../lib/dash-video";
import { qualityOptionHeight } from "../lib/player-quality";
import { sabrResolutionOptions } from "../lib/sabr-quality-selection";
import type { DefaultLayoutIcon, MenuInstance } from "../lib/vidstack";
import {
  ClipIcon,
  DefaultMenuButton,
  DefaultMenuRadioGroup,
  Menu,
  useVideoQualityOptions,
} from "../lib/vidstack";
import { m } from "../paraglide/messages.js";
import { useSabrQualityStore } from "../stores/sabr-quality-store";
import { useBiliBiliSessionGate } from "./bilibili-session-gate";

const qualityIcon: DefaultLayoutIcon = (props) => <ClipIcon {...props} />;
const MENU_ITEMS_CLASS =
  "vds-menu-items max-h-[44svh] overflow-y-auto overscroll-y-contain pr-0.5 md:max-h-72 [scrollbar-width:thin] [scrollbar-color:var(--color-zinc-500)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-surface-soft/80 [&::-webkit-scrollbar-thumb:hover]:bg-surface-soft [&::-webkit-scrollbar-track]:bg-transparent";
const QUALITY_OPTIONS = { sort: "descending" } as const;

type QualityOption = ReturnType<typeof useVideoQualityOptions>[number];

function qualityValue(option: QualityOption): string {
  const height = qualityOptionHeight(option);
  return height !== null ? String(height) : option.label;
}

function collectResolutionOptions(options: QualityOption[]): QualityOption[] {
  const grouped = new Map<string, QualityOption>();
  for (const option of options) {
    if (option.quality === null) continue;
    const value = qualityValue(option);
    const current = grouped.get(value);
    if (!current || option.selected) grouped.set(value, option);
  }
  return [...grouped.values()];
}

function activeDashTrack(
  player: dashjs.MediaPlayerClass,
  selectedVideoTrack: dashjs.MediaInfo | null,
): dashjs.MediaInfo | null {
  return selectedVideoTrack ?? player.getCurrentTrackFor("video");
}

export function QualitySelector() {
  const { locale } = useInterfaceLocale();
  const menuRef = useRef<MenuInstance>(null);
  const { player, selectedVideoTrack } = useDashPlayerSnapshot();
  const options = useVideoQualityOptions(QUALITY_OPTIONS);
  const sabrStreamId = useSabrQualityStore((state) => state.streamId);
  const sabrOptions = useSabrQualityStore((state) => state.options);
  const sabrSelectedItag = useSabrQualityStore((state) => state.selectedItag);
  const selectSabrQuality = useSabrQualityStore((state) => state.selectQuality);
  const { connectHref, requiresConnection } = useBiliBiliSessionGate();
  const unlockLink = requiresConnection ? (
    <a
      href={connectHref}
      className="mt-1 flex min-h-11 items-center gap-3 border-border border-t px-3 py-2 text-left text-fg hover:bg-surface-strong"
    >
      <LockKeyhole className="size-4 shrink-0 text-[#00a1d6]" aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm">{m.ui_bilibili_quality_unlock_menu()}</span>
        <span className="block text-xs text-fg-soft">{m.ui_bilibili_session_connect()}</span>
      </span>
      <ArrowUpRight className="size-4 shrink-0 text-fg-soft" aria-hidden="true" />
    </a>
  ) : null;

  if (sabrStreamId && sabrOptions.length > 0) {
    const streamId = sabrStreamId;
    const selected =
      sabrOptions.find((option) => option.itag === sabrSelectedItag) ?? sabrOptions[0];
    const resolutionOptions = sabrResolutionOptions(sabrOptions, selected);
    if (resolutionOptions.length <= 1) return null;
    function onSabrChange(value: string) {
      const itag = Number(value);
      if (!Number.isInteger(itag)) return;
      selectSabrQuality(streamId, itag);
      menuRef.current?.close();
    }
    return (
      <Menu.Root ref={menuRef} className="vds-quality-menu vds-menu">
        <DefaultMenuButton
          label={m.player_quality({}, { locale })}
          hint={selected.label}
          Icon={qualityIcon}
        />
        <Menu.Items className={MENU_ITEMS_CLASS}>
          <DefaultMenuRadioGroup
            value={String(selected.itag)}
            options={resolutionOptions.map((option) => ({
              label: option.label,
              value: String(option.itag),
            }))}
            onChange={onSabrChange}
          />
          {unlockLink}
        </Menu.Items>
      </Menu.Root>
    );
  }

  const dashTrack = player ? activeDashTrack(player, selectedVideoTrack) : null;
  if (player && dashTrack) {
    const dashPlayer = player;
    const activeTrack = dashTrack;
    const selectedHeight = selectedDashHeight(dashPlayer, activeTrack);
    const dashOptions = dashQualityOptions(activeTrack, selectedHeight);
    const selected = dashOptions.find((option) => option.selected) ?? dashOptions[0];

    if (dashOptions.length > 1 && selected) {
      function onDashChange(value: string) {
        const height = Number(value);
        if (!Number.isFinite(height)) return;
        selectDashTrack(dashPlayer, activeTrack, height);
        menuRef.current?.close();
      }

      return (
        <Menu.Root ref={menuRef} className="vds-quality-menu vds-menu">
          <DefaultMenuButton
            label={m.player_quality({}, { locale })}
            hint={selected.label}
            Icon={qualityIcon}
          />
          <Menu.Items className={MENU_ITEMS_CLASS}>
            <DefaultMenuRadioGroup
              value={selected.value}
              options={dashOptions.map((option) => ({
                label: option.label,
                value: option.value,
              }))}
              onChange={onDashChange}
            />
            {unlockLink}
          </Menu.Items>
        </Menu.Root>
      );
    }
  }

  const videoOptions = options.filter((o) => o.quality !== null);
  const filteredOptions = collectResolutionOptions(videoOptions);
  const selected = filteredOptions.find((o) => o.selected) ?? filteredOptions[0];
  const radioOptions = filteredOptions.map((o) => ({ label: o.label, value: qualityValue(o) }));

  if (filteredOptions.length <= 1) return null;
  if (filteredOptions.every((o) => (qualityOptionHeight(o) ?? 0) === 0)) return null;

  if (!selected) return null;
  const current = selected.label;

  function onChange(value: string) {
    filteredOptions.find((o) => qualityValue(o) === value)?.select();
    menuRef.current?.close();
  }

  return (
    <Menu.Root ref={menuRef} className="vds-quality-menu vds-menu">
      <DefaultMenuButton
        label={m.player_quality({}, { locale })}
        hint={current}
        Icon={qualityIcon}
      />
      <Menu.Items className={MENU_ITEMS_CLASS}>
        <DefaultMenuRadioGroup
          value={qualityValue(selected)}
          options={radioOptions}
          onChange={onChange}
        />
        {unlockLink}
      </Menu.Items>
    </Menu.Root>
  );
}
