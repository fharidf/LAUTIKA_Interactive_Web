/* =========================================================
   LAUTIKA Interactive Web — main.js  v2
   PWA, responsive, accessible, mobile-first
   ========================================================= */

'use strict';

/* ── Register Service Worker (PWA) ── */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .catch(err => console.warn('SW registration failed:', err));
  });
}

/* ── Splash Screen ── */
(function hideSplash() {
  const splash = document.getElementById('splash');
  if (!splash) return;
  const bar = splash.querySelector('.splash-progress');
  let w = 0;
  const iv = setInterval(() => {
    w = Math.min(w + Math.random() * 18, 95);
    if (bar) bar.style.width = w + '%';
  }, 120);
  window.addEventListener('load', () => {
    clearInterval(iv);
    if (bar) bar.style.width = '100%';
    setTimeout(() => {
      splash.style.opacity = '0';
      splash.style.pointerEvents = 'none';
      setTimeout(() => splash.remove(), 600);
    }, 350);
  });
})();

/* ── Auto-hide 3D hint ── */
(function() {
  const hint = document.getElementById('viewer-hint');
  if (!hint) return;
  setTimeout(() => {
    hint.style.transition = 'opacity 0.8s';
    hint.style.opacity    = '0';
    setTimeout(() => hint.remove(), 900);
  }, 4000);
})();

/* ── Theme (Dark / Light) ── */
const html     = document.documentElement;
const btnDark  = document.getElementById('btn-darkmode');
const darkIcon = document.getElementById('darkmode-icon');

function setTheme(t) {
  html.setAttribute('data-theme', t);
  localStorage.setItem('lautika_theme', t);
  if (darkIcon) darkIcon.textContent = t === 'dark' ? '☀️' : '🌙';
}
setTheme(localStorage.getItem('lautika_theme') || 'dark');
if (btnDark) btnDark.addEventListener('click', () =>
  setTheme(html.dataset.theme === 'dark' ? 'light' : 'dark')
);

/* ── Full Screen ── */
const btnFS = document.getElementById('btn-fullscreen');
if (btnFS) btnFS.addEventListener('click', () => {
  if (!document.fullscreenElement)
    document.documentElement.requestFullscreen?.().catch(() => {});
  else document.exitFullscreen?.().catch(() => {});
});

/* ── Sidebar (hamburger menu) ── */
const btnMenu     = document.getElementById('btn-menu');
const sidebar     = document.getElementById('sidebar');
const overlay     = document.getElementById('sidebar-overlay');
const sidebarClose= document.getElementById('sidebar-close');

function openSidebar() {
  sidebar?.classList.add('open');
  overlay?.classList.add('show');
  btnMenu?.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
}
function closeSidebar() {
  sidebar?.classList.remove('open');
  overlay?.classList.remove('show');
  btnMenu?.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

btnMenu?.addEventListener('click', () =>
  sidebar?.classList.contains('open') ? closeSidebar() : openSidebar()
);
overlay?.addEventListener('click', closeSidebar);
sidebarClose?.addEventListener('click', closeSidebar);

/* Close sidebar on nav click (mobile) */
sidebar?.querySelectorAll('.sidebar__item').forEach(a =>
  a.addEventListener('click', () => {
    if (window.innerWidth < 768) closeSidebar();
  })
);

/* ── Scroll Progress Bar ── */
const scrollBar = document.getElementById('scroll-progress');
function updateScrollProgress() {
  if (!scrollBar) return;
  const scrollTop  = window.scrollY;
  const docHeight  = document.documentElement.scrollHeight - window.innerHeight;
  const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  scrollBar.style.width = pct + '%';
  scrollBar.setAttribute('aria-valuenow', Math.round(pct));
}
window.addEventListener('scroll', updateScrollProgress, { passive: true });

/* ── Back to Top ── */
const btnBackTop = document.getElementById('btn-backtop');
window.addEventListener('scroll', () => {
  if (!btnBackTop) return;
  btnBackTop.classList.toggle('show', window.scrollY > 350);
}, { passive: true });
btnBackTop?.addEventListener('click', () =>
  window.scrollTo({ top: 0, behavior: 'smooth' })
);

/* ── Loading overlay ── */
const loading = document.getElementById('loading');
window.addEventListener('load', () =>
  setTimeout(() => loading?.classList.remove('show'), 300)
);

/* ── Toast helper ── */
const toastEl = document.getElementById('toast');
function showToast(msg, type = 'info', duration = 3000) {
  if (!toastEl) return;
  toastEl.textContent = msg;
  toastEl.className   = `toast show toast-${type}`;
  clearTimeout(toastEl._timer);
  toastEl._timer = setTimeout(() => toastEl.classList.remove('show'), duration);
}
window.LAUTIKA = window.LAUTIKA || {};
window.LAUTIKA.showToast = showToast;

/* ── Tabs ── */
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const group  = btn.dataset.group;
    const target = btn.dataset.tab;
    document.querySelectorAll(`[data-group="${group}"].tab-btn`)
      .forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected','false'); });
    document.querySelectorAll(`[data-group="${group}"].tab-panel`)
      .forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    btn.setAttribute('aria-selected','true');
    const panel = document.getElementById(target);
    if (panel) {
      panel.classList.add('active');
      /* Trigger simulasi compute & KaTeX re-render */
      computeSimulasi();
      if (window.renderMathInElement)
        window.renderMathInElement(panel, {
          delimiters: [{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false}]
        });
    }
  });
});

