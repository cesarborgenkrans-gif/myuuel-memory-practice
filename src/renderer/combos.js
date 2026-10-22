/* Fictional practice combinations, invented here and kept only in memory.
   Each one comes with the memory method it was built with, so practice trains the method as well as the string:
   random strings (chunking), sentence initials, hidden words, mirror words, number stories, look-alike swaps,
   rhyme chains and picture words. No spaces — real generated passwords almost never have them. */
(() => {
  'use strict';
  const LOWER = 'abcdefghijkmnopqrstuvwxyz', UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ', DIGITS = '23456789', SYMBOLS = '!#$%&*+=?@^~';
  const SYMBOL_NAME = { '!': 'bang', '#': 'hash', '$': 'dollar', '%': 'percent', '&': 'and', '*': 'star', '+': 'plus', '=': 'equals', '?': 'question', '@': 'at', '^': 'caret', '~': 'wave', '-': 'dash', '.': 'dot', '_': 'underscore', ':': 'colon' };

  const rnd = n => { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; };
  const pick = list => list[rnd(list.length)];
  const cap = w => w[0].toUpperCase() + w.slice(1);
  const digit = () => pick('23456789');
  const pad2 = n => String(n).padStart(2, '0');
  const an = w => (/^[aeiou]/i.test(w) ? 'an ' : 'a ') + w;
  const sym = c => an(SYMBOL_NAME[c]) + ` (${c})`;
  function shuffle(list) { for (let i = list.length - 1; i > 0; i--) { const j = rnd(i + 1); [list[i], list[j]] = [list[j], list[i]]; } return list; }
  function pickDistinct(list, n) { return shuffle([...list]).slice(0, n); }

  /* ── Random string: chunk it ── */
  const RANDOM_LEN = { gentle: 8, standard: 11, tough: 14 };
  function random(level) {
    const n = RANDOM_LEN[level], out = [pick(LOWER), pick(UPPER), pick(DIGITS), pick(SYMBOLS)];
    const all = LOWER + LOWER + UPPER + DIGITS + SYMBOLS;
    while (out.length < n) out.push(pick(all));
    const value = shuffle(out).join(''), size = n > 12 ? 5 : 4, chunks = [];
    for (let i = 0; i < value.length; i += size) chunks.push(value.slice(i, i + size));
    return { value, core: value, method: 'random', hint: 'Chunk it: ' + chunks.join('  ·  ') };
  }

  /* ── Sentence initials: a tiny story, keep the first letters ── */
  const DET = ['My', 'Our', 'The', 'Some', 'Those'];
  const ADJ = ['sleepy', 'tiny', 'brave', 'silver', 'golden', 'quiet', 'clever', 'hungry', 'purple', 'gentle', 'lucky', 'dizzy', 'shy', 'proud', 'misty', 'sunny', 'wild', 'curious', 'velvet', 'humming'];
  const NOUN = ['otters', 'foxes', 'owls', 'robins', 'dragons', 'kites', 'lanterns', 'boats', 'comets', 'clouds', 'rabbits', 'turtles', 'wizards', 'sailors', 'bakers', 'pandas', 'whales', 'moths', 'pirates', 'knights', 'ghosts', 'penguins'];
  const VERB = ['danced', 'slept', 'sang', 'waited', 'hid', 'sailed', 'glowed', 'raced', 'whispered', 'tumbled', 'wandered', 'laughed', 'floated', 'painted', 'knitted', 'giggled'];
  const PREP = ['under', 'over', 'behind', 'near', 'inside', 'beside', 'around', 'across', 'above', 'below'];
  const PLACE = ['the bridge', 'the moon', 'the old mill', 'the garden', 'the lighthouse', 'the red door', 'the harbor', 'the apple tree', 'the station', 'the river', 'the library', 'the tea house', 'the castle', 'the meadow', 'the rooftop', 'the bakery'];
  function initials(level) {
    const n = 2 + rnd(8), noun = pick(NOUN), verb = pick(VERB), prep = pick(PREP), place = pick(PLACE), end = pick('!?.!');
    const words = level === 'gentle' ? [String(n), noun, verb, prep, ...place.split(' ')] : [pick(DET), String(n), pick(ADJ), noun, verb, prep, ...place.split(' ')];
    let sentence = words.join(' '), value = words.map(w => /^\d+$/.test(w) ? w : w[0]).join('');
    if (level === 'tough') {
      const h = 1 + rnd(12), m = pick([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]);
      sentence += ` at ${h}:${pad2(m)}`; value += '@' + h + pad2(m);
    }
    sentence = cap(sentence) + end; value = cap(value) + end;
    const rule = level === 'tough' ? 'first letters, numbers stay, “at” becomes @' : 'first letters, numbers stay, so does the ending';
    return { value, core: noun + '|' + place, method: 'initials', hint: `“${sentence}” — ${rule}` };
  }

  /* ── Hidden word: a word woven with a small repeating pattern ── */
  const HIDE = {
    gentle: 'star moon kite lamp rose bell tide leaf wolf nest bird cake door fern frog gift hill iris jade lake lime mint opal pear rain reef ring sand seed ship snow song swan tree vine wave wind wing yarn deer fish'.split(' '),
    standard: 'pearl cloud maple comet river tiger ocean lotus raven amber bloom brook candy cedar coral crane daisy dream eagle ember flame frost grape heart honey koala lemon lilac magic melon otter panda peach piano plume quill robin storm sugar tulip'.split(' '),
    tough: 'garden lantern meadow harbor falcon willow cinder velvet anchor basket bramble butter candle castle cherry clover cobalt copper dragon feather forest ginger island jasmine kettle marble pepper puzzle rabbit saddle silver sparrow summer thistle thunder whisper'.split(' ')
  };
  function hidden(level) {
    const word = pick(HIDE[level]), pair = [digit(), pick(SYMBOLS)];
    const filler = level === 'gentle' ? (rnd(2) ? pair : pair.reverse()) : [digit(), pick(SYMBOLS), digit()];
    const letters = [...word].map((c, i) => level === 'tough' ? (i % 2 ? c : c.toUpperCase()) : (i ? c : c.toUpperCase()));
    let value = '';
    letters.forEach((c, i) => { value += c; if (i < letters.length - 1) value += filler[i % filler.length]; });
    const caps = level === 'tough' ? ', every other letter a capital' : '';
    return { value, core: word, method: 'hidden', hint: `The word ${word.toUpperCase()} hides in it, with ${filler.join(' ')} repeating between its letters${caps}.` };
  }

  /* ── Mirror word: read a word backwards ── */
  const MIRROR = 'garden moon candle forest pepper window castle violet island meadow silver rocket basket harbor thunder kitten anchor bottle butter cactus carpet circus cookie cotton dinner dragon falcon finger flower garlic ginger guitar hammer helmet jacket jungle ladder lemon magnet marble mitten monkey muffin needle orange parrot pebble pencil pickle pillow planet pocket puppet rabbit ribbon saddle sister spider sponge summer tomato tunnel turtle velvet walnut winter wizard yellow'.split(' ');
  const PAIR = ['rose', 'tea', 'fox', 'owl', 'kite', 'bell', 'fern', 'boat', 'pear', 'star'];
  const mirror = w => [...cap(w)].reverse().join('');
  function mirrored(level) {
    const a = pick(MIRROR);
    if (level === 'gentle') { const d = digit() + digit(); return { value: mirror(a) + d, core: a, method: 'mirror', hint: `${a.toUpperCase()} seen in a mirror (its capital ends up last), then ${d}.` }; }
    const s = pick(SYMBOLS), d = digit();
    if (level === 'standard') { const b = pick(PAIR); return { value: mirror(a) + s + cap(b) + d, core: a, method: 'mirror', hint: `${a.toUpperCase()} in a mirror, ${sym(s)}, then ${cap(b)} and ${d}.` }; }
    const b = pick(MIRROR.filter(x => x !== a)), d2 = digit();
    return { value: mirror(a) + s + mirror(b) + d + d2, core: a, method: 'mirror', hint: `${a.toUpperCase()} and ${b.toUpperCase()}, both in a mirror, joined by ${sym(s)}, then ${d}${d2}.` };
  }

  /* ── Number story: a scene with a time in it ── */
  const SCENES = [['Dawn', 'Train', 'The dawn train leaves at'], ['Owl', 'Oak', 'The owl wakes in the oak at'], ['Tea', 'Garden', 'Tea is poured in the garden at'], ['Moon', 'Boat', 'The moon boat sails at'], ['Bell', 'Tower', 'The tower bell rings at'], ['Kite', 'Hill', 'The kites lift from the hill at'], ['Fox', 'Bakery', 'The fox visits the bakery at'], ['Comet', 'Roof', 'The comet passes the roof at'], ['Ghost', 'Library', 'The ghost reads in the library at'], ['Frog', 'Pond', 'The frog sings at the pond at'],
    ['Cat', 'Window', 'The cat naps by the window at'], ['Bus', 'Bridge', 'The bus crosses the bridge at'], ['Baker', 'Oven', 'The baker opens the oven at'], ['Whale', 'Bay', 'The whale surfaces in the bay at'], ['Robin', 'Fence', 'The robin lands on the fence at'], ['Ferry', 'Island', 'The ferry reaches the island at'], ['Knight', 'Gate', 'The knight rides to the gate at'], ['Panda', 'Picnic', 'The panda joins the picnic at'], ['Rain', 'Market', 'The rain reaches the market at'], ['Clock', 'Square', 'The clock in the square chimes at'],
    ['Rocket', 'Moon', 'The rocket lands on the moon at'], ['Otter', 'River', 'The otter dives in the river at'], ['Mail', 'Door', 'The mail drops through the door at'], ['Pirate', 'Cove', 'The pirate rows into the cove at'], ['Choir', 'Hall', 'The choir sings in the hall at'], ['Dragon', 'Cave', 'The dragon yawns in its cave at'], ['Lamp', 'Street', 'The street lamps light up at'], ['Bee', 'Garden', 'The bees leave the garden at'], ['Snow', 'Valley', 'The snow reaches the valley at'], ['Wizard', 'Tower', 'The wizard climbs the tower at'],
    ['Sailor', 'Dock', 'The sailor ties up at the dock at'], ['Puppy', 'Park', 'The puppy runs to the park at'], ['Star', 'Lake', 'The first star shows over the lake at'], ['Tram', 'Corner', 'The tram turns the corner at'], ['Crow', 'Chimney', 'The crow sits on the chimney at'], ['Kettle', 'Kitchen', 'The kettle sings in the kitchen at'], ['Swan', 'Canal', 'The swan glides down the canal at'], ['Band', 'Stage', 'The band takes the stage at'], ['Fog', 'Harbor', 'The fog rolls into the harbor at'], ['Bat', 'Barn', 'The bat leaves the barn at']];
  function story(level) {
    const [a, b, line] = pick(SCENES), h = rnd(24), m = pick([5, 10, 15, 20, 30, 40, 45, 50, 55]), end = pick('!?.');
    if (level === 'gentle') return { value: a + pad2(h) + b + end, core: a + b, method: 'story', hint: `${line} ${pad2(h)}:00${end} — ${a}, the hour, ${b}, the ending.` };
    const time = pad2(h) + pad2(m), spoken = `${pad2(h)}:${pad2(m)}`;
    if (level === 'standard') return { value: a + time + b + end, core: a + b, method: 'story', hint: `${line} ${spoken}${end} — ${a}, the time, ${b}, and the ending.` };
    const s = pick(SYMBOLS);
    return { value: a + time + s + b + end, core: a + b, method: 'story', hint: `${line} ${spoken}${end} — ${a}, the time, ${sym(s)}, ${b}, the ending.` };
  }

  /* ── Look-alike swap: letters that look like numbers ── */
  const SWAP_WORDS = 'lantern comet pebble harbor violet meadow orbit ember willow season onion paper tiles seaside rose basil garden island bottle candle forest silver robot salad pirate potato oasis sunset castle sailor biscuit melody planet poem rainbow seashell spider tiger velvet window anchor balloon lemonade monsoon notebook ocean pianist raisin sesame stories tomato violin whistle zebra apricot bamboo cosmos daisies eclipse festival gelato horizon igloo jasmine'.split(' ');
  const SWAPS = { a: '4', e: '3', i: '1', o: '0', s: '5' };
  const swapWord = w => cap(w).replace(/[aeios]/g, c => SWAPS[c]);
  function swapped(level) {
    const words = pickDistinct(SWAP_WORDS, level === 'gentle' ? 1 : level === 'standard' ? 2 : 3);
    const tail = level === 'gentle' ? digit() + pick(SYMBOLS) : level === 'tough' ? pick(SYMBOLS) : '';
    const value = words.map(swapWord).join('-') + tail;
    const used = [...new Set(words.join('').match(/[aeios]/g) || [])].map(c => `${c}→${SWAPS[c]}`).join(', ');
    return { value, core: words[0], method: 'swap', hint: `${words.map(w => w.toUpperCase()).join(' · ')} with look-alikes: ${used}${tail ? `, then ${tail.split('').join(' ')}` : ''}. A well-known trick — strongest mixed with others.` };
  }

  /* ── Rhyme chain ── */
  const RHYMES = [['cat', 'hat', 'mat', 'bat', 'rat'], ['moon', 'spoon', 'tune', 'dune', 'balloon'], ['star', 'car', 'jar', 'guitar'], ['bee', 'tea', 'sea', 'key', 'tree'], ['rain', 'train', 'lane', 'plane', 'chain'], ['light', 'kite', 'night', 'bite'], ['red', 'bed', 'head', 'bread'], ['fox', 'box', 'socks', 'rocks'], ['bell', 'shell', 'well', 'spell'], ['frog', 'log', 'fog', 'dog'], ['pie', 'sky', 'fly', 'eye'], ['snow', 'bow', 'crow', 'glow'],
    ['cake', 'lake', 'snake', 'rake'], ['goat', 'boat', 'coat', 'note'], ['bear', 'chair', 'pear', 'stair'], ['king', 'ring', 'wing', 'swing'], ['house', 'mouse', 'blouse'], ['bug', 'mug', 'rug', 'hug'], ['clock', 'sock', 'rock', 'dock'], ['fish', 'dish', 'wish'], ['hen', 'pen', 'ten', 'den'], ['mail', 'snail', 'tail', 'pail'],
    ['cloud', 'crowd', 'loud', 'proud'], ['nest', 'vest', 'chest', 'west'], ['frown', 'crown', 'town', 'gown'], ['beach', 'peach', 'reach'], ['bone', 'cone', 'phone', 'stone'], ['cheese', 'bees', 'keys', 'trees'], ['honey', 'bunny', 'money', 'sunny'], ['candle', 'handle', 'sandal']];
  function rhyme(level) {
    const group = pick(RHYMES), words = pickDistinct(group, level === 'gentle' ? 2 : 3), d1 = digit(), d2 = digit();
    if (level === 'gentle') return { value: words.map(cap).join('') + d1 + d2, core: group[0], method: 'rhyme', hint: `A rhyme: ${words.join(', ')} — then ${d1}${d2}.` };
    const s = pick(SYMBOLS);
    if (level === 'standard') return { value: cap(words[0]) + s + cap(words[1]) + cap(words[2]) + d1 + d2, core: group[0], method: 'rhyme', hint: `A rhyme: ${words[0]} ${s} ${words[1]}, ${words[2]} — then ${d1}${d2}.` };
    const s2 = pick(SYMBOLS);
    return { value: cap(words[0]) + s + words[1].toUpperCase() + s2 + cap(words[2]) + d1 + d2, core: group[0], method: 'rhyme', hint: `A rhyme: ${words[0]} ${s} ${words[1].toUpperCase()} (shouted) ${s2} ${words[2]} — then ${d1}${d2}.` };
  }

  /* ── Picture words: images and a number ── */
  const PICTURES = 'amber anchor apple arrow aspen badger basil beacon berry birch bloom bramble breeze brook cactus candle canyon cedar cherry cinder clover cobalt comet copper coral cotton crane crystal daisy dawn delta dune echo ember fable falcon fern fjord flint fox frost garnet ginger glacier harbor hazel heron honey indigo iris ivory jasper juniper kettle kiwi lagoon lantern lark lemon lilac lotus maple marble meadow mint moss nectar nova oak ocean olive onyx orbit otter pebble pepper pine plum poppy prism quartz quill raven reef ripple river robin saffron sage shell silver sparrow spruce stone thistle thunder tide topaz tulip velvet violet walnut willow wren'.split(' ');
  function picture(level) {
    const [a, b, c] = pickDistinct(PICTURES, 3), s = pick(SYMBOLS), d = digit() + digit();
    if (level === 'gentle') return { value: cap(a) + d + s, core: a, method: 'picture', hint: `Picture ${an(a.toUpperCase())}, then ${d}, then ${sym(s)}.` };
    if (level === 'standard') return { value: cap(a) + s + cap(b) + d, core: a, method: 'picture', hint: `Picture ${an(a.toUpperCase())} beside ${an(b.toUpperCase())}, joined by ${sym(s)}; then ${d}.` };
    const sep = pick('-.+_');
    return { value: [cap(a), b, cap(c)].join(sep) + d + s, core: a, method: 'picture', hint: `Picture ${a.toUpperCase()}, a small ${b}, ${c.toUpperCase()} — joined by ${({ '-': 'dashes', '.': 'dots', '+': 'pluses', '_': 'underscores' })[sep]}; then ${d} and ${s}.` };
  }

  const METHODS = {
    random: { name: 'Random string', recall: 'Chunk by chunk, in your mind.', make: random },
    initials: { name: 'Sentence initials', recall: 'Say the little sentence. Keep the first letters.', make: initials },
    hidden: { name: 'Hidden word', recall: 'Find the word, then weave the pattern back in.', make: hidden },
    mirror: { name: 'Mirror word', recall: 'Read the word back in the mirror.', make: mirrored },
    story: { name: 'Number story', recall: 'Picture the scene, and the time it happens.', make: story },
    swap: { name: 'Look-alike swap', recall: 'Swap the look-alike numbers back in.', make: swapped },
    rhyme: { name: 'Rhyme chain', recall: 'Hum the rhyme, then the numbers.', make: rhyme },
    picture: { name: 'Picture words', recall: 'See the pictures in order.', make: picture }
  };
  const STORY_METHODS = Object.keys(METHODS).filter(k => k !== 'random');
  const normaliseStyle = s => s === 'characters' ? 'random' : s === 'words' ? 'methods' : ['mix', 'random', 'methods'].includes(s) ? s : 'mix';
  const normaliseLevel = l => RANDOM_LEN[l] ? l : 'standard';

  /* Recently used cores (the word, scene or rhyme a combination is built on), per method, kept in memory only for this
     session. Without this a new combination could reuse a word that just retired (PEARL again, with other numbers),
     which feels like a repeat even though the string is new. 15 per method is about an hour of practice in Mix. */
  const RECENT = {}, RECENT_SIZE = 15;
  const seen = (key, core) => (RECENT[key] || []).includes(core);
  function remember(key, core) { const list = RECENT[key] || (RECENT[key] = []); list.push(core); if (list.length > RECENT_SIZE) list.shift(); }

  /** style: 'mix' | 'random' | 'methods'. Mix is about a third random strings, the rest spread over the methods. */
  function make(style = 'mix', level = 'standard', avoid = [], recentMethods = []) {
    style = normaliseStyle(style); level = normaliseLevel(level);
    for (let tries = 0; tries < 40; tries++) {
      const key = style === 'random' ? 'random' : style === 'methods' ? pick(STORY_METHODS) : (rnd(3) === 0 ? 'random' : pick(STORY_METHODS));
      if (key !== 'random' && recentMethods.includes(key) && tries < 10) continue; // vary the methods within a set
      const made = METHODS[key].make(level);
      if (!made.value || /\s/.test(made.value) || avoid.includes(made.value)) continue;
      if (tries < 36 && seen(key, made.core)) continue; // a fresh word or scene, not one that just retired
      remember(key, made.core);
      return { ...made, methodName: METHODS[key].name, recall: METHODS[key].recall, seed: rnd(2 ** 31) };
    }
    const made = random(level);
    return { ...made, methodName: METHODS.random.name, recall: METHODS.random.recall, seed: rnd(2 ** 31) };
  }
  const classOf = c => /[0-9]/.test(c) ? 'd' : /[A-Za-z]/.test(c) ? (c === c.toUpperCase() ? 'u' : 'l') : 's';
  window.MyuuelCombos = { make, classOf, normaliseStyle, METHODS };
})();
