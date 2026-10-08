import { m } from "../paraglide/messages.js";
import { useDanmakuStore } from "../stores/danmaku-store";
import { DanmakuIcon } from "./watch-icons";

const BTN = "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors";
const BTN_IDLE = "text-fg-muted hover:text-fg hover:bg-surface-strong";
const BTN_ON = "text-fg bg-surface-strong";

export function DanmakuControls() {
  const { on, toggle } = useDanmakuStore();
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={on}
        className={`${BTN} ${on ? BTN_ON : BTN_IDLE}`}
      >
        <DanmakuIcon />
        {on ? m.ui_danmaku_on() : m.ui_danmaku()}
      </button>
    </div>
  );
}
