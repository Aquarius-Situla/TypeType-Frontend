import { useInterfaceLocale } from "../hooks/use-interface-locale";
import { useSettings } from "../hooks/use-settings";
import { m } from "../paraglide/messages.js";
import { type AppTheme, useThemeStore } from "../stores/theme-store";
import { ROW } from "./settings-toggle-switch";

const SECTION_LABEL = "px-1 text-xs font-medium text-fg-soft uppercase tracking-wider";
const GROUP = "divide-y divide-border border-y border-border";
const SELECT =
  "typetype-adaptive-control h-9 w-full max-w-full rounded-sm border border-border-strong bg-app px-2.5 text-sm text-fg sm:w-48";

export function SettingsLayoutPreferences() {
  const { locale } = useInterfaceLocale();
  const isZh = locale.startsWith("zh");
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const { settings, update } = useSettings();

  return (
    <section className="flex flex-col gap-3">
      <p className={SECTION_LABEL}>{m.settings_layout_label()}</p>
      <div className={GROUP}>
        <div className={ROW}>
          <div className="typetype-adaptive-label flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-sm text-fg">{m.settings_layout_video_grid_columns()}</span>
            <span className="text-xs text-fg-soft">
              {m.settings_layout_video_grid_columns_description()}
            </span>
          </div>
          <select
            aria-label={m.settings_layout_video_grid_columns()}
            value={settings.videoGridColumns}
            onChange={(event) =>
              update.mutate({
                videoGridColumns: Number(event.target.value) as 0 | 4 | 5 | 6,
              })
            }
            className={SELECT}
          >
            <option value={0}>{m.ui_auto()}</option>
            <option value={4}>4</option>
            <option value={5}>5</option>
            <option value={6}>6</option>
          </select>
        </div>
        <div className={ROW}>
          <div className="typetype-adaptive-label flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-sm text-fg">{isZh ? "外观主题" : "Theme"}</span>
            <span className="text-xs text-fg-soft">
              {isZh
                ? "选择界面的显示主题，支持浅色模式、深色模式或跟随系统设置"
                : "Choose your interface theme, or match your system settings"}
            </span>
          </div>
          <select
            aria-label={isZh ? "外观主题" : "Theme"}
            value={theme}
            onChange={(event) => setTheme(event.target.value as AppTheme)}
            className={SELECT}
          >
            <option value="system">{isZh ? "跟随系统" : m.ui_system_mode()}</option>
            <option value="light">{isZh ? "浅色模式" : m.ui_light_mode()}</option>
            <option value="dark">{isZh ? "深色模式" : m.ui_dark_mode()}</option>
          </select>
        </div>
        <div className={ROW}>
          <div className="typetype-adaptive-label flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-sm text-fg">{m.settings_layout_related_video_size()}</span>
            <span className="text-xs text-fg-soft">
              {m.settings_layout_related_video_size_description()}
            </span>
          </div>
          <select
            aria-label={m.settings_layout_related_video_size()}
            value={settings.relatedVideoSize}
            onChange={(event) =>
              update.mutate({
                relatedVideoSize: event.target.value as "default" | "large",
              })
            }
            className={SELECT}
          >
            <option value="default">{m.settings_layout_related_video_size_default()}</option>
            <option value="large">{m.settings_layout_related_video_size_large()}</option>
          </select>
        </div>
      </div>
    </section>
  );
}
