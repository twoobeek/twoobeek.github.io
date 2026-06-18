// ─────────────────────────────────────────────────────────────────────────────
// IMAGE DATA
// Each entry needs:
//   src        – path to the full-size image, used in the lightbox (relative to index.html, or a full URL)
//   thumb      – optional smaller/compressed image used in the grid (falls back to src)
//   width      – actual pixel width  of the image  (used for aspect ratio only)
//   height     – actual pixel height of the image  (used for aspect ratio only)
//   alt        – short description (good for accessibility / SEO)
//   title      – long title shown in the lightbox
//   shortTitle – short title shown on the unfocused thumbnail (falls back to title)
//                if title is missing, shortTitle is used in both places
//   rotateWords – optional, e.g. { Wolf: -90 } rotates the word "Wolf" by
//                 -90deg (counterclockwise) when shown in the lightbox title
//   description – optional, small text shown below the title in the lightbox
// ─────────────────────────────────────────────────────────────────────────────
const IMAGES = [
  { src: 'images/bad_dream.png',  thumb: 'images/thumbs/bad_dream.webp',  width: 1391, height: 1833, title: 'Bad Dream',  alt: 'Bad Dream' },
  { src: 'images/i_m_cooked.png', thumb: 'images/thumbs/i_m_cooked.webp', width: 1379, height: 2273, title: "Man, I'm Cooked", shortTitle: "I'm Cooked", alt: "I'm Cooked" },
  { src: 'images/mindreader.png',        thumb: 'images/thumbs/mindreader.webp',        width: 2561, height: 1941, title: 'Mindreader',          alt: 'Mindreader' },
  { src: 'images/toa_tahu_mata_sam.png', thumb: 'images/thumbs/toa_tahu_mata_sam.webp', width: 1667, height: 2120, title: 'Toa Tahu Mata Sam', alt: 'Toa Tahu Mata Sam' },
  { src: 'images/milky_way.png',         thumb: 'images/thumbs/milky_way.webp',         width: 1457, height: 610,  title: 'Milky Way', alt: 'Milky Way', description: "The global (international) version." },
  { src: "images/inoperable_brainfrog.png", thumb: "images/thumbs/inoperable_brainfrog.webp", width: 1197, height: 1545, title: "Inoperable Brainfrog", alt: "Inoperable Brainfrog" },
  { src: "images/wolfman.png", thumb: "images/thumbs/wolfman.webp", width: 945, height: 414, title: "Wolf Man", alt: "Wolf Man", rotateWords: { Man: -90 } },
  { src: "images/earth_angel.png", thumb: "images/thumbs/earth_angel.webp", width: 1728, height: 1647, title: "Earth Angel Defeating Duck O'Devil", shortTitle: "Earth Angel", alt: "Earth Angel", description: "You may not be able to hear it, but Halo the Living Nimbus exclaims: \"Yeah, dude! Get that fucking bastard! Gut the fucker! Cut its throat! Spill its blood!\"" },
  { src: "images/leonardo.png", thumb: "images/thumbs/leonardo.webp", width: 641, height: 581, title: "Leonardo da Vinci", shortTitle: "Leonardo", alt: "Leonardo", description: "Self-portrait, 1998, Oil on oak panel, Seattle Art Museum." },
];

