import { between, clamp, liftSkip, type SkipStage } from "./ad-skip-stage";

// The acts of the skip button besides the runner (components/ad-skip-runner.tsx): each one is a
// different way for the button never to be skipped. An act drives the button of its stage directly.

type Act = (stage: SkipStage) => void;

const NEAR = 85;
const FACES = ["(=^･ω･^=)", "(=°ω°=)", "(=>﹏<=)"] as const;
const BALLOON = `<svg class="typetype-ad-balloon" viewBox="0 0 70 118" aria-hidden="true"><defs><radialGradient id="typetype-ad-balloon-fill" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#fef08a"/><stop offset=".55" stop-color="#facc15"/><stop offset="1" stop-color="#ca8a04"/></radialGradient></defs><path data-part="string" d="M35 84 C 31 94 39 104 35 118" fill="none" stroke="#ffffffcc" stroke-width="1.2" opacity="0"/><g data-part="body" style="transform-origin:35px 84px;transform:scale(0)"><path d="M35 2 C 55 2 67 18 67 38 C 67 60 50 76 35 80 C 20 76 3 60 3 38 C 3 18 15 2 35 2Z" fill="url(#typetype-ad-balloon-fill)"/><path d="M31 80 L39 80 L41 86 L29 86 Z" fill="#ca8a04"/><ellipse cx="23" cy="24" rx="7" ry="11" fill="#fff" opacity=".55" transform="rotate(-24 23 24)"/></g></svg>`;

// A spot for the button away from the pointer.
function awayFromPointer(s: SkipStage, clear: number): { x: number; y: number } {
  const { W, H, w, h } = s.size();
  let x = 0;
  let y = 0;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    x = between(10, W - w - 10);
    y = between(10, H - h - 74);
    if (Math.hypot(x + w / 2 - s.px, y + h / 2 - s.py) >= clear) break;
  }
  return { x, y };
}

// Folds back into the picture like a trapdoor, then flips down somewhere else.
const teleporter: Act = (s) => {
  let busy = false;
  s.btn.style.transformOrigin = "50% 100%";
  s.onMove = () => {
    if (busy || s.dist() > NEAR) return;
    busy = true;
    const away = s.btn.animate(
      [
        { transform: "rotateX(0) translateZ(0)", opacity: 1 },
        { transform: "rotateX(18deg) translateZ(30px)", offset: 0.25 },
        { transform: "rotateX(-88deg) translateZ(-60px)", opacity: 0.2 },
      ],
      { duration: 260, easing: "cubic-bezier(.4,0,.8,.4)", fill: "forwards" },
    );
    away.onfinish = () => {
      const spot = awayFromPointer(s, 190);
      s.later(() => {
        s.place(spot.x, spot.y);
        liftSkip(s.btn, 1);
        const back = s.btn.animate(
          [
            { transform: "rotateX(88deg) translateZ(-60px)", opacity: 0.2 },
            { transform: "rotateX(-14deg) translateZ(40px)", opacity: 1, offset: 0.6 },
            { transform: "rotateX(6deg) translateZ(10px)", offset: 0.82 },
            { transform: "rotateX(0) translateZ(0)", opacity: 1 },
          ],
          { duration: 380, easing: "ease-out", fill: "forwards" },
        );
        s.later(() => liftSkip(s.btn, 0), 230);
        back.onfinish = () => {
          busy = false;
        };
      }, 160);
    };
  };
};

