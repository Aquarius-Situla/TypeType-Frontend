import { Menu } from "@videojs/react";
import { Check, ChevronLeft, ChevronRight, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { BAR_MENU_ITEM } from "../lib/videojs-menu-classes";

export type MenuOption = { value: string; label: string; disabled: boolean };

type SectionProps = {
  label: string;
  value: string;
  options: readonly MenuOption[];
  onChange: (value: string) => void;
};

type SubmenuProps = SectionProps & { icon: LucideIcon };

export function RowLabel({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <span className="flex items-center gap-4">
      <Icon className="size-6 shrink-0" strokeWidth={1.75} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

// The on and off switch of a settings row, as in the YouTube settings.
export function MenuSwitch({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200 motion-reduce:transition-none ${on ? "bg-(--media-accent-color,#ef4444)" : "bg-white/25"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform duration-200 motion-reduce:transition-none ${on ? "translate-x-4" : ""}`}
      />
    </span>
  );
}

// One row of the settings list, YouTube style: the setting and its current value; opening it swaps the list for the
// choices, with a row back to the list.
export function MenuSubmenu({ icon, label, value, options, onChange }: SubmenuProps) {
  const current = options.find((option) => option.value === value)?.label ?? "";
  return (
    <Menu.Root>
      <Menu.Trigger className={`${BAR_MENU_ITEM} min-h-12`}>
        <RowLabel icon={icon} label={label} />
        <span className="ml-auto flex items-center gap-1 text-white/60">
          <span className="max-w-28 truncate">{current}</span>
          <ChevronRight className="size-4" aria-hidden="true" />
        </span>
      </Menu.Trigger>
      <Menu.Content className="typetype-menu-content">
        <Menu.Item className={`${BAR_MENU_ITEM} justify-start font-medium`}>
          <ChevronLeft className="size-4" aria-hidden="true" />
          <span>{label}</span>
        </Menu.Item>
        <Menu.Separator className="my-1 h-px bg-white/10" />
        <Menu.RadioGroup aria-label={label} value={value} onValueChange={onChange}>
          {options.map((option) => (
            <Menu.RadioItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              className={BAR_MENU_ITEM}
            >
              <span>{option.label}</span>
              <Menu.ItemIndicator checked={option.value === value}>
                <Check className="size-4" aria-hidden="true" />
              </Menu.ItemIndicator>
            </Menu.RadioItem>
          ))}
        </Menu.RadioGroup>
      </Menu.Content>
    </Menu.Root>
  );
}

// A row that opens a list of further rows, such as the caption style or the danmaku options.
type GroupProps = { icon: LucideIcon; label: string; hint?: string; children: ReactNode };

export function MenuGroupSubmenu({ icon, label, hint, children }: GroupProps) {
  return (
    <Menu.Root>
      <Menu.Trigger className={`${BAR_MENU_ITEM} min-h-12`}>
        <RowLabel icon={icon} label={label} />
        <span className="ml-auto flex items-center gap-1 text-white/60">
          {hint && <span className="max-w-28 truncate">{hint}</span>}
          <ChevronRight className="size-4" aria-hidden="true" />
        </span>
      </Menu.Trigger>
      <Menu.Content className="typetype-menu-content">
        <Menu.Item className={`${BAR_MENU_ITEM} justify-start font-medium`}>
          <ChevronLeft className="size-4" aria-hidden="true" />
          <span>{label}</span>
        </Menu.Item>
        <Menu.Separator className="my-1 h-px bg-white/10" />
        {children}
      </Menu.Content>
    </Menu.Root>
  );
}
