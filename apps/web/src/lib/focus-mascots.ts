const FOCUS_QUESTION_MASCOT_SRC = "/focus/focus-question.webp";
const FOCUS_REST_DEFAULT_SRC = "/focus/focus-rest-en.webp";

const FOCUS_REST_SOURCES: Record<string, string> = {
  en: FOCUS_REST_DEFAULT_SRC,
  "zh-hans-cn": "/focus/focus-rest-zh-hans-cn.webp",
  fr: "/focus/focus-rest-fr.webp",
  de: "/focus/focus-rest-de.webp",
};

export const FOCUS_QUESTION_DIMENSIONS = { width: 1024, height: 1024 } as const;
export const FOCUS_REST_DIMENSIONS = { width: 1200, height: 896 } as const;

export function focusQuestionMascotSrc(): string {
  return FOCUS_QUESTION_MASCOT_SRC;
}

export function focusRestMascotSrc(locale = "en"): string {
  return FOCUS_REST_SOURCES[locale.trim().toLowerCase()] ?? FOCUS_REST_DEFAULT_SRC;
}
