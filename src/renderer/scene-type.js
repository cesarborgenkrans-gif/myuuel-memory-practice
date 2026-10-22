/* Living Type: the second theme. Inspired by the Living Type Studio (an ASCII wire form turning in a field of loose
   letters) and coloured with the Chiyuki dark macro library: near-black navy, a faint dotted grid, pink, sky blue,
   amber and mint. The wire sphere turns behind Myuuel; letters drift like ink in a slow current.
   Phases steer it: Look is still and clear, Fade loosens the letters, Recall turns the sphere into a cube while the
   letters wander, Check brings everything home in a pink bloom. Same API as the Lantern Night painter. */
(() => {
  'use strict';
  const TAU = Math.PI * 2;
  const rand = seed => { let v = seed >>> 0; return () => { v = (Math.imul(v, 1664525) + 1013904223) >>> 0; return v / 4294967296; }; };
  const seeded = (count, seed, make) => { const r = rand(seed); return Array.from({ length: count }, (_, i) => make(r, i)); };
  const mod = (v, n) => ((v % n) + n) % n;

  const MOODS = {
    intro: { glow: .8, loose: .3, morph: 0, hush: 0 }, look: { glow: .95, loose: .12, morph: 0, hush: 0 },
    fade: { glow: .65, loose: .7, morph: .35, hush: .2 }, recall: { glow: .3, loose: 1, morph: 1, hush: .55 },
    check: { glow: 1, loose: .08, morph: 0, hush: 0 }, rest: { glow: .5, loose: .45, morph: 0, hush: .3 },
    paused: { glow: .3, loose: .15, morph: 0, hush: .5 }, asleep: { glow: .2, loose: .1, morph: 0, hush: .7 }
  };
  const GLYPHS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!#$%&*+=?@~';
  const letters = seeded(84, 6101, r => ({ x: r(), y: r(), g: GLYPHS[Math.floor(r() * GLYPHS.length)], size: .8 + r() * 1.5, phase: r() * TAU, speed: .5 + r(), tint: r() < .16 ? 'pink' : r() < .34 ? 'blue' : r() < .4 ? 'amber' : 'ink' }));
  const TINT = { ink: '247,242,250', pink: '236,134,194', blue: '130,178,250', amber: '255,177,92' };

  // The wire form, built like Living Type Studio's: rings of a sphere that can morph into a cube.
  const WIRE = (() => {
    const loops = [], ring = (fn, n = 64) => { const pts = []; for (let i = 0; i <= n; i++) pts.push(fn((i / n) * TAU)); loops.push(pts); };
    ring(a => [Math.cos(a), Math.sin(a), 0]); ring(a => [0, Math.cos(a), Math.sin(a)]); ring(a => [Math.cos(a), 0, Math.sin(a)]);
    for (const y of [-0.62, 0.62]) { const r = Math.sqrt(1 - y * y); ring(a => [Math.cos(a) * r, y, Math.sin(a) * r], 52); }
    ring(a => [Math.cos(a) * Math.SQRT1_2, Math.sin(a), Math.cos(a) * Math.SQRT1_2]);
    return loops;
  })();
  function dirChar(dx, dy) { let a = Math.atan2(dy, dx); if (a < 0) a += Math.PI; const d = a * 180 / Math.PI; return d < 22.5 || d >= 157.5 ? '-' : d < 67.5 ? '\\' : d < 112.5 ? '|' : '/'; }

  function create(canvas, { reduced = false } = {}) {
    const ctx = canvas.getContext('2d');
    let breath = .5;
    let W = 1, H = 1, k = 1, u = 1, L = { cx: .5, floorY: .2, bandTop: 0, bandH: .15, panel: null }, t = 0, yaw = .6, grid = null;
    const mood = { ...MOODS.intro }, goal = { ...MOODS.intro }, rings = [], puffs = [];

    function makeGrid() {
      const c = document.createElement('canvas'); c.width = canvas.width; c.height = canvas.height;
      const g = c.getContext('2d'); g.scale(k, k);
      const step = Math.max(5, u * .6); g.fillStyle = 'rgba(247,242,250,.045)';
      for (let y = step / 2; y < H; y += step) for (let x = step / 2; x < W; x += step) g.fillRect(x, y, 1, 1);
      const big = u * 9.6; g.fillStyle = 'rgba(247,242,250,.022)';
      for (let x = 0; x < W; x += big) g.fillRect(Math.round(x), 0, 1, H);
      for (let y = 0; y < H; y += big) g.fillRect(0, Math.round(y), W, 1);
      return c;
    }
    function resize(layout) {
      W = innerWidth; H = innerHeight; k = Math.min(1.5, devicePixelRatio || 1) * .7;
      canvas.width = Math.max(1, Math.round(W * k)); canvas.height = Math.max(1, Math.round(H * k));
      u = Math.min(W / 100, H * .5625 / 100); L = layout; grid = makeGrid();
      if (reduced) draw(0);
    }
    function glow(x, y, radius, rgb, alpha) {
      if (alpha <= .002 || radius <= 0) return;
      const g = ctx.createRadialGradient(x, y, 0, x, y, radius); g.addColorStop(0, `rgba(${rgb},${alpha})`); g.addColorStop(1, `rgba(${rgb},0)`);
      ctx.fillStyle = g; ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }
    const inPanel = (x, y) => { const p = L.panel; return p && x > p.left && x < p.right && y > p.top && y < p.bottom; };

    function wire(cx, cy, R, morph, hush, glowAmt) {
      const m = morph * morph * (3 - 2 * morph), pitch = .42 + .12 * Math.sin(t * .3), cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      const cell = u * 1.45, cells = new Map();
      for (const loop of WIRE) {
        let prev = null;
        for (const p of loop) {
          const mx = Math.max(Math.abs(p[0]), Math.abs(p[1]), Math.abs(p[2])) || 1;
          let x = p[0] + (p[0] / mx * .72 - p[0]) * m, y = p[1] + (p[1] / mx * .72 - p[1]) * m, z = p[2] + (p[2] / mx * .72 - p[2]) * m;
          [x, z] = [x * cyw + z * syw, -x * syw + z * cyw]; [y, z] = [y * cp - z * sp, y * sp + z * cp];
          const px = cx + x * R, py = cy + y * R;
          if (prev) {
            const key = Math.round(px / cell) + ',' + Math.round(py / cell), had = cells.get(key);
            if (!had || had.z < z) cells.set(key, { x: Math.round(px / cell) * cell, y: Math.round(py / cell) * cell, z, ch: dirChar(px - prev[0], py - prev[1]) });
          }
          prev = [px, py];
        }
      }
      ctx.font = `${(u * 1.6).toFixed(1)}px Consolas, "Courier New", monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (const c of cells.values()) {
        const front = c.z > 0, a = (front ? .42 + .3 * glowAmt : .16) * (1 - .45 * hush);
        ctx.fillStyle = front ? `rgba(236,134,194,${a})` : `rgba(130,178,250,${a})`;
        ctx.fillText(c.ch, c.x, c.y);
      }
    }

    function draw(dt) {
      t += dt / 1000;
      const ease = 1 - Math.exp(-dt / 1000 * 1.1);
      for (const key in goal) mood[key] += (goal[key] - mood[key]) * (reduced ? 1 : ease);
      const { glow: g, loose, morph, hush } = mood;
      yaw += dt / 1000 * (.2 + .22 * loose);
      const cx = L.cx, floorY = L.floorY, bandH = L.bandH, heart = floorY - bandH * .46;

      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#090b12'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (grid) ctx.drawImage(grid, 0, 0);
      ctx.setTransform(k, 0, 0, k, 0, 0);

      ctx.globalCompositeOperation = 'lighter';
      glow(W * (.15 + .05 * Math.sin(t / 27)), -H * .02, W * .95, '130,178,250', .15 * (1 - .4 * hush));
      glow(W * (.85 + .05 * Math.sin(t / 31 + 1)), H * .02, W * .8, '236,134,194', .12 * (1 - .4 * hush));
      glow(W * .5, H * 1.04, W * 1.05, '159,226,192', .06);
      glow(cx, heart, bandH * (1 + .45 * g), '236,134,194', .06 + .14 * g);
      glow(cx, heart, bandH * .75, '130,178,250', .05 + .07 * g);
      ctx.globalCompositeOperation = 'source-over';

      wire(cx, heart, bandH * .66, morph, hush, g);

      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (const l of letters) {
        const drift = t * l.speed * (4 + 26 * loose) * u / 10;
        const x = mod(l.x * W + drift + Math.sin(t * .23 + l.phase) * u * 3 * (.3 + loose), W + u * 6) - u * 3;
        const y = mod(l.y * H - t * u * .35 * l.speed + Math.sin(t * .17 + l.phase * 2) * u * 4 * (.3 + loose), H + u * 6) - u * 3;
        let a = (.05 + .2 * loose) * (.6 + .4 * Math.sin(t * .8 + l.phase)) * (1 - .4 * hush);
        if (inPanel(x, y)) a *= .25;
        if (a < .01) continue;
        ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * .2 + l.phase) * .5 * loose);
        ctx.font = `italic ${(l.size * u * 2).toFixed(1)}px Georgia, "Yu Mincho", serif`;
        ctx.fillStyle = `rgba(${TINT[l.tint]},${a})`; ctx.fillText(l.g, 0, 0); ctx.restore();
      }

      // The baseline she stands on: a hairline and a dashed ellipse, like a specimen frame.
      ctx.save(); ctx.translate(cx, floorY); ctx.scale(1.025 - .05 * breath, .12); // the shadow breathes with her: wider as she settles, narrower as she rises
      const sh = ctx.createRadialGradient(0, 0, 0, 0, 0, bandH * .5); sh.addColorStop(0, 'rgba(2,3,8,.65)'); sh.addColorStop(1, 'rgba(2,3,8,0)');
      ctx.fillStyle = sh; ctx.fillRect(-bandH * .5, -bandH * .5, bandH, bandH); ctx.restore();
      ctx.fillStyle = `rgba(247,242,250,${.07 + .05 * g})`; ctx.fillRect(W * .06, floorY + bandH * .015, W * .88, Math.max(1, u * .12));
      ctx.setLineDash([u * .9, u * .9]); ctx.lineDashOffset = -t * u * .6;
      ctx.strokeStyle = `rgba(236,134,194,${.2 + .18 * g})`; ctx.lineWidth = Math.max(1, u * .2);
      ctx.beginPath(); ctx.ellipse(cx, floorY + bandH * .015, bandH * .95, bandH * .075, 0, 0, TAU); ctx.stroke(); ctx.setLineDash([]);

      for (let i = rings.length - 1; i >= 0; i--) {
        const age = t - rings[i].born, life = 2.2; if (age > life) { rings.splice(i, 1); continue; }
        const q = age / life; ctx.strokeStyle = `rgba(236,134,194,${(1 - q) * .4})`; ctx.lineWidth = u * (.4 - .25 * q);
        ctx.beginPath(); ctx.arc(cx, heart, bandH * (.35 + 1.3 * (1 - Math.pow(1 - q, 2))), 0, TAU); ctx.stroke();
      }
      ctx.font = `${(u * 2.2).toFixed(1)}px Consolas, "Courier New", monospace`;
      for (let i = puffs.length - 1; i >= 0; i--) {
        const p = puffs[i], age = t - p.born; if (age > p.life) { puffs.splice(i, 1); continue; }
        const q = age / p.life, drag = Math.exp(-age * 2.4);
        ctx.fillStyle = `rgba(${p.rgb},${(1 - q) * .85})`; ctx.fillText(p.ch, p.x + p.vx * age * drag, p.y + p.vy * age * drag);
      }

      if (hush > .01) { ctx.fillStyle = `rgba(4,5,10,${.3 * hush})`; ctx.fillRect(0, L.bandTop + bandH, W, H); ctx.fillStyle = `rgba(4,5,10,${.12 * hush})`; ctx.fillRect(0, 0, W, L.bandTop + bandH); }
      const v = ctx.createRadialGradient(W / 2, H * .42, Math.min(W, H) * .35, W / 2, H * .45, Math.max(W, H) * .78);
      v.addColorStop(0, 'rgba(3,4,8,0)'); v.addColorStop(1, 'rgba(3,4,8,.55)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    }

    return {
      resize,
      setMood(name) { Object.assign(goal, MOODS[name] || MOODS.look); },
      ring() { rings.push({ born: t }); if (rings.length > 4) rings.shift(); },
      puff(x, y, count = 12) {
        const r = rand((t * 1000) | 0);
        for (let i = 0; i < count; i++) {
          const a = r() * TAU, sp = (40 + r() * 110) * u / 10;
          puffs.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 2 * u, born: t, life: .6 + r() * .5, ch: '*+·/\\|-'[Math.floor(r() * 7)], rgb: r() < .5 ? '236,134,194' : '130,178,250' });
        }
        while (puffs.length > 80) puffs.shift();
      },
      frame(dt) { if (!reduced) draw(dt); },
      setBreath(b) { breath = Number.isFinite(b) ? b : 0; },
      setReduced(on) { reduced = !!on; draw(0); },
      redraw() { draw(0); }
    };
  }
  window.MyuuelTypeScene = { create };
})();
