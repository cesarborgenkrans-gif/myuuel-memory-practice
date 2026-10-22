/* Myuuel Memory Practice — wiring. Made by Cezar Borgkrans (Cesar Borgenkrans) for SparkleSnap.
    Autoplays from launch; nothing needs a click to keep practising.
   Combinations are invented in combos.js and only ever live in memory; settings never contain them. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const body = document.body;
  const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');

  /* ── settings (no combinations are ever stored) ── */
  const DEFAULTS = { mode: 'lantern', speed: 'comfortable', level: 'standard', style: 'mix', selfCheck: true, sound: true, cursor: '96', theme: 'type' };
  const KEY = 'myuuel-practice.settings.v1';
  let settings = { ...DEFAULTS };
  try { settings = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch {}
  settings.style = MyuuelCombos.normaliseStyle(settings.style);
  if (!['lantern', 'type'].includes(settings.theme)) settings.theme = 'lantern';
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch {} };

  const LABEL = { intro: 'Hello', look: 'Look', fade: 'Fade', recall: 'Recall', check: 'Check', rest: 'Rest' };
  let cues = { start: ['A quiet moment to practice.'], look: ['Take a look.'], assisted_fade: ['A little less help.'], recall: ['Try it in your mind.'], check: ['Have another look.'], rest: ['No hurry.'], paused: ['Paused.'] };
  // Rare speech bubbles: body language carries her; words are a small treat, minutes apart.
  const BUBBLES = {
    look: ['One little moment.', 'I like this one.', 'Take your time.', 'Ooh, tricky.'],
    rest: ['No hurry.', 'Little by little.', 'The stars are out tonight.', 'Breathe in… and out.', 'Nice and steady.'],
    fresh: ['A new one!', 'Ooh, a fresh one.'],
    wake: ['Mm… I’m up, I’m up!', 'Oh! Was I asleep?', '*yawn* …hello.']
  };
  // Pokes escalate (method: gentle lines first, then a mood shift). The count fades after a quiet moment.
  const POKE_STEPS = ['Oh! Hi.', 'Hehe.', 'That tickles!', 'Okay, okay — I’m awake!', 'You’re a little bit silly.', 'I’ll just… sit for a moment.'];
  const lastPicked = {};
  const pick = list => list[Math.floor(Math.random() * list.length)];
  // Never the same line twice in a row for the same kind.
  const pickFresh = (kind, list) => { let line; do line = pick(list); while (list.length > 1 && line === lastPicked[kind]); lastPicked[kind] = line; return line; };
  const pickOther = (list, not) => { const o = list.filter(x => x !== not); return pick(o.length ? o : list); };

  /* ── sound: press squishes, release pops ── */
  const sound = MyuuelSound; sound.enabled = settings.sound;
  let lastInput = performance.now();
  document.addEventListener('pointerdown', e => {
    body.classList.add('pressing'); lastInput = performance.now();
    const b = e.target.closest('button'); if (b && !b.disabled) sound.press();
    nudge(.2); // any touch makes her a little less drowsy, and wakes her if she was asleep
    if (!e.target.closest('button, .practice, .veil, .band')) sparkleAt(e.clientX, e.clientY);
  });
  document.addEventListener('pointerup', e => {
    body.classList.remove('pressing');
    const b = e.target.closest('button'); if (b && !b.disabled && !b.hasAttribute('data-toggle')) sound.release();
  });
  addEventListener('blur', () => body.classList.remove('pressing'));
  addEventListener('keydown', () => { lastInput = performance.now(); nudge(.1); });

  /* ── stage ── */
  // Two painters share the background canvas; the theme decides which one draws.
  const scenes = { lantern: MyuuelScene.create($('scene'), { reduced: reducedQuery.matches }), type: MyuuelTypeScene.create($('scene'), { reduced: reducedQuery.matches }) };
  let lastLayout = null, lastMood = 'intro';
  const active = () => scenes[settings.theme] || scenes.lantern;
  const scene = {
    resize(l) { lastLayout = l; active().resize(l); },
    setMood(m) { lastMood = m; active().setMood(m); },
    ring() { active().ring(); },
    puff(x, y, n) { active().puff(x, y, n); },
    frame(dt) { active().frame(dt); },
    setBreath(b) { for (const s of Object.values(scenes)) s.setBreath(b); },
    setReduced(on) { for (const s of Object.values(scenes)) s.setReduced(on); }
  };
  function applyTheme() {
    body.dataset.theme = settings.theme;
    $('prompt-star').textContent = settings.theme === 'type' ? '✳' : '✦';
    const s = active(); if (lastLayout) s.resize(lastLayout); s.setMood(lastMood); s.redraw();
  }
  const canvases = [$('actor-a'), $('actor-b')];
  const confetti = MyuuelConfetti.create($('confetti'));
  let engine = null, director = null;

  function actorRect() { return canvases[0].getBoundingClientRect(); }
  function layout() {
    const a = actorRect(), band = document.querySelector('.band').getBoundingClientRect(), p = $('practice').getBoundingClientRect();
    scene.resize({ cx: a.left + a.width / 2, floorY: a.top + a.height * 464 / 512, bandTop: band.top, bandH: band.height, panel: { left: p.left, right: p.right, top: p.top, bottom: p.bottom } });
    fitCombo();
  }

  /* ── the enormous combination ── */
  let charRatio = .6, spans = [], shown = null;
  function measure() {
    const s = document.createElement('span');
    s.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;font-size:100px;font-family:' + getComputedStyle($('combo')).fontFamily;
    s.textContent = 'MMMMMMMMMM'; body.append(s);
    charRatio = s.getBoundingClientRect().width / 1000 || .6; s.remove();
  }
  function renderCombo(value) {
    shown = value;
    spans = [...value].map(c => {
      const s = document.createElement('span'); s.className = 'ch ' + MyuuelCombos.classOf(c); s.textContent = c;
      // Where this letter drifts to when it fades in the Living Type theme.
      s.style.setProperty('--sx', ((Math.random() - .5) * 1.8).toFixed(2) + 'em');
      s.style.setProperty('--sy', ((Math.random() - .65) * 1.6).toFixed(2) + 'em');
      s.style.setProperty('--sr', ((Math.random() - .5) * 120).toFixed(0) + 'deg');
      return s;
    });
    fitCombo(); applyMask(engine?.mask || null);
  }
  // Largest size that fits. Wrap onto a second or third row only when it makes the text clearly bigger;
  // rows break between characters and never change the value.
  function fitCombo() {
    const box = $('stage-text').getBoundingClientRect(), combo = $('combo');
    if (!spans.length || !box.width || !box.height) return;
    const n = spans.length, W = box.width * .94, H = box.height * .9;
    const size = L => Math.min(W / (Math.ceil(n / L) * charRatio), H / (L * 1.12));
    let best = { L: 1, fs: size(1) };
    for (const L of [2, 3]) { if (n < 7 * (L - 1)) break; const fs = size(L); if (fs > best.fs * 1.22) best = { L, fs }; }
    const fs = Math.min(best.fs, H * .5);
    const rows = [], base = Math.floor(n / best.L), extra = n % best.L;
    let at = 0;
    for (let r = 0; r < best.L; r++) { const len = base + (r < extra ? 1 : 0), row = document.createElement('span'); row.className = 'row'; row.append(...spans.slice(at, at + len)); at += len; rows.push(row); }
    combo.style.fontSize = fs.toFixed(1) + 'px';
    combo.replaceChildren(...rows);
  }
  function applyMask(set) { spans.forEach((s, i) => s.classList.toggle('m', !!set && set.has(i))); }
  const showCombo = on => $('combo').classList.toggle('out', !on);
  function showPrompt(text) { if (text) $('prompt-text').textContent = text; $('prompt').classList.toggle('in', !!text); }
  new ResizeObserver(() => fitCombo()).observe($('stage-text'));

  /* ── deck pips ── */
  function onDeck(d) {
    const retiredAt = d.retired ? (d.current - 1 + d.size) % d.size : -1;
    $('deck').replaceChildren(...Array.from({ length: d.size }, (_, i) => {
      const s = document.createElement('span');
      s.className = 'pip' + (i === d.current ? ' current' : '') + (i === retiredAt ? ' fresh' : '');
      s.dataset.views = Math.min(2, d.views[i]); s.textContent = '★';
      s.title = `Combination ${i + 1} of ${d.size} · ${d.views[i]} of ${d.retireAfter} rounds`; return s;
    }));
  }

  /* ── self-check ── */
  function updateCheckActions() {
    const el = $('check-actions');
    el.hidden = !settings.selfCheck;
    el.classList.toggle('idle', !(engine && (engine.phase === 'check' || engine.phase === 'rest') && !engine.paused));
  }
  for (const b of $('check-actions').querySelectorAll('button')) b.addEventListener('click', () => {
    if (!engine.mark(b.dataset.verdict)) return;
    for (const o of $('check-actions').querySelectorAll('button')) o.setAttribute('aria-pressed', String(o === b));
  });

  /* ── Myuuel's body language per phase ── */
  /* One simulated variable, drowsiness 0–1, routes her resting poses (method: Marina's warmth, Mikasa's alertness).
     It rises slowly while practice runs on its own (about ten minutes from fresh to asleep) and quickly while paused
     (under a minute); every touch, key or poke lowers it. From .85 she dozes off (in the Rest phase, or while paused). */
  let drowsy = .15, restCount = 0, dozing = false, nextBubbleAt = performance.now() + (3 + Math.random() * 3) * 60000;
  const ASLEEP = .85;
  const sleepy = () => drowsy >= ASLEEP;
  function nudge(amount) {
    drowsy = Math.max(0, drowsy - amount);
    if (dozing && drowsy < .7) wake(true);
  }
  function fallAsleep() {
    if (dozing || !director) return;
    dozing = true; director.rest(director.POSE.doze); scene.setMood('asleep');
  }
  /* Her posture follows the difficulty, not the phase. On Tough she stands — alert, with the hardest combinations.
     On Gentle and Standard she sits cross-legged. She keeps one pose for a whole round and only changes when the next
     combination arrives, rotating through her poses so rounds still differ. Knees-hugged is kept for Pause alone. */
  const ROUND_POSES = { seated: ['calm', 'ponder', 'focus', 'stretch'], standing: ['stand', 'think'] };
  let roundIndex = 0;
  const standingMode = () => settings.level === 'tough';
  function roundPose() {
    const list = ROUND_POSES[standingMode() ? 'standing' : 'seated'];
    return director.POSE[list[roundIndex % list.length]];
  }
  const phasePose = () => roundPose();
  function choreograph(e) {
    if (!director || engine.paused) return;
    if (dozing) return; // asleep: she sleeps through the rounds until someone touches the app
    const P = director.POSE;
    switch (e.phase) {
      case 'intro': director.play(P.wave, { then: roundPose() }); break;
      case 'look':
        roundIndex = e.cycle;
        if (e.fresh && e.cycle > 0 && standingMode()) { director.play(P.wave, { then: roundPose() }); bubble('fresh'); }
        else { director.rest(roundPose()); bubble(e.fresh ? 'fresh' : 'look'); }
        break;
      case 'rest': if (sleepy()) fallAsleep(); else bubble('rest'); break;
      default: break; // Fade, Recall and Check keep the round's pose
    }
  }
  let bubbleTimers = [];
  function bubble(kind, { force = false } = {}) {
    const now = performance.now();
    if (!force && (now < nextBubbleAt || engine.paused)) return;
    if (!force) nextBubbleAt = now + (5 + Math.random() * 5) * 60000;
    const el = $('bubble');
    bubbleTimers.forEach(clearTimeout);
    say(pickFresh(kind, BUBBLES[kind]), force ? 2600 : 4200);
    if (!force && kind !== 'fresh' && director.standing && !director.busy()) director.play(director.POSE.speak, { ms: 4200 });
  }
  // Typewriter reveal, 22–34 ms a letter; the bubble fades a moment after the last letter. Reduced motion: instant.
  let typeTimer = null;
  function say(text, stay = 2600) {
    const el = $('bubble');
    bubbleTimers.forEach(clearTimeout); clearTimeout(typeTimer);
    el.classList.remove('out'); el.hidden = false; el.textContent = '';
    let i = 0;
    const done = () => { bubbleTimers = [setTimeout(() => el.classList.add('out'), stay), setTimeout(() => { el.hidden = true; el.classList.remove('out'); }, stay + 450)]; };
    if (reducedQuery.matches) { el.textContent = text; return done(); }
    const tick = () => { el.textContent = text.slice(0, ++i); if (i < text.length) typeTimer = setTimeout(tick, 22 + Math.random() * 12); else done(); };
    tick();
  }

  /* ── memory method row ── */
  function showMethod(item, state) {
    const el = $('method');
    if (item) { $('method-name').textContent = item.methodName || ''; $('method-hint').textContent = item.hint || ''; }
    el.classList.toggle('gone', state === 'gone');
    el.classList.toggle('quiet', state === 'quiet');
  }

  /* ── phases ── */
  function onPhase(e) {
    if (peeking) { peeking = false; body.classList.remove('peeking'); $('combo').classList.remove('peek'); }
    body.dataset.phase = e.phase;
    if (!engine?.paused) $('phase-name').textContent = LABEL[e.phase];
    const cueKey = e.phase === 'fade' ? 'assisted_fade' : e.phase === 'intro' ? 'start' : e.phase;
    const cue = pick(cues[cueKey] || ['']);
    $('phase-cue').textContent = cue;
    scene.setMood(dozing || (e.phase === 'rest' && sleepy()) ? 'asleep' : e.phase);
    switch (e.phase) {
      case 'intro': renderCombo(e.item.value); showCombo(false); showPrompt(cue); $('phase-cue').textContent = ''; showMethod(null, 'gone'); break;
      case 'look': if (e.item.value !== shown) renderCombo(e.item.value); applyMask(null); showCombo(true); showPrompt(null); showMethod(e.item, 'show'); break;
      case 'fade': showCombo(true); showPrompt(null); showMethod(e.item, 'show'); break;
      case 'recall': showCombo(false); showPrompt(e.item.recall || pickOther(cues.recall, cue)); showMethod(e.item, 'quiet'); break;
      case 'check':
        applyMask(null); showCombo(true); showPrompt(null); scene.ring(); showMethod(e.item, 'show');
        requestAnimationFrame(() => confetti.burst(settings.theme, $('combo').getBoundingClientRect())); // ta-dah: here is the answer
        for (const o of $('check-actions').querySelectorAll('button')) o.setAttribute('aria-pressed', 'false');
        break;
      case 'rest': restCount++; showCombo(false); showPrompt(pickOther(cues.rest, cue)); showMethod(null, 'gone'); break;
    }
    updateCheckActions();
    choreograph(e);
  }

  /* ── pause ── */
  function setPaused(on) {
    engine.pause(on);
    body.classList.toggle('paused', on);
    const b = $('btn-pause');
    b.setAttribute('aria-pressed', String(on));
    b.querySelector('.glyph').textContent = on ? '▶' : '❚❚';
    b.querySelector('.label').textContent = on ? 'Resume' : 'Pause';
    $('phase-name').textContent = on ? 'Paused' : LABEL[engine.phase];
    $('phase-cue').textContent = on ? pick(cues.paused) : '';
    scene.setMood(on ? 'paused' : engine.phase);
    if (director) {
      if (on) director.rest(director.POSE.hug); // the knees-hugged rest belongs to Pause
      else if (dozing) { dozing = false; director.play(director.POSE.stretch, { then: phasePose(engine.phase) }); }
      else director.rest(phasePose(engine.phase));
    }
    updateCheckActions();
    on ? sound.off() : sound.on();
  }
  $('btn-pause').addEventListener('click', () => setPaused(!engine.paused));

  /* ── modes ── */
  function paintModes() { for (const b of document.querySelectorAll('[data-mode]')) b.setAttribute('aria-pressed', String(b.dataset.mode === settings.mode)); }
  for (const b of document.querySelectorAll('[data-mode]')) b.addEventListener('click', () => {
    if (settings.mode === b.dataset.mode) return;
    settings.mode = b.dataset.mode; save(); paintModes();
    if (engine.paused) setPaused(false);
    engine.restartItem();
  });

  /* ── settings sheet ── */
  function paintSettings() {
    for (const seg of document.querySelectorAll('.seg[data-setting]')) {
      const key = seg.dataset.setting;
      for (const b of seg.querySelectorAll('button')) b.setAttribute('aria-pressed', String(String(settings[key]) === b.dataset.value));
    }
    body.dataset.cursor = settings.cursor;
    sound.enabled = settings.sound;
  }
  for (const seg of document.querySelectorAll('.seg[data-setting]')) for (const b of seg.querySelectorAll('button')) {
    b.type = 'button';
    b.addEventListener('click', () => {
      const key = seg.dataset.setting, raw = b.dataset.value;
      const value = raw === 'true' ? true : raw === 'false' ? false : raw;
      if (settings[key] === value) return;
      settings[key] = value; save(); paintSettings();
      if (key === 'level' || key === 'style') engine.refreshStyle();
      if (key === 'level' && director && !engine.paused && !dozing) director.rest(roundPose()); // stand up for Tough, sit for the rest
      if (key === 'selfCheck') updateCheckActions();
      if (key === 'theme') applyTheme();
    });
  }
  $('btn-new-deck').addEventListener('click', () => { engine.newDeck(); if (engine.paused) setPaused(false); close($('settings')); });

  function open(veil, trigger) { veil.hidden = false; trigger?.setAttribute('aria-expanded', 'true'); sound.open(); }
  function close(veil) { if (veil.hidden) return; veil.hidden = true; document.querySelectorAll('[aria-expanded="true"]').forEach(b => b.setAttribute('aria-expanded', 'false')); sound.close(); }
  $('btn-settings').addEventListener('click', () => $('settings').hidden ? (close($('view-menu')), open($('settings'), $('btn-settings'))) : close($('settings')));
  $('btn-view').addEventListener('click', () => $('view-menu').hidden ? (close($('settings')), open($('view-menu'), $('btn-view'))) : close($('view-menu')));
  for (const veil of document.querySelectorAll('.veil')) {
    veil.addEventListener('click', e => { if (e.target === veil || e.target.closest('[data-close]')) close(veil); });
  }
  $('view-menu').classList.add('top');

  /* ── window controls (same set as AI Discussion: placement, keep on top, minimize, maximize, close) ── */
  const bridge = window.myuuelWindow;
  let win = { placement: 'side', alwaysOnTop: false, sideAvailable: true, maximized: false };
  function paintWindow(s) {
    if (!s || s.ok === false && !s.placement) return;
    win = { ...win, ...s };
    if (s.version) $('version').textContent = `Version ${s.version} · started ${s.started}`;
    body.dataset.place = win.placement;
    const pin = $('btn-pin'), row = $('pin-row');
    pin.setAttribute('aria-pressed', String(win.alwaysOnTop)); pin.textContent = win.alwaysOnTop ? '◆' : '◇';
    pin.title = win.alwaysOnTop ? 'Allow other windows above' : 'Keep on top';
    row.setAttribute('aria-pressed', String(win.alwaysOnTop)); row.textContent = win.alwaysOnTop ? 'On' : 'Off';
    for (const b of document.querySelectorAll('[data-place]')) { b.setAttribute('aria-pressed', String(b.dataset.place === win.placement)); b.disabled = b.dataset.place === 'side' && !win.sideAvailable; }
    $('btn-max').textContent = win.maximized ? '❐' : '□';
  }
  if (!bridge) { body.classList.add('no-window'); body.dataset.place = 'free'; }
  else {
    bridge.onChange(paintWindow);
    bridge.state().then(paintWindow).catch(() => {});
    const pinToggle = async () => { const s = await bridge.pin(!win.alwaysOnTop); paintWindow(s); win.alwaysOnTop ? sound.on() : sound.off(); };
    $('btn-pin').addEventListener('click', pinToggle);
    $('pin-row').addEventListener('click', pinToggle);
    for (const b of document.querySelectorAll('[data-place]')) b.addEventListener('click', async () => { paintWindow(await bridge.place(b.dataset.place)); close($('view-menu')); });
    $('btn-min').addEventListener('click', () => bridge.action('minimize'));
    $('btn-max').addEventListener('click', () => bridge.action('maximize'));
    $('btn-close').addEventListener('click', () => bridge.action('close'));
  }

  /* ── play: poke Myuuel, sparkle the sky, hold the panel to peek ── */
  let pokeCount = 0, lastPoke = 0, peekTimer = null, peekFull = null, peeking = false;
  function wake(byTouch) {
    if (!dozing || !director) return;
    dozing = false; drowsy = Math.min(drowsy, .35); // fully awake again, not on the edge of dozing off
    director.play(director.POSE.stretch, { then: engine.paused ? director.POSE.hug : roundPose() });
    scene.setMood(engine.paused ? 'paused' : engine.phase);
    if (byTouch) bubble('wake', { force: true });
  }
  function sparkleAt(x, y) { scene.puff(x, y, 14); sound.twinkle(); }
  function poke(x, y) {
    const now = performance.now();
    if (now - lastPoke > 8000) pokeCount = 0; // the escalation forgets after a quiet moment
    lastPoke = now; pokeCount++;
    const band = document.querySelector('.band'); band.classList.remove('boop'); void band.offsetWidth; band.classList.add('boop');
    sound.poke(pokeCount);
    if (!director) return;
    director.impulse(.22 + .04 * Math.min(pokeCount, 5), 130); // her upper body gives way, then springs back
    if (dozing) { scene.puff(x, y, 6); nudge(.3); return; } // waking up is its own reaction
    nudge(.15);
    const step = Math.min(pokeCount, POKE_STEPS.length) - 1, P = director.POSE;
    say(POKE_STEPS[step], 2000);
    if (step <= 2) { scene.puff(x, y, 7); if (step === 0 && director.standing && !director.busy()) director.play(P.wave); }
    else if (step <= 4) { scene.puff(x, y, 16); scene.ring(); band.classList.add('glow'); setTimeout(() => band.classList.remove('glow'), 1500); }
    else { scene.puff(x, y, 10); director.play(P.calm, { ms: 5200 }); pokeCount = 0; } // mood shift: she sits down for a moment
  }
  const bandEl = document.querySelector('.band');
  const rig = $('rig');
  addEventListener('pointermove', e => {
    if (reducedQuery.matches) return;
    rig.style.setProperty('--px', ((e.clientX / innerWidth - .5) * 1.2).toFixed(3));
    rig.style.setProperty('--py', ((e.clientY / innerHeight - .5) * .5).toFixed(3));
  });
  document.addEventListener('pointerleave', () => { rig.style.setProperty('--px', 0); rig.style.setProperty('--py', 0); });
  const onHer = (x, y) => { const a = actorRect(); return Math.abs(x - (a.left + a.width / 2)) < a.width * .3 && y > a.top + a.height * .04 && y < a.top + a.height * .92; };
  bandEl.addEventListener('pointerdown', e => { if (onHer(e.clientX, e.clientY)) poke(e.clientX, e.clientY); else if (!dozing) sparkleAt(e.clientX, e.clientY); });

  // Hold the panel during Fade to see every letter again, or during Recall to peek: first the hint, then the combination.
  $('practice').addEventListener('pointerdown', e => {
    if (e.target.closest('button') || !engine || engine.paused || !['recall', 'fade'].includes(engine.phase)) return;
    const phase = engine.phase;
    clearTimeout(peekTimer); clearTimeout(peekFull);
    peekTimer = setTimeout(() => {
      peeking = true; body.classList.add('peeking'); sound.peek();
      if (phase === 'fade') { applyMask(null); return; }
      showMethod(null, 'show'); $('phase-cue').textContent = 'Peeking at the hint…';
      peekFull = setTimeout(() => { if (!peeking) return; $('combo').classList.add('peek'); showCombo(true); $('phase-cue').textContent = 'Peeking…'; sound.peek(); }, 1100);
    }, 260);
  });
  function endPeek() {
    clearTimeout(peekTimer); clearTimeout(peekFull);
    if (!peeking) return;
    peeking = false; body.classList.remove('peeking'); $('combo').classList.remove('peek');
    if (engine.phase === 'recall') { showCombo(false); showMethod(null, 'quiet'); $('phase-cue').textContent = ''; }
    else if (engine.phase === 'fade') applyMask(engine.mask);
  }
  for (const ev of ['pointerup', 'pointercancel', 'blur']) addEventListener(ev, endPeek);

  /* ── the SparkleSnap signature opens sparklesnap.dev in the browser ── */
  $('site-link').addEventListener('click', () => { if (bridge?.openSite) bridge.openSite(); else window.open('https://sparklesnap.dev/', '_blank', 'noopener'); });

  /* ── keyboard: Space pauses, M switches mode, Esc closes a sheet ── */
  addEventListener('keydown', e => {
    if (e.key === 'Escape') { close($('settings')); close($('view-menu')); return; }
    if (!$('settings').hidden || !$('view-menu').hidden || e.repeat) return;
    if (e.code === 'Space' && !(e.target instanceof HTMLButtonElement)) { e.preventDefault(); setPaused(!engine.paused); }
    if (e.key === 'm' || e.key === 'M') document.querySelector(`[data-mode="${settings.mode === 'quiet' ? 'lantern' : 'quiet'}"]`).click();
  });

  /* ── reduced motion follows Windows ── */
  reducedQuery.addEventListener('change', () => { scene.setReduced(reducedQuery.matches); director?.setReduced(reducedQuery.matches); });

  /* ── loop ── */
  let last = null, sceneAcc = 1000;
  function frame(now) {
    const dt = last === null ? 0 : Math.min(250, now - last); last = now;
    engine.tick(dt);
    $('progress-fill').style.transform = `scaleX(${engine.progress().toFixed(4)})`;
    drowsy = Math.min(1, drowsy + dt / 1000 / (engine.paused ? 70 : 840));
    director?.setPace(1 + drowsy * .8);
    if (director) {
      // Breath follows drowsiness: ~4.5 s alert, ~6.5 s drowsy, ~7.5 s and deeper when asleep.
      director.setBreath({ period: 4500 + 2000 * Math.min(1, drowsy / ASLEEP) + (dozing ? 1000 : 0), depth: dozing ? .05 : .03 + .012 * drowsy });
      scene.setBreath(director.breath);
    }
    if (!dozing && drowsy >= ASLEEP && (engine.paused || engine.phase === 'rest')) fallAsleep();
    director?.update(Math.min(dt, 60));
    sceneAcc += dt;
    if (sceneAcc >= 33) { scene.frame(Math.min(sceneAcc, 100)); sceneAcc = 0; } // the sky moves slowly; ~30 fps is plenty
    requestAnimationFrame(frame);
  }
  document.addEventListener('visibilitychange', () => { last = null; });
  addEventListener('resize', layout);

  async function init() {
    measure(); paintModes(); paintSettings(); body.dataset.theme = settings.theme; $('prompt-star').textContent = settings.theme === 'type' ? '✳' : '✦';
    try { const c = await (await fetch('../../content/myuuel-cues.json')).json(); for (const k of Object.keys(cues)) if (Array.isArray(c[k])) cues[k] = c[k]; } catch {}
    engine = MyuuelPractice.create({ settings, onPhase, onMask: m => { if (!peeking) applyMask(m); }, onDeck });
    layout();
    try {
      director = await MyuuelDirector.create({
        canvases, reduced: reducedQuery.matches,
        onPostureChange: () => { const a = actorRect(); scene.puff(a.left + a.width / 2, a.top + a.height * .62, 10); }
      });
    } catch (err) { console.error(err); $('phase-cue').textContent = 'Myuuel could not load: ' + err.message; }
    engine.start();
    requestAnimationFrame(frame);
    document.fonts?.ready.then(() => { measure(); fitCombo(); });
  }
  init();
})();
