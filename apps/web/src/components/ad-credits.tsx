import { useEffect } from "react";
import { AD_ROTATION } from "../lib/ad-catalog";
import { adCreditsPictureUrl } from "../lib/ad-media";
import { m } from "../paraglide/messages.js";

const ROLL_SECONDS = 26;

type Props = { onDone: () => void };

// The reward for finding the five endings: the seven ads roll past one last time. A click, or the
// end of the roll, moves on.
export function AdCredits({ onDone }: Props) {
  useEffect(() => {
    const timer = window.setTimeout(onDone, ROLL_SECONDS * 1000);
    return () => window.clearTimeout(timer);
  }, [onDone]);

  return (
    <button
      type="button"
      onClick={onDone}
      aria-label={m.ad_credits_title()}
      className="absolute inset-0 z-[70] block w-full cursor-pointer overflow-hidden bg-black text-center text-white [container-type:size]"
    >
      <div
        className="typetype-ad-credits absolute inset-x-0 top-full flex flex-col items-center gap-10 px-6 pb-[60%]"
        style={{ animationDuration: `${ROLL_SECONDS}s` }}
      >
        <div>
          <p className="text-2xl font-bold sm:text-4xl">{m.ad_credits_title()}</p>
          <p className="mt-2 text-sm text-white/75 sm:text-base">{m.ad_credits_text()}</p>
        </div>
        {AD_ROTATION.map((ad, index) => (
          <div key={ad.id} className="flex w-full max-w-sm flex-col items-center gap-3">
            <img
              src={adCreditsPictureUrl(index + 1)}
              alt=""
              className="aspect-video w-full rounded-2xl object-cover shadow-2xl ring-1 ring-white/15"
            />
            <p className="text-lg font-semibold sm:text-2xl">{ad.brand()}</p>
          </div>
        ))}
        <p className="text-xs uppercase tracking-widest text-white/50">{m.ad_thanks_credit()}</p>
      </div>
    </button>
  );
}
