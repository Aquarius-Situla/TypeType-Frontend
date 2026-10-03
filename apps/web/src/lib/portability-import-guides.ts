import { m } from "../paraglide/messages.js";
import type { Locale } from "../paraglide/runtime.js";
import { FORMAT_NAMES } from "./portability-catalog";

export type PortabilityImportGuide = {
  description: string;
  steps: string[];
  action?: { label: string; url: string };
};

const TAKEOUT_URL =
  "https://takeout.google.com/settings/takeout/custom/youtube,my_activity?dest=mail&frequency=once";

export function portabilityImportGuide(
  format: string,
  locale: Locale = "en",
): PortabilityImportGuide {
  if (format === "auto") {
    return {
      description: m.portability_guide_auto_description({}, { locale }),
      steps: [
        m.portability_guide_auto_step_one({}, { locale }),
        m.portability_guide_auto_step_two({}, { locale }),
        m.portability_guide_auto_step_three({}, { locale }),
      ],
    };
  }
  if (format === "typetype") {
    return {
      description: m.portability_guide_typetype_description({}, { locale }),
      steps: [
        m.portability_guide_typetype_step_one({}, { locale }),
        m.portability_guide_typetype_step_two({}, { locale }),
        m.portability_guide_typetype_step_three({}, { locale }),
      ],
    };
  }
  if (format === "youtube-takeout") {
    return {
      description: m.portability_guide_takeout_description({}, { locale }),
      steps: [
        m.portability_guide_takeout_step_one({}, { locale }),
        m.portability_guide_takeout_step_two({}, { locale }),
        m.portability_guide_takeout_step_three({}, { locale }),
      ],
      action: { label: m.portability_guide_takeout_action({}, { locale }), url: TAKEOUT_URL },
    };
  }
  if (format === "opml") {
    return {
      description: m.portability_guide_opml_description({}, { locale }),
      steps: [
        m.portability_guide_opml_step_one({}, { locale }),
        m.portability_guide_opml_step_two({}, { locale }),
        m.portability_guide_opml_step_three({}, { locale }),
      ],
    };
  }
  const name = FORMAT_NAMES[format] ?? format;
  return {
    description: `${m.portability_guide_generic_prefix({}, { locale })} ${name} ${m.portability_guide_generic_suffix({}, { locale })}`,
    steps: [
      `${m.portability_guide_generic_open_prefix({}, { locale })} ${name} ${m.portability_guide_generic_open_suffix({}, { locale })}`,
      m.portability_guide_generic_download({}, { locale }),
      m.portability_guide_generic_drop({}, { locale }),
    ],
  };
}
