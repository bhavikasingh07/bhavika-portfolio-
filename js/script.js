/* ============ pixel-art bitmap renderer (no image assets) ============ */
function drawPixelArt(container, grid, palette, cell) {
  const rows = grid.length, cols = grid[0].length;
  container.style.position = 'relative';
  container.style.width = cols * cell + 'px';
  container.style.height = rows * cell + 'px';
  const dot = document.createElement('div');
  dot.style.position = 'absolute';
  dot.style.top = '0'; dot.style.left = '0';
  dot.style.width = cell + 'px'; dot.style.height = cell + 'px';
  dot.style.background = 'transparent';
  const shadows = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ch = grid[r][c];
      if (ch === '.') continue;
      shadows.push(`${c * cell}px ${r * cell}px 0 0 ${palette[ch]}`);
    }
  }
  dot.style.boxShadow = shadows.join(',');
  container.innerHTML = '';
  container.appendChild(dot);
}

const playerPalette = {
  b: '#7a431d', // brown hair
  s: '#ffd0b0', // skin
  e: '#111111', // black eyes
  p: '#ff5fc9', // pink hair clip
  w: '#ffffff', // white shirt
  g: '#3fae3b'  // green skirt
};

function buildPlayerGrid() {
  const raw = [
    "...bbbbb....",
    ".ppbbbbbb...",
    ".pbbbbbbbb..",
    "..bsessebb..",
    "..bsssssbb..",
    "..bsssssbb..",
    "..swwwwws...",
    "..swwwwws...",
    "..swwwwws...",
    "...wwwww....",
    "..ggggggg...",
    "..ggggggg...",
    "..ggggggg...",
    "..ggggggg...",
    "...ss.ss....",
    "...ss.ss...."
  ];
  return raw.map(row => row.split(''));
}

function buildCatGrid() {
  const raw = [
    ".f......f.",
    ".ff....ff.",
    "fpffffffpf",
    "ffffffffff",
    "ffefffefff",
    "pfffwwfffp",
    "ffffffffff",
    ".ffffffff.",
    ".w......w."
  ];
  return raw.map(row => row.split(''));
}

const playerGrid = buildPlayerGrid();
const catPalette = { f: '#ffe9d6', p: '#ffb3d9', e: '#241a17', w: '#fff9f3' };

document.querySelectorAll('#playerSprite, #portraitSprite').forEach(el => {
  drawPixelArt(el, playerGrid, playerPalette, el.id === 'portraitSprite' ? 8 : 7);
});
drawPixelArt(document.getElementById('catSprite'), buildCatGrid(), catPalette, 6);

/* ============ starfield canvas ============ */
const canvas = document.getElementById('starfield');
const ctx = canvas.getContext('2d');
let stars = [];

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = document.documentElement.scrollHeight;
}
const starColors = ['#ffffff', '#ffe9b8', '#ffd0ef', '#cdeaff'];
function initStars() {
  const count = Math.floor((canvas.width * canvas.height) / 9000);
  stars = Array.from({ length: count }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.4 + 0.4,
    phase: Math.random() * Math.PI * 2,
    speed: Math.random() * 0.02 + 0.008,
    color: starColors[Math.floor(Math.random() * starColors.length)]
  }));
}
resizeCanvas();
initStars();
window.addEventListener('resize', () => { resizeCanvas(); initStars(); });

let t = 0;
function drawStars() {
  t += 1;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const scrollOffset = window.scrollY * 0.05;
  stars.forEach(s => {
    const twinkle = 0.5 + 0.5 * Math.sin(t * s.speed + s.phase);
    ctx.globalAlpha = 0.25 + twinkle * 0.75;
    ctx.fillStyle = s.color;
    ctx.fillRect(s.x, (s.y - scrollOffset + canvas.height) % canvas.height, s.r, s.r);
  });
  ctx.globalAlpha = 1;
  requestAnimationFrame(drawStars);
}
drawStars();

/* ============ sound synth (Web Audio, no files) ============ */
let audioCtx = null;
let soundOn = true;

function ensureAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  startBgMusic();
}

/* ============ background music ============ */
const bgMusic = document.getElementById('bgMusic');
if (bgMusic) bgMusic.volume = 0.65;
let bgMusicStarted = false;
function startBgMusic() {
  if (!bgMusic || bgMusicStarted || !soundOn) return;
  bgMusicStarted = true;
  bgMusic.play().catch(() => { bgMusicStarted = false; });
}

/* -- master volume node -- */
let masterGain = null;
function getMaster() {
  if (!masterGain) {
    ensureAudio();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.45;
    masterGain.connect(audioCtx.destination);
  }
  return masterGain;
}

function playSfx(type) {
  if (!soundOn) return;
  ensureAudio();
  const now = audioCtx.currentTime;
  const master = getMaster();

  if (type === 'hover') {
    // 8-bit coin blip — quick rising square chirp
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.06);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain).connect(master);
    osc.start(now);
    osc.stop(now + 0.08);
  }
  else if (type === 'click') {
    // Retro button press — two-tone square pop
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc1.type = 'square';
    osc1.frequency.setValueAtTime(520, now);
    osc1.frequency.exponentialRampToValueAtTime(260, now + 0.1);
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(1040, now);
    osc2.frequency.exponentialRampToValueAtTime(520, now + 0.1);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(master);
    osc1.start(now); osc2.start(now);
    osc1.stop(now + 0.12); osc2.stop(now + 0.12);
  }
  else if (type === 'start') {
    // Power-up fanfare — classic NES arpeggio
    const notes = [523, 659, 784, 1047, 1319, 1568];
    notes.forEach((freq, i) => {
      const d = i * 0.07;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + d);
      gain.gain.setValueAtTime(0.16, now + d);
      gain.gain.exponentialRampToValueAtTime(0.001, now + d + 0.2);
      osc.connect(gain).connect(master);
      osc.start(now + d);
      osc.stop(now + d + 0.2);
    });
  }
  else if (type === 'photoToggle') {
    // Camera shutter click + soft major-chord shimmer reveal
    const bufferSize = Math.floor(audioCtx.sampleRate * 0.035);
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const bandpass = audioCtx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 2400;
    bandpass.Q.value = 1.1;
    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.3, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
    noise.connect(bandpass).connect(noiseGain).connect(master);
    noise.start(now);
    noise.stop(now + 0.05);

    const chimeNotes = [784, 988, 1175]; // G5, B5, D6 shimmer chord
    chimeNotes.forEach((freq) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + 0.05);
      gain.gain.setValueAtTime(0, now + 0.05);
      gain.gain.linearRampToValueAtTime(0.11, now + 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc.connect(gain).connect(master);
      osc.start(now + 0.05);
      osc.stop(now + 0.56);
    });
  }
  else if (type === 'bloom') {
    // Soft two-note sparkle — for the blossom-reveal moment
    const notes = [1046.5, 1568]; // C6, G6
    notes.forEach((freq, i) => {
      const d = i * 0.09;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + d);
      gain.gain.setValueAtTime(0, now + d);
      gain.gain.linearRampToValueAtTime(0.13, now + d + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + d + 0.35);
      osc.connect(gain).connect(master);
      osc.start(now + d);
      osc.stop(now + d + 0.36);
    });
  }
  else if (type === 'critter') {
    // Playful pitch-bend squeak — for the cat's pounce
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(500, now + 0.16);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain).connect(master);
    osc.start(now);
    osc.stop(now + 0.19);
  }
}

function playHover() { playSfx('hover'); }
function playClick() { playSfx('click'); }
function playStart() { playSfx('start'); }

const soundToggle = document.getElementById('soundToggle');
soundToggle.addEventListener('click', () => {
  soundOn = !soundOn;
  soundToggle.textContent = soundOn ? '🔊' : '🔇';
  if (soundOn) {
    ensureAudio();
    playSfx('click');
    if (bgMusic && bgMusicStarted) bgMusic.play().catch(() => {});
  } else if (bgMusic) {
    bgMusic.pause();
  }
});

