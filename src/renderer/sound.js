/* Soft, boppy click sounds, synthesised on the fly (no audio files). Press squishes down, release pops up. */
(() => {
  'use strict';
  let ac = null, out = null, enabled = true;
  function audio() {
    if (!ac) {
      ac = new AudioContext();
      out = ac.createGain(); out.gain.value = .5;
      const comp = ac.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 4;
      out.connect(comp); comp.connect(ac.destination);
    }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }
  function blip(f0, f1, dur, vol, type = 'sine', delay = 0) {
    if (!enabled) return;
    const a = audio(), t = a.currentTime + .005 + delay;
    const o = a.createOscillator(), g = a.createGain(), lp = a.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 2600; lp.Q.value = .4;
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur * .75);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .007); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(lp); lp.connect(g); g.connect(out); o.start(t); o.stop(t + dur + .03);
  }
  const api = {
    set enabled(v) { enabled = !!v; }, get enabled() { return enabled; },
    press() { blip(430, 290, .1, .24); blip(860, 560, .06, .05, 'triangle'); },
    release() { blip(560, 860, .09, .17); blip(1120, 1500, .05, .035, 'triangle', .012); },
    on() { blip(620, 930, .07, .15); blip(930, 1400, .09, .13, 'sine', .07); },
    off() { blip(900, 620, .07, .14); blip(620, 410, .1, .12, 'sine', .07); },
    open() { blip(520, 700, .07, .12); blip(700, 940, .08, .1, 'sine', .06); blip(940, 1250, .1, .08, 'sine', .12); },
    poke(n = 1) { const lift = Math.min(4, n) * 70; blip(260 + lift, 620 + lift, .16, .2); blip(620 + lift, 380 + lift, .12, .07, 'triangle', .1); },
    twinkle() { blip(1300, 1750, .09, .05, 'triangle'); blip(1750, 2300, .14, .045, 'sine', .07); },
    peek() { blip(340, 720, .2, .08); },
    close() { blip(940, 700, .07, .1); blip(700, 520, .09, .1, 'sine', .06); }
  };
  window.MyuuelSound = api;
})();
