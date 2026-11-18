import { useNavigate, useRouterState } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSettings } from "../hooks/use-settings";
import { useTwitchEnabled } from "../hooks/use-twitch";
import {
  nextServiceRoute,
  nextTwitchSearchRoute,
  SERVICE_OPTIONS,
  serviceAlternatives,
  TWITCH_SEARCH_OPTION,
} from "../lib/service-options";
import { m } from "../paraglide/messages.js";
import { useUiStore } from "../stores/ui-store";
import type { ServiceId } from "../types/user";
import { ServiceIcon } from "./service-icon";

type Props = {
  compact?: boolean;
};

export function NavbarServicePicker({ compact = false }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useRouterState({ select: (state) => state.location });
  const { settings, update } = useSettings();
  const twitchEnabled = useTwitchEnabled();
  const searchTwitch = useUiStore((state) => state.searchTwitch) && twitchEnabled;
  const setSearchTwitch = useUiStore((state) => state.setSearchTwitch);
  const service =
    SERVICE_OPTIONS.find((option) => option.id === settings.defaultService) ?? SERVICE_OPTIONS[0];
  const active = searchTwitch ? TWITCH_SEARCH_OPTION : service;
  const alternatives = searchTwitch
    ? SERVICE_OPTIONS
    : serviceAlternatives(settings.defaultService);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  function selectService(service: ServiceId) {
    setSearchTwitch(false);
    if (service !== settings.defaultService) update.mutate({ defaultService: service });
    setOpen(false);
    const target = nextServiceRoute(location.pathname, location.searchStr, service);
    if (target) navigate(target);
  }

  function selectTwitch() {
    setSearchTwitch(true);
    setOpen(false);
    const target = nextTwitchSearchRoute(location.pathname, location.searchStr);
    if (target) navigate(target);
  }

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={m.nav_services()}
        onClick={() => setOpen((current) => !current)}
        className={`flex h-9 items-center rounded-sm border border-transparent text-fg transition-colors hover:border-border hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-strong ${
          compact ? "w-9 justify-center px-0" : "gap-2 px-2"
        }`}
      >
        <ServiceIcon path={active.path} color={active.color} label={active.label} />
        {!compact && <span className="hidden text-xs font-medium xl:inline">{active.label}</span>}
        <ChevronDown
          size={12}
          className={`transition-transform duration-150 ${compact ? "hidden" : ""} ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </button>
      <div
        role="listbox"
        aria-label={m.nav_services()}
        className={`absolute right-0 top-full z-30 mt-1 w-44 max-w-[calc(100vw-1rem)] origin-top-right rounded-sm border border-border-strong bg-app p-1 shadow-xl transition-[opacity,transform] duration-150 ${
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-1 opacity-0"
        }`}
      >
        {alternatives.map((service) => (
          <button
            key={service.id}
            type="button"
            role="option"
            aria-selected={false}
            onClick={() => selectService(service.id)}
            className="flex min-h-10 w-full items-center gap-2 rounded-sm px-2 text-left text-xs text-fg-muted transition-colors hover:bg-surface hover:text-fg"
          >
            <ServiceIcon path={service.path} color={service.color} label={service.label} />
            <span className="flex-1">{service.label}</span>
          </button>
        ))}
        {twitchEnabled && !searchTwitch && (
          <button
            type="button"
            role="option"
            aria-selected={false}
            onClick={selectTwitch}
            className="flex min-h-10 w-full items-center gap-2 rounded-sm px-2 text-left text-xs text-fg-muted transition-colors hover:bg-surface hover:text-fg"
          >
            <ServiceIcon
              path={TWITCH_SEARCH_OPTION.path}
              color={TWITCH_SEARCH_OPTION.color}
              label={TWITCH_SEARCH_OPTION.label}
            />
            <span className="flex-1">{TWITCH_SEARCH_OPTION.label}</span>
          </button>
        )}
      </div>
    </div>
  );
}
