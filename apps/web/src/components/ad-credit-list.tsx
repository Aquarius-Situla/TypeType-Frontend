import { AD_CREDITS } from "../lib/ad-credits";
import { m } from "../paraglide/messages.js";

// The people and tools behind the overlay media, with the note that AI tools were used.
export function AdCreditList({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center gap-3 text-center ${className}`}>
      <p className="text-xs font-semibold uppercase tracking-widest opacity-70">
        {m.ad_credits_heading()}
      </p>
      {AD_CREDITS.map((credit) => (
        <div key={credit.names[0]} className="flex flex-col gap-0.5">
          <p className="text-xs opacity-60">{credit.role()}</p>
          {credit.names.map((name) => (
            <p key={name} className="text-sm">
              {name}
            </p>
          ))}
        </div>
      ))}
      <p className="max-w-sm text-xs opacity-70">{m.ad_ai_note()}</p>
    </div>
  );
}
