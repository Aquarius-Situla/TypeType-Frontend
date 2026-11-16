import { Menu } from "@videojs/react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { BAR_MENU_ITEM, BAR_MENU_LABEL } from "../lib/videojs-menu-classes";

export type MenuOption = { value: string; label: string; disabled: boolean };

type SectionProps = {
  label: string;
  value: string;
  options: readonly MenuOption[];
  onChange: (value: string) => void;
};

export function MenuSection({ label, value, options, onChange }: SectionProps) {
  return (
    <>
      <p className={BAR_MENU_LABEL}>{label}</p>
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
    </>
  );
}

type SubmenuProps = SectionProps & { children?: never };

// One row of the settings list, YouTube style: the setting and its current value; opening it swaps the list for the
// choices, with a row back to the list.
export function MenuSubmenu({ label, value, options, onChange }: SubmenuProps) {
  const current = options.find((option) => option.value === value)?.label ?? "";
  return (
    <Menu.Root>
      <Menu.Trigger className={BAR_MENU_ITEM}>
        <span>{label}</span>
        <span className="ml-auto flex items-center gap-1 text-white/60">
          <span className="max-w-28 truncate">{current}</span>
          <ChevronRight className="size-4" aria-hidden="true" />
        </span>
      </Menu.Trigger>
      <Menu.Content>
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
export function MenuGroupSubmenu({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <Menu.Root>
      <Menu.Trigger className={BAR_MENU_ITEM}>
        <span>{label}</span>
        <span className="ml-auto flex items-center gap-1 text-white/60">
          {hint && <span className="max-w-28 truncate">{hint}</span>}
          <ChevronRight className="size-4" aria-hidden="true" />
        </span>
      </Menu.Trigger>
      <Menu.Content>
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
