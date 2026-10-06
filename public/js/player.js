/* GameWeb — player: carrega o emulador sob demanda (EmulatorJS para a maioria dos consoles, Play!.js para PS2). */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const GW = window.GW || {};
  const data = JSON.parse($('#player-data').textContent);
  const page = $('[data-player]');
  const gate = $('[data-gate]', page);
  const surface = $('[data-surface]', page);
  const stage = $('[data-stage]', page);
  const playBtn = $('[data-play]', gate);
  const warn = $('[data-gate-warn]', gate);
  const progress = $('[data-progress]', gate);
  const mobileMq = matchMedia('(max-width: 860px)');

  let system = data.system;
  let file = null;
  let biosFile = null;
  let running = false;

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // texto de teclas -> <kbd>: só vira tecla o que parece tecla (mesma regra do servidor)
  const SEP = new Set(['·', '/', 'ou', 'e', 'ou:']);
  const KEY_RE = /^(?:[A-Za-z0-9]|[A-Z]\d|[←↑→↓✕○□△]|Enter|Tab|Backspace|Esc|Espaço|Shift|Ctrl|Alt|Start|F\d{1,2})$/;
  const caps = (str) => String(str).split(/\s+/).filter(Boolean).map((t) => {
    const m = t.match(/^(.*?)([,;.]?)$/);
    if (SEP.has(t)) return `<span class="sep">${esc(t)}</span> `;
    if (KEY_RE.test(m[1])) return `<kbd>${esc(m[1])}</kbd>${esc(m[2])} `;
    return `<span class="word">${esc(t)}</span> `;
  }).join('');
  const fmtSize = (n) => (n > 1048576 ? (n / 1048576).toFixed(n > 1e8 ? 0 : 1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB');

  /* ------------------------------------------------------------ painel lateral (controles e dicas) */
  function renderPanel() {
    const body = $('[data-panel-body]', page);
    if (!system) {
      body.innerHTML = '<section class="panel-block"><h2>Controles</h2><p class="muted small">Escolha o console para ver o mapa de teclas e as dicas.</p></section>';
      return;
    }
    body.innerHTML = `<section class="panel-block"><h2><svg class="i"><use href="#i-keyboard"/></svg>Teclado</h2>
      <div class="table-wrap"><table class="keys compact"><tbody>${system.pad.map(([a, b]) => `<tr><th scope="row">${esc(a)}</th><td>${caps(b)}</td></tr>`).join('')}</tbody></table></div></section>
      <section class="panel-block"><h2><svg class="i"><use href="#i-info"/></svg>Dicas</h2><ul class="tips">${system.tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></section>`;
  }

  function setPanel(open) {
    const toggle = $('[data-panel-toggle]', page);
    if (mobileMq.matches) page.classList.toggle('panel-open', open);
    else page.classList.toggle('panel-closed', !open);
    toggle?.setAttribute('aria-expanded', String(open));
  }
  const panelOpen = () => (mobileMq.matches ? page.classList.contains('panel-open') : !page.classList.contains('panel-closed'));
  $('[data-panel-toggle]', page)?.addEventListener('click', () => setPanel(!panelOpen()));
  if (mobileMq.matches) setPanel(false);

  /* ------------------------------------------------------------ avisos de desempenho */
  function checkDevice() {
    warn.hidden = true;
    const d = GW.getDevice ? GW.getDevice() : null;
    $('[data-device-summary]', page).textContent = d
      ? `${GW.tierName(d.tier)} (nota ${d.score}/100) · ${d.cores} núcleos · ${d.gl2 ? 'WebGL2' : 'WebGL'}${d.mobile ? ' · celular' : ''}.`
      : 'Não foi possível testar este aparelho.';
    if (!system) return true;
    const needsThreads = system.core === 'psp' || system.engine === 'play';
    if (needsThreads && !(self.crossOriginIsolated && typeof SharedArrayBuffer !== 'undefined')) {
      warn.hidden = false;
      warn.innerHTML = `<svg class="i"><use href="#i-alert"/></svg><span>Este navegador não liberou o multithreading (SharedArrayBuffer) exigido por ${esc(system.nick)}. Use o Chrome, Edge ou Firefox atualizado no computador.</span>`;
      return false;
    }
    if (d) {
      const c = GW.compat(system.tier, { desktopOnly: system.id === 'ps2', threads: needsThreads });
      if (c.level !== 'good') {
        warn.hidden = false;
        warn.innerHTML = `<svg class="i"><use href="#i-alert"/></svg><span>${esc(c.text)}. ${system.id === 'ps2' ? 'O PS2 é experimental e exige um computador potente.' : 'Você pode tentar mesmo assim; se travar, reduza a resolução em ⚙ ou escolha um console mais leve.'}</span>`;
      }
    }
    return true;
  }

  /* ------------------------------------------------------------ escolha de console e arquivo (modo "abrir meu jogo") */
  function selectSystem(sys) {
    system = sys;
    const chip = $('[data-player-chip]', page);
    chip.textContent = sys.short;
    chip.style.setProperty('--c', sys.color);
    chip.hidden = false;
    $('[data-player-title]', page).textContent = `Abrir meu jogo de ${sys.nick}`;
    $('h1', gate).textContent = `Abrir meu jogo de ${sys.nick}`;
    $$('[data-pick-system]', gate).forEach((b) => b.classList.toggle('active', b.dataset.pickSystem === sys.id));
    const stepFile = $('[data-step-file]', gate);
    if (stepFile) {
      stepFile.hidden = false;
      $('[data-drop-accept]', gate).textContent = 'Formatos: ' + sys.exts.map((e) => '.' + e).join(' ');
      $('[data-file]', gate).accept = sys.accept;
      const bios = $('[data-bios]', gate);
      bios.hidden = !sys.bios;
      if (sys.bios) { $('[data-bios-label]', gate).textContent = sys.bios.label; $('[data-bios-hint]', gate).textContent = sys.bios.hint; }
    }
    renderPanel();
    checkDevice();
    updatePlayState();
    history.replaceState(null, '', `/emulador/${sys.slug}`);
  }

  function setFile(f) {
    if (!f) return;
    const ext = f.name.split('.').pop().toLowerCase();
    if (!system) {
      const cands = data.systems.filter((s) => s.exts.includes(ext));
      if (cands.length === 1) selectSystem(cands[0]);
      else {
        warn.hidden = false;
        warn.innerHTML = `<svg class="i"><use href="#i-info"/></svg><span>${cands.length ? `O formato .${esc(ext)} é usado por vários consoles (${cands.map((s) => esc(s.nick)).join(', ')}). Escolha o console do seu jogo acima.` : `Formato .${esc(ext)} não reconhecido. Escolha o console do seu jogo acima.`}</span>`;
        file = f;
        return;
      }
    } else if (!system.exts.includes(ext) && !['zip', '7z'].includes(ext)) {
      warn.hidden = false;
      warn.innerHTML = `<svg class="i"><use href="#i-alert"/></svg><span>O formato .${esc(ext)} não é o esperado para ${esc(system.nick)} (${system.exts.map((e) => '.' + e).join(' ')}). Você pode tentar mesmo assim.</span>`;
    } else { checkDevice(); }
    file = f;
    const dz = $('[data-dropzone]', gate);
    dz.classList.add('has-file');
    $('[data-drop-title]', gate).textContent = f.name;
    $('[data-drop-accept]', gate).textContent = fmtSize(f.size) + ' · clique para trocar de arquivo';
    updatePlayState();
  }

  function updatePlayState() {
    if (data.mode !== 'byo') return;
    playBtn.disabled = !(system && file);
  }

  if (data.mode === 'byo') {
    $$('[data-pick-system]', gate).forEach((b) => b.addEventListener('click', () => {
      selectSystem(data.systems.find((s) => s.id === b.dataset.pickSystem));
      if (file) setFile(file);
    }));
    const input = $('[data-file]', gate);
    input?.addEventListener('change', () => setFile(input.files[0]));
    $('[data-bios-file]', gate)?.addEventListener('change', (e) => { biosFile = e.target.files[0] || null; });
    const dz = $('[data-dropzone]', gate);
    dz?.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } });
    ['dragenter', 'dragover'].forEach((t) => gate.addEventListener(t, (e) => { e.preventDefault(); dz?.classList.add('drag'); }));
    ['dragleave', 'drop'].forEach((t) => gate.addEventListener(t, (e) => { e.preventDefault(); dz?.classList.remove('drag'); }));
    gate.addEventListener('drop', (e) => setFile(e.dataTransfer.files[0]));
    if (system) selectSystem(system);
  } else {
    renderPanel();
    checkDevice();
  }

  /* ------------------------------------------------------------ iniciar o jogo */
  function track() {
    const body = JSON.stringify({ t: 'play', game: data.game?.slug, system: system?.id });
    try { navigator.sendBeacon('/api/event', new Blob([body], { type: 'application/json' })); } catch { /* ignora */ }
  }

  function hideGate() { gate.classList.add('hide'); setTimeout(() => { gate.hidden = true; }, 600); }

  function psControls() {
    return {
      0: {
        0: { value: 'x', value2: 'BUTTON_1' }, 1: { value: 's', value2: 'BUTTON_3' }, 2: { value: 'v', value2: 'SELECT' }, 3: { value: 'enter', value2: 'START' },
        4: { value: 'up arrow', value2: 'DPAD_UP' }, 5: { value: 'down arrow', value2: 'DPAD_DOWN' }, 6: { value: 'left arrow', value2: 'DPAD_LEFT' }, 7: { value: 'right arrow', value2: 'DPAD_RIGHT' },
        8: { value: 'z', value2: 'BUTTON_2' }, 9: { value: 'a', value2: 'BUTTON_4' },
        10: { value: 'q', value2: 'LEFT_TOP_SHOULDER' }, 11: { value: 'e', value2: 'RIGHT_TOP_SHOULDER' }, 12: { value: 'tab', value2: 'LEFT_BOTTOM_SHOULDER' }, 13: { value: 'r', value2: 'RIGHT_BOTTOM_SHOULDER' },
        14: { value: '', value2: 'LEFT_STICK' }, 15: { value: '', value2: 'RIGHT_STICK' },
        16: { value: 'h', value2: 'LEFT_STICK_X:+1' }, 17: { value: 'f', value2: 'LEFT_STICK_X:-1' }, 18: { value: 'g', value2: 'LEFT_STICK_Y:+1' }, 19: { value: 't', value2: 'LEFT_STICK_Y:-1' },
        20: { value: 'l', value2: 'RIGHT_STICK_X:+1' }, 21: { value: 'j', value2: 'RIGHT_STICK_X:-1' }, 22: { value: 'k', value2: 'RIGHT_STICK_Y:+1' }, 23: { value: 'i', value2: 'RIGHT_STICK_Y:-1' },
        24: { value: '1' }, 25: { value: '2' }, 26: { value: '3' }, 27: {}, 28: {}, 29: {},
      }, 1: {}, 2: {}, 3: {},
    };
  }

  // O EmulatorJS só atribui um controle ao jogador 1 se ele aparecer DEPOIS que o menu dele foi criado.
  // Se o jogador já apertou um botão do controle na tela inicial (como sugerimos), o controle seria ignorado.
  // Solução: o EmulatorJS enxerga o controle somente depois que o jogo iniciou.
  const nativeGetPads = navigator.getGamepads ? navigator.getGamepads.bind(navigator) : null;
  let padGate = true;
  if (nativeGetPads) navigator.getGamepads = () => (padGate ? [] : nativeGetPads());
  const releasePads = () => setTimeout(() => { padGate = false; }, 600);

  // O EmulatorJS consulta a versão mais recente no CDN dele. Evitamos essa chamada externa (privacidade e CSP):
  // respondemos localmente com uma versão neutra.
  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    const url = typeof input === 'string' ? input : input?.url || '';
    if (url.startsWith('https://cdn.emulatorjs.org/')) return Promise.resolve(new Response('{"version":"0.0.0"}', { status: 200, headers: { 'content-type': 'application/json' } }));
    return nativeFetch(input, init);
  };

  function startEJS(source, name) {
    surface.replaceChildren();
    const host = document.createElement('div');
    host.id = 'game';
    surface.append(host);
    Object.assign(window, {
      EJS_player: '#game', EJS_core: system.core, EJS_gameUrl: source, EJS_gameName: name,
      EJS_pathtodata: '/emu/ejs/', EJS_startOnLoaded: true, EJS_language: 'pt-BR', EJS_disableAutoLang: false,
      EJS_color: '#7c5cff', EJS_threads: system.core === 'psp', EJS_gameID: 1,
      EJS_onGameStart: () => { running = true; host.querySelector('canvas')?.focus?.(); releasePads(); },
    });
    if (system.ps) window.EJS_defaultControls = psControls();
    // qualidade automática conforme o aparelho (o que o usuário mudar em ⚙ fica salvo e prevalece)
    const dev = GW.getDevice ? GW.getDevice() : null;
    if (system.core === 'psp' && dev) {
      window.EJS_defaultOptions = { ppsspp_internal_resolution: dev.tier >= 4 ? '960x544' : '480x272', ...(dev.tier <= 2 ? { ppsspp_auto_frameskip: 'enabled' } : {}) };
    }
    if (biosFile && system.bios) window.EJS_biosUrl = biosFile;
    const s = document.createElement('script');
    s.src = '/emu/ejs/loader.js';
    s.onerror = () => { warn.hidden = false; gate.classList.remove('hide'); gate.hidden = false; warn.textContent = 'Não foi possível carregar o emulador. Verifique a conexão e recarregue a página.'; };
    document.body.append(s);
  }

  function startPlay(f) {
    surface.replaceChildren();
    const frame = document.createElement('iframe');
    frame.src = '/emu/play/';
    frame.title = 'Emulador de PS2 (Play!)';
    frame.allow = 'gamepad; fullscreen; autoplay; cross-origin-isolated';
    frame.setAttribute('allowfullscreen', '');
    surface.append(frame);
    // entrega o arquivo ao emulador assim que ele estiver pronto (mesma origem)
    const deliver = () => {
      try {
        const input = frame.contentDocument.querySelector('input[type=file]');
        const dt = new DataTransfer();
        dt.items.add(f);
        input.files = dt.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
        running = true;
        frame.focus();
      } catch (err) {
        GW.toast?.('Selecione o arquivo manualmente no botão do emulador.');
        console.warn('Falha ao entregar o arquivo ao Play!', err);
      }
    };
    const onMsg = (e) => { if (e.data?.type === 'gw-ps2-ready' && e.source === frame.contentWindow) { removeEventListener('message', onMsg); setTimeout(deliver, 350); } };
    addEventListener('message', onMsg);
  }

  function start() {
    if (!system) return;
    if (!checkDevice() && system.core === 'psp') return;
    playBtn.disabled = true;
    progress.hidden = false;
    track();
    if (data.game?.kind === 'web') {
      const frame = document.createElement('iframe');
      frame.src = data.game.url;
      frame.title = data.game.title;
      frame.allow = 'gamepad; fullscreen; autoplay';
      frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-pointer-lock allow-popups');
      frame.addEventListener('load', () => { frame.focus(); try { frame.contentWindow.focus(); } catch { /* origem diferente */ } });
      surface.replaceChildren(frame);
      running = true;
      hideGate();
      return;
    }
    if (system.engine === 'play') {
      if (!file) { GW.toast?.('Escolha o arquivo do seu jogo de PS2.'); playBtn.disabled = false; progress.hidden = true; return; }
      startPlay(file);
    } else if (data.mode === 'byo') {
      startEJS(file, file.name);
    } else {
      startEJS(new URL(data.game.url, location.origin).href, data.game.title);
    }
    hideGate();
  }
  playBtn?.addEventListener('click', start);
  document.addEventListener('gw:device', () => { if (!running) checkDevice(); });

  /* ------------------------------------------------------------ tela cheia e teclado */
  const fsBtn = $('[data-fs]', page);
  if (!document.fullscreenEnabled) fsBtn?.remove();
  fsBtn?.addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else stage.requestFullscreen?.().catch(() => {});
  });
  // setas e espaço não devem rolar a página enquanto o jogo está em foco
  addEventListener('keydown', (e) => {
    if (!running || !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) return;
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    e.preventDefault();
  }, { passive: false });
  addEventListener('beforeunload', (e) => { if (running) { e.preventDefault(); e.returnValue = ''; } });
})();
