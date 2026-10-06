// Página do player (/jogar/:slug e /emulador[/:console]) — a lógica roda em public/js/player.js.
import { acceptList } from '../systems.js';
import { html, raw } from '../util.js';
import { icon } from './components.js';

const BASE_TIPS = [
  'Passe o mouse sobre a tela do jogo para ver a barra do emulador: salvar/carregar estado, silenciar e abrir as configurações ⚙.',
  'Remapeie teclado e controle em ⚙ → Controles.',
  'Os saves do jogo ficam guardados no navegador. Se limpar os dados do site, eles se perdem.',
];
const TIPS = {
  psp: ['Para melhorar o desempenho: feche outras abas, use Chrome ou Edge e mantenha a resolução em 1x.', 'Em notebooks, ligue na tomada e force a GPU dedicada para o navegador.', 'Imagens ISO grandes consomem muita RAM; prefira o formato CSO.'],
  psx: ['Jogos com .bin e .cue: coloque os dois arquivos em um .zip e escolha o .zip.', 'Se o jogo não iniciar, informe o seu BIOS (opcional) antes de começar.'],
  n64: ['Se travar, reduza a resolução em ⚙ → Opções do núcleo.', 'Os botões C ficam no analógico direito (J L I K) ou nos botões virtuais.'],
  nds: ['Clique ou toque na tela de baixo para usar a caneta (stylus).', 'Mude o layout das telas em ⚙ → Opções do núcleo.'],
  ps2: ['O PS2 é experimental: espere falhas gráficas e FPS baixo em alguns jogos.', 'Se o teclado não responder, clique uma vez na tela do jogo.', 'Chrome ou Edge no computador têm o melhor desempenho.'],
};
const GENERIC_TIPS = ['Tela cheia: use o botão ⛶ do GameWeb ou o da barra do emulador.', 'No celular, gire o aparelho para a horizontal e use os botões virtuais.'];
const WEB_TIPS = ['Os controles variam por jogo: veja as instruções dentro da tela do jogo.', 'Se o teclado não responder, clique uma vez dentro do jogo.', 'Tela cheia: use o botão ⛶ do GameWeb. No celular, gire o aparelho para a horizontal.'];

export const systemTips = (s) => (s.engine === 'web' ? WEB_TIPS : (s.engine === 'play' ? [] : BASE_TIPS).concat(TIPS[s.id] || GENERIC_TIPS));

const brief = (s, controls) => ({
  id: s.id, slug: s.slug, name: s.name, short: s.short, nick: s.nick, emulator: s.emulator, engine: s.engine, core: s.core, exts: s.exts,
  accept: acceptList(s), tier: s.tier, ps: !!s.psLayout, bios: s.bios || null, color: s.color, pad: controls?.length ? controls : s.pad, tips: systemTips(s),
});

const jsonScript = (id, data) => raw(`<script type="application/json" id="${id}">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`);