/* ── Scroll-reveal animations ── */
(function initScrollReveal() {
  if (!('IntersectionObserver' in window)) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('reveal-show');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
})();

/* ── Progress Belajar ── */
const PROGRESS_KEY = 'lautika_progress_v2';
function getProgress() {
  try { return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {}; }
  catch { return {}; }
}
function setProgress(slug, val) {
  const p = getProgress(); p[slug] = Math.max(p[slug]||0, val);
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
}

const currentSlug = document.body.dataset.slug;
if (currentSlug) setProgress(currentSlug, 1);

/* ── Latihan Interaktif ── */
(function initLatihan() {
  const btn  = document.getElementById('btn-check');
  const inp  = document.getElementById('latihan-input');
  const fb   = document.getElementById('latihan-feedback');
  const pem  = document.getElementById('latihan-pembahasan');
  const cel  = document.getElementById('latihan-celebrate');
  if (!btn || !inp) return;

  const jawaban   = parseFloat(btn.dataset.jawaban);
  const toleransi = parseFloat(btn.dataset.toleransi || '0');
  let attempts = 0;

  function check() {
    const val = parseFloat(inp.value.replace(',', '.'));
    if (isNaN(val)) { showFb('Masukkan angka yang valid.', 'wrong'); return; }
    attempts++;
    if (Math.abs(val - jawaban) <= toleransi) {
      showFb('🎉 Benar! Jawaban kamu tepat!', 'correct');
      inp.classList.replace('wrong','correct');
      inp.classList.add('correct');
      if (pem) pem.style.display = 'none';
      if (cel) { cel.textContent = '🌟'; cel.classList.add('celebrate'); }
      if (currentSlug) setProgress(currentSlug, 2);
      showToast('Jawaban benar! 🌟', 'success');
    } else {
      const hint = attempts >= 2 ? ' Cek pembahasan di bawah!' : ' Periksa rumusmu ya.';
      showFb('Belum tepat. Coba lagi!' + hint, 'wrong');
      inp.classList.remove('correct'); inp.classList.add('wrong');
      if (attempts >= 2 && pem) pem.style.display = 'block';
    }
  }

  function showFb(msg, type) {
    if (!fb) return;
    fb.textContent = msg;
    fb.className   = `latihan-feedback show ${type}`;
  }

  btn.addEventListener('click', check);
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') check(); });
  inp.addEventListener('input', () => {
    inp.classList.remove('correct', 'wrong');
    if (fb) fb.classList.remove('show');
  });
})();

