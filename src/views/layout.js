import { statSync } from 'node:fs';
import { join } from 'node:path';
import { config } from '../config.js';
import { THEME_SCRIPT } from '../security.js';
import { headTags } from '../seo.js';
import { esc, html, raw } from '../util.js';
import { icon, spriteSvg } from './components.js';

/* URL de asset com versão (mtime) para cache imutável */
const vcache = new Map();
export function asset(path) {
  let v = vcache.get(path);
  if (!v || !config.isProd) {
    try { v = Math.floor(statSync(join(config.publicDir, path)).mtimeMs / 1000).toString(36); } catch { v = '0'; }
    vcache.set(path, v);
  }
  return `${path}?v=${v}`;
}

/** Acrescenta " | Nome" ao título se couber em ~62 caracteres. */
export const pageTitle = (title, siteName) => (title.length + siteName.length + 3 <= 62 ? `${title} | ${siteName}` : title);

function header(ctx) {
  const { settings } = ctx;
  return html`
  ${settings.announcement.enabled && settings.announcement.text ? html`<div class="announce">${settings.announcement.link
    ? html`<a href="${settings.announcement.link}">${settings.announcement.text} ${icon('arrow')}</a>` : settings.announcement.text}</div>` : ''}
  <header class="site-header" data-header>
    <div class="container header-inner">
      <a class="brand" href="/" aria-label="${settings.siteName} — página inicial"><img src="/img/logo.svg" width="36" height="36" alt=""><span>${settings.siteName}</span></a>
      <nav class="nav" id="nav" aria-label="Principal">
        <a href="/jogos">Jogos</a><a href="/consoles">Consoles</a><a href="/ajuda">Ajuda</a><a class="nav-cta" href="/emulador">${icon('upload')}Abrir meu jogo</a>
      </nav>
      <div class="header-actions">
        <button class="device-pill" type="button" data-device-pill hidden title="Resultado do teste do seu aparelho"><span class="dot"></span><span data-device-label></span></button>
        <button class="icon-btn" type="button" data-theme-toggle aria-label="Alternar tema claro/escuro">${icon('moon', 'only-dark')}${icon('sun', 'only-light')}</button>
        <button class="icon-btn nav-toggle" type="button" aria-label="Abrir menu" aria-expanded="false" aria-controls="nav" data-nav-toggle>${icon('menu', 'm-open')}${icon('close', 'm-close')}</button>
      </div>
    </div>
  </header>`;
}

function footer(ctx) {
  const { settings, systems } = ctx;
  const year = new Date().getFullYear();
  return html`<footer class="site-footer">
    <div class="container footer-grid">
      <div class="footer-brand">
        <a class="brand" href="/"><img src="/img/logo.svg" width="32" height="32" alt=""><span>${settings.siteName}</span></a>
        <p class="muted">${settings.tagline}. Emuladores em WebAssembly, com teclado, controle e toque, direto no navegador.</p>
      </div>
      <nav aria-label="Consoles"><h2 class="foot-title">Consoles</h2><ul>${systems.slice(0, 7).map((s) => html`<li><a href="/consoles/${s.slug}">Emulador de ${s.nick}</a></li>`)}</ul></nav>
      <nav aria-label="Explorar"><h2 class="foot-title">Explorar</h2><ul>
        <li><a href="/jogos">Jogos livres</a></li><li><a href="/consoles">Todos os consoles</a></li><li><a href="/emulador">Abrir meu jogo</a></li><li><a href="/ajuda">Ajuda e controles</a></li></ul></nav>
      <nav aria-label="Informações"><h2 class="foot-title">Informações</h2><ul>
        <li><a href="/sobre">Sobre</a></li><li><a href="/legal">Aviso legal e privacidade</a></li><li><a href="/feed.xml">Feed de novidades</a></li><li><a href="/sitemap.xml">Mapa do site</a></li></ul></nav>
    </div>
    <div class="container footer-bottom">
      <p>© ${year} ${settings.siteName}. O ${settings.siteName} não hospeda jogos comerciais: arquivos abertos pelo visitante ficam somente no navegador dele.</p>
      <p>Emuladores: <a href="https://emulatorjs.org" rel="noopener">EmulatorJS</a> (GPL-3.0) e <a href="https://purei.org" rel="noopener">Play!</a> (BSD-2-Clause). <a href="/legal#licencas">Licenças</a></p>
    </div>
  </footer>`;
}

/**
 * Monta a página completa.
 * page: { title, description, path, ogImage, ogType, noindex, jsonld[], main, scripts[], bodyClass, chrome=true, imageAlt }
 */
export function renderPage(ctx, page) {
  const { settings, origin } = ctx;
  const chrome = page.chrome !== false;
  const head = headTags({
    origin, settings, title: page.title, description: page.description, path: page.path,
    ogImage: page.ogImage, ogType: page.ogType, noindex: page.noindex, jsonld: page.jsonld || [], imageAlt: page.imageAlt,
  });
  const ga = settings.analytics.ga4, pl = settings.analytics.plausibleDomain;
  const analytics = page.kind !== 'site' ? '' : [
    ga ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${esc(ga)}"></script><script defer src="/js/ga.js?id=${esc(ga)}"></script>` : '',
    pl ? `<script defer data-domain="${esc(pl)}" src="https://plausible.io/js/script.js"></script>` : '',
  ].join('');
  return '<!doctype html>\n' + html`<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<script>${raw(THEME_SCRIPT)}</script>
<link rel="preload" href="/fonts/inter-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/space-grotesk-latin.woff2" as="font" type="font/woff2" crossorigin>
${head}
<link rel="icon" href="/img/logo.svg" type="image/svg+xml">
<link rel="icon" href="/img/icon-192.png" sizes="192x192" type="image/png">
<link rel="apple-touch-icon" href="/img/apple-touch-icon.png">
<link rel="manifest" href="/manifest.webmanifest">
<meta name="theme-color" content="#07080f" media="(prefers-color-scheme: dark)"><meta name="theme-color" content="#f4f5ff" media="(prefers-color-scheme: light)">
<link rel="alternate" type="application/atom+xml" title="Novos jogos" href="/feed.xml">
<link rel="stylesheet" href="${asset('/css/site.css')}">
</head>
<body class="${page.bodyClass || ''}">
${spriteSvg()}
${chrome ? html`<a class="skip-link" href="#main">Pular para o conteúdo</a>${header(ctx)}` : ''}
<main id="main">${page.main}</main>
${chrome ? footer(ctx) : ''}
<div class="toasts" data-toasts aria-live="polite"></div>
${raw(analytics)}
<script src="${asset('/js/site.js')}" defer></script>
${(page.scripts || []).map((s) => raw(`<script src="${esc(asset(s))}" defer></script>`))}
</body>
</html>`.toString();
}
