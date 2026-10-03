import { DollarSign } from "lucide-react";
import { siGithub, siLemmy } from "simple-icons";
import { useInterfaceLocale } from "../hooks/use-interface-locale";
import { LEMMY_COMMUNITY_URL } from "../lib/lemmy";
import { m } from "../paraglide/messages.js";
import { ServiceIcon } from "./service-icon";

const COMMUNITY_URL = "https://github.com/TypeType-Video";
const SPONSOR_URL = "https://github.com/sponsors/Priveetee";

export function AppFooter() {
  useInterfaceLocale();
  return (
    <footer className="mt-12 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-t border-border px-3 py-5 text-xs text-fg-soft">
      <a
        href={COMMUNITY_URL}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 text-fg-muted hover:text-fg"
      >
        <ServiceIcon path={siGithub.path} color="currentColor" label="GitHub" />
        {m.shell_built_by_community()}
      </a>
      <a
        href={LEMMY_COMMUNITY_URL}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 text-fg-muted hover:text-fg"
      >
        <ServiceIcon path={siLemmy.path} color="currentColor" label="Lemmy" />
        Lemmy
      </a>
      <a
        href={SPONSOR_URL}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 text-accent hover:text-accent-strong"
      >
        <DollarSign size={13} />
        {m.shell_support_typetype()}
      </a>
    </footer>
  );
}
