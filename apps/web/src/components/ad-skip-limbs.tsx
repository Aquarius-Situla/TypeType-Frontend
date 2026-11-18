const LIMB = "typetype-ad-limb absolute rounded-full bg-white";

function Arm({ side }: { side: "left" | "right" }) {
  const left = side === "left";
  return (
    <span
      data-side={side}
      className={`typetype-ad-arm top-1/2 h-1 w-4 ${LIMB} ${left ? "-left-3.5 origin-right" : "-right-3.5 origin-left"}`}
    >
      <span
        className={`absolute -top-[3px] h-2.5 w-2.5 rounded-full bg-white ${left ? "-left-1" : "-right-1"}`}
      />
    </span>
  );
}

function Leg({ side }: { side: "left" | "right" }) {
  return (
    <span
      data-side={side}
      className={`typetype-ad-leg -bottom-4 h-5 w-1 origin-top ${LIMB} ${side === "left" ? "left-[26%]" : "right-[26%]"}`}
    >
      <span className="typetype-ad-shoe absolute -bottom-0.5 h-1.5 w-3 rounded-full bg-white" />
    </span>
  );
}

// The arms and legs the skip button grows once it has been chased enough. Their motion follows
// the state of the button body and lives in styles/ad-motion.css.
export function AdSkipLimbs() {
  return (
    <span aria-hidden="true" className="typetype-ad-limbs absolute inset-0">
      <Arm side="left" />
      <Arm side="right" />
      <Leg side="left" />
      <Leg side="right" />
    </span>
  );
}
