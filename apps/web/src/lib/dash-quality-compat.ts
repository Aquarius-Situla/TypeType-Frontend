import type * as dashjs from "dashjs";

type DashjsV4Compat = {
  setQualityFor: (type: dashjs.MediaType, index: number, forceReplace?: boolean) => void;
  setRepresentationForTypeByIndex: (
    type: dashjs.MediaType,
    index: number,
    forceReplace?: boolean,
  ) => void;
};

export function installDashQualityCompat(player: dashjs.MediaPlayerClass): void {
  const compat = player as unknown as DashjsV4Compat;
  if (typeof compat.setQualityFor === "function") return;
  compat.setQualityFor = (type, index, forceReplace = false) => {
    compat.setRepresentationForTypeByIndex(type, index, forceReplace);
  };
}
