import { between, liftSkip, SKIP_NEAR, type SkipAct } from "./ad-skip-stage";

// Acts of the skip button that put on a show of their own.

const BALLOON = `<svg class="typetype-ad-balloon" viewBox="0 0 70 118" aria-hidden="true"><defs><radialGradient id="typetype-ad-balloon-fill" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#fef08a"/><stop offset=".55" stop-color="#facc15"/><stop offset="1" stop-color="#ca8a04"/></radialGradient></defs><path data-part="string" d="M35 84 C 31 94 39 104 35 118" fill="none" stroke="#ffffffcc" stroke-width="1.2" opacity="0"/><g data-part="body" style="transform-origin:35px 84px;transform:scale(0)"><path d="M35 2 C 55 2 67 18 67 38 C 67 60 50 76 35 80 C 20 76 3 60 3 38 C 3 18 15 2 35 2Z" fill="url(#typetype-ad-balloon-fill)"/><path d="M31 80 L39 80 L41 86 L29 86 Z" fill="#ca8a04"/><ellipse cx="23" cy="24" rx="7" ry="11" fill="#fff" opacity=".55" transform="rotate(-24 23 24)"/></g></svg>`;

// Pops up on its own from under the bottom edge, leaning out, then ducks. Coming near hurries it.
export const mole: SkipAct = (s) => {
  const hidden = "translateY(160%) rotateX(55deg)";
  const out = "translateY(0) rotateX(0) translateZ(20px)";
  let busy = true;
  let current: Animation | undefined;
  s.btn.style.transform = hidden;
  s.btn.style.transformOrigin = "50% 100%";
  const play = (frames: Keyframe[], options: KeyframeAnimationOptions, then: () => void) => {
    current?.cancel();
    current = s.btn.animate(frames, { fill: "forwards", ...options });
    current.onfinish = then;
  };
  const duck = () => {
    if (busy) return;
    busy = true;
    liftSkip(s.btn, 0);
    play(
      [
        { transform: out },
        { transform: "translateY(-8%) rotateX(-10deg) translateZ(30px)", offset: 0.25 },
        { transform: hidden },
      ],
      { duration: 200, easing: "ease-in" },
      () => s.later(rise, between(300, 800)),
    );
  };
  const rise = () => {
    const { W, H, w, h } = s.size();
    // The middle of the bottom edge, between the controls on either side.
    let x = 0;
    for (let attempt = 0; attempt < 20; attempt += 1) {
      x = between(W * 0.3, Math.max(W * 0.3, W * 0.68 - w));
      if (Math.abs(x + w / 2 - s.px) >= 150) break;
    }
    s.free(x, H - h - 4);
    liftSkip(s.btn, 0);
    play(
      [{ transform: hidden }, { transform: "translateY(68%) rotateX(40deg)" }],
      { duration: 200, easing: "ease-out" },
      () =>
        s.later(
          () => {
            liftSkip(s.btn, 0.7);
            play(
              [
                { transform: "translateY(68%) rotateX(40deg)" },
                {
                  transform: "translateY(-12%) rotateX(-16deg) translateZ(40px)",
                  offset: 0.6,
                },
                { transform: "translateY(3%) rotateX(5deg) translateZ(15px)", offset: 0.82 },
                { transform: out },
              ],
              { duration: 340, easing: "ease-out" },
              () => {
                busy = false;
                s.later(duck, between(700, 1500));
              },
            );
          },
          between(250, 500),
        ),
    );
  };
  rise();
  s.onMove = () => {
    if (s.dist() < SKIP_NEAR) duck();
  };
};

// A balloon swells above it, pulls its string tight and carries it out of the frame.
export const balloon: SkipAct = (s) => {
  s.btn.insertAdjacentHTML("beforeend", BALLOON);
  const drawing = s.btn.querySelector<SVGElement>(".typetype-ad-balloon");
  const body = drawing?.querySelector<SVGElement>('[data-part="body"]');
  const string = drawing?.querySelector<SVGElement>('[data-part="string"]');
  let started = -1;
  let climb = 0;
  s.loop((dt, t) => {
    if (!drawing || !body || !string) return;
    if (started < 0) {
      if (s.dist() >= 100) return;
      started = t;
      string.setAttribute("opacity", "1");
      body.animate(
        [
          { transform: "scale(0)" },
          { transform: "scale(.5,.42)", offset: 0.3 },
          { transform: "scale(.85,.95)", offset: 0.55 },
          { transform: "scale(1.12,1.06)", offset: 0.78 },
          { transform: "scale(.97,1.02)", offset: 0.9 },
          { transform: "scale(1)" },
        ],
        { duration: 900, easing: "ease-out", fill: "forwards" },
      );
    }
    const since = t - started;
    drawing.style.transform = `rotate(${Math.sin(since * 2.1) * 7}deg)`;
    if (since < 0.75) {
      s.btn.style.transform = `translateY(${-Math.min(1, since / 0.75) * 3}px) rotate(${Math.sin(since * 30) * 1.2}deg)`;
      return;
    }
    climb = Math.min(105, climb + 70 * dt);
    const sway = Math.sin((since - 0.75) * 1.7);
    s.free(s.x + sway * 22 * dt, s.y - climb * dt);
    s.btn.style.transform = `rotate(${-sway * 5}deg)`;
  });
};
