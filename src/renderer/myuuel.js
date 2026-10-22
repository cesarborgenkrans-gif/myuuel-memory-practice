/* Myuuel on stage — a clip runtime over the approved motion kit (SparkleSnap sprite-rig method).
   Sheets are not played as whole loops any more. Each pose is a STILL drawing held like a pose (boring on purpose),
   and every 9–20 s a short DRIFT clip — a blink, a breath, a small gesture — plays once and settles back on the
   still. Authored gestures (the wave) keep their reviewed timing and play once. The kit still does registration,
   upper-body breathing, cloth wind and eased head moves between drawings; we only choose which drawing, when.
   Two actors cross-fade so pose changes never cut. Standing and cross-legged sheets share the 464 floor anchor.
   Clip choices live in CLIPS below; sheets without an entry use a safe default (still = drawing 0, drift = the
   authored order once). */
(() => {
  'use strict';
  const KIT = '../../assets/myuuel/motion-kit/';
  const POSE = {
    stand: '01-idle-blink', speak: '03-speaking', think: '04-thinking', wave: '05-happy-wave',
    focus: '07-cross-legged-focus-clean', hug: '10-knees-hugged-rest', stretch: '11-seated-stretch-clean',
    calm: '15-cross-legged-calm', ponder: '16-cross-legged-thinking', doze: '17-cross-legged-dozing'
  };
  /* still: the drawing she rests on. drifts: short phrases [drawing, ms] that start from and return to the still.
     gesture: the full movement when the pose is played once (stretch, wave). Refined from the frame index. */
  const CLIPS = {};

  const sum = beats => beats.reduce((s, b) => s + b[1], 0);
  const jitter = (a, b) => a + Math.random() * (b - a);

  async function create({ canvases, reduced = false, onPostureChange = () => {} }) {
    const sheets = await (await fetch(KIT + 'approved-sheets.json')).json();
    const byId = Object.fromEntries(sheets.map(s => [s.id, s]));
    const images = {};
    await Promise.all(Object.values(POSE).map(id => new Promise((resolve, reject) => {
      const d = byId[id]; if (!d) return reject(new Error('Missing approved sheet ' + id));
      const im = new Image();
      im.onload = () => { images[id] = im; resolve(); };
      im.onerror = () => reject(new Error('Could not load ' + d.image));
      im.src = KIT + d.image.split('/').map(encodeURIComponent).join('/');
    })));

    // Reviewed phrases (wave, listening) stay exactly as authored; every other sheet gets its beats from us.
    const REVIEWED = new Set(Object.keys(window.MyuuelMotionProfiles || {}));
    const prof = { ...(window.MyuuelMotionProfiles || {}) };
    // The kit registers standing and perch drawings frame by frame; the cross-legged sheets had one anchor for all eight
    // drawings, so her seat jumped up to 15 px between drawings. tools/register-seated.py measures each drawing's seat
    // and supplies the missing registration, so standing (feet) and sitting (seat) both rest on the same floor point.
    const registration = { ...(window.MyuuelRegistration || {}), ...(window.MyuuelSeatedRegistration || {}) };
    // Same size in every pose: each sheet is drawn at the scale that matches her head to the standing reference sheet.
    const sizes = window.MyuuelSheetScale || null;
    const actors = canvases.map(c => MyuuelCharacter.create(c, { reducedMotion: reduced, profiles: prof, registration, sizes }));
    for (const a of actors) a.configure({ wind: true, windStrength: .7, motion: true });

    /* Life through the kit's own squish spring (3.1 Hz, damped; it only ever moves her upper body, never feet or seat).
       In AI Discussion the spring hears real speech. Here there is no audio, so one continuous signal feeds it:
       a slow breath (she settles a touch on each exhale and rises back on the inhale; slower and deeper when drowsy)
       plus short impulses (a poke). One unbroken signal, sampled identically into both layers, so the spring never
       resets or jumps — not even across a pose change. Breath stays near a fifth of speaking strength. */
    const life = { phase: 0, period: 4500, depth: .03, impulses: [], b: 0 };
    for (const a of actors) a.audio.begin('output', 'life');
    const smooth = x => x * x * (3 - 2 * x);
    function breathe(dt) {
      life.phase = (life.phase + dt / life.period) % 1;
      const p = life.phase; life.b = p < .4 ? smooth(p / .4) : 1 - smooth((p - .4) / .6); // 0 = exhaled, 1 = full inhale
      let v = .007 + life.depth * (1 - life.b); // .007 is the spring's gate: a full inhale is no squish at all
      life.impulses = life.impulses.filter(i => clock - i.at < i.ms);
      for (const i of life.impulses) v = Math.max(v, i.amp * (1 - (clock - i.at) / i.ms * .35));
      if (!reduced) for (const a of actors) a.audio.sample('output', 'life', v);
    }

    function clipsFor(id) {
      if (CLIPS[id]) return CLIPS[id];
      const d = byId[id], max = Math.max(...d.durations);
      const t = f => Math.round(d.durations[f] >= max * .7 ? d.durations[f] * 1.3 : d.durations[f] * .9);
      const order = [1, 2, 3, 4, 5, 6, 7].map(f => [f, t(f)]);
      return { still: 0, drifts: [order], gesture: [[0, t(0)], ...order] };
    }
    const HOLD = 600000; // "forever": the still is replaced long before this runs out
    const stillBeats = id => [[clipsFor(id).still, HOLD]];
    const loopBeats = id => byId[id].durations.map((ms, i) => [i, Math.round(ms * 1.15)]);
    let pace = 1; // > 1 when she is drowsy: slower drifts, longer gaps

    function apply(actor, id, beats) { if (!REVIEWED.has(id)) prof[id] = { beats }; actor.setSheet(byId[id], images[id]); }
    function startBeats(id, mode) {
      if (REVIEWED.has(id)) return null;
      if (id === POSE.speak) return loopBeats(id);
      if (mode === 'gesture') { const c = clipsFor(id), g = c.gesture || c.drifts[0]; return [...g.map(([f, ms]) => [f, ms * pace]), [g[g.length - 1][0], HOLD]]; }
      return stillBeats(id);
    }
    const posture = id => byId[id]?.posture;
    const durationOf = (id, mode) => REVIEWED.has(id) ? sum(prof[id].beats) : mode === 'gesture' ? sum(startBeats(id, 'gesture').slice(0, -1)) : sum(loopBeats(id));

    let front = 0, current = null, base = POSE.stand, shot = null, clock = 0, lastSwap = -1e9, pending = null, driftAt = 4000, swap = null;
    /* Pose changes, timed on the director clock. The new drawing always fades in ON TOP of the old one.
       Same posture: the old one stays solid until the new one is complete (240 ms), then its uncovered edges fade.
       Standing <-> sitting: a slow cross-fade where the old pose starts fading a beat after the new one begins
       (in 640 ms, out from 280 ms over 520 ms) — soft like a dissolve, yet she never drops below ~92% solid. */
    // Standing -> sitting uses the original plain cross-fade (both layers together, 760 ms, one curve) — chosen by eye.
    const DWELL = 1100, PLAIN = 'cubic-bezier(.4, 0, .2, 1)';
    const TIMING = { same: { in: 240, outAt: 240, out: 180 }, posture: { in: 640, outAt: 280, out: 520 }, sitDown: { in: 760, outAt: 0, out: 760, ease: PLAIN } };
    const FADE = 820;
    function finishSwap() {
      if (!swap) return;
      const out = canvases[swap.from], inn = canvases[swap.to];
      out.classList.remove('on', 'top', 'enter', 'leave');
      inn.classList.remove('enter', 'leave'); inn.classList.add('on', 'top');
      swap = null;
    }
    function beginSwap(from, to, postureChange, sittingDown) {
      finishSwap();
      const out = canvases[from], inn = canvases[to];
      out.classList.remove('top', 'enter', 'leave'); out.classList.add('on');
      if (reduced) { inn.classList.add('on', 'top'); out.classList.remove('on'); return; }
      const t = sittingDown ? TIMING.sitDown : postureChange ? TIMING.posture : TIMING.same;
      for (const c of [inn, out]) c.style.setProperty('--ease-in', t.ease || 'cubic-bezier(.3, .1, .3, 1)'), c.style.setProperty('--ease-out', t.ease || 'cubic-bezier(.4, 0, .6, 1)');
      inn.style.setProperty('--dur', t.in + 'ms'); inn.classList.add('on', 'top', 'enter');
      swap = { from, to, t, at: clock, leaving: false, entered: false };
    }
    function stepSwap() {
      if (!swap) return;
      const out = canvases[swap.from], inn = canvases[swap.to], t = swap.t, age = clock - swap.at;
      if (!swap.leaving && age >= t.outAt) { out.style.setProperty('--dur', t.out + 'ms'); out.classList.add('leave'); swap.leaving = true; }
      if (!swap.entered && age >= t.in) { inn.classList.remove('enter'); swap.entered = true; }
      if (swap.leaving && swap.entered && age >= t.outAt + t.out) { out.classList.remove('on', 'leave'); swap = null; }
    }

    const schedule = (after = 0) => { driftAt = clock + after + jitter(9000, 20000) * pace; };

    function show(id, mode = 'still') {
      if (id === current && mode === 'still') { pending = null; return; }
      if (current && id !== current && clock - lastSwap < DWELL) { pending = { id, mode }; return; } // too soon: queue
      pending = null;
      if (id === current) { apply(actors[front], id, startBeats(id, mode)); return; }
      lastSwap = clock;
      const changed = current && posture(current) !== posture(id);
      if (!current) { apply(actors[front], id, startBeats(id, mode)); canvases[front].classList.add('on', 'top'); current = id; schedule(); return; }
      const back = 1 - front;
      apply(actors[back], id, startBeats(id, mode));
      beginSwap(front, back, changed, changed && posture(id) === 'Sitting');
      front = back; current = id; schedule(FADE);
      if (changed) onPostureChange(id);
    }
    function drift() {
      const c = clipsFor(current), clip = c.drifts[Math.floor(Math.random() * c.drifts.length)];
      // Start on the still for a moment so the kit eases the head into the first drawing, end back on the still.
      const beats = [[c.still, 1], ...clip.map(([f, ms]) => [f, Math.round(ms * pace)]), [c.still, HOLD]];
      apply(actors[front], current, beats);
      schedule(sum(beats.slice(0, -1)));
    }

    return {
      POSE,
      /** The resting pose for the current phase. A one-shot gesture finishes first. */
      rest(id) { base = id; if (shot) shot.then = null; else show(id); },
      /** Play a pose once (its gesture) or for ms, then return to the resting pose (or `then`). */
      play(id, { ms, then } = {}) {
        const wait = current && id !== current ? Math.max(0, DWELL - (clock - lastSwap)) : 0;
        shot = { until: clock + wait + (ms || durationOf(id, 'gesture')), then };
        show(id, id === POSE.speak || REVIEWED.has(id) ? 'still' : 'gesture');
      },
      busy: () => !!shot,
      get pose() { return current; },
      get standing() { return posture(current) === 'Standing'; },
      /** Breath: period in ms (alert ~4.5 s, asleep ~7.5 s) and depth (signal level; ~.03 alert, ~.05 asleep). */
      setBreath({ period, depth }) { if (period > 0) life.period = period; if (depth >= 0) life.depth = Math.min(.08, depth); },
      /** 0 = exhaled … 1 = full inhale, for the floor shadow. */
      get breath() { return life.b; },
      /** A short push into the spring: she gives way, then bounces back and settles on her own. */
      impulse(amp = .3, ms = 130) { life.impulses.push({ at: clock, amp: Math.min(.45, amp), ms }); },
      /** 1 = alert … ~1.8 = drowsy. Slows drift clips and stretches the quiet between them. */
      setPace(p) { pace = Math.max(.8, Math.min(2.2, p)); },
      update(dt) {
        clock += dt;
        stepSwap();
        if (pending && clock - lastSwap >= DWELL) show(pending.id, pending.mode);
        if (shot && clock >= shot.until) { const next = shot.then; shot = null; if (next) base = next; show(base); }
        if (!shot && !pending && current && !reduced && !swap && clock >= driftAt && !REVIEWED.has(current) && current !== POSE.speak) drift();
        // Both layers always advance together: their breathing and cloth-wind clocks stay identical, so a pose change
        // never snaps her sway or her dress to a different moment. (setSheet keeps that clock; only the phrase resets.)
        breathe(dt);
        actors[front].update(dt); actors[1 - front].update(dt);
      },
      setReduced(on) { reduced = !!on; if (reduced) finishSwap(); for (const a of actors) a.configure({ reducedMotion: reduced }); }
    };
  }
  window.MyuuelDirector = { create, POSE_IDS: POSE };
})();
