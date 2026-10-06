// Componentes de HTML reutilizáveis (SSR). Valores interpolados são escapados por html``.
import { STATUS_LABEL, TIER_LABEL, systemById } from '../systems.js';
import { html, raw } from '../util.js';

/* ------------------------------------------------------------- ícones (sprite inline) */
const ICONS = {
  play: '<polygon points="7 4 20 12 7 20 7 4"/>',
  gamepad: '<path d="M6 12h4M8 10v4M15 13h.01M18 11h.01"/><path d="M17.3 5H6.7a4 4 0 0 0-4 3.6C2.6 9.4 2 14.5 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.4-1.4a2 2 0 0 1 1.4-.6h4.4a2 2 0 0 1 1.4.6L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.5-.6-6.6-.7-7.4A4 4 0 0 0 17.3 5z"/>',
  keyboard: '<rect width="20" height="14" x="2" y="5" rx="2"/><path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M7 15h10M6 12h.01M10 12h.01M14 12h.01M18 12h.01"/>',
  cpu: '<rect width="14" height="14" x="5" y="5" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/>',
  phone: '<rect width="12" height="20" x="6" y="2" rx="2.5"/><path d="M12 18h.01"/>',
  zap: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/>',
  shield: '<path d="M12 22c5-2 8-5.5 8-10V5l-8-3-8 3v7c0 4.5 3 8 8 10z"/><path d="m9 12 2 2 4-4"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  maximize: '<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  check: '<path d="m5 12 5 5 9-10"/>',
  alert: '<path d="M12 3 2 20h20L12 3z"/><path d="M12 10v4M12 17h.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  monitor: '<rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8M12 17v4"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5zM3 13l9 5 9-5"/>',
  sparkles: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16z"/>',
  mouse: '<rect width="12" height="18" x="6" y="3" rx="6"/><path d="M12 7v4"/>',
  bolt: '<path d="M11 2 4 13h6l-1 9 8-12h-6l1-8z"/>',
  file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z"/><path d="M14 3v5h5"/>',
};

export const spriteSvg = () => raw('<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>'
  + Object.entries(ICONS).map(([k, v]) => `<symbol id="i-${k}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${v}</symbol>`).join('')
  + '</defs></svg>');

export const icon = (name, cls = '') => raw(`<svg class="i ${cls}" aria-hidden="true" focusable="false"><use href="#i-${name}"/></svg>`);

/* ------------------------------------------------------------- pequenos blocos */
export const statusChip = (s) => html`<span class="chip status-${s.status}">${STATUS_LABEL[s.status]}</span>`;

export const breadcrumbs = (items) => html`<nav class="breadcrumbs" aria-label="Você está em">
  <ol>${items.map(([label, href], i) => (i === items.length - 1
    ? html`<li aria-current="page">${label}</li>`
    : html`<li><a href="${href}">${label}</a></li>`))}</ol></nav>`;

export const faqList = (faq) => html`<div class="faq">${faq.map((f) => html`<details class="faq-item reveal">
  <summary><span>${f.q}</span>${icon('chevron')}</summary><div class="faq-body"><p>${f.a}</p></div></details>`)}</div>`;

export const sectionHead = ({ eyebrow, title, lead, id }) => html`<header class="section-head reveal">
  ${eyebrow ? html`<p class="eyebrow">${eyebrow}</p>` : ''}<h2${id ? raw(` id="${id}"`) : ''}>${title}</h2>${lead ? html`<p class="lead">${lead}</p>` : ''}</header>`;

/* ------------------------------------------------------------- cartões */
export function gameCard(g, { i = 0 } = {}) {
  const sys = systemById(g.system);
  return html`<a class="game-card card reveal" style="--c:${sys?.color || '#7c5cff'};--i:${i}" href="/jogos/${g.slug}"
    data-system="${g.system}" data-title="${g.title.toLowerCase()}" data-genres="${g.genres.join('|').toLowerCase()}" data-text="${[g.title, g.tagline, g.developer, g.tags.join(' ')].join(' ').toLowerCase()}">
    <div class="game-media">
      ${g.cover ? html`<img class="pixel" src="${g.cover}" alt="Capa de ${g.title}" loading="lazy" decoding="async" width="320" height="240" style="view-transition-name:cover-${g.slug}">` : html`<span class="media-fallback">${icon('gamepad')}</span>`}
      <span class="chip chip-sys">${sys?.short || g.system}</span>
      ${g.featured ? html`<span class="chip chip-hot">${icon('sparkles')}Destaque</span>` : ''}
    </div>
    <div class="game-body"><h3>${g.title}</h3><p class="muted">${g.tagline || g.genres.join(' · ')}</p>
      <div class="game-foot"><span>${g.genres.slice(0, 2).join(' · ')}</span><span class="go">${icon('play')}Jogar</span></div></div></a>`;
}

