
// === image pipeline helpers (auto-generated) ===
function amiSrcs(base) {
  const file = base.split('/').pop();
  const name = file.replace(/\.[^.]+$/, '');
  return {
    thumbWebp: `photos/thumb/${name}.webp`,
    thumbJpg:  `photos/thumb/${name}.jpg`,
    fullWebp:  `photos/full/${name}.webp`,
    fullJpg:   `photos/full/${name}.jpg`
  };
}
function amiPictureEl(base, alt, classes) {
  const s = amiSrcs(base);
  const pic = document.createElement('picture');
  if (classes) pic.className = classes;
  const s2 = document.createElement('source');
  s2.type = 'image/webp';
  s2.srcset = s.thumbWebp;
  const img = document.createElement('img');
  img.loading = 'lazy';
  img.decoding = 'async';
  img.src = s.thumbJpg;
  img.alt = alt || '';
  pic.appendChild(s2);
  pic.appendChild(img);
  return pic;
}


// === merged: theme handling with system preference ===
const THEME_KEY = 'theme';
const META_THEME = document.querySelector('#meta-theme-color');

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  if (META_THEME) META_THEME.setAttribute('content', theme === 'dark' ? '#1b1d21' : '#ffffff');
}
function detectSystemTheme() {
  return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
}
let __savedTheme = localStorage.getItem(THEME_KEY);
if (!__savedTheme) {
  __savedTheme = detectSystemTheme();
  localStorage.setItem(THEME_KEY, __savedTheme);
}
applyTheme(__savedTheme);

const PAGE_SIZE = 25;
const PHOTOS_MANIFEST = 'photos/photos.json';

const LANGS = ['ru','uk','en','de','fr'];
const LANG_FLAGS = { ru:'🇷🇺', uk:'🇺🇦', en:'🇬🇧', de:'🇩🇪', fr:'🇫🇷' };

let photos = [];
let page = 1;
let currentIndex = 0;
let STR = {};
let PHOTO_TITLES = {};
let LANG = 'de'; // default German

const qs = (s, r = document) => r.querySelector(s);

/* Theme */
function initTheme() {
  let theme = localStorage.getItem('theme');
  if (!theme) {
    const h = new Date().getHours();
    theme = (h >= 20 || h < 8) ? 'dark' : 'light';
  }
  setTheme(theme);
  qs('#themeToggle').addEventListener('click', () => {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    setTheme(isLight ? 'dark' : 'light');
  });
}
function setTheme(mode) {
  document.documentElement.setAttribute('data-theme', mode);
  localStorage.setItem('theme', mode);
  const sun = qs('#iconSun'), moon = qs('#iconMoon');
  if (sun && moon) {
    sun.style.display = (mode === 'light') ? 'block' : 'none';
    moon.style.display = (mode === 'dark') ? 'block' : 'none';
  }
  const btn = qs('#themeToggle');
  if (btn && STR.ui) {
    btn.setAttribute('aria-label', mode === 'light' ? (STR.ui.theme_light?.[LANG] || 'Light theme')
                                                   : (STR.ui.theme_dark?.[LANG]  || 'Dark theme'));
  }
}

/* Language */
async function initLang() {
  try { STR = await (await fetch('i18n/strings.json', {cache:'no-store'})).json(); } catch(e) { STR = {}; }
  try { PHOTO_TITLES = await (await fetch('i18n/photos.json', {cache:'no-store'})).json(); } catch(e) { PHOTO_TITLES = {}; }

  const saved = localStorage.getItem('lang');
  if (saved && LANGS.includes(saved)) LANG = saved;

  applyLang();

  const btn = qs('#langToggle');
  btn.addEventListener('click', () => {
    const i = LANGS.indexOf(LANG);
    LANG = LANGS[(i+1) % LANGS.length];
    localStorage.setItem('lang', LANG);
    applyLang();
    render();
    if (!qs('#lightbox').hidden) updateLightboxCaption();
  });
}
function applyLang() {
  document.documentElement.lang = LANG;
  qs('#langFlag').textContent = LANG_FLAGS[LANG] || '🏳️';
  const title = STR.title?.[LANG] || 'Kristina amigurumi';
  const subtitle = STR.subtitle?.[LANG] || 'crocheted toys — handmade';
  qs('#siteTitle').textContent = title;
  qs('#siteSubtitle').textContent = subtitle;
  document.title = title + ' — Галерея';
  const y = new Date().getFullYear();
  const l1 = STR.footer_line1?.[LANG]; if (l1) qs('#footerL1').textContent = l1;
  const l2 = STR.footer_line2?.[LANG]; if (l2) qs('#footerL2').innerHTML = l2.replace('{year}', y);
}

