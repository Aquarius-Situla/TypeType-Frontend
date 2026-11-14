import { useReactionGif } from "../hooks/use-reaction-gif";
import type { ReactionKind } from "../lib/reaction-gifs";

type Props = {
  kind: ReactionKind;
  // Side of the square box the reaction is fitted in, without being cropped.
  size: number;
  className?: string;
  // A fixed picture in place of the drawn one.
  src?: string;
};

export function ReactionGif({ kind, size, className = "", src }: Props) {
  const drawn = useReactionGif(kind);
  return (
    <img
      src={src ?? drawn}
      width={size}
      height={size}
      alt=""
      className={`object-contain ${className}`}
    />
  );
}