// ─────────────────────────────────────────────────────────────────────────────
// RENDER GALLERY  (masonry via CSS columns)
// ─────────────────────────────────────────────────────────────────────────────
function renderGallery() {
  const container = document.getElementById('gallery');
  container.innerHTML = '';

  IMAGES.forEach((item, idx) => {
    const fig = document.createElement('figure');
    fig.className = 'g-item';
    const rx = 2 + Math.random() * 3;
    const ry = 2 + Math.random() * 3;
    const startAngle = Math.random() * Math.PI * 2;
    const dir = Math.random() < 0.5 ? 1 : -1;
    for (let i = 0; i < 8; i++) {
      const a = startAngle + dir * (i / 8) * Math.PI * 2;
      fig.style.setProperty(`--cx${i}`, `${(rx * Math.cos(a)).toFixed(2)}px`);
      fig.style.setProperty(`--cy${i}`, `${(ry * Math.sin(a)).toFixed(2)}px`);
    }
    fig.style.setProperty('--float-dur', `${(4 + Math.random() * 3).toFixed(1)}s`);
    fig.style.setProperty('--float-delay', `-${(Math.random() * 7).toFixed(1)}s`);

    const randomAngle = () => (Math.random() * 1.8 + 0.7) * (Math.random() < 0.5 ? 1 : -1);
    fig.addEventListener('mouseenter', () => fig.style.setProperty('--hover-rotate', `${randomAngle().toFixed(1)}deg`));
    fig.addEventListener('focus', () => fig.style.setProperty('--hover-rotate', `${randomAngle().toFixed(1)}deg`));
    fig.setAttribute('role', 'button');
    fig.setAttribute('tabindex', '0');
    fig.setAttribute('aria-label', item.alt || `Photo ${idx + 1}`);

    const img = document.createElement('img');
    img.alt = item.alt;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.addEventListener('load', () => img.classList.add('visible'));
    img.style.maxWidth = `${item.width}px`;
    img.draggable = false;
    img.src = item.thumb || item.src;

    const caption = document.createElement('span');
    caption.className = 'g-caption';
    const inner = document.createElement('span');
    inner.className = 'g-caption-inner';
    const captionText = item.shortTitle || item.title;
    for (const char of captionText) {
      const s = document.createElement('span');
      s.textContent = char;
      if (char.trim()) s.style.color = randomColor();
      inner.appendChild(s);
    }
    caption.appendChild(inner);

    fig.appendChild(img);
    fig.appendChild(caption);

    fig.addEventListener('click', () => { openedViaKeyboard = false; openLightbox(idx); });
    fig.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { openedViaKeyboard = true; openLightbox(idx); } });

    container.appendChild(fig);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// LIGHTBOX
// ─────────────────────────────────────────────────────────────────────────────
let currentIdx = 0;
let prevFocus = null;
let openedViaKeyboard = false;

const lightbox     = document.getElementById('lightbox');
const lbImg        = document.getElementById('lb-img');
const lbPeekPrev   = document.getElementById('lb-peek-prev');
const lbPeekNext   = document.getElementById('lb-peek-next');
const lbStage      = lightbox.querySelector('.lb-stage');
const lbCounter = lightbox.querySelector('.lb-counter');
const lbTitle   = document.getElementById('lb-title');
const lbDescription = document.getElementById('lb-description');
const lbBg      = document.getElementById('lb-bg');
const lbSpinner = lightbox.querySelector('.lb-spinner');
const lbClose   = lightbox.querySelector('.lb-close');

function openLightbox(index) {
  prevFocus = document.activeElement;
  currentIdx = index;
  loadLightboxImage();
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  lbClose.focus();
}

function closeLightbox() {
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  lbImg.src = '';
  hidePeek(lbPeekPrev);
  hidePeek(lbPeekNext);
  if (prevFocus && openedViaKeyboard) prevFocus.focus();
}

function hidePeek(peek) {
  peek.src = '';
  peek.classList.remove('visible');
  delete peek.dataset.idx;
}

// Pre-load the neighboring thumbs so a drag never has to swap an <img> src
// mid-gesture (that's what caused the "blank in the middle" glitch on fast
// back-and-forth swipes — src changes are async).
function setupPeek(peek, idx) {
  const neighbor = IMAGES[idx];
  if (!neighbor) { hidePeek(peek); return; }
  if (peek.dataset.idx === String(idx)) return;
  peek.dataset.idx = String(idx);
  peek.style.maxWidth = `min(100%, ${neighbor.width}px)`;
  peek.style.maxHeight = `min(100%, ${neighbor.height}px)`;
  peek.src = neighbor.thumb || neighbor.src;
}

function refreshPeeks() {
  setupPeek(lbPeekPrev, currentIdx - 1);
  setupPeek(lbPeekNext, currentIdx + 1);
}

const lbMobileQuery = window.matchMedia('(max-width: 700px)');

// On the stacked mobile layout the stage used to size itself to whatever
// height the in-flow <img> rendered at (so the gap to the title below felt
// snug and consistent per picture). Now that the images are absolutely
// positioned (for the drag-swipe), the stage no longer sizes around them
// automatically, so we compute and set its height to match by hand.
function applyStageHeight(item) {
  if (!lbMobileQuery.matches) { lbStage.style.height = ''; return; }
  const width = lbStage.getBoundingClientRect().width;
  if (!width) return; // transient 0 during a layout/fullscreen transition — a retry below will catch it
  const maxHeight = window.innerHeight * 0.55;
  const heightFromWidth = width * (item.height / item.width);
  lbStage.style.height = `${Math.min(heightFromWidth, maxHeight)}px`;
}

// Window resizes (e.g. exiting fullscreen) can briefly report a 0/stale
// stage width mid-transition; a single read can land on that moment and
// leave the stage permanently collapsed. Retry a few times shortly after
// instead of trusting just one measurement.
function recalcStageHeightSoon() {
  const item = IMAGES[currentIdx];
  applyStageHeight(item);
  requestAnimationFrame(() => applyStageHeight(item));
  setTimeout(() => applyStageHeight(item), 150);
  setTimeout(() => applyStageHeight(item), 400);
}
window.addEventListener('resize', recalcStageHeightSoon);
document.addEventListener('fullscreenchange', recalcStageHeightSoon);

function setLightboxMeta(item) {
  applyStageHeight(item);
  renderLightboxTitle(item);
  lbDescription.textContent = item.description || '';
  lbCounter.textContent = `${currentIdx + 1} / ${IMAGES.length}`;

  // use the small (likely already-cached) thumb, and only swap once it has
  // actually loaded — the old backdrop stays put until then, so there's
  // never a blank gap between pictures
  const bgSrc = item.thumb || item.src;
  const probe = new Image();
  probe.onload = () => {
    if (IMAGES[currentIdx] !== item) return; // navigated again before this finished loading
    lbBg.style.backgroundImage = `url(${bgSrc})`;
  };
  probe.src = bgSrc;
}

function loadLightboxImage(delta = 0) {
  const item = IMAGES[currentIdx];

  lbImg.style.transition = 'none';
  lbImg.style.setProperty('--drag-x', '0px');
  lbImg.classList.remove('visible', 'slide-from-left', 'slide-from-right');
  if (delta > 0) lbImg.classList.add('slide-from-right');
  else if (delta < 0) lbImg.classList.add('slide-from-left');
  void lbImg.offsetWidth; // force reflow so the slide-from class applies before transitioning
  lbSpinner.classList.remove('hidden');

  lbImg.onload = () => {
    lbSpinner.classList.add('hidden');
    lbImg.classList.add('visible');
  };
  lbImg.onerror = () => {
    lbSpinner.classList.add('hidden');
  };

  lbImg.alt = item.alt;
  lbImg.style.maxWidth = `min(100%, ${item.width}px)`;
  lbImg.style.maxHeight = `min(100%, ${item.height}px)`;
  lbImg.src = item.src;

  setLightboxMeta(item);
  refreshPeeks();
}

function renderLightboxTitle(item) {
  const text = item.title || item.shortTitle;
  const rotateWords = item.rotateWords || {};
  lbTitle.innerHTML = '';
  const words = text.split(' ');
  const rotatedSpans = [];
  words.forEach((word, i) => {
    if (rotateWords[word] !== undefined) {
      const span = document.createElement('span');
      span.textContent = word;
      span.style.display = 'inline-block';
      span.style.whiteSpace = 'nowrap';
      span.style.verticalAlign = 'middle';
      span.classList.add('lb-title-rotated-word');
      lbTitle.appendChild(span);
      rotatedSpans.push({ span, deg: rotateWords[word] });
    } else {
      lbTitle.appendChild(document.createTextNode(word));
    }
    if (i < words.length - 1) lbTitle.appendChild(document.createTextNode(' '));
  });

  // swap width/height to the word's natural size *before* rotating, so the
  // line reserves the post-rotation footprint instead of the pre-rotation one
  rotatedSpans.forEach(({ span, deg }) => {
    const w = span.offsetWidth;
    const h = span.offsetHeight;
    span.style.width  = `${h}px`;
    span.style.height = `${w}px`;
    span.style.transform = `rotate(${deg}deg)`;
  });
}

function navigate(delta) {
  const next = currentIdx + delta;
  if (next >= 0 && next < IMAGES.length) {
    currentIdx = next;
    loadLightboxImage(delta);
  }
}

// Lightbox event listeners
lbClose.addEventListener('click', closeLightbox);

lightbox.addEventListener('click', (e) => {
  if (e.target.closest('.lb-close')) return;
  if (Date.now() < suppressClickUntil) return;
  const half = window.innerWidth / 2;
  navigate(e.clientX < half ? -1 : 1);
});

document.addEventListener('keydown', (e) => {
  if (!lightbox.classList.contains('open')) return;
  if (e.key === 'Escape')     closeLightbox();
  if (e.key === 'ArrowLeft')  navigate(-1);
  if (e.key === 'ArrowRight') navigate(1);
});

// Touch swipe support — the image tracks the finger 1:1, with the next/prev
// picture (pre-loaded ahead of time, see refreshPeeks) peeking in from the
// side, and only commits to navigating once the drag clears a distance/
// velocity threshold (otherwise it springs back).
const DEAD_ZONE = 10;       // px of finger movement ignored, so vertical scrolling/jitter doesn't trigger anything
const COMMIT_RATIO = 0.3;   // fraction of stage width that counts as a deliberate swipe
const COMMIT_VELOCITY = 0.7; // px/ms flick speed that counts as deliberate
const COMMIT_MIN_DISTANCE = 24; // a flick still needs to have moved this many px to commit

let isMultiTouch = false;
let suppressClickUntil = 0;
let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;
let dragDelta = 0;
let dragDirection = 0; // -1 = prev, 1 = next, 0 = none
let stageWidth = 0;
let gestureAxis = null; // 'x' | 'y' | null (undecided) — locked once movement clears the dead zone

// Lets an in-flight 200ms "settle" animation (cancel or commit) be finished
// immediately instead of silently dropped if a new touch starts before it's
// done — otherwise rapid consecutive swipes could desync currentIdx from
// what's on screen.
let pendingSettle = null;
function scheduleSettle(fn, delay) {
  flushPendingSettle();
  const timeoutId = setTimeout(() => { pendingSettle = null; fn(); }, delay);
  pendingSettle = () => { clearTimeout(timeoutId); pendingSettle = null; fn(); };
}
function flushPendingSettle() {
  if (pendingSettle) pendingSettle();
}

function setDragX(el, px) {
  el.style.setProperty('--drag-x', `${px}px`);
}

function hardResetDrag() {
  flushPendingSettle();
  lbImg.style.transition = 'none';
  lbPeekPrev.style.transition = 'none';
  lbPeekNext.style.transition = 'none';
  setDragX(lbImg, 0);
  setDragX(lbPeekPrev, 0);
  setDragX(lbPeekNext, 0);
  lbPeekPrev.classList.remove('visible');
  lbPeekNext.classList.remove('visible');
  lbImg.classList.add('visible');
  dragDelta = 0;
  dragDirection = 0;
  gestureAxis = null;
}

lightbox.addEventListener('touchstart', (e) => {
  if (e.touches.length > 1) { isMultiTouch = true; return; }
  isMultiTouch = false;
  hardResetDrag();
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
  touchStartTime = performance.now();
  stageWidth = lbStage.getBoundingClientRect().width;
}, { passive: true });

lightbox.addEventListener('touchmove', (e) => {
  if (e.touches.length > 1) {
    if (!isMultiTouch) hardResetDrag();
    isMultiTouch = true;
    return;
  }
  if (isMultiTouch || !stageWidth) return;

  const rawX = e.touches[0].clientX - touchStartX;
  const rawY = e.touches[0].clientY - touchStartY;

  // decide once, early, whether this gesture is a horizontal swipe or a
  // vertical scroll — and stick with it, so a swipe that drifts vertically
  // (or vice versa) doesn't flip-flop mid-gesture
  if (gestureAxis === null && (Math.abs(rawX) >= DEAD_ZONE || Math.abs(rawY) >= DEAD_ZONE)) {
    gestureAxis = Math.abs(rawX) > Math.abs(rawY) ? 'x' : 'y';
  }
  if (gestureAxis !== 'x') {
    if (dragDirection !== 0) { dragDelta = 0; dragDirection = 0; setDragX(lbImg, 0); lbPeekPrev.classList.remove('visible'); lbPeekNext.classList.remove('visible'); }
    return;
  }

  const raw = rawX;
  let delta = Math.abs(raw) < DEAD_ZONE ? 0 : raw;
  const dir = delta < 0 ? 1 : delta > 0 ? -1 : 0;
  const neighbor = dir !== 0 ? IMAGES[currentIdx + dir] : null;
  if (!neighbor) delta = 0;
  delta = Math.max(-stageWidth, Math.min(stageWidth, delta));

  dragDelta = delta;
  dragDirection = delta === 0 ? 0 : dir;
  setDragX(lbImg, delta);

  // both peeks are already preloaded — just move whichever side is active
  if (dragDirection === 1) {
    lbPeekNext.classList.add('visible');
    setDragX(lbPeekNext, stageWidth + delta);
  } else {
    lbPeekNext.classList.remove('visible');
  }
  if (dragDirection === -1) {
    lbPeekPrev.classList.add('visible');
    setDragX(lbPeekPrev, -stageWidth + delta);
  } else {
    lbPeekPrev.classList.remove('visible');
  }
}, { passive: true });

lightbox.addEventListener('touchend', () => {
  // after a pinch/multi-touch gesture, the browser may fire a synthetic
  // "click" afterwards — ignore it instead of letting it navigate
  suppressClickUntil = Date.now() + 500;
  if (isMultiTouch || !stageWidth) { hardResetDrag(); return; }

  const elapsed = performance.now() - touchStartTime;
  const velocity = dragDelta / Math.max(elapsed, 1); // px per ms
  const committed = dragDirection !== 0 && Math.abs(dragDelta) > COMMIT_MIN_DISTANCE &&
    (Math.abs(dragDelta) > stageWidth * COMMIT_RATIO || Math.abs(velocity) > COMMIT_VELOCITY);

  if (committed) completeSwipe(dragDirection);
  else cancelSwipe(dragDirection);
}, { passive: true });

function cancelSwipe(direction) {
  const peek = direction === 1 ? lbPeekNext : lbPeekPrev;
  lbImg.style.transition = 'transform 0.2s ease';
  peek.style.transition = 'transform 0.2s ease';
  setDragX(lbImg, 0);
  // slide the peek back to where it started (off-screen), not to center
  setDragX(peek, direction * stageWidth);
  dragDelta = 0;
  dragDirection = 0;
  scheduleSettle(() => peek.classList.remove('visible'), 200);
}

function completeSwipe(direction) {
  const peek = direction === 1 ? lbPeekNext : lbPeekPrev;
  lbImg.style.transition = 'transform 0.2s ease';
  peek.style.transition = 'transform 0.2s ease';
  setDragX(lbImg, -direction * stageWidth);
  setDragX(peek, 0);
  dragDelta = 0;
  dragDirection = 0;

  scheduleSettle(() => {
    currentIdx += direction;

    // promote the peek image into the main slot instantly, no jump
    lbImg.style.transition = 'none';
    lbImg.onload = lbImg.onerror = null;
    lbImg.src = peek.src;
    lbImg.style.maxWidth = peek.style.maxWidth;
    lbImg.style.maxHeight = peek.style.maxHeight;
    lbImg.classList.remove('slide-from-left', 'slide-from-right');
    lbImg.classList.add('visible');
    setDragX(lbImg, 0);

    peek.style.transition = 'none';
    peek.classList.remove('visible');
    setDragX(peek, 0);
    delete peek.dataset.idx;

    const item = IMAGES[currentIdx];
    lbImg.alt = item.alt;
    setLightboxMeta(item);
    refreshPeeks();

    // quietly upgrade from the (lighter) peek thumb to the full-res image
    const full = new Image();
    full.onload = () => { lbImg.src = item.src; };
    full.src = item.src;
  }, 200);
}

// ─────────────────────────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────────────────────────
const TITLE_COLORS = ['#FDC300', '#C73D1D', '#19519F', '#C75C7A', '#1C7436', '#14263E', '#C6B290', '#FA2500', '#556975'];

function randomColor() {
  return TITLE_COLORS[Math.floor(Math.random() * TITLE_COLORS.length)];
}

function reshuffleColors() {
  document.querySelectorAll('.g-caption-inner span').forEach(span => {
    if (span.textContent.trim()) span.style.color = randomColor();
  });
}

renderGallery();
setInterval(reshuffleColors, 800);

// Disable "Open/Save Image" right-click menu on the photos
document.addEventListener('contextmenu', (e) => {
  if (e.target.closest('#gallery img, #lb-img, .lb-peek')) e.preventDefault();
});

// ─────────────────────────────────────────────────────────────────────────────
// BACKGROUND PREFETCH
// Quietly warms the browser cache with full-size images one at a time during
// idle moments, so by the time a picture is clicked it likely opens instantly.
// ─────────────────────────────────────────────────────────────────────────────
function prefetchFullImages() {
  const conn = navigator.connection;
  if (conn && (conn.saveData || /2g/.test(conn.effectiveType || ''))) return;

  let i = 0;
  const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 200));

  function next() {
    if (i >= IMAGES.length) return;
    const img = new Image();
    if ('fetchPriority' in img) img.fetchPriority = 'low';
    img.decoding = 'async';
    img.onload = img.onerror = () => idle(next);
    img.src = IMAGES[i++].src;
  }
  idle(next);
}

window.addEventListener('load', prefetchFullImages);
