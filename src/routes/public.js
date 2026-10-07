import { existsSync } from 'node:fs';
import { libraryRelFromUrl, resolveLibraryFile } from '../library.js';
import { join } from 'node:path';
import express from 'express';
import { config } from '../config.js';
import {
  getGameBySlug, getSettings, listGames, listSystems, publishedGames, recordPlay, recordTier, recordView,
} from '../db.js';
import { atomFeed, llmsFullTxt, llmsTxt, robotsTxt, siteOrigin, sitemapXml } from '../seo.js';
import { rateLimit, setPageHeaders } from '../security.js';
import { systemById, systemBySlug } from '../systems.js';
import { BOT_RE } from '../util.js';
import { catalogPage, consolesPage, gamePage, systemPage } from '../views/catalog.js';
import { homePage } from '../views/home.js';
import { aboutPage, helpPage, legalPage, notFoundPage } from '../views/info.js';
import { pageTitle, renderPage } from '../views/layout.js';
import { playerPage } from '../views/player.js';

const CACHE_PAGE = 'public, max-age=60, stale-while-revalidate=600';

function makeCtx(req) {
  const settings = getSettings();
  const allGames = publishedGames();
  return { req, settings, origin: siteOrigin(req, settings), systems: listSystems(), allSystems: listSystems({ hidden: true }), games: allGames, allGames };
}

function send(res, ctx, page, { kind = 'site', status = 200, cache = CACHE_PAGE } = {}) {
  setPageHeaders(res, kind, { ga4: kind === 'site' ? ctx.settings.analytics.ga4 : '', plausible: kind === 'site' ? ctx.settings.analytics.plausibleDomain : '' });
  res.status(status).set('Cache-Control', cache).type('html').send(renderPage(ctx, { kind, ...page }));
}

const isBot = (req) => BOT_RE.test(req.get('user-agent') || '') || req.method === 'HEAD';
const view = (req, slug) => { if (!isBot(req)) recordView(slug); };

export function notFound(req, res) {
  const ctx = makeCtx(req);
  const { main } = notFoundPage(ctx);
  send(res, ctx, {
    title: pageTitle('Página não encontrada', ctx.settings.siteName), description: 'A página que você procura não existe.',
    path: req.path, main, noindex: true,
  }, { status: 404, cache: 'no-store' });
}

