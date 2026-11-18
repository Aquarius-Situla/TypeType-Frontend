import { useNavigate } from "@tanstack/react-router";
import { Download, Lock, Play } from "lucide-react";
import { type ReactNode, useState } from "react";
import { AD_ROTATION, type Ad, trialIsEarned } from "../lib/ad-catalog";
import { trialEndingUrl, trialThumbnailUrl } from "../lib/ad-media";
import { freshAdProgress } from "../lib/ad-progress";
import { endingTitle, TRIAL_ENDINGS } from "../lib/ad-trial";
import { hasPremium, readAdVault, wantAds } from "../lib/ad-vault";
import { m } from "../paraglide/messages.js";
import { AdClassic } from "./ad-classic";
import { AdCreditList } from "./ad-credit-list";
import { AdPremium } from "./ad-premium";
import { AdTrial } from "./ad-trial";

// What the screen of the page plays: an ad of the rotation, or one ending of the trial in full.
type Showing = { ad: Ad } | { ending: number };

function showingKey(showing: Showing): string {
  return "ad" in showing ? showing.ad.id : `ending-${showing.ending}`;
}

function AgencyScreen({ showing, onClose }: { showing: Showing; onClose: () => void }) {
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [progress] = useState(freshAdProgress);
  const shared = {
    progress,
    volume,
    muted,
    replay: true,
    onToggleMute: () => setMuted((before) => !before),
    onVolume: setVolume,
    onSoundBlocked: () => setMuted(true),
    onFinish: onClose,
  };
  let player: ReactNode;
  if ("ending" in showing) {
    player = (
      <AdClassic
        {...shared}
        brand={`${m.ad_brand_7()} · ${endingTitle(showing.ending)}`}
        src={trialEndingUrl(showing.ending)}
        cues={`lineaire_fin${showing.ending}`}
        download={`le-proces-fin-${showing.ending}.mp4`}
      />
    );
  } else if (showing.ad.kind === "trial") {
    player = <AdTrial {...shared} brand={showing.ad.brand()} />;
  } else {
    player = (
      <AdClassic
        {...shared}
        brand={showing.ad.brand()}
        src={showing.ad.src}
        cues={showing.ad.cues}
      />
    );
  }
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">{player}</div>
  );
}

// The sponsors page: the ads already watched can be replayed here, the others stay locked.
export function AdAgency() {
  const navigate = useNavigate();
  const [vault, setVault] = useState(readAdVault);
  const [playing, setPlaying] = useState<Showing | null>(null);
  const earned = trialIsEarned(vault);
  function close() {
    setPlaying(null);
    setVault(readAdVault());
  }
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-fg">{m.ad_agency_title()}</h1>
      </header>
      {hasPremium(vault) && !playing && (
        <div className="relative h-40 overflow-hidden rounded-lg">
          <AdPremium />
        </div>
      )}
      {playing && <AgencyScreen key={showingKey(playing)} showing={playing} onClose={close} />}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {AD_ROTATION.map((ad) => {
          const open = ad.kind === "trial" ? earned : vault.seen.includes(ad.id);
          return (
            <li key={ad.id}>
              <button
                type="button"
                disabled={!open}
                onClick={() => setPlaying({ ad })}
                className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 text-center transition-colors enabled:hover:border-yellow-400 disabled:opacity-60"
              >
                {open ? (
                  <Play className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                ) : (
                  <Lock className="h-5 w-5 text-fg-soft" aria-hidden="true" />
                )}
                <span className="text-sm font-medium text-fg">{open ? ad.brand() : "? ? ?"}</span>
                <span className="text-[11px] leading-4 text-fg-soft">
                  {ad.kind === "trial"
                    ? open
                      ? m.ad_agency_endings({ n: String(vault.endings.length) })
                      : m.ad_agency_trial_locked()
                    : open
                      ? m.ad_agency_replay()
                      : m.ad_agency_locked()}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {earned && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-fg">{m.ad_agency_full_endings()}</h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {Object.entries(TRIAL_ENDINGS).map(([key, ending]) => {
              const number = Number(key);
              const found = vault.endings.includes(number);
              return (
                <li key={key} className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    disabled={!found}
                    onClick={() => setPlaying({ ending: number })}
                    className="group relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-surface transition-colors enabled:hover:border-yellow-400 disabled:opacity-60"
                  >
                    {found ? (
                      <>
                        <img
                          src={trialThumbnailUrl(ending.picture)}
                          alt=""
                          className="absolute inset-0 h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100"
                        />
                        <Play
                          className="absolute inset-0 m-auto h-6 w-6 text-yellow-400 drop-shadow"
                          aria-hidden="true"
                        />
                      </>
                    ) : (
                      <Lock
                        className="absolute inset-0 m-auto h-5 w-5 text-fg-soft"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-medium text-fg">
                      {found ? `${number}. ${endingTitle(number)}` : m.ad_agency_locked()}
                    </span>
                    {found && (
                      <a
                        href={trialEndingUrl(number)}
                        download={`le-proces-fin-${number}.mp4`}
                        aria-label={m.ad_download()}
                        title={m.ad_download()}
                        className="shrink-0 text-fg-soft hover:text-yellow-400"
                      >
                        <Download className="h-4 w-4" aria-hidden="true" />
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}
      <AdCreditList className="border-t border-border pt-6 text-fg-soft" />
      <div className="flex items-center justify-between gap-3 text-xs text-fg-soft">
        <span>{m.ad_agency_endings({ n: `${vault.endings.length}` })}</span>
        <button
          type="button"
          onClick={() => {
            wantAds(false);
            navigate({ to: "/" });
          }}
          className="underline hover:text-fg"
        >
          {m.ad_agency_off()}
        </button>
      </div>
    </main>
  );
}
