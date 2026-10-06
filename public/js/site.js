/* GameWeb — comportamento do site: tema, menu, animações, teste de aparelho, catálogo, controle (gamepad). */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (n, a = 0, b = 100) => Math.min(b, Math.max(a, n));
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* modo privado */ } },
  };
  const GW = (window.GW = window.GW || {});

  /* ------------------------------------------------------------ tema */
  const theme = () => document.documentElement.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-theme-toggle]')) return;
    const next = theme() === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    store.set('gw-theme', next);
  });

  /* ------------------------------------------------------------ cabeçalho / menu */
  const header = $('[data-header]');
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', scrollY > 8);
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });
  }
  const root = document.documentElement;
  const navBtn = $('[data-nav-toggle]');
  const setNav = (open) => { root.classList.toggle('nav-open', open); navBtn?.setAttribute('aria-expanded', String(open)); navBtn?.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu'); };
  navBtn?.addEventListener('click', () => setNav(!root.classList.contains('nav-open')));
  $('#nav')?.addEventListener('click', (e) => { if (e.target.closest('a')) setNav(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setNav(false); });
  matchMedia('(min-width: 861px)').addEventListener('change', () => setNav(false));

  /* ------------------------------------------------------------ revelar ao rolar */
  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver((list) => list.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -6% 0px', threshold: 0.06 })
    : null;
  $$('.reveal').forEach((el) => (io ? io.observe(el) : el.classList.add('is-in')));

  /* ------------------------------------------------------------ brilho que segue o mouse, inclinação e botões magnéticos */
  if (fine && !reduce) {
    document.addEventListener('pointermove', (e) => {
      const c = e.target.closest && e.target.closest('.card');
      if (!c) return;
      const r = c.getBoundingClientRect();
      c.style.setProperty('--mx', e.clientX - r.left + 'px');
      c.style.setProperty('--my', e.clientY - r.top + 'px');
    }, { passive: true });
    $$('[data-tilt-root]').forEach((rootEl) => {
      const el = $('[data-tilt]', rootEl);
      if (!el) return;
      rootEl.addEventListener('pointermove', (e) => {
        const r = rootEl.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty('--ry', (x * 16).toFixed(2) + 'deg');
        el.style.setProperty('--rx', (-y * 12).toFixed(2) + 'deg');
      });
      rootEl.addEventListener('pointerleave', () => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
    });
    $$('[data-magnetic]').forEach((b) => {
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${((e.clientX - r.left - r.width / 2) * 0.16).toFixed(1)}px,${((e.clientY - r.top - r.height / 2) * 0.28).toFixed(1)}px)`;
      });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
  }

  /* ------------------------------------------------------------ galeria da página do jogo */
  $$('[data-gallery]').forEach((g) => {
    const main = $('#gallery-main', g);
    g.addEventListener('click', (e) => {
      const t = e.target.closest('.thumb');
      if (!t || !main) return;
      $$('.thumb', g).forEach((x) => x.classList.toggle('active', x === t));
      main.animate([{ opacity: 0.2, transform: 'scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: 300, easing: 'cubic-bezier(.22,1,.36,1)' });
      main.src = t.dataset.src;
    });
  });

  // capas pequenas (pixel art) usam "pixelated"; imagens grandes ficam suaves
  $$('img.pixel').forEach((img) => {
    const fix = () => { img.classList.toggle('pixel', img.naturalWidth > 0 && img.naturalWidth <= 400); };
    if (img.complete) fix();
    img.addEventListener('load', fix);
  });

  /* ------------------------------------------------------------ toasts */
  GW.toast = (msg, ms = 3800) => {
    const box = $('[data-toasts]');
    if (!box) return;
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    box.append(t);
    setTimeout(() => { t.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300 }).finished.then(() => t.remove()); }, ms);
  };

  /* ------------------------------------------------------------ teste do aparelho */
  const TIER_NAME = { 1: 'Básico', 2: 'Intermediário', 3: 'Bom', 4: 'Potente' };
  function gpuScore(renderer, gl2, ok) {
    if (!ok) return 0;
    const r = renderer || '';
    if (/swiftshader|llvmpipe|software|basic render|softpipe/i.test(r)) return 8;
    let s = gl2 ? 50 : 28;
    if (/RTX|GTX\s?1[0-9]{3}|GTX\s?16|RX\s?\d{3,4}|Radeon RX|Radeon Pro|Apple M\d|Apple GPU|Arc\b|Quadro|Titan|Adreno.*\b[78]\d\d\b|Immortalis|Mali-G7[1-9]|Mali-G[89]\d|Xclipse/i.test(r)) s = 90;
    else if (/Iris|UHD|Radeon.*Graphics|Vega|Adreno.*\b6\d\d\b|Mali-G[5-6]\d|Apple A1[2-9]|PowerVR|Intel/i.test(r)) s = 55;
    else if (/Mali-[T4]|Mali-G3\d|Adreno.*\b[2-5]\d\d\b|HD Graphics|GMA|Radeon HD|Vivante/i.test(r)) s = 24;
    return gl2 ? s : Math.min(s, 40);
  }
  /** Coleta rápida e síncrona (sem o benchmark de CPU, que roda em um Worker). */
  function collect() {
    const ua = navigator.userAgent || '';
    const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(ua));
    const cores = navigator.hardwareConcurrency || 2;
    const mem = navigator.deviceMemory || (mobile ? 3 : 6);
    let gl2 = false, glOk = false, renderer = '';
    try {
      const c = document.createElement('canvas');
      const g2 = c.getContext('webgl2');
      const g = g2 || c.getContext('webgl');
      gl2 = !!g2; glOk = !!g;
      if (g) {
        const ext = g.getExtension('WEBGL_debug_renderer_info');
        renderer = String(ext ? g.getParameter(ext.UNMASKED_RENDERER_WEBGL) : g.getParameter(g.RENDERER));
        const lose = g.getExtension('WEBGL_lose_context'); if (lose) lose.loseContext();
      }
    } catch { /* sem WebGL */ }
    const threadsCapable = 'crossOriginIsolated' in self && typeof WebAssembly === 'object';
    return { mobile, cores, mem, gl2, glOk, renderer, threadsCapable };
  }
  /** Nota final a partir da coleta e do tempo (ms) do microbenchmark de CPU (~40 ms em um PC moderno). */
  function scoreDevice({ mobile, cores, mem, gl2, glOk, renderer, threadsCapable }, ms) {
    const bench = clamp(100 - ((ms - 25) / (380 - 25)) * 100);
    const cpu = Math.round(0.6 * bench + 0.4 * clamp(((cores - 1) / 7) * 100));
    const memS = Math.round(clamp((mem / 8) * 100));
    const gpu = Math.round(gpuScore(renderer, gl2, glOk));
    const thr = Math.round(!threadsCapable ? 0 : cores >= 4 ? 100 : cores >= 2 ? 60 : 35);
    let score = cpu * 0.38 + gpu * 0.27 + memS * 0.2 + thr * 0.15;
    if (mobile) score *= 0.86;
    score = Math.round(clamp(score));
    const tier = score >= 74 ? 4 : score >= 54 ? 3 : score >= 31 ? 2 : 1;
    return { tier, score, cpu, mem: memS, gpu, thr, mobile, cores, gl2, threadsCapable, at: Date.now() };
  }
  /** Resultado do teste (do cache da sessão ou medido agora, com o benchmark em um Worker para não travar a página). */
  function loadDevice() {
    return new Promise((resolve) => {
      let cached = null;
      try { cached = JSON.parse(sessionStorage.getItem('gw-device') || 'null'); } catch { /* ignora */ }
      if (cached && Date.now() - cached.at < 6 * 3600e3) return resolve(cached);
      const base = collect();
      let finished = false;
      const done = (ms) => {
        if (finished) return;
        finished = true;
        const d = scoreDevice(base, ms);
        try { sessionStorage.setItem('gw-device', JSON.stringify(d)); } catch { /* ignora */ }
        let sent = false;
        try { sent = !!sessionStorage.getItem('gw-tier-sent'); sessionStorage.setItem('gw-tier-sent', '1'); } catch { /* ignora */ }
        if (!sent) { try { navigator.sendBeacon('/api/event', new Blob([JSON.stringify({ t: 'tier', tier: d.tier })], { type: 'application/json' })); } catch { /* ignora */ } }
        resolve(d);
      };
      try {
        const w = new Worker('/js/bench.js');
        const timer = setTimeout(() => { w.terminate(); done(160); }, 3000);
        w.onmessage = (e) => { clearTimeout(timer); w.terminate(); done(e.data.ms); };
        w.onerror = () => { clearTimeout(timer); done(160); };
      } catch { done(160); }
    });
  }
  const getDevice = () => GW.device || null;
  /** Nível de compatibilidade de um console (tier exigido) neste aparelho. */
  GW.compat = (tier, opts = {}) => {
    const d = getDevice();
    if (!d) return { level: 'unknown', text: 'Analisando o seu aparelho…' };
    let level = d.tier >= tier ? 'good' : d.tier === tier - 1 ? 'ok' : 'hard';
    if (opts.desktopOnly && d.mobile) level = 'hard';
    if (opts.threads && !d.threadsCapable) level = 'hard';
    return { level, text: level === 'good' ? 'Deve rodar bem no seu aparelho' : level === 'ok' ? 'Pode rodar com ajustes' : 'Provavelmente vai travar neste aparelho' };
  };
  GW.getDevice = getDevice;
  GW.tierName = (t) => TIER_NAME[t];

  function renderDevice() {
    const d = getDevice();
    const lvl = d.tier >= 3 ? 'good' : 'ok';
    $$('[data-device-pill]').forEach((p) => { p.hidden = false; p.dataset.level = lvl; $('[data-device-label]', p).textContent = `Seu aparelho: ${TIER_NAME[d.tier]}`; p.addEventListener('click', () => { location.href = '/#aparelho'; }); });
    $$('[data-compat]').forEach((el) => {
      const sys = el.dataset.systemId || el.closest('[data-system-id]')?.dataset.systemId || '';
      const c = GW.compat(+el.dataset.tier, { desktopOnly: sys === 'ps2', threads: sys === 'psp' || sys === 'ps2' });
      el.dataset.level = c.level;
      const t = $('[data-compat-text]', el); if (t) t.textContent = c.text;
    });
    const card = $('[data-device-card]');
    if (card) {
      const ring = $('[data-score-ring]', card);
      requestAnimationFrame(() => { ring.style.setProperty('--p', d.score); });
      $('[data-score-num]', card).textContent = d.score;
      $('[data-device-title]', card).textContent = `Seu aparelho: ${TIER_NAME[d.tier]}`;
      $('[data-device-sub]', card).textContent = ({
        1: 'Ótimo para Game Boy, NES, SNES, Mega Drive e outros consoles leves.',
        2: 'Roda os consoles leves e deve dar conta de PS1, N64 e Nintendo DS.',
        3: 'Roda a maioria dos consoles. O PSP deve funcionar com bons resultados.',
        4: 'Tudo deve rodar bem, até o PSP em resolução maior. O PS2 é experimental, mas é a sua melhor chance.',
      })[d.tier] + (d.mobile ? ' (celular detectado)' : '');
      const txt = (v) => (v >= 75 ? 'Excelente' : v >= 50 ? 'Bom' : v >= 25 ? 'Razoável' : 'Limitado');
      for (const [k, v, extra] of [['cpu', d.cpu, `${d.cores} núcleos`], ['mem', d.mem, ''], ['gpu', d.gpu, d.gl2 ? 'WebGL2' : 'WebGL'], ['thr', d.thr, '']]) {
        const bar = $(`[data-meter="${k}"]`, card), label = $(`[data-meter-text="${k}"]`, card);
        requestAnimationFrame(() => { bar.style.width = Math.max(4, v) + '%'; });
        label.textContent = txt(v);
        label.title = extra;
      }
      const recs = $('[data-device-recs]', card);
      let list = [];
      try { list = JSON.parse($('#systems-data')?.textContent || '[]'); } catch { /* sem dados */ }
      if (recs && list.length) {
        recs.replaceChildren(...list.map((s) => {
          const c = GW.compat(s.tier, { desktopOnly: s.id === 'ps2', threads: s.id === 'psp' || s.id === 'ps2' });
          const a = document.createElement('a');
          a.className = 'chip-btn'; a.href = `/consoles/${s.slug}`; a.dataset.level = c.level; a.title = c.text;
          a.innerHTML = '<span class="dot"></span>' + s.short;
          return a;
        }));
      }
    }
  }
  loadDevice().then((d) => {
    GW.device = d;
    try { renderDevice(); } catch (err) { console.warn('Teste de aparelho indisponível', err); }
    document.dispatchEvent(new CustomEvent('gw:device', { detail: d }));
  });

  /* ------------------------------------------------------------ controle (Gamepad API) */
  // referência original: o player pode "esconder" o controle do EmulatorJS temporariamente (ver player.js)
  const nativeGetPads = navigator.getGamepads ? navigator.getGamepads.bind(navigator) : null;
  const pads = () => (nativeGetPads ? [...nativeGetPads()].filter((p) => p && p.connected) : []);
  GW.pads = pads;
  const padName = (id) => (String(id).replace(/\(.*?\)/g, '').replace(/Vendor:.*$/i, '').trim() || 'Controle genérico').slice(0, 48);
  let rafId = 0;
  function padUI() {
    const p = pads()[0];
    $$('[data-gamepad-text]').forEach((t) => { t.textContent = p ? `Controle detectado: ${padName(p.id)}` : (t.closest('.gate-hint') ? 'Use o teclado ou aperte um botão do controle.' : 'Nenhum controle detectado. Aperte um botão do seu controle.'); });
    $$('[data-gamepad-status]').forEach((s) => s.classList.toggle('on', !!p));
    if (p && !rafId && $('[data-pad-demo]')) rafId = requestAnimationFrame(loop);
    document.dispatchEvent(new CustomEvent('gw:pads', { detail: { pad: p || null } }));
  }
  function loop() {
    const p = pads()[0];
    const demo = $('[data-pad-demo] .pad-svg');
    if (!p || !demo) { rafId = 0; return; }
    p.buttons.forEach((b, i) => { const el = $(`[data-btn="${i}"]`, demo); if (el) el.classList.toggle('on', b.pressed || b.value > 0.5); });
    const [lx = 0, ly = 0, rx = 0, ry = 0] = p.axes;
    const l = $('[data-stick=l] .stick-cap', demo), r = $('[data-stick=r] .stick-cap', demo);
    if (l) l.style.transform = `translate(${lx * 12}px,${ly * 12}px)`;
    if (r) r.style.transform = `translate(${rx * 12}px,${ry * 12}px)`;
    rafId = requestAnimationFrame(loop);
  }
  addEventListener('gamepadconnected', () => { GW.toast('Controle conectado!'); padUI(); });
  addEventListener('gamepaddisconnected', () => { rafId = 0; padUI(); });
  padUI();

  /* ------------------------------------------------------------ catálogo: busca e filtros instantâneos */
  const cat = $('[data-catalog]');
  if (cat) {
    const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
    const grid = $('[data-catalog-grid]', cat), cards = $$('.game-card', grid);
    const q = $('[data-catalog-q]', cat), gsel = $('[data-catalog-genre]', cat), sysIn = $('[data-catalog-system]', cat);
    const chips = $$('[data-catalog-chips] [data-sys]', cat), count = $('[data-catalog-count]', cat), empty = $('[data-catalog-empty]', cat);
    let system = sysIn.value;
    cards.forEach((c) => { c.dataset.textN = norm(c.dataset.text); });
    const apply = () => {
      const needle = norm(q.value), genre = norm(gsel.value);
      const first = new Map(cards.map((c) => [c, c.getBoundingClientRect()]));
      let shown = 0;
      for (const c of cards) {
        const ok = (!system || c.dataset.system === system) && (!genre || c.dataset.genres.split('|').map(norm).includes(genre)) && (!needle || c.dataset.textN.includes(needle));
        c.classList.toggle('is-hidden', !ok);
        if (ok) shown++;
      }
      if (!reduce) {
        for (const c of cards) {
          if (c.classList.contains('is-hidden')) continue;
          const a = first.get(c), b = c.getBoundingClientRect();
          const wasHidden = !a.width;
          const dx = a.left - b.left, dy = a.top - b.top;
          if (wasHidden) c.animate([{ opacity: 0, transform: 'scale(.92)' }, { opacity: 1, transform: 'none' }], { duration: 380, easing: 'cubic-bezier(.22,1,.36,1)' });
          else if (dx || dy) c.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: 'none' }], { duration: 460, easing: 'cubic-bezier(.22,1,.36,1)' });
        }
      }
      count.textContent = `${shown} ${shown === 1 ? 'jogo' : 'jogos'}`;
      empty.classList.toggle('show', shown === 0);
      chips.forEach((ch) => ch.classList.toggle('active', ch.dataset.sys === system));
      const p = new URLSearchParams();
      if (q.value) p.set('q', q.value);
      if (system) p.set('console', system);
      if (gsel.value) p.set('genero', gsel.value);
      const qs = p.toString();
      history.replaceState(null, '', location.pathname + (qs ? '?' + qs : ''));
    };
    q.addEventListener('input', apply);
    gsel.addEventListener('change', apply);
    $('[data-catalog-chips]', cat).addEventListener('click', (e) => {
      const ch = e.target.closest('[data-sys]');
      if (!ch) return;
      e.preventDefault();
      system = ch.dataset.sys; sysIn.value = system; apply();
    });
    $('[data-catalog-form]', cat).addEventListener('submit', (e) => { e.preventDefault(); apply(); });
    apply();
  }

  /* ------------------------------------------------------------ PWA */
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
  }
})();
