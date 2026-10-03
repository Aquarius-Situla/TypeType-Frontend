import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { m } from "../../paraglide/messages.js";

export function GroupManagerHeader(): React.JSX.Element {
  return (
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{m.sg_manage_groups()}</h1>
        <p className="mt-1 text-sm text-fg-muted">{m.sg_manager_description()}</p>
      </div>
      <Link to="/subscriptions/channels" className="sg-button">
        <ArrowLeft size={14} />
        {m.sg_back_channels()}
      </Link>
    </header>
  );
}
