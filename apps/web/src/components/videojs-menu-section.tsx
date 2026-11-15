import { Menu } from "@videojs/react";
import { Check, ChevronLeft, ChevronRight, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { BAR_MENU_ITEM, BAR_SUBMENU_CONTENT } from "../lib/videojs-menu-classes";

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
    <span className="flex items-center gap-3">
      <Icon className="size-[1.125rem] shrink-0 text-white/80" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

// One row of the settings list, YouTube style: the setting and its current value; opening it swaps the list for the
// choices, with a row back to the list.
export function MenuSubmenu({ icon, label, value, options, onChange }: SubmenuProps) {
  const current = options.find((option) => option.value === value)?.label ?? "";
  return (
    <Menu.Root>
      <Menu.Trigger className={BAR_MENU_ITEM}>
        <RowLabel icon={icon} label={label} />
        <span className="ml-auto flex items-center gap-1 text-white/60">
          <span className="max-w-28 truncate">{current}</span>
          <ChevronRight className="size-4" aria-hidden="true" />
        </span>
      </Menu.Trigger>
      <Menu.Content className={BAR_SUBMENU_CONTENT}>
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
      <Menu.Trigger className={BAR_MENU_ITEM}>
        <RowLabel icon={icon} label={label} />
        <span className="ml-auto flex items-center gap-1 text-white/60">
          {hint && <span className="max-w-28 truncate">{hint}</span>}
          <ChevronRight className="size-4" aria-hidden="true" />
        </span>
      </Menu.Trigger>
      <Menu.Content className={BAR_SUBMENU_CONTENT}>
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
