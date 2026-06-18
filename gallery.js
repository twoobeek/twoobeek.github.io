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

const lightbox  = document.getElementById('lightbox');
const lbImg     = document.getElementById('lb-img');
const lbPeek    = document.getElementById('lb-peek');
const lbStage   = lightbox.querySelector('.lb-stage');
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
  lbPeek.src = '';
  lbPeek.classList.remove('visible');
  delete lbPeek.dataset.idx;
  if (prevFocus && openedViaKeyboard) prevFocus.focus();
}

function setLightboxMeta(item) {
  renderLightboxTitle(item);
  lbDescription.textContent = item.description || '';
  lbCounter.textContent = `${currentIdx + 1} / ${IMAGES.length}`;
  lbBg.style.backgroundImage = `url(${item.src})`;
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
// picture peeking in from the side, and only commits to navigating once the
// drag clears a distance/velocity threshold (otherwise it springs back).
let isMultiTouch = false;
let suppressClickUntil = 0;
let touchStartX = 0;
let touchStartTime = 0;
let dragDelta = 0;
let dragDirection = 0; // -1 = prev, 1 = next, 0 = none
let stageWidth = 0;
let swipeSettleTimeout = null;

function setDragX(el, px) {
  el.style.setProperty('--drag-x', `${px}px`);
}

function hardResetDrag() {
  if (swipeSettleTimeout) { clearTimeout(swipeSettleTimeout); swipeSettleTimeout = null; }
  lbImg.style.transition = 'none';
  lbPeek.style.transition = 'none';
  setDragX(lbImg, 0);
  setDragX(lbPeek, 0);
  lbPeek.classList.remove('visible');
  lbImg.classList.add('visible');
  dragDelta = 0;
  dragDirection = 0;
}

lightbox.addEventListener('touchstart', (e) => {
  if (e.touches.length > 1) { isMultiTouch = true; return; }
  isMultiTouch = false;
  hardResetDrag();
  touchStartX = e.touches[0].clientX;
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

  let delta = e.touches[0].clientX - touchStartX;
  const dir = delta < 0 ? 1 : delta > 0 ? -1 : 0;
  const neighbor = dir !== 0 ? IMAGES[currentIdx + dir] : null;
  if (!neighbor) delta = 0;
  delta = Math.max(-stageWidth, Math.min(stageWidth, delta));

  dragDelta = delta;
  dragDirection = delta === 0 ? 0 : dir;
  setDragX(lbImg, delta);

  if (dragDirection !== 0) {
    if (lbPeek.dataset.idx !== String(currentIdx + dragDirection)) {
      lbPeek.dataset.idx = String(currentIdx + dragDirection);
      lbPeek.src = neighbor.thumb || neighbor.src;
      lbPeek.style.maxWidth = `min(100%, ${neighbor.width}px)`;
      lbPeek.style.maxHeight = `min(100%, ${neighbor.height}px)`;
    }
    lbPeek.classList.add('visible');
    setDragX(lbPeek, dragDirection * stageWidth + delta);
  } else {
    lbPeek.classList.remove('visible');
  }
}, { passive: true });

lightbox.addEventListener('touchend', () => {
  // after a pinch/multi-touch gesture, the browser may fire a synthetic
  // "click" afterwards — ignore it instead of letting it navigate
  suppressClickUntil = Date.now() + 500;
  if (isMultiTouch || !stageWidth) { hardResetDrag(); return; }

  const elapsed = performance.now() - touchStartTime;
  const velocity = dragDelta / Math.max(elapsed, 1); // px per ms
  const committed = dragDirection !== 0 &&
    (Math.abs(dragDelta) > stageWidth * 0.25 || Math.abs(velocity) > 0.5);

  if (committed) completeSwipe(dragDirection);
  else cancelSwipe();
}, { passive: true });

function cancelSwipe() {
  lbImg.style.transition = 'transform 0.2s ease';
  lbPeek.style.transition = 'transform 0.2s ease';
  setDragX(lbImg, 0);
  setDragX(lbPeek, 0);
  dragDelta = 0;
  dragDirection = 0;
  swipeSettleTimeout = setTimeout(() => lbPeek.classList.remove('visible'), 200);
}

function completeSwipe(direction) {
  lbImg.style.transition = 'transform 0.2s ease';
  lbPeek.style.transition = 'transform 0.2s ease';
  setDragX(lbImg, -direction * stageWidth);
  setDragX(lbPeek, 0);

  swipeSettleTimeout = setTimeout(() => {
    currentIdx += direction;

    // promote the peek image into the main slot instantly, no jump
    lbImg.style.transition = 'none';
    lbImg.onload = lbImg.onerror = null;
    lbImg.src = lbPeek.src;
    lbImg.style.maxWidth = lbPeek.style.maxWidth;
    lbImg.style.maxHeight = lbPeek.style.maxHeight;
    lbImg.classList.remove('slide-from-left', 'slide-from-right');
    lbImg.classList.add('visible');
    setDragX(lbImg, 0);

    lbPeek.style.transition = 'none';
    lbPeek.classList.remove('visible');
    setDragX(lbPeek, 0);
    delete lbPeek.dataset.idx;

    dragDelta = 0;
    dragDirection = 0;

    const item = IMAGES[currentIdx];
    lbImg.alt = item.alt;
    setLightboxMeta(item);

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
