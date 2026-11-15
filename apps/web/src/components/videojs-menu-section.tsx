import { Menu } from "@videojs/react";
import { Check } from "lucide-react";
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
