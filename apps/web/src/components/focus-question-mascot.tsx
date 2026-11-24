import type { JSX } from "react";
import { FOCUS_QUESTION_DIMENSIONS, focusQuestionMascotSrc } from "../lib/focus-mascots";

type Props = {
  className?: string;
};

export function FocusQuestionMascot({ className = "w-44 shrink-0 sm:w-52" }: Props): JSX.Element {
  return (
    <img
      src={focusQuestionMascotSrc()}
      width={FOCUS_QUESTION_DIMENSIONS.width}
      height={FOCUS_QUESTION_DIMENSIONS.height}
      alt=""
      className={`block h-auto object-contain ${className}`}
    />
  );
}
