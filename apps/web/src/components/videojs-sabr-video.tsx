import { useAttachMedia, useMediaInstance } from "@videojs/react";
import { forwardRef, type ReactNode, type Ref, useCallback, type VideoHTMLAttributes } from "react";
import { SabrVideoAdapter } from "../lib/sabr-video-adapter";

type Props = VideoHTMLAttributes<HTMLVideoElement> & { children?: ReactNode };

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") ref(value);
  else if (ref) (ref as { current: T | null }).current = value;
}

export const SabrVideo = forwardRef<HTMLVideoElement, Props>(function SabrVideo(
  { children, ...props },
  ref,
) {
  const media = useMediaInstance(SabrVideoAdapter);
  const attach = useAttachMedia<HTMLVideoElement>(media);
  const composed = useCallback(
    (element: HTMLVideoElement | null) => {
      attach(element);
      assignRef(ref, element);
    },
    [attach, ref],
  );
  return (
    <video ref={composed} {...props}>
      {children}
    </video>
  );
});
