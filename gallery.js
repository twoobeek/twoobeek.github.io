// ─────────────────────────────────────────────────────────────────────────────
// IMAGE DATA
// Each entry needs:
//   src        – path to the image (relative to index.html, or a full URL)
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
  { src: 'images/bad_dream.png',  width: 1391, height: 1833, title: 'Bad Dream',  alt: 'Bad Dream' },
  { src: 'images/i_m_cooked.png', width: 1379, height: 2273, title: "Man, I'm Cooked", shortTitle: "I'm Cooked", alt: "I'm Cooked" },
  { src: 'images/mindreader.png',        width: 2561, height: 1941, title: 'Mindreader',          alt: 'Mindreader' },
  { src: 'images/toa_tahu_mata_sam.png', width: 1667, height: 2120, title: 'Toa Tahu Mata Sam', alt: 'Toa Tahu Mata Sam' },
  { src: 'images/milky_way.png',         width: 1457, height: 610,  title: 'Milky Way', alt: 'Milky Way', description: "The global (international) version." },
  { src: "images/inoperable_brainfrog.png", width: 1197, height: 1545, title: "Inoperable Brainfrog", alt: "Inoperable Brainfrog" },
  { src: "images/wolfman.png", width: 945, height: 414, title: "Wolf Man", alt: "Wolf Man", rotateWords: { Man: -90 } },
  { src: "images/earth_angel.png", width: 1728, height: 1647, title: "Earth Angel Defeating Duck O'Devil", shortTitle: "Earth Angel", alt: "Earth Angel", description: "You may not be able to hear it, but in this picture, Halo the Living Nimbus is saying: \"Yeah, dude! Get that fucking bastard!\"" },
  { src: "images/leonardo.png", width: 641, height: 581, title: "Leonardo da Vinci", shortTitle: "Leonardo", alt: "Leonardo", description: "Self-portrait, 1998, Oil on oak panel, The State Hermitage Museum." },
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
    img.addEventListener('load', () => img.classList.add('visible'));
    img.src = item.src;

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
const lbCounter = lightbox.querySelector('.lb-counter');
const lbTitle   = document.getElementById('lb-title');
const lbDescription = document.getElementById('lb-description');
const lbBg      = document.getElementById('lb-bg');
const lbSpinner = lightbox.querySelector('.lb-spinner');
const lbClose   = lightbox.querySelector('.lb-close');
const lbPrev    = lightbox.querySelector('.lb-prev');
const lbNext    = lightbox.querySelector('.lb-next');

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
  if (prevFocus && openedViaKeyboard) prevFocus.focus();
}

function loadLightboxImage() {
  const item = IMAGES[currentIdx];

  lbImg.classList.remove('visible');
  lbSpinner.classList.remove('hidden');

  lbImg.onload = () => {
    lbSpinner.classList.add('hidden');
    lbImg.classList.add('visible');
  };
  lbImg.onerror = () => {
    lbSpinner.classList.add('hidden');
  };

  lbImg.alt = item.alt;
  lbImg.src = item.src;

  lbBg.style.backgroundImage = `url(${item.src})`;
  renderLightboxTitle(item);
  lbDescription.textContent = item.description || '';
  lbCounter.textContent = `${currentIdx + 1} / ${IMAGES.length}`;
  lbPrev.disabled = currentIdx === 0;
  lbNext.disabled = currentIdx === IMAGES.length - 1;
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
    loadLightboxImage();
  }
}

// Lightbox event listeners
lbClose.addEventListener('click', closeLightbox);
lbPrev.addEventListener('click', () => navigate(-1));
lbNext.addEventListener('click', () => navigate(1));

lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox();
});

document.addEventListener('keydown', (e) => {
  if (!lightbox.classList.contains('open')) return;
  if (e.key === 'Escape')     closeLightbox();
  if (e.key === 'ArrowLeft')  navigate(-1);
  if (e.key === 'ArrowRight') navigate(1);
});

// Touch swipe support
let touchX = 0;
lightbox.addEventListener('touchstart', (e) => {
  touchX = e.touches[0].clientX;
}, { passive: true });
lightbox.addEventListener('touchend', (e) => {
  const delta = e.changedTouches[0].clientX - touchX;
  if (Math.abs(delta) > 50) navigate(delta < 0 ? 1 : -1);
}, { passive: true });

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
