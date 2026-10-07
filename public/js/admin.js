/* GameWeb — painel administrativo (SPA em JavaScript puro, sem dependências). */
(() => {
  'use strict';
  const app = document.getElementById('app');
  const state = { user: null, csrf: '', systems: null };
  const nf = new Intl.NumberFormat('pt-BR');

  /* ------------------------------------------------------------ utilidades de DOM */
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (k === 'value') el.value = v;
      else if (['checked', 'disabled', 'selected', 'hidden', 'required', 'multiple', 'autofocus'].includes(k)) el[k] = !!v;
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat(Infinity)) {
      if (kid == null || kid === false) continue;
      el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    }
    return el;
  }
  const ICONS = {
    dash: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
    game: '<path d="M6 12h4M8 10v4M15 13h.01M18 11h.01"/><path d="M17.3 5H6.7a4 4 0 0 0-4 3.6C2.6 9.4 2 14.5 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.4-1.4a2 2 0 0 1 1.4-.6h4.4a2 2 0 0 1 1.4.6L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.5-.6-6.6-.7-7.4A4 4 0 0 0 17.3 5z"/>',
    monitor: '<rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8M12 17v4"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>',
    trash: '<path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6"/>',
    ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    eyeoff: '<path d="M17.9 17.9A10.9 10.9 0 0 1 12 20c-7 0-11-8-11-8a18.5 18.5 0 0 1 5.1-5.9M9.9 4.2A9.1 9.1 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.2 3.2M14.1 14.1a3 3 0 1 1-4.2-4.2M1 1l22 22"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>', menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>', check: '<path d="m5 12 5 5 9-10"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    up: '<path d="m18 15-6-6-6 6"/>', down: '<path d="m6 9 6 6 6-6"/>', key: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.7 12.3 9.8-9.8M16 7l3 3"/>',
  };
  const ico = (name) => { const s = h('span', { class: 'ico', 'aria-hidden': 'true' }); s.innerHTML = `<svg viewBox="0 0 24 24">${ICONS[name] || ''}</svg>`; return s; };
  const debounce = (fn, ms = 250) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  const fmtDate = (iso) => (iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—');
  const fmtBytes = (n) => (!n ? '—' : n > 1073741824 ? (n / 1073741824).toFixed(2) + ' GB' : n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB');
  const slugify = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);

  function toast(msg, kind = 'ok') {
    let box = document.querySelector('.toasts');
    if (!box) { box = h('div', { class: 'toasts', 'aria-live': 'polite' }); document.body.append(box); }
    const t = h('div', { class: `toast ${kind}`, role: kind === 'bad' ? 'alert' : 'status' }, msg);
    box.append(t);
    setTimeout(() => t.remove(), kind === 'bad' ? 7000 : 3800);
  }

  function dialog(build) {
    return new Promise((resolve) => {
      const d = h('dialog');
      build(d, (val) => { d.close(); d.remove(); resolve(val); });
      document.body.append(d);
      d.addEventListener('cancel', () => { d.remove(); resolve(null); });
      d.showModal();
    });
  }
  const confirmBox = ({ title, text, ok = 'Confirmar', danger = false }) => dialog((d, close) => {
    d.append(h('h2', {}, title), h('p', { class: 'muted' }, text),
      h('div', { class: 'row' }, h('button', { class: 'btn', type: 'button', onclick: () => close(false) }, 'Cancelar'),
        h('button', { class: `btn ${danger ? 'danger solid' : 'primary'}`, type: 'button', onclick: () => close(true) }, ok)));
  });
  const secretBox = ({ title, text, secret }) => dialog((d, close) => {
    d.append(h('h2', {}, title), h('p', { class: 'muted' }, text), h('div', { class: 'pwbox' }, h('span', { class: 'grow' }, secret)),
      h('p', { class: 'hint', style: 'margin-top:10px' }, 'Esta senha aparece uma única vez. A pessoa deverá trocá-la no primeiro acesso.'),
      h('div', { class: 'row' },
        h('button', { class: 'btn', type: 'button', onclick: async () => { try { await navigator.clipboard.writeText(secret); toast('Senha copiada.'); } catch { toast('Copie manualmente.', 'bad'); } } }, ico('copy'), 'Copiar'),
        h('button', { class: 'btn primary', type: 'button', onclick: () => close(true) }, 'Fechar')));
  });

  /* ------------------------------------------------------------ API */
  async function api(method, url, body) {
    const opts = { method, headers: {}, credentials: 'same-origin' };
    if (state.csrf) opts.headers['x-csrf-token'] = state.csrf;
    if (body !== undefined) { opts.headers['content-type'] = 'application/json'; opts.body = JSON.stringify(body); }
    const res = await fetch('/api/admin' + url, opts);
    let data = null;
    try { data = await res.json(); } catch { /* sem corpo */ }
    if (!res.ok) {
      if (res.status === 401 && state.user) { state.user = null; renderLogin('Sua sessão expirou. Entre novamente.'); }
      if (res.status === 403 && data?.code === 'password_change_required') renderChangePassword(true);
      const err = new Error(data?.error || `Erro ${res.status}`);
      err.status = res.status; err.data = data;
      throw err;
    }
    return data;
  }
  function upload(path, file, onProgress) {
    return new Promise((resolve, reject) => {
      const fd = new FormData();
      fd.append('file', file);
      const x = new XMLHttpRequest();
      x.open('POST', '/api/admin' + path);
      x.setRequestHeader('x-csrf-token', state.csrf);
      x.upload.onprogress = (e) => { if (e.lengthComputable) onProgress?.(e.loaded / e.total); };
      x.onload = () => {
        let d = {}; try { d = JSON.parse(x.responseText); } catch { /* ignora */ }
        x.status >= 200 && x.status < 300 ? resolve(d) : reject(new Error(d.error || `Falha no envio (${x.status})`));
      };
      x.onerror = () => reject(new Error('Falha de rede durante o envio.'));
      x.send(fd);
    });
  }
  const getSystems = async () => (state.systems ??= await api('GET', '/systems'));

  /* ------------------------------------------------------------ tema */
  const savedTheme = (() => { try { return localStorage.getItem('gw-admin-theme'); } catch { return null; } })();
  if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);
  function toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('gw-admin-theme', next); } catch { /* ignora */ }
  }

  /* ------------------------------------------------------------ componentes de formulário */
  const field = (label, control, { hint, errKey, id } = {}) => h('div', { class: 'field' },
    label && h('label', { for: id }, label), control, hint && h('div', { class: 'hint' }, hint), h('div', { class: 'err', dataset: { err: errKey || '' } }));
  const input = (attrs) => h('input', { class: 'input', ...attrs });

  function chipsInput(values, onChange, placeholder) {
    const wrap = h('div', { class: 'chipsin' });
    const inp = h('input', { placeholder, 'aria-label': placeholder });
    const render = () => { wrap.replaceChildren(...values.map((v, i) => h('span', { class: 'chipx' }, v, h('button', { type: 'button', 'aria-label': `Remover ${v}`, onclick: () => { values.splice(i, 1); render(); onChange(values); } }, '×'))), inp); };
    const add = () => { const v = inp.value.replace(/,/g, '').trim(); if (v && !values.includes(v)) { values.push(v); onChange(values); } inp.value = ''; render(); };
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); }
      else if (e.key === 'Backspace' && !inp.value && values.length) { values.pop(); render(); onChange(values); }
    });
    inp.addEventListener('blur', add);
    render();
    return wrap;
  }

  /* ------------------------------------------------------------ login e troca de senha */
  function renderLogin(message = '') {
    document.title = 'Entrar · Painel GameWeb';
    const user = input({ id: 'u', name: 'username', autocomplete: 'username', autocapitalize: 'none', spellcheck: 'false', autofocus: true, required: true });
    const pass = input({ id: 'p', name: 'password', type: 'password', autocomplete: 'current-password', required: true });
    const err = h('p', { class: 'err', role: 'alert', style: 'margin-bottom:10px' }, message);
    const btn = h('button', { class: 'btn primary full', type: 'submit' }, 'Entrar');
    const eye = h('button', { class: 'btn ghost icon toggle', type: 'button', 'aria-label': 'Mostrar senha', onclick: () => { const show = pass.type === 'password'; pass.type = show ? 'text' : 'password'; eye.replaceChildren(ico(show ? 'eyeoff' : 'eye')); } }, ico('eye'));
    const form = h('form', { class: 'login-card', novalidate: true, onsubmit: async (e) => {
      e.preventDefault();
      err.textContent = '';
      if (!user.value.trim() || !pass.value) { err.textContent = 'Informe usuário e senha.'; return; }
      btn.disabled = true; btn.textContent = 'Entrando…';
      try {
        const r = await api('POST', '/login', { username: user.value.trim(), password: pass.value });
        state.user = r.user; state.csrf = r.csrf;
        afterAuth();
      } catch (ex) { err.textContent = ex.message; pass.value = ''; pass.focus(); }
      btn.disabled = false; btn.textContent = 'Entrar';
    } },
    h('div', { class: 'brand' }, h('img', { src: '/img/logo.svg', alt: '' }), 'GameWeb'),
    h('h1', {}, 'Painel administrativo'), h('p', { class: 'muted' }, 'Entre com o seu usuário e senha.'), err,
    field('Usuário', user, { id: 'u' }), field('Senha', h('div', { class: 'pw' }, pass, eye), { id: 'p' }), btn,
    h('p', { class: 'hint', style: 'margin-top:14px' }, 'Acesso restrito. Tentativas de login são registradas e limitadas.'));
    app.className = '';
    app.replaceChildren(h('div', { class: 'login' }, form));
  }

  function strength(pw) {
    let s = 0;
    if (pw.length >= 10) s++;
    if (pw.length >= 14) s++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
    if (/\d/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return Math.min(4, s);
  }
  function passwordForm({ forced, onDone }) {
    const cur = input({ type: 'password', autocomplete: 'current-password', id: 'pw0' });
    const nw = input({ type: 'password', autocomplete: 'new-password', id: 'pw1' });
    const cf = input({ type: 'password', autocomplete: 'new-password', id: 'pw2' });
    const bar = h('i'); const meter = h('div', { class: 'strength' }, bar);
    const err = h('p', { class: 'err', role: 'alert' });
    nw.addEventListener('input', () => { const s = strength(nw.value); bar.style.width = s * 25 + '%'; bar.style.background = ['var(--bad)', 'var(--bad)', 'var(--warn)', 'var(--ok)', 'var(--ok)'][s]; });
    const btn = h('button', { class: 'btn primary', type: 'submit' }, forced ? 'Salvar nova senha e continuar' : 'Alterar senha');
    const form = h('form', { novalidate: true, onsubmit: async (e) => {
      e.preventDefault(); err.textContent = '';
      if (nw.value !== cf.value) { err.textContent = 'A confirmação não confere com a nova senha.'; return; }
      btn.disabled = true;
      try {
        const r = await api('POST', '/password', { current: cur.value, next: nw.value });
        state.user = r.user; toast('Senha alterada com sucesso.'); onDone();
      } catch (ex) { err.textContent = ex.message; }
      btn.disabled = false;
    } },
    field('Senha atual', cur, { id: 'pw0' }), field('Nova senha', nw, { id: 'pw1', hint: 'Mínimo de 10 caracteres, com 3 tipos entre minúsculas, maiúsculas, números e símbolos.' }), meter,
    h('div', { style: 'height:12px' }), field('Confirmar nova senha', cf, { id: 'pw2' }), err, btn);
    return form;
  }
  function renderChangePassword(forced) {
    document.title = 'Trocar senha · Painel GameWeb';
    app.className = '';
    app.replaceChildren(h('div', { class: 'login' }, h('div', { class: 'login-card' },
      h('div', { class: 'brand' }, h('img', { src: '/img/logo.svg', alt: '' }), 'GameWeb'),
      h('h1', {}, 'Defina uma nova senha'),
      h('p', { class: 'muted' }, 'Por segurança, troque a senha inicial antes de continuar. Use a senha do arquivo CREDENCIAIS-INICIAIS-ADMIN.txt como "senha atual".'),
      passwordForm({ forced, onDone: afterAuth }),
      h('p', { style: 'margin-top:14px' }, h('button', { class: 'btn ghost sm', type: 'button', onclick: logout }, 'Sair')))));
  }

  async function logout() {
    try { await api('POST', '/logout'); } catch { /* ignora */ }
    state.user = null; state.csrf = '';
    renderLogin();
  }

  /* ------------------------------------------------------------ casca do painel */
  const NAV = [['#/dashboard', 'dash', 'Visão geral'], ['#/games', 'game', 'Jogos'], ['#/systems', 'monitor', 'Consoles'], ['#/settings', 'settings', 'Site e SEO'], ['#/users', 'users', 'Usuários e conta'], ['#/audit', 'list', 'Atividade']];
  function renderShell() {
    const shell = h('div', { class: 'shell', id: 'shell' });
    const closeMenu = () => shell.classList.remove('menu-open');
    const side = h('aside', { class: 'side' },
      h('a', { class: 'brand', href: '#/dashboard' }, h('img', { src: '/img/logo.svg', alt: '' }), 'GameWeb'),
      h('nav', { class: 'nav', 'aria-label': 'Principal', onclick: closeMenu }, NAV.map(([href, icon, label]) => h('a', { href, dataset: { route: href } }, ico(icon), label))),
      h('div', { class: 'foot' },
        h('a', { class: 'btn sm', href: '/', target: '_blank', rel: 'noopener' }, ico('ext'), 'Ver o site'),
        h('div', { class: 'who' }, h('span', { class: 'av' }, state.user.username.slice(0, 1).toUpperCase()), h('div', {}, h('div', {}, state.user.username), h('div', { class: 'hint' }, state.user.role === 'admin' ? 'Administrador' : state.user.role))),
        h('div', { class: 'row' },
          h('button', { class: 'btn sm', type: 'button', onclick: toggleTheme, 'aria-label': 'Alternar tema' }, ico('sun'), ico('moon')),
          h('button', { class: 'btn sm', type: 'button', onclick: logout }, ico('logout'), 'Sair'))));
    const topbar = h('div', { class: 'topbar' }, h('button', { class: 'btn icon', type: 'button', 'aria-label': 'Abrir menu', onclick: () => shell.classList.add('menu-open') }, ico('menu')), h('strong', {}, 'GameWeb · Painel'));
    shell.append(side, h('div', { class: 'scrim', onclick: closeMenu }), h('div', { class: 'content' }, topbar, h('main', { class: 'main', id: 'view', tabindex: '-1' })));
    app.className = '';
    app.replaceChildren(shell);
  }

  const view = () => document.getElementById('view');
  const pageHead = (title, sub, ...actions) => h('div', { class: 'page-head' }, h('div', {}, h('h1', {}, title), sub && h('p', {}, sub)), h('div', { class: 'row' }, actions));

  async function route() {
    if (!state.user) return;
    const hash = location.hash || '#/dashboard';
    const routes = [
      [/^#\/dashboard$/, viewDashboard], [/^#\/games$/, viewGames], [/^#\/games\/new$/, () => viewGameForm(null)], [/^#\/games\/([\w-]+)$/, (m) => viewGameForm(m[1])],
      [/^#\/systems$/, viewSystems], [/^#\/settings$/, viewSettings], [/^#\/users$/, viewUsers], [/^#\/audit$/, viewAudit],
    ];
    document.querySelectorAll('.nav a').forEach((a) => a.classList.toggle('active', hash.startsWith(a.dataset.route)));
    for (const [re, fn] of routes) {
      const m = hash.match(re);
      if (m) {
        const v = view();
        v.replaceChildren(h('p', { class: 'muted' }, 'Carregando…'));
        try { await fn(m); } catch (ex) { if (view() === v) v.replaceChildren(h('div', { class: 'notice bad' }, ex.message)); }
        window.scrollTo(0, 0);
        return;
      }
    }
    location.hash = '#/dashboard';
  }
  addEventListener('hashchange', route);

  /* ------------------------------------------------------------ visão geral */
  function barChart(series) {
    const W = 720, H = 220, pad = { l: 34, r: 8, t: 10, b: 28 };
    const max = Math.max(5, ...series.flatMap((d) => [d.views, d.plays]));
    const step = (W - pad.l - pad.r) / series.length;
    const bw = Math.min(14, step / 2.6);
    const y = (v) => pad.t + (H - pad.t - pad.b) * (1 - v / max);
    let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Visitas e jogos iniciados nos últimos 14 dias">`;
    for (let i = 0; i <= 4; i++) { const v = Math.round((max / 4) * i); s += `<line x1="${pad.l}" x2="${W - pad.r}" y1="${y(v)}" y2="${y(v)}"/><text x="${pad.l - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text>`; }
    series.forEach((d, i) => {
      const x = pad.l + step * i + step / 2;
      s += `<rect class="bar-v" x="${x - bw - 1}" y="${y(d.views)}" width="${bw}" height="${H - pad.b - y(d.views)}" rx="3"><title>${d.day}: ${d.views} visitas</title></rect>`;
      s += `<rect class="bar-p" x="${x + 1}" y="${y(d.plays)}" width="${bw}" height="${H - pad.b - y(d.plays)}" rx="3"><title>${d.day}: ${d.plays} jogos iniciados</title></rect>`;
      if (i % 2 === 0 || series.length < 8) s += `<text x="${x}" y="${H - 8}" text-anchor="middle">${d.day.slice(8, 10)}/${d.day.slice(5, 7)}</text>`;
    });
    const el = h('div'); el.innerHTML = s + '</svg>';
    return el;
  }
  const hbars = (rows, empty) => (rows.length ? h('div', { class: 'hbars' }, rows.map(([label, value, max]) => h('div', { class: 'hbar' }, h('span', {}, label), h('div', { class: 't' }, h('i', { style: `width:${Math.max(4, (value / max) * 100)}%` })), h('b', { class: 'right' }, nf.format(value))))) : h('p', { class: 'muted' }, empty));

  async function viewDashboard() {
    const [d, games, systems] = await Promise.all([api('GET', '/dashboard'), api('GET', '/games'), getSystems()]);
    document.title = 'Visão geral · Painel GameWeb';
    const unverified = games.filter((g) => g.status === 'published' && g.license?.redistribution === 'unverified');
    const tierNames = { 1: 'Básico', 2: 'Intermediário', 3: 'Bom', 4: 'Potente' };
    const tierMax = Math.max(1, ...Object.values(d.tiers));
    const sysName = Object.fromEntries(systems.map((s) => [s.id, s.short]));
    const sysRows = Object.entries(d.systems).sort((a, b) => b[1] - a[1]).slice(0, 6);
    view().replaceChildren(
      pageHead('Visão geral', 'Resumo do site nos últimos dias (contadores agregados, sem dados pessoais).', h('a', { class: 'btn primary', href: '#/games/new' }, ico('plus'), 'Novo jogo')),
      unverified.length ? h('div', { class: 'notice warn' }, ico('key'), h('div', {}, h('strong', {}, `${unverified.length} jogo(s) publicado(s) sem licença de redistribuição verificada: `), unverified.map((g) => g.title).join(', '), '. ',
        'Confirme a licença com o autor ou despublique antes de colocar o site na internet.')) : null,
      h('div', { class: 'stats' },
        [['Jogos publicados', d.totals.published, `${d.totals.drafts} rascunho(s)`], ['Visitas (7 dias)', d.last7.views, `${nf.format(d.today.views)} hoje`],
          ['Jogos iniciados (7 dias)', d.last7.plays, `${nf.format(d.today.plays)} hoje`], ['Visitas (30 dias)', d.last30.views, `${nf.format(d.last30.plays)} jogos iniciados`]]
          .map(([k, v, s]) => h('div', { class: 'stat' }, h('div', { class: 'k' }, k), h('div', { class: 'v' }, nf.format(v)), h('div', { class: 's' }, s)))),
      h('div', { class: 'card' }, h('h2', {}, 'Últimos 14 dias'),
        h('div', { class: 'legend' }, h('span', {}, h('i', { style: 'background:var(--brand)' }), 'Visitas'), h('span', {}, h('i', { style: 'background:var(--brand2)' }), 'Jogos iniciados')), barChart(d.series)),
      h('div', { class: 'cols' },
        h('div', { class: 'card' }, h('h2', {}, 'Jogos mais acessados (30 dias)'),
          d.top.length ? h('div', { class: 'table-wrap' }, h('table', {}, h('thead', {}, h('tr', {}, h('th', {}, 'Jogo'), h('th', { class: 'right' }, 'Visitas'), h('th', { class: 'right' }, 'Partidas'))),
            h('tbody', {}, d.top.map((t) => h('tr', {}, h('td', {}, t.title), h('td', { class: 'right' }, nf.format(t.views)), h('td', { class: 'right' }, nf.format(t.plays))))))) : h('p', { class: 'muted' }, 'Ainda sem dados. Eles aparecem conforme o site recebe visitas.')),
        h('div', { class: 'card' }, h('h2', {}, 'Aparelhos dos visitantes (30 dias)'),
          hbars([1, 2, 3, 4].filter((t) => d.tiers[t]).map((t) => [tierNames[t], d.tiers[t], tierMax]), 'Sem dados ainda.'),
          h('h2', { style: 'margin:20px 0 12px' }, 'Consoles mais jogados'),
          hbars(sysRows.map(([id, n]) => [sysName[id] || id, n, sysRows[0][1]]), 'Sem partidas registradas ainda.'))),
      h('div', { class: 'card' }, h('h2', {}, 'SEO e visibilidade em IA'),
        h('p', { class: 'muted' }, 'Arquivos gerados automaticamente a partir dos seus jogos e configurações:'),
        h('div', { class: 'row' }, ['/sitemap.xml', '/robots.txt', '/llms.txt', '/llms-full.txt', '/feed.xml'].map((u) => h('a', { class: 'btn sm', href: u, target: '_blank', rel: 'noopener' }, ico('ext'), u)))),
    );
  }

  /* ------------------------------------------------------------ jogos: lista */
  async function viewGames() {
    const [games, systems] = await Promise.all([api('GET', '/games'), getSystems()]);
    document.title = 'Jogos · Painel GameWeb';
    const q = input({ type: 'search', placeholder: 'Buscar jogo…', 'aria-label': 'Buscar jogo', class: 'input grow' });
    const st = h('select', { class: 'input', 'aria-label': 'Status' }, h('option', { value: '' }, 'Todos os status'), h('option', { value: 'published' }, 'Publicados'), h('option', { value: 'draft' }, 'Rascunhos'));
    const sy = h('select', { class: 'input', 'aria-label': 'Console' }, h('option', { value: '' }, 'Todos os consoles'), systems.map((s) => h('option', { value: s.id }, s.short)));
    const body = h('tbody');
    const render = () => {
      const needle = q.value.toLowerCase();
      const rows = games.filter((g) => (!st.value || g.status === st.value) && (!sy.value || g.system === sy.value) && (!needle || (g.title + g.slug + g.developer).toLowerCase().includes(needle)));
      body.replaceChildren(...rows.map((g) => h('tr', {},
        h('td', {}, h('div', { class: 'thumb' }, g.cover ? h('img', { src: g.cover, alt: '', loading: 'lazy' }) : ico('game'))),
        h('td', {}, h('a', { href: `#/games/${g.id}` }, h('strong', {}, g.title)), h('div', { class: 'hint' }, `/jogos/${g.slug}`)),
        h('td', {}, g.systemShort),
        h('td', {}, h('span', { class: `badge ${g.status === 'published' ? 'ok' : ''}` }, g.status === 'published' ? 'Publicado' : 'Rascunho'), ' ',
          g.featured ? h('span', { class: 'badge' }, 'Destaque') : null, ' ',
          g.license?.redistribution === 'unverified' ? h('span', { class: 'badge warn', title: 'Sem licença de redistribuição verificada' }, 'Licença?') : null),
        h('td', { class: 'nowrap muted' }, fmtDate(g.updatedAt)),
        h('td', {}, h('div', { class: 'actions' },
          g.status === 'published' ? h('a', { class: 'btn sm icon', href: `/jogos/${g.slug}`, target: '_blank', rel: 'noopener', 'aria-label': `Ver ${g.title} no site`, title: 'Ver no site' }, ico('eye')) : null,
          h('a', { class: 'btn sm icon', href: `#/games/${g.id}`, 'aria-label': `Editar ${g.title}`, title: 'Editar' }, ico('edit')),
          h('button', { class: 'btn sm icon danger', type: 'button', 'aria-label': `Excluir ${g.title}`, title: 'Excluir', onclick: async () => {
            if (!(await confirmBox({ title: 'Excluir jogo?', text: `“${g.title}” será removido do catálogo, junto com os arquivos enviados por você. Isso não pode ser desfeito.`, ok: 'Excluir', danger: true }))) return;
            try { await api('DELETE', `/games/${g.id}`); games.splice(games.indexOf(g), 1); render(); toast('Jogo excluído.'); } catch (ex) { toast(ex.message, 'bad'); }
          } }, ico('trash')))))));
      if (!rows.length) body.replaceChildren(h('tr', {}, h('td', { colspan: 6 }, h('div', { class: 'empty' }, 'Nenhum jogo encontrado.'))));
    };
    [q, st, sy].forEach((el) => el.addEventListener('input', render));
    view().replaceChildren(
      pageHead('Jogos', `${games.length} no total`, h('a', { class: 'btn primary', href: '#/games/new' }, ico('plus'), 'Novo jogo')),
      h('div', { class: 'toolbar' }, q, st, sy),
      h('div', { class: 'card', style: 'padding:6px 14px' }, h('div', { class: 'table-wrap' }, h('table', {}, h('thead', {}, h('tr', {}, ['', 'Jogo', 'Console', 'Status', 'Atualizado', ''].map((t) => h('th', {}, t)))), body))));
    render();
  }

  /* ------------------------------------------------------------ jogos: formulário */
  const blankGame = () => ({ title: '', slug: '', system: 'gba', status: 'draft', featured: false, tagline: '', description: '', genres: [], tags: [], year: '', developer: '', publisher: '', players: '', controls: [],
    cover: '', screenshots: [], rom: { kind: 'file', url: '', size: 0, sha256: '' }, license: { name: '', url: '', redistribution: 'unverified' }, rightsConfirmed: false, source: { name: '', url: '' }, seo: { title: '', description: '' } });

  async function viewGameForm(id) {
    const systems = await getSystems();
    const isNew = !id;
    const g = isNew ? blankGame() : await api('GET', `/games/${id}`);
    g.year = g.year ?? '';
    let slugAuto = isNew;
    document.title = (isNew ? 'Novo jogo' : g.title) + ' · Painel GameWeb';
    const romExts = ['.iso', '.cso', '.pbp', '.elf', '.bin', '.cue', '.gb', '.gbc', '.gba', '.nes', '.sfc', '.smc', '.md', '.gen', '.smd', '.sms', '.gg', '.pce', '.a26', '.z64', '.n64', '.v64', '.nds', '.chd', '.zip', '.7z'].join(',');

    const title = input({ id: 'title', value: g.title, maxlength: 80, oninput: () => { g.title = title.value; if (slugAuto) { slug.value = slugify(title.value); g.slug = slug.value; } serp(); } });
    const slug = input({ id: 'slug', value: g.slug, maxlength: 80, oninput: () => { slugAuto = false; g.slug = slugify(slug.value); serp(); } });
    const system = h('select', { class: 'input', id: 'system', onchange: () => { g.system = system.value; } }, systems.map((s) => h('option', { value: s.id, selected: s.id === g.system }, `${s.short} — ${s.name}`)));
    const status = h('div', { class: 'seg', role: 'radiogroup', 'aria-label': 'Status' }, [['draft', 'Rascunho'], ['published', 'Publicado']].map(([v, l]) => h('label', {}, h('input', { type: 'radio', name: 'status', value: v, checked: g.status === v, onchange: () => { g.status = v; } }), h('span', {}, l))));
    const featured = h('label', { class: 'switch' }, h('input', { type: 'checkbox', checked: g.featured, onchange: (e) => { g.featured = e.target.checked; } }), h('span'));
    g.controls ??= [];
    const controlsTa = h('textarea', { class: 'input', id: 'controls', placeholder: 'Mover = Setas ou W A S D\nChutar = Espaço', style: 'min-height:96px', oninput: () => {
      g.controls = controlsTa.value.split('\n').map((l) => l.split('=')).filter((p) => p.length >= 2).map(([a, ...b]) => [a.trim(), b.join('=').trim()]).filter(([a, b]) => a && b);
    } });
    controlsTa.value = g.controls.map(([a, b]) => `${a} = ${b}`).join('\n');
    const tagline = input({ id: 'tagline', value: g.tagline, maxlength: 120, placeholder: 'Uma frase curta e chamativa', oninput: () => { g.tagline = tagline.value; serp(); } });
    const desc = h('textarea', { class: 'input', id: 'description', maxlength: 4000, style: 'min-height:170px', oninput: () => { g.description = desc.value; serp(); } });
    desc.value = g.description;

    // mídia
    const coverImg = h('div', { class: 'cover-box' });
    const paintCover = () => coverImg.replaceChildren(g.cover ? h('img', { src: g.cover, alt: 'Capa' }) : h('span', {}, 'Sem capa'));
    paintCover();
    const coverFile = h('input', { type: 'file', accept: 'image/png,image/jpeg,image/webp,image/avif,image/gif', hidden: true, onchange: async () => {
      const f = coverFile.files[0]; if (!f) return;
      try { const r = await upload('/upload/image', f); g.cover = r.url; paintCover(); toast('Capa enviada.'); } catch (ex) { toast(ex.message, 'bad'); }
      coverFile.value = '';
    } });
    const shots = h('div', { class: 'shots' });
    const paintShots = () => shots.replaceChildren(...g.screenshots.map((u, i) => h('div', { class: 'shot' }, h('img', { src: u, alt: `Captura ${i + 1}` }), h('button', { type: 'button', 'aria-label': 'Remover captura', onclick: () => { g.screenshots.splice(i, 1); paintShots(); } }, '×'))));
    paintShots();
    const shotFile = h('input', { type: 'file', accept: 'image/*', multiple: true, hidden: true, onchange: async () => {
      for (const f of shotFile.files) { if (g.screenshots.length >= 8) break; try { g.screenshots.push((await upload('/upload/image', f)).url); paintShots(); } catch (ex) { toast(ex.message, 'bad'); } }
      shotFile.value = '';
    } });

    // arquivo do jogo
    const romInfo = h('div', { class: 'hint' });
    const progress = h('div', { class: 'progress', hidden: true }, h('i'));
    const paintRom = () => { romInfo.textContent = g.rom.url ? `${g.rom.url}${g.rom.size ? ' · ' + fmtBytes(g.rom.size) : ''}${g.rom.sha256 ? ' · SHA-256 ' + g.rom.sha256.slice(0, 12) + '…' : ''}` : 'Nenhum arquivo selecionado.'; };
    paintRom();
    const romFile = h('input', { type: 'file', accept: romExts, hidden: true, onchange: async () => {
      const f = romFile.files[0]; if (!f) return;
      progress.hidden = false;
      try {
        const r = await upload('/upload/rom', f, (p) => { progress.firstChild.style.width = Math.round(p * 100) + '%'; });
        Object.assign(g.rom, { kind: 'file', url: r.url, size: r.size, sha256: r.sha256 }); paintRom(); toast('Arquivo enviado.');
      } catch (ex) { toast(ex.message, 'bad'); }
      progress.hidden = true; progress.firstChild.style.width = '0'; romFile.value = '';
    } });
    // arquivos da pasta local de jogos (ROMS_DIR, ex.: pasta do Google Drive)
    const libBox = h('div', { class: 'lib' });
    const openLibrary = async () => {
      libBox.replaceChildren(h('p', { class: 'muted' }, 'Lendo a pasta…'));
      let data;
      try { data = await api('GET', '/library'); } catch (ex) { libBox.replaceChildren(); toast(ex.message, 'bad'); return; }
      if (!data.configured) { libBox.replaceChildren(h('p', { class: 'muted' }, 'Pasta de jogos não configurada. Defina ROMS_DIR no arquivo .env (ex.: ROMS_DIR=G:\Meu Drive\Jogos) e reinicie o servidor.')); return; }
      if (!data.reachable) { libBox.replaceChildren(h('p', { class: 'muted' }, 'Não consegui abrir a pasta configurada em ROMS_DIR. Confira o caminho e se o Google Drive está aberto.')); return; }
      const list = h('div', { class: 'lib-list', role: 'listbox', 'aria-label': 'Arquivos da pasta de jogos' });
      const q = input({ placeholder: 'Filtrar por nome…', 'aria-label': 'Filtrar arquivos', oninput: () => paint() });
      const paint = () => {
        const needle = q.value.toLowerCase().trim();
        const rows = data.files.filter((f) => !needle || f.path.toLowerCase().includes(needle)).slice(0, 80);
        list.replaceChildren(...(rows.length ? rows.map((f) => h('button', { class: 'btn lib-item', type: 'button', role: 'option', onclick: () => {
          Object.assign(g.rom, { kind: 'file', url: f.url, size: f.size, sha256: '' }); romPath.value = f.url; paintRom(); libBox.replaceChildren(); toast('Arquivo selecionado.');
        } }, h('span', {}, f.path), h('small', {}, fmtBytes(f.size)))) : [h('p', { class: 'muted' }, 'Nenhum arquivo de jogo encontrado.')]));
      };
      libBox.replaceChildren(h('p', { class: 'hint' }, `${data.files.length} arquivo(s) em "${data.dir}"${data.truncated ? ' (lista cortada)' : ''}.`), q, list);
      paint();
    };
    const romPath = input({ id: 'romurl', placeholder: '/roms/arquivo.gba, /library/… ou https://…', value: g.rom.url, oninput: () => { g.rom.url = romPath.value.trim(); g.rom.size = 0; g.rom.sha256 = ''; paintRom(); } });
    const romBox = h('div');
    const kindSeg = h('div', { class: 'seg', role: 'radiogroup', 'aria-label': 'Tipo de arquivo' }, [['file', 'ROM / ISO'], ['web', 'Jogo web (HTML5)'], ['none', 'Nenhum']].map(([v, l]) => h('label', {}, h('input', {
      type: 'radio', name: 'kind', value: v, checked: g.rom.kind === v,
      onchange: () => {
        g.rom.kind = v;
        if (v === 'web') { g.system = 'web'; system.value = 'web'; } else if (g.system === 'web') { g.system = 'gba'; system.value = 'gba'; }
        paintKind();
      },
    }), h('span', {}, l))));
    const paintKind = () => {
      if (g.rom.kind === 'file') romBox.replaceChildren(h('div', { class: 'row' }, h('button', { class: 'btn', type: 'button', onclick: () => romFile.click() }, ico('upload'), 'Enviar arquivo'), h('button', { class: 'btn', type: 'button', onclick: openLibrary }, 'Escolher da pasta de jogos'), romFile), libBox, progress, romInfo,
        field('Ou informe um caminho já existente no servidor', romPath, { hint: 'Ex.: /roms/jogo.gba (pasta public/roms). Arquivos enviados ficam em /uploads/roms.', errKey: 'rom' }));
      else if (g.rom.kind === 'web') romBox.replaceChildren(field('URL do jogo web', romPath, { hint: 'Caminho local iniciando em /web/ ou um endereço https:// (será aberto em um iframe com sandbox).', errKey: 'rom' }));
      else romBox.replaceChildren(h('p', { class: 'muted' }, 'Sem arquivo, o jogo só pode ficar como rascunho.'));
    };
    paintKind();

    // licença
    const licName = input({ id: 'licname', value: g.license.name, maxlength: 80, placeholder: 'Ex.: MIT, GPL-3.0, CC BY 4.0, Freeware', oninput: () => { g.license.name = licName.value; } });
    const licUrl = input({ id: 'licurl', value: g.license.url, placeholder: 'https://…', oninput: () => { g.license.url = licUrl.value.trim(); } });
    const redist = h('select', { class: 'input', id: 'redist', onchange: () => { g.license.redistribution = redist.value; } },
      [['verified', 'Licença aberta verificada (MIT, GPL, CC, domínio público…)'], ['owner', 'Sou o autor / tenho os direitos'], ['unverified', 'Gratuito, mas sem licença de redistribuição explícita']].map(([v, l]) => h('option', { value: v, selected: g.license.redistribution === v }, l)));
    const srcName = input({ id: 'srcname', value: g.source.name, maxlength: 60, placeholder: 'Ex.: Homebrew Hub, itch.io, GitHub', oninput: () => { g.source.name = srcName.value; } });
    const srcUrl = input({ id: 'srcurl', value: g.source.url, placeholder: 'https://…', oninput: () => { g.source.url = srcUrl.value.trim(); } });
    const rights = h('input', { type: 'checkbox', id: 'rights', checked: g.rightsConfirmed, onchange: () => { g.rightsConfirmed = rights.checked; } });

    // SEO
    const seoT = input({ id: 'seot', value: g.seo.title, maxlength: 70, placeholder: 'Deixe vazio para gerar automaticamente', oninput: () => { g.seo.title = seoT.value; serp(); } });
    const seoD = h('textarea', { class: 'input', id: 'seod', maxlength: 170, style: 'min-height:80px', placeholder: 'Deixe vazio para gerar automaticamente', oninput: () => { g.seo.description = seoD.value; serp(); } });
    seoD.value = g.seo.description;
    const serpBox = h('div', { class: 'serp', 'aria-label': 'Prévia no Google' });
    const cT = h('span', { class: 'count' }), cD = h('span', { class: 'count' });
    function serp() {
      const sysShort = systems.find((s) => s.id === g.system)?.short || '';
      const t = g.seo.title || `${g.title || 'Título do jogo'} — jogar online no navegador (${sysShort})`;
      const d = g.seo.description || `Jogue ${g.title || 'este jogo'} grátis no navegador, no PC ou no celular, com teclado ou controle. ${g.tagline || ''}`;
      serpBox.replaceChildren(h('div', { class: 'u' }, `${location.host} › jogos › ${g.slug || 'slug'}`), h('div', { class: 't' }, t.slice(0, 62) + (t.length > 62 ? '…' : '')), h('div', { class: 'd' }, d.slice(0, 160) + (d.length > 160 ? '…' : '')));
      cT.textContent = `${g.seo.title.length}/70`; cD.textContent = `${g.seo.description.length}/170`;
    }
    serp();

    const errBox = (key) => view().querySelector(`[data-err="${key}"]`);
    const save = async (e) => {
      e?.preventDefault();
      view().querySelectorAll('.err').forEach((x) => { x.textContent = ''; });
      view().querySelectorAll('.invalid').forEach((x) => x.classList.remove('invalid'));
      const payload = { ...g, year: g.year === '' ? null : Number(g.year) };
      saveBtn.disabled = true;
      try {
        const saved = isNew ? await api('POST', '/games', payload) : await api('PUT', `/games/${g.id}`, payload);
        toast(isNew ? 'Jogo criado.' : 'Jogo salvo.');
        if (isNew) location.hash = `#/games/${saved.id}`;
        else Object.assign(g, saved);
      } catch (ex) {
        toast(ex.message, 'bad');
        const errs = ex.data?.errors || {};
        let first = null;
        for (const [k, msg] of Object.entries(errs)) { const b = errBox(k); if (b) { b.textContent = msg; first ??= b; } }
        first?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
      saveBtn.disabled = false;
    };
    const saveBtn = h('button', { class: 'btn primary', type: 'submit' }, isNew ? 'Criar jogo' : 'Salvar alterações');
    const del = isNew ? null : h('button', { class: 'btn danger', type: 'button', onclick: async () => {
      if (!(await confirmBox({ title: 'Excluir jogo?', text: `“${g.title}” será removido definitivamente.`, ok: 'Excluir', danger: true }))) return;
      try { await api('DELETE', `/games/${g.id}`); toast('Jogo excluído.'); location.hash = '#/games'; } catch (ex) { toast(ex.message, 'bad'); }
    } }, ico('trash'), 'Excluir');

    const form = h('form', { novalidate: true, onsubmit: save },
      h('div', { class: 'card' }, h('h2', {}, 'Informações básicas'),
        h('div', { class: 'grid2' }, field('Título *', title, { id: 'title', errKey: 'title' }), field('Endereço (slug)', slug, { id: 'slug', hint: 'Aparece na URL: /jogos/seu-slug', errKey: 'slug' })),
        h('div', { class: 'grid3' }, field('Console *', system, { id: 'system', errKey: 'system' }), field('Status', status), field('Destaque na página inicial', featured)),
        field('Frase de destaque', tagline, { id: 'tagline', hint: 'Até 120 caracteres.' }), field('Descrição', desc, { id: 'description', hint: 'Use linhas em branco para separar parágrafos. Escreva para pessoas: bons textos ajudam no Google e nas IAs.' })),
      h('div', { class: 'card' }, h('h2', {}, 'Detalhes'),
        h('div', { class: 'grid2' }, field('Gêneros', chipsInput(g.genres, () => {}, 'Digite e aperte Enter (ex.: Esporte)')), field('Tags', chipsInput(g.tags, () => {}, 'Digite e aperte Enter'))),
        h('div', { class: 'grid3' }, field('Ano', input({ type: 'number', min: 1970, max: 2100, value: g.year, oninput: (e) => { g.year = e.target.value; } })),
          field('Desenvolvedor', input({ value: g.developer, maxlength: 80, oninput: (e) => { g.developer = e.target.value; } })), field('Publicação', input({ value: g.publisher, maxlength: 80, oninput: (e) => { g.publisher = e.target.value; } }))),
        field('Jogadores', input({ value: g.players, maxlength: 40, placeholder: 'Ex.: 1 jogador, 1–2 jogadores', oninput: (e) => { g.players = e.target.value; } })),
        field('Controles deste jogo (opcional)', controlsTa, { hint: 'Um por linha, no formato “Ação = Teclas”. Se ficar vazio, usa o mapa padrão do console. Recomendado para jogos web.' })),
      h('div', { class: 'card' }, h('h2', {}, 'Imagens'),
        h('div', { class: 'preview' }, coverImg, h('div', {}, h('p', { class: 'muted small' }, 'Capa do jogo (PNG, JPG, WebP, AVIF ou GIF, até 8 MB). Também é usada na imagem de compartilhamento.'),
          h('div', { class: 'row' }, h('button', { class: 'btn', type: 'button', onclick: () => coverFile.click() }, ico('upload'), 'Enviar capa'), g.cover ? h('button', { class: 'btn sm danger', type: 'button', onclick: () => { g.cover = ''; paintCover(); } }, 'Remover') : null, coverFile))),
        h('h3', { style: 'margin:18px 0 10px' }, 'Capturas de tela'), shots, h('div', { class: 'row', style: 'margin-top:10px' }, h('button', { class: 'btn sm', type: 'button', onclick: () => shotFile.click() }, ico('plus'), 'Adicionar capturas'), shotFile)),
      h('div', { class: 'card' }, h('h2', {}, 'Arquivo do jogo'), h('div', { class: 'field' }, kindSeg), romBox),
      h('div', { class: 'card' }, h('h2', {}, 'Licença e direitos'),
        h('div', { class: 'notice warn' }, ico('key'), h('div', {}, 'Publique apenas jogos que você pode distribuir: homebrew com licença aberta, jogos livres ou de sua autoria. ', h('strong', {}, 'Não hospede jogos comerciais protegidos por direitos autorais.'))),
        h('div', { class: 'grid2' }, field('Nome da licença', licName, { id: 'licname' }), field('Link da licença', licUrl, { id: 'licurl' })),
        field('Situação dos direitos de distribuição', redist, { id: 'redist' }),
        h('div', { class: 'grid2' }, field('Fonte (nome)', srcName, { id: 'srcname' }), field('Fonte (link)', srcUrl, { id: 'srcurl' })),
        h('div', { class: 'field' }, h('label', { class: 'check', for: 'rights' }, rights, h('span', {}, 'Confirmo que tenho licença ou permissão para distribuir este arquivo neste site.')), h('div', { class: 'err', dataset: { err: 'rightsConfirmed' } }))),
      h('div', { class: 'card' }, h('h2', {}, 'SEO (opcional)'),
        field('Título para buscadores', seoT, { id: 'seot' }), cT, field('Descrição para buscadores', seoD, { id: 'seod' }), cD,
        h('p', { class: 'label', style: 'margin:14px 0 8px' }, 'Prévia no Google'), serpBox),
      h('div', { class: 'sticky-save' }, h('a', { class: 'btn', href: '#/games' }, 'Voltar'), h('span', { class: 'spacer' }), del,
        !isNew && g.status === 'published' ? h('a', { class: 'btn', href: `/jogos/${g.slug}`, target: '_blank', rel: 'noopener' }, ico('ext'), 'Ver no site') : null, saveBtn));

    view().replaceChildren(pageHead(isNew ? 'Novo jogo' : g.title, isNew ? 'Cadastre um jogo livre ou homebrew.' : `Última alteração: ${fmtDate(g.updatedAt)}`), form);
  }

  /* ------------------------------------------------------------ consoles */
  async function viewSystems() {
    state.systems = null;
    const systems = await getSystems();
    document.title = 'Consoles · Painel GameWeb';
    const statusBadge = { stable: ['ok', 'Estável'], beta: ['warn', 'Beta'], experimental: ['bad', 'Experimental'] };
    const tierName = { 1: 'Qualquer aparelho', 2: 'Intermediário', 3: 'Bom (computador)', 4: 'Potente (computador)' };
    const orderInput = (s) => input({
      type: 'number', min: 0, max: 999, value: s.order, style: 'width:80px', 'aria-label': `Ordem de ${s.short}`,
      onchange: async (e) => {
        try { await api('PUT', `/systems/${s.id}`, { order: Number(e.target.value) }); toast('Ordem salva.'); } catch (ex) { toast(ex.message, 'bad'); }
      },
    });
    const enabledSwitch = (s) => {
      const box = h('input', { type: 'checkbox', checked: s.enabled, 'aria-label': `Ativar ${s.short}` });
      box.addEventListener('change', async () => {
        try {
          await api('PUT', `/systems/${s.id}`, { enabled: box.checked });
          toast(box.checked ? `${s.short} ativado.` : `${s.short} desativado.`);
        } catch (ex) { box.checked = !box.checked; toast(ex.message, 'bad'); }
      });
      return h('label', { class: 'switch' }, box, h('span'));
    };
    const rows = systems.map((s) => h('tr', {},
      h('td', {}, h('strong', {}, s.short), h('div', { class: 'hint' }, s.name)),
      h('td', {}, s.emulator),
      h('td', {}, h('span', { class: `badge ${statusBadge[s.status][0]}` }, statusBadge[s.status][1])),
      h('td', {}, tierName[s.tier]),
      h('td', {}, orderInput(s)),
      h('td', {}, enabledSwitch(s))));
    const head = h('thead', {}, h('tr', {}, ['Console', 'Emulador', 'Status', 'Exigência', 'Ordem', 'Ativo'].map((t) => h('th', {}, t))));
    view().replaceChildren(
      pageHead('Consoles', 'Ative ou desative consoles e defina a ordem em que aparecem no site.'),
      h('div', { class: 'card', style: 'padding:6px 14px' }, h('div', { class: 'table-wrap' }, h('table', {}, head, h('tbody', {}, rows)))));
  }

  /* ------------------------------------------------------------ configurações e SEO */
  async function viewSettings() {
    const s = await api('GET', '/settings');
    document.title = 'Site e SEO · Painel GameWeb';
    const keywords = [...s.keywords];
    const txt = (v, attrs = {}) => input({ value: v, ...attrs });
    const f = {
      siteName: txt(s.siteName, { maxlength: 40 }), tagline: txt(s.tagline, { maxlength: 120 }), siteUrl: txt(s.siteUrl, { placeholder: 'https://www.seusite.com.br' }),
      description: h('textarea', { class: 'input', maxlength: 300 }), contactEmail: txt(s.contactEmail, { type: 'email', placeholder: 'contato@seusite.com.br' }),
      ogImage: txt(s.seo.ogImage), twitter: txt(s.seo.twitterHandle, { placeholder: '@seuperfil' }),
      ga4: txt(s.analytics.ga4, { placeholder: 'G-XXXXXXXXXX' }), plausible: txt(s.analytics.plausibleDomain, { placeholder: 'seusite.com.br' }),
      annText: txt(s.announcement.text, { maxlength: 200 }), annLink: txt(s.announcement.link, { placeholder: '/jogos ou https://…' }),
    };
    f.description.value = s.description;
    const social = Object.fromEntries(Object.keys(s.social).map((k) => [k, txt(s.social[k], { placeholder: 'https://…' })]));
    const tgl = (checked) => h('label', { class: 'switch' }, h('input', { type: 'checkbox', checked }), h('span'));
    const aiSearch = tgl(s.seo.aiSearchBots), aiTrain = tgl(s.seo.aiTrainingBots), annOn = tgl(s.announcement.enabled);
    const faq = s.faq.map((x) => ({ ...x }));
    const faqBox = h('div');
    const paintFaq = () => faqBox.replaceChildren(...faq.map((item, i) => h('div', { class: 'faqrow' },
      input({ value: item.q, placeholder: 'Pergunta', 'aria-label': `Pergunta ${i + 1}`, oninput: (e) => { item.q = e.target.value; } }),
      (() => { const t = h('textarea', { class: 'input', placeholder: 'Resposta', 'aria-label': `Resposta ${i + 1}`, oninput: (e) => { item.a = e.target.value; } }); t.value = item.a; return t; })(),
      h('div', { class: 'row' },
        h('button', { class: 'btn sm icon', type: 'button', 'aria-label': 'Subir', disabled: i === 0, onclick: () => { [faq[i - 1], faq[i]] = [faq[i], faq[i - 1]]; paintFaq(); } }, ico('up')),
        h('button', { class: 'btn sm icon', type: 'button', 'aria-label': 'Descer', disabled: i === faq.length - 1, onclick: () => { [faq[i + 1], faq[i]] = [faq[i], faq[i + 1]]; paintFaq(); } }, ico('down')),
        h('span', { class: 'spacer' }), h('button', { class: 'btn sm danger', type: 'button', onclick: () => { faq.splice(i, 1); paintFaq(); } }, ico('trash'), 'Remover')))));
    paintFaq();
    const saveBtn = h('button', { class: 'btn primary', type: 'submit' }, 'Salvar configurações');
    const form = h('form', { novalidate: true, onsubmit: async (e) => {
      e.preventDefault(); saveBtn.disabled = true;
      try {
        await api('PUT', '/settings', {
          siteName: f.siteName.value, tagline: f.tagline.value, siteUrl: f.siteUrl.value, description: f.description.value, keywords, contactEmail: f.contactEmail.value,
          social: Object.fromEntries(Object.entries(social).map(([k, el]) => [k, el.value])),
          analytics: { ga4: f.ga4.value, plausibleDomain: f.plausible.value },
          seo: { aiSearchBots: aiSearch.firstChild.checked, aiTrainingBots: aiTrain.firstChild.checked, ogImage: f.ogImage.value, twitterHandle: f.twitter.value },
          announcement: { enabled: annOn.firstChild.checked, text: f.annText.value, link: f.annLink.value }, faq,
        });
        toast('Configurações salvas. O site já usa os novos valores.');
      } catch (ex) { toast(ex.message, 'bad'); }
      saveBtn.disabled = false;
    } },
    h('div', { class: 'card' }, h('h2', {}, 'Identidade do site'),
      h('div', { class: 'grid2' }, field('Nome do site', f.siteName), field('Frase de apresentação', f.tagline)),
      field('Descrição (meta description da página inicial)', f.description, { hint: 'Ideal: 120 a 160 caracteres.' }),
      h('div', { class: 'grid2' }, field('Endereço oficial do site', f.siteUrl, { hint: 'Usado em canonical, sitemap e dados estruturados. Defina o domínio final (https). Também pode ser fixado pela variável SITE_URL.' }), field('E-mail de contato', f.contactEmail))),
    h('div', { class: 'card' }, h('h2', {}, 'SEO e IAs'),
      field('Palavras-chave', chipsInput(keywords, () => {}, 'Digite e aperte Enter'), { hint: 'Usadas em textos e no llms.txt; o Google não usa a meta keywords.' }),
      h('div', { class: 'grid2' }, field('Imagem de compartilhamento padrão', f.ogImage, { hint: '1200×630. Gere com “npm run og”.' }), field('Perfil no X/Twitter', f.twitter)),
      h('div', { class: 'field' }, h('label', { class: 'check' }, aiSearch, h('span', {}, h('strong', {}, 'Permitir buscadores de IA'), ' (ChatGPT Search, Claude, Perplexity…) — aumenta a chance de ser citado nas respostas.'))),
      h('div', { class: 'field' }, h('label', { class: 'check' }, aiTrain, h('span', {}, h('strong', {}, 'Permitir coleta para treinamento de IA'), ' (GPTBot, ClaudeBot, Google-Extended…) — controla o robots.txt.')))),
    h('div', { class: 'card' }, h('h2', {}, 'Redes sociais'), h('div', { class: 'grid2' }, Object.entries(social).map(([k, el]) => field(k[0].toUpperCase() + k.slice(1), el)))),
    h('div', { class: 'card' }, h('h2', {}, 'Análise de audiência (opcional)'), h('p', { class: 'muted small' }, 'Os contadores internos já funcionam sem cookies. Preencha apenas se usar um serviço externo.'),
      h('div', { class: 'grid2' }, field('Google Analytics 4 (ID)', f.ga4), field('Plausible (domínio)', f.plausible))),
    h('div', { class: 'card' }, h('h2', {}, 'Aviso no topo do site'),
      h('div', { class: 'field' }, h('label', { class: 'check' }, annOn, h('span', {}, 'Mostrar aviso'))), h('div', { class: 'grid2' }, field('Texto', f.annText), field('Link (opcional)', f.annLink))),
    h('div', { class: 'card' }, h('h2', {}, 'Perguntas frequentes (página inicial e /ajuda)'), faqBox,
      h('button', { class: 'btn sm', type: 'button', onclick: () => { faq.push({ q: '', a: '' }); paintFaq(); } }, ico('plus'), 'Adicionar pergunta')),
    h('div', { class: 'sticky-save' }, h('span', { class: 'spacer' }), saveBtn));
    view().replaceChildren(pageHead('Site e SEO', 'Tudo aqui vale imediatamente para o site público.'), form);
  }

  /* ------------------------------------------------------------ usuários e conta */
  async function viewUsers() {
    const users = await api('GET', '/users');
    document.title = 'Usuários · Painel GameWeb';
    const name = input({ placeholder: 'novo.usuario', maxlength: 40, 'aria-label': 'Nome de usuário', style: 'max-width:260px' });
    const body = h('tbody', {}, users.map((u) => h('tr', {}, h('td', {}, h('strong', {}, u.username), u.id === state.user.id ? h('span', { class: 'badge', style: 'margin-left:8px' }, 'você') : null), h('td', {}, u.role === 'admin' ? 'Administrador' : u.role),
      h('td', { class: 'muted nowrap' }, fmtDate(u.lastLoginAt)), h('td', {}, u.mustChangePassword ? h('span', { class: 'badge warn' }, 'Deve trocar a senha') : h('span', { class: 'badge ok' }, 'Ativo')),
      h('td', {}, h('div', { class: 'actions' },
        h('button', { class: 'btn sm', type: 'button', onclick: async () => {
          if (!(await confirmBox({ title: 'Redefinir senha?', text: `Será gerada uma senha temporária para “${u.username}” e as sessões abertas dele serão encerradas.`, ok: 'Redefinir' }))) return;
          try { const r = await api('POST', `/users/${u.id}/reset`); await secretBox({ title: `Senha temporária de ${u.username}`, text: 'Entregue esta senha à pessoa por um canal seguro.', secret: r.temporaryPassword }); viewUsers(); } catch (ex) { toast(ex.message, 'bad'); }
        } }, ico('key'), 'Redefinir senha'),
        u.id !== state.user.id ? h('button', { class: 'btn sm danger', type: 'button', onclick: async () => {
          if (!(await confirmBox({ title: 'Excluir usuário?', text: `“${u.username}” perderá o acesso ao painel.`, ok: 'Excluir', danger: true }))) return;
          try { await api('DELETE', `/users/${u.id}`); toast('Usuário excluído.'); viewUsers(); } catch (ex) { toast(ex.message, 'bad'); }
        } }, ico('trash'), 'Excluir') : null)))));
    const add = h('form', { class: 'row', novalidate: true, onsubmit: async (e) => {
      e.preventDefault();
      try { const r = await api('POST', '/users', { username: name.value.trim() }); await secretBox({ title: `Usuário ${r.user.username} criado`, text: 'Use esta senha temporária para o primeiro acesso.', secret: r.temporaryPassword }); viewUsers(); } catch (ex) { toast(ex.message, 'bad'); }
    } }, name, h('button', { class: 'btn primary', type: 'submit' }, ico('plus'), 'Adicionar administrador'));
    view().replaceChildren(pageHead('Usuários e conta', 'Controle quem acessa o painel.'),
      h('div', { class: 'card' }, h('h2', {}, 'Minha senha'), h('div', { style: 'max-width:420px' }, passwordForm({ forced: false, onDone: () => viewUsers() }))),
      h('div', { class: 'card' }, h('h2', {}, 'Administradores'), h('div', { class: 'table-wrap' }, h('table', {}, h('thead', {}, h('tr', {}, ['Usuário', 'Perfil', 'Último acesso', 'Situação', ''].map((t) => h('th', {}, t)))), body)), h('div', { style: 'margin-top:16px' }, add)));
  }

  /* ------------------------------------------------------------ atividade */
  async function viewAudit() {
    const rows = await api('GET', '/audit');
    document.title = 'Atividade · Painel GameWeb';
    const names = { login: 'Login', login_falhou: 'Login falhou', logout: 'Logout', senha_alterada: 'Senha alterada', jogo_criado: 'Jogo criado', jogo_editado: 'Jogo editado', jogo_excluido: 'Jogo excluído', upload_rom: 'Upload de arquivo', configuracoes_salvas: 'Configurações salvas', console_atualizado: 'Console atualizado', usuario_criado: 'Usuário criado', senha_redefinida: 'Senha redefinida', usuario_excluido: 'Usuário excluído' };
    view().replaceChildren(pageHead('Atividade', 'Últimas ações realizadas no painel.'),
      h('div', { class: 'card', style: 'padding:6px 14px' }, rows.length ? h('div', { class: 'table-wrap' }, h('table', {}, h('thead', {}, h('tr', {}, ['Quando', 'Usuário', 'Ação', 'Detalhe'].map((t) => h('th', {}, t)))),
        h('tbody', {}, rows.map((r) => h('tr', {}, h('td', { class: 'nowrap muted' }, fmtDate(r.at)), h('td', {}, r.user), h('td', {}, h('span', { class: `badge ${r.action === 'login_falhou' ? 'bad' : ''}` }, names[r.action] || r.action)), h('td', { class: 'muted' }, r.detail)))))) : h('div', { class: 'empty' }, 'Sem atividade registrada.')));
  }

  /* ------------------------------------------------------------ inicialização */
  function afterAuth() {
    if (state.user.mustChangePassword) return renderChangePassword(true);
    renderShell();
    if (!location.hash) location.hash = '#/dashboard';
    route();
  }
  (async () => {
    try {
      const me = await api('GET', '/me');
      if (me.authenticated) { state.user = me.user; state.csrf = me.csrf; afterAuth(); } else renderLogin();
    } catch (ex) { app.replaceChildren(h('p', { class: 'boot-msg' }, 'Não foi possível carregar o painel: ' + ex.message)); }
  })();
})();