// A small cat in the label: the closer the pointer, the further it backs into the picture.
const shyCat: Act = (s) => {
  const face = document.createElement("span");
  face.className = "typetype-ad-kao";
  face.textContent = FACES[0];
  s.btn.prepend(face);
  const { W, H, w, h } = s.size();
  s.place(W - w - 14, H - h);
  let fearNow = 0;
  let speed = 0;
  let shown = 0;
  s.loop((dt, t) => {
    const fear = clamp(1 - (s.dist() - 40) / 220, 0, 1);
    speed += ((fear - fearNow) * 170 - speed * 16) * dt;
    fearNow = clamp(fearNow + speed * dt, -0.08, 1.05);
    const shake = fearNow > 0.35 ? (fearNow - 0.35) * 3 : 0;
    const mood = fear < 0.25 ? 0 : fear < 0.6 ? 1 : 2;
    if (mood !== shown) {
      face.textContent = FACES[mood];
      shown = mood;
    }
    // A negative translateZ sinks it towards the vanishing point: smaller, and nearer the centre.
    s.btn.style.transform = `translate3d(${Math.sin(t * 61) * shake}px, ${Math.cos(t * 53) * shake}px, ${-fearNow * 2600}px)`;
    s.btn.style.filter = `drop-shadow(0 ${4 + fearNow * 10}px ${5 + fearNow * 8}px rgb(0 0 0 / .5)) blur(${Math.max(0, fearNow - 0.25) * 3.2}px) brightness(${1 - fearNow * 0.45})`;
    s.btn.style.pointerEvents = fearNow > 0.4 ? "none" : "auto";
  });
};

// Splits in two at every approach. The copies pop away on their own, or when clicked.
const decoys: Act = (s) => {
  const all: HTMLButtonElement[] = [s.btn];
  const glide = "left .25s cubic-bezier(.3,1.4,.6,1), top .25s cubic-bezier(.3,1.4,.6,1)";
  let busy = false;
  s.btn.style.transition = glide;
  const scatter = (button: HTMLButtonElement) => {
    const { W, H, w, h } = s.size();
    button.style.left = `${between(8, W - w - 8)}px`;
    button.style.top = `${between(8, H - h - 70)}px`;
  };
  const pop = (button: HTMLButtonElement) => {
    const index = all.indexOf(button);
    if (index < 0 || all.length < 2) return;
    all.splice(index, 1);
    const gone = button.animate(
      [
        { transform: "scale(1)" },
        { transform: "scale(1.18)", offset: 0.35 },
        { transform: "scale(0)" },
      ],
      { duration: 190, easing: "ease-in", fill: "forwards" },
    );
    gone.onfinish = () => {
      if (button === s.btn) button.style.visibility = "hidden";
      else button.remove();
    };
  };
  s.btn.onclick = () => pop(s.btn);
  s.onMove = () => {
    if (busy) return;
    const box = s.frame.getBoundingClientRect();
    const near = all.find((button) => {
      const own = button.getBoundingClientRect();
      const dx = s.px - (own.left - box.left + own.width / 2);
      const dy = s.py - (own.top - box.top + own.height / 2);
      return Math.hypot(dx, dy) < 70;
    });
    if (!near) return;
    busy = true;
    if (all.length < 14) {
      const copy = near.cloneNode(true) as HTMLButtonElement;
      copy.style.transition = glide;
      copy.onclick = () => pop(copy);
      s.frame.append(copy);
      s.own(copy);
      all.push(copy);
      window.requestAnimationFrame(() => scatter(copy));
      s.later(() => pop(copy), between(2500, 5000));
    }
    scatter(near);
    s.later(() => {
      busy = false;
    }, 220);
  };
};

// Pops up on its own from under the bottom edge, leaning out, then ducks. Coming near hurries it.
const mole: Act = (s) => {
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
    if (s.dist() < NEAR) duck();
  };
};

