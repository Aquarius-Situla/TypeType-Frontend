import { between, clamp, liftSkip, SKIP_NEAR, type SkipAct, type SkipStage } from "./ad-skip-stage";

// Acts of the skip button that get away from the pointer.

const FACES = ["(=^･ω･^=)", "(=°ω°=)", "(=>﹏<=)"] as const;

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
export const teleporter: SkipAct = (s) => {
  let busy = false;
  s.btn.style.transformOrigin = "50% 100%";
  s.onMove = () => {
    if (busy || s.dist() > SKIP_NEAR) return;
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
export const shyCat: SkipAct = (s) => {
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
export const decoys: SkipAct = (s) => {
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
