/* Film capture harness for Myuuel Memory Practice — injected before the app's own scripts.
   A virtual clock replaces timers, requestAnimationFrame, performance.now and Date.now, and every CSS animation or
   transition is paused and seeked to the same clock, so each recorded frame is exact and the app runs unchanged.
   Settings arrive through the app's own localStorage key; the first combination is scripted (fictional, as always).
   Cesar Borgenkrans (2026) / SparkleSnap.dev  <!-- source author: Cezar Borgkrans --> */
(() => {
  const CFG = window.__FILM__ || {};
  let vt = 0;
  const base = Date.UTC(2026, 9, 22, 9, 0, 0);

  let seed = (CFG.seed >>> 0) || 7;
  Math.random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  performance.now = () => vt;
  Date.now = () => base + vt;

  let tid = 1; const timers = new Map();
  window.setTimeout = (fn, ms = 0, ...args) => { const id = tid++; timers.set(id, { due: vt + Math.max(0, +ms || 0), fn, args, iv: 0, order: id }); return id; };
  window.clearTimeout = id => { timers.delete(id); };
  window.setInterval = (fn, ms = 0, ...args) => { const id = tid++; const iv = Math.max(4, +ms || 0); timers.set(id, { due: vt + iv, fn, args, iv, order: id }); return id; };
  window.clearInterval = window.clearTimeout;
  let rid = 1, raf = new Map();
  window.requestAnimationFrame = cb => { const id = rid++; raf.set(id, cb); return id; };
  window.cancelAnimationFrame = id => { raf.delete(id); };

  const started = new WeakMap();
  function adopt() {
    for (const a of document.getAnimations()) {
      if (started.has(a)) continue;
      started.set(a, vt); a.pause(); a.currentTime = 0;
    }
  }
  function seek() {
    for (const a of document.getAnimations()) {
      const t0 = started.get(a); if (t0 === undefined) continue;
      const t = vt - t0, end = a.effect?.getComputedTiming().endTime;
      if (Number.isFinite(end) && t >= end) a.finish(); else a.currentTime = t;
    }
  }
  const run = (fn, args) => { try { typeof fn === 'function' ? fn(...args) : (0, eval)(fn); } catch (e) { console.error(e); } adopt(); };

  window.__vt = () => vt;
  window.__advance = ms => {
    const end = vt + ms;
    for (;;) {
      let next = null;
      for (const [id, t] of timers) if (t.due <= end && (!next || t.due < next.t.due || (t.due === next.t.due && t.order < next.t.order))) next = { id, t };
      if (!next) break;
      vt = Math.max(vt, next.t.due);
      if (next.t.iv) next.t.due += next.t.iv; else timers.delete(next.id);
      run(next.t.fn, next.t.args);
    }
    vt = end;
    const cbs = [...raf.values()]; raf = new Map();
    for (const cb of cbs) run(cb, [vt]);
    adopt(); seek();
  };

  try { localStorage.setItem('myuuel-practice.settings.v1', JSON.stringify(CFG.settings || {})); } catch {}

  // Scripted combinations for the film; anything after the queue comes from the app's own generator.
  const queue = [...(CFG.combos || [])];
  let combos;
  Object.defineProperty(window, 'MyuuelCombos', {
    configurable: true,
    get: () => combos,
    set(v) {
      const make = v.make;
      combos = { ...v, make(...a) {
        const c = queue.shift();
        if (!c) return make(...a);
        const m = v.METHODS[c.method];
        return { core: c.value, ...c, methodName: m.name, recall: m.recall, seed: c.seed || 4242 };
      } };
    }
  });

  // Every sound the app plays is logged with the clock, so the film's mix can re-synthesise exactly those sounds.
  window.__sounds = [];
  let sound;
  Object.defineProperty(window, 'MyuuelSound', {
    configurable: true,
    get: () => sound,
    set(v) {
      sound = v;
      for (const k of ['press', 'release', 'on', 'off', 'open', 'close', 'poke', 'twinkle', 'peek']) {
        const f = v[k];
        v[k] = (...a) => { if (v.enabled) window.__sounds.push({ name: k, args: a, t: vt }); return f.apply(v, a); };
      }
    }
  });

  // The desktop window bridge (preload.js) is not present in a browser; a quiet stand-in shows the same window buttons.
  const winState = { ok: true, placement: 'side', alwaysOnTop: false, sideAvailable: true, maximized: false };
  window.myuuelWindow = { state: async () => winState, place: async () => winState, pin: async () => winState, action: async () => winState, openSite() {}, onChange() {} };

  if (CFG.css) addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = CFG.css; document.head.append(s); });
})();
