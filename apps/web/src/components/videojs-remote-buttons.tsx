import { AirPlayButton, CastButton } from "@videojs/react";
import { Airplay, Cast } from "lucide-react";
import { BAR_BUTTON } from "../lib/videojs-menu-classes";
import { m } from "../paraglide/messages.js";

const REMOTE_BUTTON = `${BAR_BUTTON} data-[availability=unavailable]:hidden`;

// Casting and AirPlay, as in the Vidstack bar: each button stays hidden until the browser finds a device for it.
export function SkinRemoteButtons() {
  return (
    <>
      <CastButton className={REMOTE_BUTTON} aria-label={m.player_cast()} title={m.player_cast()}>
        <Cast className="size-5" aria-hidden="true" />
      </CastButton>
      <AirPlayButton
        className={BAR_BUTTON}
        aria-label={m.player_airplay()}
        title={m.player_airplay()}
      >
        <Airplay className="size-5" aria-hidden="true" />
      </AirPlayButton>
    </>
  );
}
