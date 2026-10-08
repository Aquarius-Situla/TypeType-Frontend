import { Link } from "@tanstack/react-router";
import { Calendar, Compass, Flame, ShieldAlert, Sparkles } from "lucide-react";
import { useSubscriptionGroups } from "../hooks/use-subscription-groups";
import { getEntertainmentWeight, useFocusModeStore } from "../stores/focus-mode-store";

const PRESET_DAYS = [7, 30, 90, 180, 365];

export function SettingsFocusMode() {
  const {
    enabled,
    startedAt,
    transitionDays,
    studyGroupId,
    entertainmentGroupId,
    hideOldEntertainmentDays,
    setEnabled,
    setTransitionDays,
    setStudyGroupId,
    setEntertainmentGroupId,
    setHideOldEntertainmentDays,
    resetProgress,
  } = useFocusModeStore();

  const groupsQuery = useSubscriptionGroups();
  const groups = groupsQuery.data ?? [];

  const weight = getEntertainmentWeight({ enabled, startedAt, transitionDays });
  const entertainmentPercentage = Math.round(weight * 100);
  const elapsedDays = Math.floor(Math.max(0, Date.now() - startedAt) / 86_400_000);
  const totalDays = Math.max(1, transitionDays);

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-fg flex items-center gap-2">
          <Flame className="h-4 w-4 text-amber-500" aria-hidden="true" />
          <span>Self-Discipline Mode (自律专注模式)</span>
        </h2>
        <p className="text-xs text-fg-soft leading-relaxed">
          Designed for long-term digital detox and focused learning. Progressively eliminates
          entertainment recommendations over your chosen timeframe and hides deep channel archives
          to prevent algorithmic addiction.
        </p>
      </div>

      {/* Main Activation Card */}
      <div className="rounded-xl border border-border bg-surface p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-fg">Enable Self-Discipline Mode</span>
            <span className="text-xs text-fg-soft">
              {enabled
                ? "Active · Algorithm decay is in progress"
                : "Disabled · Standard feeds without decay"}
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={() => setEnabled(!enabled)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              enabled ? "bg-amber-600" : "bg-zinc-700"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                enabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {enabled && (
          <div className="rounded-lg border border-border-strong/50 bg-surface-strong/40 p-3 flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-fg">
                Day {Math.min(totalDays, elapsedDays + 1)} of {totalDays}
              </span>
              <span className="text-amber-500 font-semibold">
                Entertainment Feed: {entertainmentPercentage}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.round(((totalDays - weight * totalDays) / totalDays) * 100))}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-fg-muted pt-1">
              <span>{Math.round(100 - entertainmentPercentage)}% detoxified</span>
              <button
                type="button"
                onClick={resetProgress}
                className="hover:text-fg underline transition-colors"
              >
                Reset Start Timer
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Dual Group Configuration */}
      <div className="flex flex-col gap-3">
        <p className="px-1 text-xs font-medium text-fg-soft uppercase tracking-wider">
          Dual Group Mapping (双分组归类)
        </p>
        <div className="rounded-xl border border-border bg-surface divide-y divide-border">
          {/* Study Group */}
          <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-fg flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                Study Group (学习分组)
              </span>
              <span className="text-xs text-fg-soft">
                Channels dedicated to courses, skills, and academic research (always prioritized).
              </span>
            </div>
            <select
              aria-label="Study Group"
              value={studyGroupId ?? ""}
              onChange={(e) => setStudyGroupId(e.target.value || null)}
              className="h-9 rounded-lg border border-border-strong bg-surface-strong px-3 text-xs text-fg sm:w-56"
            >
              <option value="">(None / Ungrouped)</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name} ({group.channelCount})
                </option>
              ))}
            </select>
          </div>

          {/* Entertainment Group */}
          <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-fg flex items-center gap-1.5">
                <Compass className="h-3.5 w-3.5 text-amber-400" />
                Entertainment Group (娱乐分组)
              </span>
              <span className="text-xs text-fg-soft">
                Gaming, comedy, and relaxation channels subject to progressive decay.
              </span>
            </div>
            <select
              aria-label="Entertainment Group"
              value={entertainmentGroupId ?? ""}
              onChange={(e) => setEntertainmentGroupId(e.target.value || null)}
              className="h-9 rounded-lg border border-border-strong bg-surface-strong px-3 text-xs text-fg sm:w-56"
            >
              <option value="">(None / Ungrouped)</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name} ({group.channelCount})
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="px-1 text-xs text-fg-muted">
          Need to create or assign channels to groups? Manage them in{" "}
          <Link to="/subscriptions/groups" className="text-fg underline hover:text-white">
            Subscription Groups
          </Link>
          .
        </p>
      </div>

      {/* Decay Transition Timeframe */}
      <div className="flex flex-col gap-3">
        <p className="px-1 text-xs font-medium text-fg-soft uppercase tracking-wider">
          Transition Timeframe (过渡衰减周期)
        </p>
        <div className="rounded-xl border border-border bg-surface p-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-fg flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-blue-400" />
              Decay Duration (Days)
            </span>
            <span className="text-xs text-fg-soft">
              Entertainment channel recommendations on Home and Subscriptions will gradually decay
              from 100% to 0% over this duration.
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {PRESET_DAYS.map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setTransitionDays(days)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  transitionDays === days
                    ? "bg-fg text-app"
                    : "bg-surface-strong text-fg-muted hover:text-fg hover:bg-surface-strong/80"
                }`}
              >
                {days} Days {days === 90 ? "(Recommended)" : ""}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 7-Day Cutoff Window */}
      <div className="flex flex-col gap-3">
        <p className="px-1 text-xs font-medium text-fg-soft uppercase tracking-wider">
          Binge Prevention Window (深坑防刷机制)
        </p>
        <div className="rounded-xl border border-border bg-surface p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-fg flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
              Entertainment Channel Archive Window
            </span>
            <span className="text-xs text-fg-soft">
              When entering an entertainment channel page, hide videos uploaded older than{" "}
              {hideOldEntertainmentDays} days to keep you updated on recent highlights while
              preventing endless binge-watching.
            </span>
          </div>

          <select
            aria-label="Archive Window"
            value={hideOldEntertainmentDays}
            onChange={(e) => setHideOldEntertainmentDays(Number(e.target.value))}
            className="h-9 rounded-lg border border-border-strong bg-surface-strong px-3 text-xs text-fg sm:w-44"
          >
            <option value={3}>3 Days</option>
            <option value={7}>7 Days (Standard)</option>
            <option value={14}>14 Days</option>
            <option value={30}>30 Days</option>
          </select>
        </div>
      </div>
    </section>
  );
}