export function playerPage(ctx, { mode, game = null, system = null }) {
  const { systems } = ctx;
  const sys = system || (game && ctx.allSystems.find((s) => s.id === game.system)) || null;
  const data = {
    mode,
    game: game && { slug: game.slug, title: game.title, kind: game.rom.kind, url: game.rom.url, cover: game.cover || '' },
    system: sys && brief(sys, game?.controls),
    systems: mode === 'byo' ? systems.map(brief) : [],
  };
  const title = game ? game.title : sys ? `Abrir meu jogo de ${sys.nick}` : 'Abrir meu jogo';
  const back = game ? `/jogos/${game.slug}` : sys ? `/consoles/${sys.slug}` : '/consoles';

  const main = html`
  <div class="player-page" data-player>
    <div class="player-bar">
      <a class="btn btn-ghost btn-sm" href="${back}" aria-label="Voltar">${icon('back')}<span class="hide-sm">Voltar</span></a>
      <div class="player-title"><strong data-player-title>${title}</strong>${sys ? html`<span class="chip chip-sys" data-player-chip style="--c:${sys.color}">${sys.short}</span>` : html`<span class="chip chip-sys" data-player-chip hidden></span>`}</div>
      <div class="player-actions">
        <button class="device-pill" type="button" data-device-pill hidden><span class="dot"></span><span data-device-label></span></button>
        <button class="icon-btn" type="button" data-fs aria-label="Tela cheia" title="Tela cheia">${icon('maximize')}</button>
        <button class="icon-btn" type="button" data-panel-toggle aria-label="Controles e dicas" aria-expanded="true" title="Controles e dicas">${icon('keyboard')}</button>
        <button class="icon-btn" type="button" data-theme-toggle aria-label="Alternar tema">${icon('moon', 'only-dark')}${icon('sun', 'only-light')}</button>
      </div>
    </div>
    <div class="player-layout">
      <section class="player-stage" data-stage aria-label="Área do jogo">
        <div class="player-surface" data-surface></div>
        <div class="player-gate ${game ? '' : 'byo'}" data-gate>
          ${game?.cover ? html`<div class="gate-bg" style="background-image:url(${game.cover})" aria-hidden="true"></div>` : ''}
          <div class="gate-card">
            ${game ? html`
              <h1>${game.title}</h1>
              <p class="muted">${sys.engine === 'web' ? 'Jogo HTML5 · roda direto no navegador' : `${sys.name} · ${sys.emulator}`}</p>
              <button class="btn btn-primary btn-xl" type="button" data-play>${icon('play')}Jogar agora</button>`
    : html`
              <h1>${sys ? `Abrir meu jogo de ${sys.nick}` : 'Abrir meu jogo'}</h1>
              <div class="byo-step" data-step-system ${sys ? raw('hidden') : ''}>
                <p class="muted">1. Escolha o console do seu jogo</p>
                <div class="chips" role="group" aria-label="Console">${systems.map((s) => html`<button type="button" class="chip-btn" data-pick-system="${s.id}" style="--c:${s.color}">${s.short}</button>`)}</div>
              </div>
              <div class="byo-step" data-step-file ${sys ? '' : raw('hidden')}>
                <p class="muted" data-step-file-label>${sys ? '' : '2. '}Arraste o arquivo do seu jogo ou clique para escolher</p>
                <label class="dropzone" data-dropzone tabindex="0">${icon('upload')}<strong data-drop-title>Solte o arquivo aqui</strong><span data-drop-accept>${sys ? 'Formatos: ' + sys.exts.map((e) => '.' + e).join(' ') : ''}</span>
                  <input type="file" data-file hidden></label>
                <div class="bios-box" data-bios hidden><label class="muted small" data-bios-label>BIOS (opcional)</label><input type="file" data-bios-file><p class="muted small" data-bios-hint></p></div>
              </div>
              <button class="btn btn-primary btn-xl" type="button" data-play disabled>${icon('play')}Iniciar</button>`}
            <p class="gate-hint">${icon('gamepad')}<span data-gamepad-text>Use o teclado ou aperte um botão do controle.</span></p>
            <p class="notice warn" data-gate-warn hidden></p>
            <p class="gate-privacy">${icon('shield')}${game ? 'Roda no seu navegador.' : 'O arquivo é lido só no seu navegador e não é enviado a nenhum servidor.'}</p>
            <div class="gate-progress" data-progress hidden><div class="bar"><i></i></div><span data-progress-text>Carregando…</span></div>
          </div>
        </div>
      </section>
      <aside class="player-panel" data-panel aria-label="Controles e dicas">
        <div data-panel-body></div>
        <section class="panel-block"><h2>${icon('gamepad')}Controle (gamepad)</h2>
          <p class="pad-status" data-gamepad-status aria-live="polite"><span class="dot"></span><span data-gamepad-text>Nenhum controle detectado. Aperte um botão do seu controle.</span></p></section>
        <section class="panel-block"><h2>${icon('cpu')}Seu aparelho</h2><p class="muted small" data-device-summary>Analisando…</p></section>
      </aside>
    </div>
    <noscript><p class="notice">${icon('info')} O emulador precisa de JavaScript.</p></noscript>
  </div>
  ${jsonScript('player-data', data)}`;

  return { main, title, data };
}