// A balloon swells above it, pulls its string tight and carries it out of the frame.
const balloon: Act = (s) => {
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

// Turns see-through as the pointer comes near: the click goes through, and it drifts away.
const ghost: Act = (s) => {
  s.loop((dt, t) => {
    const distance = s.dist();
    const solid = clamp((distance - 40) / 170, 0.08, 1);
    s.btn.style.opacity = `${solid}`;
    s.btn.style.pointerEvents = solid < 0.9 ? "none" : "auto";
    if (distance < 190) {
      const { cx, cy } = s.center();
      const angle = Math.atan2(cy - s.py, cx - s.px);
      s.place(s.x + Math.cos(angle) * 70 * dt, s.y + Math.sin(angle) * 70 * dt);
    }
    s.btn.style.transform = `translateY(${Math.sin(t * 2.2) * 5}px) rotate(${Math.sin(t * 1.4) * 3}deg)`;
  });
};

// Slides like wet soap: the lightest touch sends it off, and it bounces off the edges.
const soap: Act = (s) => {
  let vx = 0;
  let vy = 0;
  let turn = 0;
  s.loop((dt) => {
    const { W, H, w, h } = s.size();
    const distance = s.dist();
    if (distance < 100) {
      const { cx, cy } = s.center();
      const angle = Math.atan2(cy - s.py, cx - s.px);
      const push = (100 - distance) * 60;
      vx += Math.cos(angle) * push * dt;
      vy += Math.sin(angle) * push * dt;
    }
    vx *= 0.985;
    vy *= 0.985;
    let x = s.x + vx * dt;
    let y = s.y + vy * dt;
    if (x < 6 || x > W - w - 6) {
      vx = -vx * 0.9;
      x = clamp(x, 6, W - w - 6);
    }
    if (y < 6 || y > H - h - 64) {
      vy = -vy * 0.9;
      y = clamp(y, 6, H - h - 64);
    }
    turn += vx * dt * 0.25;
    s.free(x, y);
    s.btn.style.transform = `rotate(${turn}deg)`;
  });
};

// Lets itself be clicked, plays dead on the floor, gets up and starts its countdown again.
const actor: Act = (s) => {
  let busy = false;
  s.btn.style.transition = "transform .45s cubic-bezier(.5,0,.6,1.4), top .45s ease-in";
  s.btn.style.transformOrigin = "50% 100%";
  s.btn.onclick = () => {
    if (busy) return;
    busy = true;
    const { H } = s.size();
    const standing = s.y;
    s.btn.style.transform = "rotate(180deg)";
    s.free(s.x, H - 70);
    s.later(() => {
      s.btn.style.transform = "rotate(0)";
      s.free(s.x, standing);
      let left = 5;
      const tick = () => {
        if (left > 0) {
          s.btn.textContent = s.countdown(left);
          left -= 1;
          s.later(tick, 1000);
        } else {
          s.showLabel();
          busy = false;
        }
      };
      tick();
    }, 1700);
  };
};

// Goes into orbit around the pointer: always at the same distance, never under the click.
const satellite: Act = (s) => {
  let angle = -Math.PI / 4;
  let orbiting = false;
  s.loop((dt) => {
    if (s.px < 0) {
      orbiting = false;
      return;
    }
    if (!orbiting && s.dist() < 120) orbiting = true;
    if (!orbiting) return;
    const { w, h } = s.size();
    angle += dt * 2.4;
    const x = s.px + Math.cos(angle) * 125 - w / 2;
    const y = s.py + Math.sin(angle) * 80 - h / 2;
    const ease = Math.min(1, dt * 9);
    s.place(s.x + (x - s.x) * ease, s.y + (y - s.y) * ease);
  });
};

export const SKIP_ACTS = {
  teleporter,
  shyCat,
  decoys,
  mole,
  balloon,
  ghost,
  soap,
  actor,
  satellite,
} satisfies Record<string, Act>;

export type SkipActName = keyof typeof SKIP_ACTS;
// The runner is the original act, drawn by its own component.
export type SkipVariant = SkipActName | "runner";

const VARIANTS: SkipVariant[] = ["runner", ...(Object.keys(SKIP_ACTS) as SkipActName[])];
let lastVariant: SkipVariant | null = null;

// One act per ad, never the one of the ad before. `random` returns a number in [0, 1).
export function pickSkipVariant(random: () => number = Math.random): SkipVariant {
  const choices = VARIANTS.filter((variant) => variant !== lastVariant);
  const variant = choices[Math.floor(random() * choices.length)] ?? "runner";
  lastVariant = variant;
  return variant;
}

export function skipVariants(): readonly SkipVariant[] {
  return VARIANTS;
}