document.querySelectorAll('.start-btn, .tool-chip, .mission-card, .castle-door, .contact-links a').forEach(el => {
  el.addEventListener('mouseenter', playHover);
});
document.querySelectorAll('[data-sfx="start"]').forEach(btn => {
  btn.addEventListener('click', () => { ensureAudio(); playStart(); });
});
document.querySelectorAll('.mission-card, .castle-door, .contact-links a').forEach(el => {
  el.addEventListener('click', () => { ensureAudio(); playClick(); });
});

/* ============ nav actions ============ */
document.getElementById('startBtn').addEventListener('click', () => {
  ensureAudio();
  playStart();
  document.getElementById('level1').scrollIntoView({ behavior: 'smooth' });
});
document.getElementById('continueBtn').addEventListener('click', () => {
  ensureAudio();
  playClick();
  document.getElementById('boot').scrollIntoView({ behavior: 'smooth' });
});

/* ============ health bar fill on load ============ */
window.addEventListener('load', () => {
  setTimeout(() => { document.getElementById('healthFill').style.width = '72%'; }, 500);
});

/* ============ scroll reveal ============ */
const revealTargets = document.querySelectorAll(
  '.level-heading, .ds-wrap, .dialog, .stat-panel, .mission-card, .game-over'
);
revealTargets.forEach(el => el.classList.add('reveal'));

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
revealTargets.forEach(el => revealObserver.observe(el));

/* ============ DS console tilt-on-mouse ============ */
const dsWrap = document.getElementById('dsWrap');
const dsConsole = dsWrap.querySelector('.ds-console');
dsWrap.addEventListener('mousemove', (e) => {
  const rect = dsWrap.getBoundingClientRect();
  const px = (e.clientX - rect.left) / rect.width - 0.5;
  const py = (e.clientY - rect.top) / rect.height - 0.5;
  dsConsole.style.transform = `rotateY(${px * 16}deg) rotateX(${-py * 16}deg) scale(1.03)`;
});
dsWrap.addEventListener('mouseleave', () => {
  dsConsole.style.transform = 'rotateY(0) rotateX(0) scale(1)';
});

/* ============ ambient cursor glow ============ */
if (window.matchMedia('(pointer: fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const glow = document.createElement('div');
  glow.className = 'cursor-glow';
  document.body.appendChild(glow);
  let gx = 0, gy = 0, cx = 0, cy = 0;
  window.addEventListener('mousemove', (e) => { gx = e.clientX; gy = e.clientY; });
  (function animateGlow() {
    cx += (gx - cx) * 0.12;
    cy += (gy - cy) * 0.12;
    glow.style.transform = `translate(${cx}px, ${cy}px)`;
    requestAnimationFrame(animateGlow);
  })();
}

/* ============ typewriter for dialog ============ */
function playTypewriterSfx() {
  if (!soundOn) return;
  ensureAudio();
  const now = audioCtx.currentTime;
  const master = getMaster();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(200 + Math.random() * 160, now);
  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
  osc.connect(gain).connect(master);
  osc.start(now);
  osc.stop(now + 0.04);
}

const typewriterEl = document.getElementById('typewriter');
const fullLine = "Let's start the game!";
let typed = false;
const twObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && !typed) {
      typed = true;
      let i = 0;
      const interval = setInterval(() => {
        typewriterEl.textContent = fullLine.slice(0, i + 1);
        playTypewriterSfx();
        i++;
        if (i >= fullLine.length) { clearInterval(interval); typewriterEl.style.borderRight = 'none'; }
      }, 45);
      twObserver.disconnect();
    }
  });
}, { threshold: 0.4 });
twObserver.observe(document.getElementById('dialogBox'));

/* ============ console screen toggle (Real Image <-> Pixel Art) ============ */
const consoleScreen = document.getElementById('consoleScreen');
const portraitSprite = document.getElementById('portraitSprite');
const realPortrait = document.getElementById('realPortrait');