/* Photos */
async function loadPhotos() {
  const res = await fetch(PHOTOS_MANIFEST, { cache: 'no-store' });
  if (!res.ok) throw new Error('Не удалось загрузить список фото');
  const files = await res.json();
  files.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }) * -1);
  photos = files.map(fn => ({ src: `photos/${fn}`, key: fn.replace(/\.[a-z0-9]+$/i, '') }));
}
function currentTitleFor(key) {
  return (PHOTO_TITLES[key] && PHOTO_TITLES[key][LANG]) ? PHOTO_TITLES[key][LANG] : key;
}

/* Render */
function render() {
  const p = getPageFromUrl();
  const totalPages = Math.max(1, Math.ceil(photos.length / PAGE_SIZE));
  page = Math.min(Math.max(1, p), totalPages);
  setUrlPage(page);

  const start = (page - 1) * PAGE_SIZE;
  const chunk = photos.slice(start, start + PAGE_SIZE);

  const wrap = qs('#gallery');
  wrap.innerHTML = '';
  chunk.forEach((photo, i) => {
    const globalIndex = start + i;
    const card = document.createElement('article');
    card.className = 'card';

    const imgWrap = document.createElement('a');
    imgWrap.href = photo.src;
    imgWrap.className = 'card__imgwrap';
    imgWrap.addEventListener('click', (e) => { e.preventDefault(); openLightbox(globalIndex); });

    const img = document.createElement('img');
    img.loading = 'lazy'; img.decoding = 'async';
    img.src = photo.src; img.alt = currentTitleFor(photo.key);
    imgWrap.appendChild(img);

    const caption = document.createElement('div');
    caption.className = 'card__caption';
    caption.textContent = currentTitleFor(photo.key);

    card.append(imgWrap, caption);
    wrap.appendChild(card);
  });

  const pag = qs('#pagination');
  pag.innerHTML = ''; pag.hidden = totalPages <= 1;
  if (totalPages > 1) {
    const makeBtn = (text, pNum, current = false, disabled = false) => {
      const btn = document.createElement('button');
      btn.className = 'page-btn';
      btn.textContent = text;
      if (current) btn.setAttribute('aria-current', 'page');
      if (disabled) btn.disabled = true;
      btn.addEventListener('click', () => { setUrlPage(pNum); render(); });
      return btn;
    };
    pag.append(makeBtn('‹', Math.max(1, page - 1), false, page === 1));
    const range = []; const push = (n) => { if (!range.includes(n) && n >= 1 && n <= totalPages) range.push(n); };
    [1, 2, page - 1, page, page + 1, totalPages - 1, totalPages].forEach(push);
    range.sort((a, b) => a - b);
    let last = 0;
    for (const n of range) {
      if (last && n - last > 1) {
        const dots = document.createElement('span');
        dots.className = 'page-btn'; dots.ariaHidden = 'true'; dots.textContent = '…';
        pag.append(dots);
      }
      pag.append(makeBtn(String(n), n, n === page));
      last = n;
    }
    pag.append(makeBtn('›', Math.min(totalPages, page + 1), false, page === totalPages));
  }
}

