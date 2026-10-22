/* One phase engine for Quiet Recall and Fading Lantern, and the small rotating deck of fictional combinations.
   Time only moves when the host calls tick(ms); pause freezes it. Nothing here touches the page. */
(() => {
  'use strict';
  const TIMINGS = {
    quiet: { comfortable: { look: 8, recall: 12, check: 5, rest: 5 }, slow: { look: 12, recall: 20, check: 8, rest: 10 } },
    lantern: { comfortable: { look: 4, fade: 4, recall: 12, check: 5, rest: 5 }, slow: { look: 6, fade: 6, recall: 20, check: 8, rest: 10 } }
  };
  const ORDER = { quiet: ['look', 'recall', 'check', 'rest'], lantern: ['look', 'fade', 'recall', 'check', 'rest'] };
  const DECK_SIZE = 3, RETIRE_AFTER = 3;

  // Small deterministic generator so a fade pattern stays the same for a whole cycle.
  function seeded(seed) { let v = seed >>> 0 || 1; return () => { v = (Math.imul(v, 1664525) + 1013904223) >>> 0; return v / 4294967296; }; }

  function create({ settings, onPhase = () => {}, onMask = () => {}, onDeck = () => {} }) {
    const s = settings;
    let deck = [], cur = 0, phase = 'intro', index = -1, elapsed = 0, introMs = 3200, cycle = 0, paused = false, verdict = null, mask = null, maskStage = 0;

    const order = () => ORDER[s.mode] || ORDER.quiet;
    const seconds = name => (TIMINGS[s.mode]?.[s.speed] || TIMINGS.quiet.comfortable)[name] || 5;
    const item = () => deck[cur];

    function fill() {
      while (deck.length < DECK_SIZE) {
        const c = MyuuelCombos.make(s.style, s.level, deck.map(d => d.value), deck.map(d => d.method));
        deck.push({ ...c, id: Math.random().toString(36).slice(2), views: 0, fresh: false }); // a starting set is not 'new' to wave at
      }
    }
    function newDeck() { deck = []; cur = 0; fill(); onDeck(snapshotDeck()); }
    function snapshotDeck() { return { size: deck.length, current: cur, views: deck.map(d => d.views), retireAfter: RETIRE_AFTER }; }

    function maskOrder(it) {
      const r = seeded(it.seed ^ (cycle * 2654435761)), idx = [...it.value].map((_, i) => i);
      for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
      return idx;
    }
    function setMask(stage) {
      if (stage === maskStage) return;
      maskStage = stage;
      const it = item(), n = [...it.value].length;
      if (stage === 0) { mask = null; onMask(null); return; }
      const ord = maskOrder(it);
      const keep1 = Math.min(n - 1, Math.max(1, Math.ceil(n / 2)));
      const keep2 = Math.min(keep1 - 1, Math.max(1, Math.round(n / 4)));
      const keep = stage === 1 ? keep1 : Math.max(0, keep2);
      mask = new Set(ord.slice(keep));
      onMask(mask);
    }

    function enter(i) {
      index = i; elapsed = 0; phase = order()[i];
      if (phase !== 'fade') setMask(0);
      const it = item();
      onPhase({ phase, item: it, mode: s.mode, cycle, durationMs: seconds(phase) * 1000, fresh: phase === 'look' && it.fresh });
      if (phase === 'look') it.fresh = false;
      if (phase === 'fade') setMask(1);
    }
    function endCycle() {
      const it = item();
      let retire = false, repeat = false;
      if (verdict === 'comfortable') retire = true;
      else if (verdict === 'again') { it.views = 0; repeat = true; }
      else { it.views++; retire = it.views >= RETIRE_AFTER; }
      verdict = null; cycle++;
      if (retire) {
        const c = MyuuelCombos.make(s.style, s.level, deck.map(d => d.value), deck.filter((_, i) => i !== cur).map(d => d.method));
        deck[cur] = { ...c, id: Math.random().toString(36).slice(2), views: 0, fresh: true };
        cur = (cur + 1) % deck.length;
      } else if (!repeat) cur = (cur + 1) % deck.length;
      onDeck({ ...snapshotDeck(), retired: retire });
    }
    function advance() {
      const next = index + 1;
      if (next >= order().length) { endCycle(); enter(0); }
      else enter(next);
    }

    function tick(ms) {
      if (paused || !deck.length) return;
      elapsed += ms;
      if (phase === 'intro') { if (elapsed >= introMs) enter(0); return; }
      const dur = seconds(phase) * 1000;
      if (phase === 'fade') setMask(elapsed < dur / 2 ? 1 : 2);
      if (elapsed >= dur) advance();
    }

    return {
      start() { newDeck(); phase = 'intro'; index = -1; elapsed = 0; onPhase({ phase: 'intro', item: item(), mode: s.mode, cycle, durationMs: introMs }); },
      tick,
      pause(on) { paused = !!on; },
      get paused() { return paused; },
      // A mode change restarts the current combination from Look, right away.
      restartItem() { setMask(0); enter(0); },
      newDeck() { newDeck(); setMask(0); cycle++; enter(0); },
      // Changing style or difficulty refreshes the deck at the next cycle boundary rather than mid-phase.
      refreshStyle() { deck = deck.map((d, i) => i === cur ? d : { ...MyuuelCombos.make(s.style, s.level, deck.map(x => x.value), deck.map(x => x.method)), id: Math.random().toString(36).slice(2), views: 0, fresh: true }); onDeck(snapshotDeck()); },
      mark(v) { if (phase === 'check' || phase === 'rest') { verdict = v; return true; } return false; },
      get verdict() { return verdict; },
      progress() { const dur = phase === 'intro' ? introMs : seconds(phase) * 1000; return Math.min(1, elapsed / dur); },
      get phase() { return phase; },
      get item() { return item(); },
      get mask() { return mask; },
      deck: snapshotDeck
    };
  }
  window.MyuuelPractice = { create, TIMINGS };
})();
