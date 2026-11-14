import { clamp, type SkipAct } from "./ad-skip-stage";

// Acts of the skip button that slip away or play with the click.

// Turns see-through as the pointer comes near: the click goes through, and it drifts away.
export const ghost: SkipAct = (s) => {
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
export const soap: SkipAct = (s) => {
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
export const actor: SkipAct = (s) => {
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
export const satellite: SkipAct = (s) => {
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
