import { m } from "../paraglide/messages.js";

// The reward for seeing the five endings of the trial: no more ads.
export function AdPremium() {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/85 px-6 text-center">
      <div>
        <p className="mt-2 text-2xl font-semibold sm:text-4xl">{m.ad_premium_title()}</p>
        <p className="mt-3 text-sm text-white/80 sm:text-base">{m.ad_premium_text()}</p>
      </div>
    </div>
  );
}
