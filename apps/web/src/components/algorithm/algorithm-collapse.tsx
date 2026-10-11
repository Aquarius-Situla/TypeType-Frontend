import type { ReactNode } from "react";

export function Collapse({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <div className="algorithm-collapse" data-open={open} inert={!open}>
      <div>{children}</div>
    </div>
  );
}