export function createPublicRouter() {
  const r = express.Router();

  // remove a barra final (evita conteúdo duplicado)
  r.use((req, res, next) => {
    if (req.method === 'GET' && req.path.length > 1 && req.path.endsWith('/') && !req.path.startsWith('/emu/')) {
      const q = req.originalUrl.slice(req.path.length);
      return res.redirect(301, req.path.replace(/\/+$/, '') + q);
    }
    next();
  });

  /* ------------------------------------------------------------ páginas */
  r.get('/', (req, res) => {
    const ctx = makeCtx(req);
    const { main, jsonld } = homePage(ctx);
    view(req);
    send(res, ctx, {
      title: `${ctx.settings.siteName}: emulador online para jogar PS2, PSP e clássicos`, description: ctx.settings.description, path: '/', main, jsonld,
      imageAlt: `${ctx.settings.siteName} — emulador online no navegador`,
    });
  });

  r.get('/jogos', (req, res) => {
    const ctx = makeCtx(req);
    const q = String(req.query.q || '').slice(0, 80);
    const system = systemById(String(req.query.console || '')) ? String(req.query.console) : '';
    const genre = String(req.query.genero || '').slice(0, 40);
    ctx.games = publishedGames({ q, system, genre });
    const { main, jsonld, noindex } = catalogPage(ctx, { q, system, genre });
    view(req);
    send(res, ctx, {
      title: pageTitle('Jogos grátis para jogar no navegador', ctx.settings.siteName),
      description: 'Catálogo de jogos livres e homebrew para jogar online no navegador, no PC ou no celular, com teclado ou controle. Sem instalar nada.',
      path: '/jogos', main, jsonld, noindex,
    });
  });

  r.get('/jogos/:slug', (req, res, next) => {
    const g = getGameBySlug(req.params.slug);
    if (!g || g.status !== 'published' || !systemById(g.system)) return next();
    const ctx = makeCtx(req);
    const page = gamePage(ctx, g);
    view(req, g.slug);
    const og = existsSync(join(config.publicDir, 'og', g.slug + '.png')) ? `/og/${g.slug}.png` : page.ogImage;
    send(res, ctx, {
      title: pageTitle(page.title, ctx.settings.siteName), description: page.description, path: `/jogos/${g.slug}`,
      main: page.main, jsonld: page.jsonld, ogImage: og, ogType: 'article', imageAlt: `Imagem do jogo ${g.title}`,
    });
  });

  r.get('/consoles', (req, res) => {
    const ctx = makeCtx(req);
    const { main, jsonld } = consolesPage(ctx);
    view(req);
    send(res, ctx, {
      title: 'Consoles suportados: PS2, PSP, PS1, N64, GBA e mais',
      description: 'Veja os consoles que rodam no navegador (PS2, PSP, PS1, N64, Nintendo DS, GBA, SNES e mais), os formatos aceitos e o que cada um exige do seu aparelho.',
      path: '/consoles', main, jsonld,
    });
  });

  r.get('/consoles/:slug', (req, res, next) => {
    const base = systemBySlug(req.params.slug);
    const s = base && listSystems().find((x) => x.id === base.id);
    if (!s) return next();
    const ctx = makeCtx(req);
    const { main, jsonld } = systemPage(ctx, s);
    view(req);
    send(res, ctx, { title: pageTitle(s.title, ctx.settings.siteName), description: s.description, path: `/consoles/${s.slug}`, main, jsonld, imageAlt: s.title });
  });

  /* jogos da pasta local (ROMS_DIR): só serve o que está vinculado a um jogo publicado */
  r.get(/^\/library\/.+/, (req, res, next) => {
    let wanted;
    try { wanted = decodeURIComponent(req.path.slice('/library/'.length)); } catch { return next(); }
    const linked = listGames().some((g) => g.status === 'published' && g.rom.kind === 'file' && libraryRelFromUrl(g.rom.url) === wanted);
    const file = linked && resolveLibraryFile(wanted);
    if (!file) return next();
    res.set({ 'Cross-Origin-Resource-Policy': 'same-origin', 'X-Robots-Tag': 'noindex', 'Cache-Control': 'no-cache', 'Accept-Ranges': 'bytes' });
    res.sendFile(file, { dotfiles: 'deny', cacheControl: false }, (err) => { if (err && !res.headersSent) next(); });
  });

  /* player: páginas isoladas (COOP/COEP) para SharedArrayBuffer/threads */
  r.get('/jogar/:slug', (req, res, next) => {
    const g = getGameBySlug(req.params.slug);
    if (!g || g.status !== 'published' || !systemById(g.system) || g.rom.kind === 'none') return next();
    const ctx = makeCtx(req);
    const { main, title } = playerPage(ctx, { mode: 'catalog', game: g });
    send(res, ctx, {
      title: `${title} — jogar online | ${ctx.settings.siteName}`, description: `Jogue ${g.title} online no navegador.`, path: `/jogar/${g.slug}`,
      main, noindex: true, chrome: false, bodyClass: 'is-player', scripts: ['/js/player.js'],
    }, { kind: g.rom.kind === 'web' ? 'webgame' : 'player', cache: 'no-cache' });
  });

  const byo = (req, res, next) => {
    let sys = null;
    if (req.params.slug) {
      const base = systemBySlug(req.params.slug);
      sys = base && listSystems().find((x) => x.id === base.id);
      if (!sys) return next();
    }
    const ctx = makeCtx(req);
    const { main, title } = playerPage(ctx, { mode: 'byo', system: sys });
    send(res, ctx, {
      title: `${title} | ${ctx.settings.siteName}`, description: 'Abra o arquivo do seu jogo e jogue no navegador. O arquivo fica no seu aparelho.',
      path: req.path, main, noindex: true, chrome: false, bodyClass: 'is-player', scripts: ['/js/player.js'],
    }, { kind: 'player', cache: 'no-cache' });
  };
  r.get('/emulador', byo);
  r.get('/emulador/:slug', byo);

  r.get('/ajuda', (req, res) => {
    const ctx = makeCtx(req);
    const { main, jsonld } = helpPage(ctx);
    view(req);
    send(res, ctx, {
      title: 'Ajuda: como jogar com teclado, controle e no celular',
      description: 'Guia para jogar no navegador: mapa de teclas, como conectar controles de Xbox e PlayStation, jogar no celular e resolver travamentos e erros comuns.',
      path: '/ajuda', main, jsonld,
    });
  });
  r.get('/sobre', (req, res) => {
    const ctx = makeCtx(req);
    const { main, jsonld } = aboutPage(ctx);
    send(res, ctx, { title: pageTitle(`Sobre o ${ctx.settings.siteName}`, ctx.settings.siteName), description: ctx.settings.description, path: '/sobre', main, jsonld });
  });
  r.get('/legal', (req, res) => {
    const ctx = makeCtx(req);
    const { main, jsonld } = legalPage(ctx);
    send(res, ctx, {
      title: 'Aviso legal, privacidade e licenças', path: '/legal', main, jsonld,
      description: `Direitos autorais, privacidade e licenças de software livre do ${ctx.settings.siteName}.`,
    });
  });

  /* ------------------------------------------------------------ arquivos para buscadores e IAs */
  const text = (res, type, body, cache = 'public, max-age=3600') => res.type(type).set('Cache-Control', cache).send(body);

  r.get('/robots.txt', (req, res) => { const c = makeCtx(req); text(res, 'text/plain; charset=utf-8', robotsTxt(c.origin, c.settings)); });

  r.get('/sitemap.xml', (req, res) => {
    const c = makeCtx(req);
    const built = c.settings.updatedAt || new Date().toISOString();
    const entries = [
      { path: '/', priority: 1, changefreq: 'weekly', lastmod: built },
      { path: '/jogos', priority: 0.9, changefreq: 'weekly', lastmod: c.allGames[0]?.updatedAt || built },
      { path: '/consoles', priority: 0.9, lastmod: built },
      ...c.systems.map((s) => ({ path: `/consoles/${s.slug}`, priority: 0.8, lastmod: built })),
      ...c.allGames.map((g) => ({ path: `/jogos/${g.slug}`, priority: 0.7, lastmod: g.updatedAt, image: g.cover, imageTitle: g.title })),
      { path: '/ajuda', priority: 0.6, lastmod: built }, { path: '/sobre', priority: 0.3, changefreq: 'monthly', lastmod: built }, { path: '/legal', priority: 0.2, changefreq: 'monthly', lastmod: built },
    ];
    text(res, 'application/xml; charset=utf-8', sitemapXml(c.origin, entries));
  });

  r.get('/llms.txt', (req, res) => { const c = makeCtx(req); text(res, 'text/plain; charset=utf-8', llmsTxt(c.origin, c.settings, c.systems, c.allGames)); });
  r.get('/llms-full.txt', (req, res) => { const c = makeCtx(req); text(res, 'text/plain; charset=utf-8', llmsFullTxt(c.origin, c.settings, c.systems, c.allGames)); });
  r.get('/feed.xml', (req, res) => { const c = makeCtx(req); text(res, 'application/atom+xml; charset=utf-8', atomFeed(c.origin, c.settings, [...c.allGames].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)))); });

  r.get('/manifest.webmanifest', (req, res) => {
    const { settings } = makeCtx(req);
    text(res, 'application/manifest+json; charset=utf-8', JSON.stringify({
      name: `${settings.siteName} — emulador online`, short_name: settings.siteName, description: settings.description,
      lang: 'pt-BR', start_url: '/?utm_source=pwa', scope: '/', display: 'standalone', orientation: 'any',
      background_color: '#07080f', theme_color: '#07080f', categories: ['games', 'entertainment'],
      icons: [
        { src: '/img/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/img/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/img/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
      shortcuts: [{ name: 'Jogos', url: '/jogos' }, { name: 'Abrir meu jogo', url: '/emulador' }],
    }), 'public, max-age=86400');
  });

  r.get('/healthz', (req, res) => res.json({ ok: true }));

  /* ------------------------------------------------------------ estatísticas anônimas (agregadas) */
  r.post('/api/event', rateLimit({ windowMs: 60e3, max: 90 }), express.json({ limit: '2kb' }), (req, res) => {
    if (!isBot(req)) {
      const b = req.body || {};
      if (b.t === 'play') {
        const g = typeof b.game === 'string' ? getGameBySlug(b.game) : null;
        const sys = g ? g.system : (systemById(String(b.system || '')) ? String(b.system) : null);
        if (g || sys) recordPlay({ game: g?.slug, system: sys });
      } else if (b.t === 'tier' && [1, 2, 3, 4].includes(b.tier)) {
        recordTier(b.tier);
      }
    }
    res.status(204).end();
  });

  return r;
}