/* URL helpers */
function getPageFromUrl() {
  const p = new URLSearchParams(location.search).get('page');
  const n = parseInt(p, 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}
function setUrlPage(p) {
  const url = new URL(location.href);
  if (p === 1) url.searchParams.delete('page'); else url.searchParams.set('page', p);
  history.replaceState({}, '', url);
}

/* Lightbox */
function openLightbox(index) {
  currentIndex = index;
  const lb = qs('#lightbox');
  const img = qs('#lightboxImg');
  img.src = photos[index].src;
  img.alt = currentTitleFor(photos[index].key);
  updateLightboxCaption();
  lb.hidden = false;
  const onKey = (e) => {
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  };
  document.addEventListener('keydown', onKey);
  lb._onKey = onKey;
}
function updateLightboxCaption() {
  const cap = qs('#lightboxCaption');
  if (cap && photos[currentIndex]) cap.textContent = currentTitleFor(photos[currentIndex].key);
}
function closeLightbox() {
  const lb = qs('#lightbox');
  lb.hidden = true;
  if (lb._onKey) { document.removeEventListener('keydown', lb._onKey); delete lb._onKey; }
}
function step(dir) {
  currentIndex = (currentIndex + dir + photos.length) % photos.length;
  const img = qs('#lightboxImg');
  img.src = photos[currentIndex].src;
  img.alt = currentTitleFor(photos[currentIndex].key);
  updateLightboxCaption();
}

/* Start */
document.addEventListener('DOMContentLoaded', async () => {
  qs('#year').textContent = new Date().getFullYear();
  await initLang();
  initTheme();
  try { await loadPhotos(); render(); }
  catch (e) { qs('#gallery').innerHTML = `<p role="alert">Ошибка загрузки галереи: ${e.message}</p>`; }
});

// Lightbox controls binding fallback
if (document.readyState !== 'loading') {
  // Wire up lightbox controls (close / prev / next / backdrop)
  const btnClose = qs('#lightboxClose');
  const btnPrev  = qs('#lightboxPrev');
  const btnNext  = qs('#lightboxNext');
  const lb       = qs('#lightbox');
  if (btnClose && !btnClose._bound) { btnClose.addEventListener('click', closeLightbox); btnClose._bound = true; }
  if (btnPrev  && !btnPrev._bound)  { btnPrev.addEventListener('click', () => step(-1)); btnPrev._bound = true; }
  if (btnNext  && !btnNext._bound)  { btnNext.addEventListener('click', () => step(1));  btnNext._bound = true; }
  if (lb && !lb._backdropBound) {
    lb.addEventListener('click', (e) => { if (e.target === lb) closeLightbox(); });
    lb._backdropBound = true;
  }
} else {document.addEventListener('DOMContentLoaded',()=>{
  // Wire up lightbox controls (close / prev / next / backdrop)
  const btnClose = qs('#lightboxClose');
  const btnPrev  = qs('#lightboxPrev');
  const btnNext  = qs('#lightboxNext');
  const lb       = qs('#lightbox');
  if (btnClose && !btnClose._bound) { btnClose.addEventListener('click', closeLightbox); btnClose._bound = true; }
  if (btnPrev  && !btnPrev._bound)  { btnPrev.addEventListener('click', () => step(-1)); btnPrev._bound = true; }
  if (btnNext  && !btnNext._bound)  { btnNext.addEventListener('click', () => step(1));  btnNext._bound = true; }
  if (lb && !lb._backdropBound) {
    lb.addEventListener('click', (e) => { if (e.target === lb) closeLightbox(); });
    lb._backdropBound = true;
  }
});}
// === Lightbox controls: Esc / Arrows / Backdrop click / Swipes ===
(() => {
  const lb = document.getElementById('lightbox');
  if (!lb) return;

  const btnClose = document.getElementById('lightboxClose');
  const btnPrev  = document.getElementById('lightboxPrev');
  const btnNext  = document.getElementById('lightboxNext');

  const isOpen = () => lb && !lb.hasAttribute('hidden');

  const closeLB = () => btnClose?.click();
  const prevImg = () => btnPrev?.click();
  const nextImg = () => btnNext?.click();

  // 1) Клавиатура: Esc / ← / →
  window.addEventListener('keydown', (e) => {
    if (!isOpen()) return;
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        closeLB();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        prevImg();
        break;
      case 'ArrowRight':
        e.preventDefault();
        nextImg();
        break;
    }
  });

  // 2) Клик по фону закрывает (но не по фрейму/кнопкам)
  lb.addEventListener('click', (e) => {
    // Закрываем только если кликнули по самому бэкдропу
    if (e.target === lb) {
      closeLB();
    }
  });

  // 3) Свайпы на мобильных
  let touchX = 0, touchY = 0, t0 = 0;
  const THRESH_X = 40;   // порог по X (px)
  const THRESH_Y = 60;   // ограничение по вертикали, чтобы не путать со скроллом
  const TIME_MAX = 800;  // макс. длительность свайпа (мс)

  lb.addEventListener('touchstart', (e) => {
    if (!isOpen()) return;
    const t = e.changedTouches[0];
    touchX = t.clientX;
    touchY = t.clientY;
    t0 = Date.now();
  }, { passive: true });

  lb.addEventListener('touchend', (e) => {
    if (!isOpen()) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchX;
    const dy = t.clientY - touchY;
    const dt = Date.now() - t0;

    // горизонтальный быстрый свайп
    if (dt <= TIME_MAX && Math.abs(dx) >= THRESH_X && Math.abs(dy) <= THRESH_Y) {
      if (dx > 0) {
        // свайп вправо — предыдущая картинка
        prevImg();
      } else {
        // свайп влево — следующая
        nextImg();
      }
    }
  }, { passive: true });

  // (необяз.) Блокируем «резиновые» скроллы внутри, пока открыт лайтбокс
  lb.addEventListener('touchmove', (e) => {
    if (!isOpen()) return;
    // если явный горизонтальный жест — позволяем, вертикальные подавляем (чуть меньше дрожи)
    const t = e.changedTouches[0];
    const ax = Math.abs(t.clientX - touchX);
    const ay = Math.abs(t.clientY - touchY);
    if (ay > ax && ay > 8) e.preventDefault();
  }, { passive: false });
})();
// === Lightbox: focus-trap + scroll lock ===
(() => {
  const lb = document.getElementById('lightbox');
  if (!lb) return;

  const btnClose = document.getElementById('lightboxClose');
  const btnPrev  = document.getElementById('lightboxPrev');
  const btnNext  = document.getElementById('lightboxNext');
  const body = document.body;

  let prevFocus = null;
  let touchMoveBlocker = null;

  const isOpen = () => !lb.hasAttribute('hidden');

  // Фокусируем первый доступный элемент (close), запоминаем прошлый фокус
  const onOpen = () => {
    prevFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    // Блокируем скролл фона
    body.style.overflow = 'hidden';

    // iOS/мобильные: глобально блокируем touchmove, чтобы фон не прокручивался
    touchMoveBlocker = (e) => {
      // Разрешаем жест внутри лайтбокса; всё остальное — блокируем
      if (!lb.contains(e.target)) e.preventDefault();
    };
    document.addEventListener('touchmove', touchMoveBlocker, { passive: false });

    // Ставим фокус на кнопку закрытия
    queueMicrotask(() => btnClose?.focus());
  };

  const onClose = () => {
    // Возвращаем скролл
    body.style.overflow = '';
    if (touchMoveBlocker) {
      document.removeEventListener('touchmove', touchMoveBlocker);
      touchMoveBlocker = null;
    }
    // Возвращаем фокус туда, где был
    if (prevFocus && document.contains(prevFocus)) {
      prevFocus.focus();
    }
  };

  // Трап фокуса: Tab/Shift+Tab циклятся внутри лайтбокса
  const getFocusables = () => {
    return lb.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
  };

  const onKeydown = (e) => {
    if (!isOpen()) return;

    if (e.key === 'Tab') {
      const nodes = Array.from(getFocusables());
      if (!nodes.length) return;

      const first = nodes[0];
      const last  = nodes[nodes.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first || !lb.contains(document.activeElement)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last || !lb.contains(document.activeElement)) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    // Дублируем на всякий случай Enter/Space для стрелок (опционально)
    if ((e.key === 'Enter' || e.key === ' ') && document.activeElement === btnPrev) {
      e.preventDefault(); btnPrev.click();
    }
    if ((e.key === 'Enter' || e.key === ' ') && document.activeElement === btnNext) {
      e.preventDefault(); btnNext.click();
    }
  };

  window.addEventListener('keydown', onKeydown);

  // Следим, когда лайтбокс открывают/закрывают (по атрибуту hidden)
  const observer = new MutationObserver(() => {
    if (isOpen()) onOpen(); else onClose();
  });
  observer.observe(lb, { attributes: true, attributeFilter: ['hidden'] });

  // На случай, если лайтбокс уже открыт при загрузке
  if (isOpen()) onOpen();

  // Подстраховка: если закрывают по кнопке — тоже onClose
  btnClose?.addEventListener('click', () => { if (!isOpen()) onClose(); });
})();


// === merged: a11y labels & guards ===
window.addEventListener('DOMContentLoaded', () => {
  // Pagination buttons (try several selectors)
  const STR = window.STRINGS || {};
  const lang = (window.LANG || (navigator.language||'en').slice(0,2)).toLowerCase();
  const tr = (k, fb) => (STR[k] && (STR[k][lang] || STR[k][lang.slice(0,2)])) || fb || k;

  document.querySelectorAll('[data-pagination="prev"], .pagination .prev, button.prev').forEach(btn => {
    if (!btn.getAttribute('aria-label')) btn.setAttribute('aria-label', tr('prevPage','Предыдущая страница'));
  });
  document.querySelectorAll('[data-pagination="next"], .pagination .next, button.next').forEach(btn => {
    if (!btn.getAttribute('aria-label')) btn.setAttribute('aria-label', tr('nextPage','Следующая страница'));
  });

  const lb = document.querySelector('.lightbox, [role="dialog"].lightbox, .lb');
  if (lb) {
    const closeBtn = lb.querySelector('.close, [data-action="close"]');
    const prevBtn  = lb.querySelector('.prev, [data-action="prev"]');
    const nextBtn  = lb.querySelector('.next, [data-action="next"]');
    if (closeBtn && !closeBtn.getAttribute('aria-label')) closeBtn.setAttribute('aria-label', tr('close','Закрыть'));
    if (prevBtn  && !prevBtn.getAttribute('aria-label'))  prevBtn.setAttribute('aria-label',  tr('prev','Предыдущее'));
    if (nextBtn  && !nextBtn.getAttribute('aria-label'))  nextBtn.setAttribute('aria-label',  tr('next','Следующее'));
  }

  // Prevent double swipe-binding if you use bindSwipe()
  const frame = document.querySelector('.lightbox-frame, .lb-frame');
  if (frame && window.bindSwipe && !frame._swipeBound) {
    try { window.bindSwipe(frame, ()=>{}, ()=>{}); frame._swipeBound = true; } catch(_) {}
  }
});