if (consoleScreen && portraitSprite && realPortrait) {
  const heartBtn = document.getElementById('heartBtn');

  function togglePortrait() {
    ensureAudio();
    playSfx('photoToggle');
    portraitSprite.classList.toggle('ds-hidden');
    realPortrait.classList.toggle('ds-hidden');
  }

  consoleScreen.addEventListener('click', togglePortrait);
  if (heartBtn) heartBtn.addEventListener('click', togglePortrait);
}

/* ============ playable ground scene (arrow-key walk) ============ */
(function initWalk() {
  const player = document.getElementById('playerSprite');
  const scene = player && player.closest('.scene-ground');
  const cat = document.getElementById('catSprite');
  const lamp = document.getElementById('lampToggle');
  const tree = document.getElementById('treeToggle');
  if (!player || !scene) return;

  const SPEED = 2.6;
  const PAD = 30;
  const keys = { left: false, right: false };
  let x = null;
  let facingLeft = false;
  let walking = false;

  player.addEventListener('click', () => {
    ensureAudio();
    playSfx('bloom');
    player.classList.remove('greet');
    void player.offsetWidth;
    player.classList.add('greet');
  });

  if (cat) {
    cat.addEventListener('click', () => {
      ensureAudio();
      playSfx('critter');
      cat.classList.remove('pounce');
      void cat.offsetWidth;
      cat.classList.add('pounce');
    });
  }

  function bounds() {
    const max = scene.clientWidth - PAD - player.offsetWidth;
    return { min: PAD, max: Math.max(PAD, max) };
  }

  function clampToBounds() {
    const { min, max } = bounds();
    if (x === null) x = initialX();
    x = Math.min(max, Math.max(min, x));
    player.style.left = x + 'px';
  }

  function initialX() {
    const { min, max } = bounds();
    if (lamp && tree) {
      const sceneRect = scene.getBoundingClientRect();
      const lampRight = lamp.getBoundingClientRect().right - sceneRect.left;
      const treeLeft = tree.getBoundingClientRect().left - sceneRect.left;
      const mid = lampRight + (treeLeft - lampRight) * 0.08 - player.offsetWidth / 2;
      return Math.min(max, Math.max(min, mid));
    }
    return min + (max - min) * 0.4;
  }

  function setWalking(on) {
    if (walking === on) return;
    walking = on;
    player.classList.toggle('walking', on);
    if (on && cat) {
      cat.classList.remove('notice');
      void cat.offsetWidth;
      cat.classList.add('notice');
    }
  }

  function setFacing(left) {
    if (facingLeft === left) return;
    facingLeft = left;
    player.classList.toggle('facing-left', left);
  }

  function loop() {
    const { min, max } = bounds();
    let dx = 0;
    if (keys.left) dx -= SPEED;
    if (keys.right) dx += SPEED;
    if (dx !== 0) {
      x = Math.min(max, Math.max(min, x + dx));
      player.style.left = x + 'px';
      setWalking(true);
      setFacing(dx < 0);
    } else {
      setWalking(false);
    }
    requestAnimationFrame(loop);
  }

  clampToBounds();
  requestAnimationFrame(loop);
  window.addEventListener('resize', clampToBounds);

  window.addEventListener('keydown', (e) => {
    if (['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD'].includes(e.code)) {
      e.preventDefault();
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = true;
    }
  });
  window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
  });
})();

/* ============ lamp tap: toggle pink mode ============ */
const lampToggle = document.getElementById('lampToggle');
if (lampToggle) {
  lampToggle.addEventListener('click', () => {
    ensureAudio();
    playClick();
    document.body.classList.toggle('pink-mode');
  });
}

/* ============ tree tap: bloom blossoms ============ */
const treeToggle = document.getElementById('treeToggle');
if (treeToggle) {
  treeToggle.addEventListener('click', () => {
    ensureAudio();
    playSfx('bloom');
    treeToggle.classList.toggle('bloomed');
  });
}
