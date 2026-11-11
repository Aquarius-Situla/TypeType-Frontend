import { Link } from "@tanstack/react-router";
import { Megaphone } from "lucide-react";
import { useState } from "react";
import { ConfirmModal } from "../components/confirm-modal";
import { adMediaAvailable } from "../lib/ad-media";
import { readAdVault, wantAds } from "../lib/ad-vault";
import { m } from "../paraglide/messages.js";
import { ROW, ToggleSwitch } from "./settings-toggle-switch";

// Turning ads on takes two confirmations; turning them off takes none.
function askSteps() {
  return [
    { title: m.ad_ask_1_t(), description: "", confirm: m.ad_ask_1_c() },
    { title: m.ad_ask_2_t(), description: m.ad_ask_2_d(), confirm: m.ad_ask_2_c() },
  ];
}

// The switch lives with the SponsorBlock modes: this one puts ads back instead of skipping them.
export function AdModeRow() {
  const [wanted, setWanted] = useState(() => readAdVault().wanted);
  // Index of the confirmation on screen, or -1.
  const [step, setStep] = useState(-1);
  const current = step >= 0 ? askSteps()[step] : null;
  // False once the instance was found not to serve the videos.
  const [available, setAvailable] = useState(true);
  function confirm() {
    if (step < askSteps().length - 1) return setStep(step + 1);
    setStep(-1);
    setWanted(wantAds(true).wanted);
  }
  function toggle() {
    if (wanted) return setWanted(wantAds(false).wanted);
    void adMediaAvailable().then((ok) => {
      setAvailable(ok);
      if (ok) setStep(0);
    });
  }
  return (
    <>
      <div className={`${ROW} gap-3`}>
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-yellow-400 text-black">
          <Megaphone className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex items-center gap-2 text-sm text-fg">
            {m.ad_mode_add()}
            {wanted && (
              <span className="rounded-sm bg-yellow-400 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-black">
                {m.ad_mode_add_on()}
              </span>
            )}
          </span>
          <span className="text-xs text-fg-soft">{m.ad_mode_add_desc()}</span>
          {!available && <span className="text-xs text-danger-strong">{m.ad_unavailable()}</span>}
          {wanted && (
            <Link
              to="/sponsors"
              className="self-start text-xs text-fg-soft underline hover:text-fg"
            >
              {m.ad_agency_title()}
            </Link>
          )}
        </div>
        <ToggleSwitch checked={wanted || step >= 0} onClick={toggle} />
      </div>
      {current && (
        <ConfirmModal
          title={current.title}
          description={current.description}
          confirmLabel={current.confirm}
          onConfirm={confirm}
          onCancel={() => setStep(-1)}
        />
      )}
    </>
  );
}
