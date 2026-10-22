/* Lantern Night: Myuuel's own stage, painted with the same craft as AI Discussion's Studio looks
   (layered radial glows, seeded motes, a pure function of time per frame). Night plum and warm gold,
   with her star ornament scattered as slow sparkles. It is brightest in the mascot band and hushes
   behind the practice panel, and it answers the practice phases instead of a voice:
   Look opens a warm pool of light, Recall hushes to a violet night, Check blooms gold, Rest breathes. */
(() => {
  'use strict';
  const TAU = Math.PI * 2;
  const rand = seed => { let v = seed >>> 0; return () => { v = (Math.imul(v, 1664525) + 1013904223) >>> 0; return v / 4294967296; }; };
  const seeded = (count, seed, make) => { const r = rand(seed); return Array.from({ length: count }, (_, i) => make(r, i)); };
  const mod = (v, n) => ((v % n) + n) % n;

  const stars = seeded(120, 5813, r => ({ x: r(), y: Math.pow(r(), 1.7) * .66, size: .5 + r() * 1.3, rate: .4 + r() * 1.6, phase: r() * TAU, warm: r() < .3 }));
  const sparkles = seeded(9, 2207, r => ({ x: .06 + r() * .88, y: r(), period: 7 + r() * 9, phase: r() * 20, size: .7 + r() * .8 }));
  const motes = seeded(64, 9431, r => ({ x: r(), y: r(), speed: 5 + r() * 14, sway: 6 + r() * 22, phase: r() * TAU, size: .6 + r() * 1.6, twinkle: .4 + r() * 1.3 }));

  const MOODS = {
    intro: { warm: .85, hush: 0, cool: 0 },
    look: { warm: .95, hush: 0, cool: 0 },
    fade: { warm: .6, hush: .25, cool: .35 },
    recall: { warm: .2, hush: .7, cool: 1 },
    check: { warm: 1, hush: 0, cool: 0 },
    rest: { warm: .5, hush: .35, cool: .2 },
    paused: { warm: .3, hush: .55, cool: .3 },
    asleep: { warm: .18, hush: .75, cool: .5 }
  };

  function create(canvas, { reduced = false } = {}) {
    const ctx = canvas.getContext('2d');
    let breath = .5;
    let W = 1, H = 1, k = 1, u = 1, L = { cx: .5, floorY: .2, bandTop: 0, bandH: .15, panel: null }, t = 0;
    const mood = { ...MOODS.intro }, goal = { ...MOODS.intro };
    const rings = [], puffs = [];

    function resize(layout) {
      W = innerWidth; H = innerHeight;
      k = Math.min(1.5, devicePixelRatio || 1) * .62; // painted soft and a little under-sampled; the glows do not need more
      canvas.width = Math.max(1, Math.round(W * k)); canvas.height = Math.max(1, Math.round(H * k));
      u = Math.min(W / 100, H * .5625 / 100);
      L = layout; if (reduced) draw(0);
    }
    function setMood(name) { Object.assign(goal, MOODS[name] || MOODS.look); }
    function ring() { rings.push({ born: t }); if (rings.length > 4) rings.shift(); }
    function puff(x, y, count = 14) {
      const r = rand((t * 1000) | 0);
      for (let i = 0; i < count; i++) {
        const a = r() * TAU, sp = (40 + r() * 120) * u / 10;
        puffs.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 20 * u / 10, born: t, life: .6 + r() * .5, size: (.6 + r() * .9) * u, gold: r() < .55 });
      }
      while (puffs.length > 80) puffs.shift();
    }

    function glow(x, y, radius, rgb, alpha) {
      if (alpha <= .002 || radius <= 0) return;
      const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
      g.addColorStop(0, `rgba(${rgb},${alpha})`); g.addColorStop(1, `rgba(${rgb},0)`);
      ctx.fillStyle = g; ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }
    function sparkle(x, y, s, alpha, rgb = '255,240,210') {
      if (alpha <= .01) return;
      ctx.fillStyle = `rgba(${rgb},${alpha})`;
      ctx.beginPath();
      ctx.moveTo(x, y - s); ctx.quadraticCurveTo(x + s * .14, y - s * .14, x + s, y); ctx.quadraticCurveTo(x + s * .14, y + s * .14, x, y + s);
      ctx.quadraticCurveTo(x - s * .14, y + s * .14, x - s, y); ctx.quadraticCurveTo(x - s * .14, y - s * .14, x, y - s); ctx.fill();
      glow(x, y, s * 1.6, rgb, alpha * .35);
    }
    const inPanel = (x, y) => { const p = L.panel; return p && x > p.left && x < p.right && y > p.top && y < p.bottom; };

    function draw(dt) {
      t += dt / 1000;
      const ease = 1 - Math.exp(-dt / 1000 * 1.3);
      for (const key in goal) mood[key] += (goal[key] - mood[key]) * (reduced ? 1 : ease);
      const { warm, hush, cool } = mood;
      const cx = L.cx, floorY = L.floorY, bandH = L.bandH, heart = floorY - bandH * .46;
      ctx.setTransform(k, 0, 0, k, 0, 0);
      ctx.globalCompositeOperation = 'source-over';

      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#22143a'); sky.addColorStop(.2, '#1b1129'); sky.addColorStop(.55, '#140d1f'); sky.addColorStop(1, '#0b0812');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

      ctx.globalCompositeOperation = 'lighter';
      const calm = 1 - .45 * hush;
      glow(W * (.5 + .32 * Math.sin(t / 23)), heart + H * .05 * Math.cos(t / 31), W * 1.05, '122,79,143', .3 * calm);
      glow(W * (.5 + .4 * Math.sin(t / 29 + 2)), H * (.07 + .04 * Math.sin(t / 19)), W * .8, '190,104,150', .12 * calm);
      glow(cx + W * .22 * Math.sin(t / 37 + 4), heart, W * .75, '232,180,90', .05 + .08 * warm);
      glow(W * (.3 + .1 * Math.sin(t / 41)), H * .86, W * .95, '86,52,120', .12);
      glow(cx, L.panel ? (L.panel.top + L.panel.bottom) / 2 : H * .6, W * .95, '104,112,206', .09 * cool);

      for (const s of stars) {
        const a = (.18 + .62 * Math.pow(Math.sin(t * s.rate + s.phase), 2)) * (1 - .25 * hush) * (1 + .3 * cool);
        const x = s.x * W, y = s.y * H, r = s.size * u * .18;
        ctx.fillStyle = s.warm ? `rgba(255,226,170,${a})` : `rgba(236,228,255,${a})`;
        ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
      }
      for (const s of sparkles) {
        const p = mod(t + s.phase, s.period) / s.period, peak = p < .2 ? Math.sin(p / .2 * Math.PI) : 0;
        const y = L.bandTop + s.y * bandH * 1.05, x = s.x * W;
        if (Math.abs(x - cx) < bandH * .32) continue; // keep her silhouette clear
        sparkle(x, y, s.size * u * 1.7 * (.6 + .4 * peak), peak * (.55 + .35 * warm));
      }

      const breathe = .5 + .5 * Math.sin(t * TAU / 7);
      glow(cx, heart, bandH * (.95 + .5 * warm + .06 * breathe), '255,212,150', (.07 + .25 * warm) * (1 - .35 * hush));
      glow(cx, floorY, bandH * .9, '232,180,90', .05 + .1 * warm);

      for (const m of motes) {
        const y = mod(m.y * H - t * m.speed * u / 10, H + 20) - 10, x = m.x * W + Math.sin(t * .3 + m.phase) * m.sway * u / 10;
        let a = (.1 + .35 * Math.pow(Math.sin(t * m.twinkle + m.phase), 2)) * (1 - .5 * hush);
        if (inPanel(x, y)) a *= .22;
        ctx.fillStyle = `rgba(255,222,160,${a})`; ctx.beginPath(); ctx.arc(x, y, m.size * u * .16, 0, TAU); ctx.fill();
      }

      ctx.globalCompositeOperation = 'source-over';
      // The stage rim she stands on: a soft shadow and a thin gold ellipse.
      ctx.save(); ctx.translate(cx, floorY); ctx.scale(1.025 - .05 * breath, .12); // the shadow breathes with her: wider as she settles, narrower as she rises
      const sh = ctx.createRadialGradient(0, 0, 0, 0, 0, bandH * .5); sh.addColorStop(0, 'rgba(6,3,10,.62)'); sh.addColorStop(1, 'rgba(6,3,10,0)');
      ctx.fillStyle = sh; ctx.fillRect(-bandH * .5, -bandH * .5, bandH, bandH); ctx.restore();
      ctx.lineWidth = Math.max(1, u * .22);
      ctx.strokeStyle = `rgba(232,180,90,${.14 + .14 * warm})`;
      ctx.beginPath(); ctx.ellipse(cx, floorY + bandH * .01, bandH * 1.05, bandH * .085, 0, 0, TAU); ctx.stroke();
      ctx.strokeStyle = `rgba(232,180,90,${.06 + .06 * warm})`;
      ctx.beginPath(); ctx.ellipse(cx, floorY + bandH * .01, bandH * 1.45, bandH * .12, 0, 0, TAU); ctx.stroke();

      for (let i = rings.length - 1; i >= 0; i--) {
        const age = t - rings[i].born, life = 2.4;
        if (age > life) { rings.splice(i, 1); continue; }
        const q = age / life;
        ctx.strokeStyle = `rgba(240,196,119,${(1 - q) * .38})`; ctx.lineWidth = u * (.5 - .3 * q);
        ctx.beginPath(); ctx.arc(cx, heart, bandH * (.35 + 1.4 * (1 - Math.pow(1 - q, 2))), 0, TAU); ctx.stroke();
      }
      ctx.globalCompositeOperation = 'lighter';
      for (let i = puffs.length - 1; i >= 0; i--) {
        const p = puffs[i], age = t - p.born;
        if (age > p.life) { puffs.splice(i, 1); continue; }
        const q = age / p.life, drag = Math.exp(-age * 2.4);
        sparkle(p.x + p.vx * age * drag, p.y + p.vy * age * drag, p.size * (1 - q * .5), (1 - q) * .8, p.gold ? '255,214,140' : '255,244,226');
      }
      ctx.globalCompositeOperation = 'source-over';

      if (hush > .01) { ctx.fillStyle = `rgba(9,6,15,${.3 * hush})`; ctx.fillRect(0, L.bandTop + bandH, W, H); ctx.fillStyle = `rgba(9,6,15,${.14 * hush})`; ctx.fillRect(0, 0, W, L.bandTop + bandH); }
      const v = ctx.createRadialGradient(W / 2, H * .42, Math.min(W, H) * .35, W / 2, H * .45, Math.max(W, H) * .78);
      v.addColorStop(0, 'rgba(5,3,9,0)'); v.addColorStop(1, 'rgba(5,3,9,.6)');
      ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    }

    return {
      resize, setMood, ring, puff,
      frame(dt) { if (!reduced) draw(dt); },
      setBreath(b) { breath = Number.isFinite(b) ? b : 0; },
      setReduced(on) { reduced = !!on; draw(0); },
      redraw() { draw(0); }
    };
  }
  window.MyuuelScene = { create };
})();
