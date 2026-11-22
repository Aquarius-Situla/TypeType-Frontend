import type { JSX } from "react";
import { LoadingMascot } from "./loading-mascot";

type Props = {
  sectionClass: string;
};

export function ShortsShellLoader({ sectionClass }: Props): JSX.Element {
  return (
    <section className={sectionClass}>
      <div className="flex h-full min-h-0 w-full items-center justify-center">
        <div className="shorts-stage relative max-h-full max-w-full">
          <div className="shorts-shell shorts-frame relative overflow-hidden rounded-lg bg-black shadow-xl">
            <LoadingMascot variant="video-portrait" surface="fill" />
          </div>
        </div>
      </div>
    </section>
  );
}
