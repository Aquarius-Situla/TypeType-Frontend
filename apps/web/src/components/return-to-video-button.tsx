import { ArrowUpLeft } from "lucide-react";
import { useInterfaceLocale } from "../hooks/use-interface-locale";
import { useReturnToVideo } from "../hooks/use-return-to-video";
import { m } from "../paraglide/messages.js";

export function ReturnToVideoButton() {
  const back = useReturnToVideo();
  const { locale } = useInterfaceLocale();
  const label = m.player_return_to_video({}, { locale });
  if (!back) return null;

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(event) => {
        event.stopPropagation();
        back();
      }}
    >
      <ArrowUpLeft size={20} aria-hidden="true" />
    </button>
  );
}
