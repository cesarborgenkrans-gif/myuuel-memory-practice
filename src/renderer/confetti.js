/* A small "ta-dah" at Check: confetti pops from just above the revealed combination and drifts down around it,
   so it reads as the answer being shown — a moment of completion, whether or not you remembered it.
   Drawn in each theme's own language: Lantern Night throws gold and cream star sparkles with a few ribbons;
   Living Type throws loose characters in its pink, sky blue, amber and mint. Subtle on purpose (~44 pieces, ~2 s). */
(() => {
  'use strict';
  const TAU = Math.PI * 2;
  const THEMES = {
    lantern: { colours: ['#f3cd86', '#fff3dc', '#e8b45a', '#d4b8f6', '#f0aeb8'], kinds: ['star', 'star', 'star', 'ribbon', 'dot'] },
    type: { colours: ['#ec86c2', '#82b2fa', '#ffb15c', '#9fe2c0', '#f7f2fa'], kinds: ['glyph'], glyphs: ['*', '+', '✳', '·', '×', '◇', '/', '~'] }
  };

  function create(canvas) {
    const ctx = canvas.getContext('2d');
    let parts = [], running = false, last = 0, k = 1, box = null, theme = THEMES.lantern;

    function fit() {
      const r = canvas.getBoundingClientRect(); k = Math.min(2, devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.round(r.width * k)); canvas.height = Math.max(1, Math.round(r.height * k));
      box = r;
    }
    /** target: the revealed combination's rectangle (viewport coordinates). */
    function burst(themeName, target) {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches || !target?.width) return;
      fit(); theme = THEMES[themeName] || THEMES.lantern;
      const u = Math.min(innerWidth / 100, innerHeight * .5625 / 100);
      const x0 = target.left - box.left, y0 = target.top - box.top, w = target.width, h = target.height;
      for (let i = 0; i < 44; i++) {
        const side = Math.random();
        // Most pieces pop from the top edge of the text; a few from its upper corners, so they fall *around* it.
        const x = side < .7 ? x0 + Math.random() * w : side < .85 ? x0 - u * 2 : x0 + w + u * 2;
        const y = y0 - u * (1 + Math.random() * 3);
        parts.push({
          x, y, vx: (Math.random() - .5) * u * 9 + (side >= .85 ? u * 4 : side >= .7 ? -u * 4 : 0), vy: -u * (8 + Math.random() * 10),
          spin: (Math.random() - .5) * 8, a: Math.random() * TAU, sway: Math.random() * TAU, size: u * (.7 + Math.random() * .9),
          colour: theme.colours[Math.floor(Math.random() * theme.colours.length)],
          kind: theme.kinds[Math.floor(Math.random() * theme.kinds.length)],
          glyph: theme.glyphs ? theme.glyphs[Math.floor(Math.random() * theme.glyphs.length)] : '',
          age: 0, life: 1.7 + Math.random() * .9, floor: y0 + h + u * 6
        });
      }
      if (!running) { running = true; last = performance.now(); requestAnimationFrame(step); }
    }
    function draw(p) {
      const q = p.age / p.life, alpha = q < .08 ? q / .08 : q > .65 ? (1 - q) / .35 : 1;
      ctx.save(); ctx.globalAlpha = Math.max(0, alpha) * .9; ctx.translate(p.x * k, p.y * k); ctx.rotate(p.a); ctx.fillStyle = p.colour;
      const s = p.size * k;
      if (p.kind === 'star') { ctx.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? s * .28 : s; const t = i / 8 * TAU; ctx[i ? 'lineTo' : 'moveTo'](Math.cos(t) * r, Math.sin(t) * r); } ctx.fill(); }
      else if (p.kind === 'ribbon') { ctx.scale(1, Math.cos(p.sway * 2)); ctx.fillRect(-s * .9, -s * .22, s * 1.8, s * .44); }
      else if (p.kind === 'dot') { ctx.beginPath(); ctx.arc(0, 0, s * .32, 0, TAU); ctx.fill(); }
      else { ctx.font = `700 ${(s * 2).toFixed(1)}px Consolas, "Courier New", monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(p.glyph, 0, 0); }
      ctx.restore();
    }
    function step(now) {
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height);
      const u = Math.min(innerWidth / 100, innerHeight * .5625 / 100);
      parts = parts.filter(p => (p.age += dt) < p.life);
      for (const p of parts) {
        p.vy += u * 26 * dt; p.vx *= Math.exp(-dt * 2.2); p.vy = Math.min(p.vy, u * 9); // light pieces: gravity, air drag, slow terminal fall
        p.sway += dt * 5; p.x += (p.vx + Math.sin(p.sway) * u * 2.4) * dt; p.y += p.vy * dt; p.a += p.spin * dt;
        draw(p);
      }
      if (parts.length) requestAnimationFrame(step);
      else { running = false; ctx.clearRect(0, 0, canvas.width, canvas.height); }
    }
    return { burst, clear() { parts = []; } };
  }
  window.MyuuelConfetti = { create };
})();