export function systemCard(s, { i = 0, count = 0 } = {}) {
  return html`<article class="system-card card reveal" style="--c:${s.color};--i:${i}" data-tier="${s.tier}" data-system-id="${s.id}">
    <div class="sys-top"><span class="sys-badge">${s.short}</span>${statusChip(s)}</div>
    <h3><a href="/consoles/${s.slug}">${s.name}</a></h3>
    <p class="muted">${s.maker} · ${s.year} · ${s.emulator}</p>
    <p class="compat" data-compat data-tier="${s.tier}"><span class="dot"></span><span data-compat-text>Exigência: ${TIER_LABEL[s.tier]}</span></p>
    <div class="card-actions">
      <a class="btn btn-ghost btn-sm" href="/consoles/${s.slug}">Detalhes</a>
      <a class="btn btn-sm" href="/emulador/${s.slug}">${icon('upload')}Abrir meu jogo</a>
    </div>${count ? html`<p class="count">${count} ${count === 1 ? 'jogo livre' : 'jogos livres'} no catálogo</p>` : ''}</article>`;
}

// Texto de teclas -> <kbd>. Só vira tecla o que parece tecla; o resto fica como texto comum.
const SEP = new Set(['·', '/', 'ou', 'e', 'ou:']);
const KEY_RE = /^(?:[A-Za-z0-9]|[A-Z]\d|[←↑→↓✕○□△]|Enter|Tab|Backspace|Esc|Espaço|Shift|Ctrl|Alt|Start|F\d{1,2})$/;
const keyCaps = (str) => String(str).split(/\s+/).filter(Boolean).map((t) => {
  const m = t.match(/^(.*?)([,;.]?)$/);
  const base = m[1], punct = m[2];
  if (SEP.has(t)) return html`<span class="sep">${t}</span> `;
  if (KEY_RE.test(base)) return html`<kbd>${base}</kbd>${punct} `;
  return html`<span class="word">${t}</span> `;
});

/** Tabela de teclas do console. */
export function controlsTable(s, { compact = false } = {}) {
  return html`<div class="table-wrap"><table class="keys${compact ? ' compact' : ''}"><thead><tr><th scope="col">Botão do jogo</th><th scope="col">Teclado</th></tr></thead>
    <tbody>${s.pad.map(([a, b]) => html`<tr><th scope="row">${a}</th><td>${keyCaps(b)}</td></tr>`)}</tbody></table></div>`;
}

/* ------------------------------------------------------------- ilustração do controle (hero + demo ao vivo) */
export function padSvg({ live = false } = {}) {
  const b = (n, cx, cy, label, cls = '') => `<g class="pad-btn ${cls}" data-btn="${n}" style="--i:${n}"><circle cx="${cx}" cy="${cy}" r="15"/><text x="${cx}" y="${cy + 5}" text-anchor="middle">${label}</text></g>`;
  return raw(`<svg class="pad-svg${live ? ' live' : ''}" viewBox="0 0 520 330" role="img" aria-label="Ilustração de um controle de videogame">
  <defs><linearGradient id="padg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7c5cff"/><stop offset=".55" stop-color="#22d3ee"/><stop offset="1" stop-color="#ff4fa3"/></linearGradient></defs>
  <g class="pad-shoulders"><rect data-btn="4" x="96" y="26" width="104" height="22" rx="11"/><rect data-btn="5" x="320" y="26" width="104" height="22" rx="11"/></g>
  <path class="pad-body" d="M130 58H390C440 58 478 96 488 146L508 248C516 298 480 328 438 328C412 328 394 316 378 298L346 260H174L142 298C126 316 108 328 82 328C40 328 4 298 12 248L32 146C42 96 80 58 130 58Z"/>
  <g class="pad-dpad"><rect data-btn="12" x="110" y="118" width="22" height="26" rx="5"/><rect data-btn="13" x="110" y="168" width="22" height="26" rx="5"/><rect data-btn="14" x="80" y="146" width="28" height="22" rx="5"/><rect data-btn="15" x="134" y="146" width="28" height="22" rx="5"/></g>
  <g class="pad-faces">${b(3, 400, 120, 'Y')}${b(0, 400, 190, 'A')}${b(2, 365, 155, 'X')}${b(1, 435, 155, 'B')}</g>
  <g class="pad-sticks"><g data-stick="l"><circle class="stick-base" cx="190" cy="226" r="34"/><circle class="stick-cap" cx="190" cy="226" r="20"/></g><g data-stick="r"><circle class="stick-base" cx="330" cy="226" r="34"/><circle class="stick-cap" cx="330" cy="226" r="20"/></g></g>
  <g class="pad-mini"><rect data-btn="8" x="226" y="140" width="28" height="12" rx="6"/><rect data-btn="9" x="266" y="140" width="28" height="12" rx="6"/></g>
</svg>`);
}

export const noscriptNote = html`<noscript><p class="notice">${icon('info')} O emulador precisa de JavaScript e WebAssembly. Ative o JavaScript no navegador para jogar.</p></noscript>`;