/* ── Quiz Interaktif ── */
(function initQuiz() {
  const form   = document.getElementById('quiz-form');
  const submit = document.getElementById('quiz-submit');
  const score  = document.getElementById('quiz-score');
  const retry  = document.getElementById('quiz-retry');
  if (!form) return;

  form.querySelectorAll('.quiz-opt').forEach(opt => {
    opt.addEventListener('click', () => {
      opt.closest('.quiz-question')
         .querySelectorAll('.quiz-opt')
         .forEach(o => { o.classList.remove('selected'); o.setAttribute('aria-pressed','false'); });
      opt.classList.add('selected');
      opt.setAttribute('aria-pressed','true');
    });
  });

  function gradeQuiz() {
    let benar = 0, total = 0;
    form.querySelectorAll('.quiz-question').forEach(q => {
      total++;
      const correct = parseInt(q.dataset.jawaban);
      const opts    = q.querySelectorAll('.quiz-opt');
      const sel     = q.querySelector('.quiz-opt.selected');
      opts[correct]?.classList.add('correct');
      if (sel) {
        const idx = [...opts].indexOf(sel);
        if (idx === correct) benar++;
        else sel.classList.add('wrong');
      }
      opts.forEach(o => { o.disabled = true; o.style.pointerEvents = 'none'; });
    });
    const pct  = Math.round(benar / total * 100);
    const icon = pct >= 80 ? '🌟' : pct >= 60 ? '👍' : '📚';
    const msg  = pct >= 80 ? 'Luar biasa! Kamu sangat memahami materi ini.'
               : pct >= 60 ? 'Bagus! Pelajari kembali soal yang salah.'
               : 'Semangat! Pelajari lagi materi ini ya.';
    if (score) {
      score.innerHTML = `
        <div class="score-num" style="color:${pct>=80?'var(--accent-teal)':pct>=60?'var(--accent-gold)':'var(--accent-orange)'}">
          ${pct}%
        </div>
        <div style="font-size:1rem;margin:6px 0">${benar} dari ${total} soal benar</div>
        <div style="font-size:.85rem;color:var(--text-muted)">${icon} ${msg}</div>`;
      score.style.display = 'block';
      score.classList.add('fade-in');
    }
    if (submit) submit.style.display = 'none';
    if (retry)  retry.style.display  = 'inline-flex';
    if (pct >= 80 && currentSlug) setProgress(currentSlug, 3);
    showToast(`${icon} Skor kamu: ${pct}%`, pct>=80?'success':'info');
  }

  submit?.addEventListener('click', gradeQuiz);
  retry?.addEventListener('click', () => location.reload());
})();

/* ── Simulasi Slider ── */
function initSimulasi() {
  const sliders = document.querySelectorAll('.sim-slider');
  if (!sliders.length) return;
  sliders.forEach(sl => {
    const valEl = document.getElementById(`val-${sl.id}`);
    const update = () => { if (valEl) valEl.textContent = sl.value; computeSimulasi(); };
    sl.addEventListener('input', update);
    update();
  });
}
initSimulasi();

function computeSimulasi() {
  const slug = document.body.dataset.slug;
  if (!slug) return;
  const g = id => { const el = document.getElementById(id); return el ? parseFloat(el.value) : null; };
  const PI = Math.PI;
  let res = {};

  if (slug === 'jolen') {
    const [p,l,t1,t2] = [g('p'),g('l'),g('t1'),g('t2')];
    if (p&&l&&t1&&t2) {
      const la = p*l;
      res = { V_balok:`${(p*l*t1).toLocaleString()} cm³`,
              V_limas:`${Math.round(la*t2/3).toLocaleString()} cm³`,
              V_total:`${Math.round(p*l*t1+la*t2/3).toLocaleString()} cm³`,
              Lp_balok:`${(2*(p*l+p*t1+l*t1)).toLocaleString()} cm²` };
    }
  } else if (slug === 'tumpeng') {
    const [r,t] = [g('r'),g('t')];
    if (r&&t) {
      const s = Math.sqrt(r*r+t*t);
      res = { s:`${s.toFixed(1)} cm`,
              V_kerucut:`${(PI*r*r*t/3).toFixed(1)} cm³`,
              L_kerucut:`${(PI*r*(r+s)).toFixed(1)} cm²` };
    }
  } else if (slug === 'perahu_nelayan') {
    const [dp,dl,kp,kl,kt] = [g('dek_p'),g('dek_l'),g('kab_p'),g('kab_l'),g('kab_t')];
    if (dp&&dl&&kp&&kl&&kt) {
      res = { L_dek:`${(dp*dl).toLocaleString()} cm²`,
              V_kabin:`${(kp*kl*kt).toLocaleString()} cm³` };
    }
  } else if (slug === 'layar_perahu') {
    const [a,t,s1,s2,s3] = [g('a'),g('t'),g('s1'),g('s2'),g('s3')];
    if (a&&t&&s1&&s2&&s3) {
      res = { L_segitiga:`${(0.5*a*t).toFixed(2)} m²`,
              K_segitiga:`${(s1+s2+s3).toFixed(2)} m` };
    }
  } else if (slug === 'jaring_nelayan') {
    const [b,k,tx,ty] = [g('baris'),g('kolom'),g('tx'),g('ty')];
    if (b&&k) {
      res = { N_pola:`${b*k} pola`,
              posisi_baru:`(${1+(tx||0)}, ${1+(ty||0)})` };
    }
  }

  Object.entries(res).forEach(([key, val]) => {
    const el = document.getElementById(`res-${key}`);
    if (el) { el.textContent = val; el.classList.add('highlight-pulse'); }
  });
}

/* ── Keyboard shortcuts ── */
document.addEventListener('keydown', e => {
  if (e.key === 'd' && e.ctrlKey) {
    e.preventDefault();
    setTheme(html.dataset.theme === 'dark' ? 'light' : 'dark');
  }
});
