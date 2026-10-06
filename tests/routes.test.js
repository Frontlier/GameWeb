// Testes de integração: sobem o servidor com dados temporários e verificam rotas, cabeçalhos e o painel.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';

const DATA = mkdtempSync(join(tmpdir(), 'gameweb-route-test-'));
const PASS = 'Senha-de-Teste-123!';
let BASE = '';
let server;

const freePort = () => new Promise((res) => { const s = createServer(); s.listen(0, () => { const { port } = s.address(); s.close(() => res(port)); }); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const get = (path, init) => fetch(BASE + path, { redirect: 'manual', ...init });

before(async () => {
  const port = await freePort();
  BASE = `http://localhost:${port}`;
  server = spawn(process.execPath, ['server.js'], { cwd: process.cwd(), env: { ...process.env, PORT: String(port), DATA_DIR: DATA, ADMIN_PASSWORD: PASS }, stdio: 'ignore' });
  for (let i = 0; i < 60; i++) { try { if ((await fetch(BASE + '/healthz')).ok) return; } catch { /* aguardando */ } await sleep(250); }
  throw new Error('servidor não iniciou');
});
after(() => { server?.kill(); rmSync(DATA, { recursive: true, force: true }); });

describe('páginas públicas', () => {
  const pages = ['/', '/jogos', '/jogos/combat-soccer', '/jogos/mini-futebol', '/consoles', '/consoles/ps2', '/consoles/psp', '/ajuda', '/sobre', '/legal', '/emulador', '/emulador/psp', '/jogar/combat-soccer'];
  for (const p of pages) {
    it(`GET ${p} -> 200 HTML`, async () => {
      const r = await get(p);
      assert.equal(r.status, 200);
      assert.match(r.headers.get('content-type'), /text\/html/);
      const html = await r.text();
      assert.match(html, /<html lang="pt-BR">/);
      assert.match(html, /<title>[^<]{10,}<\/title>/);
      assert.ok(!/\[object Object\]|undefined/.test(html), 'artefato de template');
      for (const m of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)) JSON.parse(m[1]);
    });
  }
  it('home tem canonical, description e JSON-LD (WebSite, FAQPage)', async () => {
    const html = await (await get('/')).text();
    assert.match(html, /<link rel="canonical" href="http:\/\/localhost:\d+\/">/);
    assert.match(html, /<meta name="description" content="[^"]{80,}">/);
    assert.match(html, /"@type":"WebSite"/);
    assert.match(html, /"@type":"FAQPage"/);
  });
  it('página do jogo tem VideoGame + Breadcrumb', async () => {
    const html = await (await get('/jogos/combat-soccer')).text();
    assert.match(html, /"@type":"VideoGame"/);
    assert.match(html, /"@type":"BreadcrumbList"/);
    assert.match(html, /<h1[^>]*>Combat Soccer/);
  });
  it('páginas do player são noindex', async () => {
    for (const p of ['/jogar/combat-soccer', '/emulador']) assert.match(await (await get(p)).text(), /content="noindex, follow"/);
  });
  it('404 retorna status 404 e noindex', async () => {
    const r = await get('/nao-existe');
    assert.equal(r.status, 404);
    assert.match(await r.text(), /noindex/);
    assert.equal((await get('/jogos/nao-existe')).status, 404);
    assert.equal((await get('/consoles/nao-existe')).status, 404);
    assert.equal((await get('/jogar/nao-existe')).status, 404);
  });
  it('barra final redireciona (301)', async () => {
    const r = await get('/jogos/');
    assert.equal(r.status, 301);
    assert.equal(r.headers.get('location'), '/jogos');
  });
  it('filtros do catálogo funcionam no servidor', async () => {
    const html = await (await get('/jogos?q=soccer')).text();
    assert.match(html, /Combat Soccer/);
    assert.ok(!/Apotris/.test(html.split('data-catalog-grid')[1] || ''));
    assert.match(html, /content="noindex, follow"/);
  });
});

describe('cabeçalhos de segurança e isolamento', () => {
  it('páginas do player têm COOP/COEP e CSP própria', async () => {
    const r = await get('/jogar/combat-soccer');
    assert.equal(r.headers.get('cross-origin-opener-policy'), 'same-origin');
    assert.equal(r.headers.get('cross-origin-embedder-policy'), 'require-corp');
    assert.match(r.headers.get('content-security-policy'), /wasm-unsafe-eval/);
  });
  it('páginas normais não usam COEP (permitem analytics/embeds)', async () => {
    const r = await get('/');
    assert.equal(r.headers.get('cross-origin-embedder-policy'), null);
    assert.match(r.headers.get('content-security-policy'), /default-src 'self'/);
    assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
    assert.match(r.headers.get('permissions-policy'), /gamepad=\(self\)/);
  });
  it('emuladores e ROMs são servidos com isolamento', async () => {
    const e = await get('/emu/ejs/loader.js');
    assert.equal(e.status, 200);
    assert.equal(e.headers.get('cross-origin-embedder-policy'), 'require-corp');
    const play = await get('/emu/play/');
    assert.equal(play.status, 200);
    assert.equal(play.headers.get('cross-origin-embedder-policy'), 'require-corp');
    const rom = await get('/roms/combat-soccer.gbc');
    assert.equal(rom.status, 200);
    assert.equal(rom.headers.get('cross-origin-resource-policy'), 'same-origin');
  });
  it('suporta Range em arquivos grandes', async () => {
    const r = await get('/roms/apotris.gba', { headers: { range: 'bytes=0-99' } });
    assert.equal(r.status, 206);
    assert.equal((await r.arrayBuffer()).byteLength, 100);
  });
  it('painel: noindex, sem cache e CSP restrita', async () => {
    const r = await get('/admin');
    assert.equal(r.status, 200);
    assert.match(r.headers.get('x-robots-tag'), /noindex/);
    assert.equal(r.headers.get('cache-control'), 'no-store');
    assert.match(r.headers.get('content-security-policy'), /frame-ancestors 'none'/);
    assert.equal(r.headers.get('x-frame-options'), 'DENY');
  });
  it('pasta de dados e arquivos sensíveis não são públicos', async () => {
    for (const p of ['/data/users.json', '/data/settings.json', '/../data/users.json', '/%2e%2e/data/users.json', '/package.json', '/server.js', '/.env', '/src/db.js']) {
      const r = await get(p);
      assert.equal(r.status, 404, `${p} -> ${r.status}`);
    }
  });
});

describe('SEO técnico', () => {
  it('robots.txt, sitemap.xml, llms.txt, feed e manifest', async () => {
    const robots = await (await get('/robots.txt')).text();
    assert.match(robots, /Sitemap: http:\/\/localhost:\d+\/sitemap\.xml/);
    assert.match(robots, /User-agent: OAI-SearchBot/);
    const sm = await get('/sitemap.xml');
    assert.match(sm.headers.get('content-type'), /xml/);
    const xml = await sm.text();
    assert.match(xml, /<loc>http:\/\/localhost:\d+\/jogos\/combat-soccer<\/loc>/);
    assert.match(xml, /\/consoles\/ps2/);
    assert.ok(!/\/jogar\/|\/emulador|\/admin/.test(xml), 'sitemap não deve listar player/admin');
    assert.match(robots, /Disallow: \/admin/);
    assert.ok(!/Disallow: \/jogar/.test(robots), 'player usa noindex (precisa ser rastreável)');
    const llms = await (await get('/llms.txt')).text();
    assert.match(llms, /^# GameWeb/);
    assert.match((await (await get('/llms-full.txt')).text()), /Perguntas frequentes/);
    assert.match(await (await get('/feed.xml')).text(), /<feed xmlns="http:\/\/www\.w3\.org\/2005\/Atom"/);
    const mf = await (await get('/manifest.webmanifest')).json();
    assert.equal(mf.display, 'standalone');
    assert.ok(mf.icons.length >= 3);
  });
  it('imagens de compartilhamento e ícones existem', async () => {
    for (const p of ['/img/og-default.png', '/img/icon-192.png', '/img/icon-512.png', '/img/logo.svg', '/og/combat-soccer.png', '/sw.js']) assert.equal((await get(p)).status, 200, p);
  });
});

describe('API pública', () => {
  it('/api/event aceita eventos e ignora lixo', async () => {
    const send = (body) => get('/api/event', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    assert.equal((await send({ t: 'tier', tier: 3 })).status, 204);
    assert.equal((await send({ t: 'play', game: 'combat-soccer' })).status, 204);
    assert.equal((await send({ t: 'x', tier: 'abc' })).status, 204);
  });
});

describe('painel administrativo (API)', () => {
  let cookie = '', csrf = '';
  const api = (method, path, body, extra = {}) => get('/api/admin' + path, {
    method, headers: { cookie, ...(csrf ? { 'x-csrf-token': csrf } : {}), ...(body ? { 'content-type': 'application/json' } : {}), ...extra }, body: body ? JSON.stringify(body) : undefined,
  });
  it('sem sessão: 401 e /me informa não autenticado', async () => {
    assert.equal((await api('GET', '/games')).status, 401);
    assert.deepEqual(await (await api('GET', '/me')).json(), { authenticated: false });
  });
  it('login com senha errada é recusado', async () => {
    const r = await get('/api/admin/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: 'admin', password: 'errada-123' }) });
    assert.equal(r.status, 401);
  });
  it('login correto cria sessão (cookie HttpOnly + SameSite=Strict)', async () => {
    const r = await get('/api/admin/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: 'admin', password: PASS }) });
    assert.equal(r.status, 200);
    const sc = r.headers.get('set-cookie');
    assert.match(sc, /gw_sid=/); assert.match(sc, /HttpOnly/i); assert.match(sc, /SameSite=Strict/i);
    cookie = sc.split(';')[0];
    csrf = (await r.json()).csrf;
    assert.ok(csrf.length > 20);
  });
  it('escrita exige token CSRF', async () => {
    const saved = csrf; csrf = '';
    assert.equal((await api('PUT', '/settings', { siteName: 'X' })).status, 403);
    csrf = saved;
    assert.equal((await api('PUT', '/settings', { siteName: 'GameWeb Teste' })).status, 200);
    assert.match(await (await get('/')).text(), /<title>GameWeb Teste:/);
  });
  it('CRUD de jogo: valida, cria, edita e exclui', async () => {
    const bad = await api('POST', '/games', { title: 'a', system: 'gba' });
    assert.equal(bad.status, 422);
    const payload = { title: 'Jogo API', system: 'gb', status: 'published', rom: { kind: 'file', url: '/roms/max-pirate.gb' }, rightsConfirmed: true, license: { name: 'MIT', redistribution: 'verified' } };
    const created = await api('POST', '/games', payload);
    assert.equal(created.status, 201);
    const g = await created.json();
    assert.equal((await get('/jogos/jogo-api')).status, 200);
    const upd = await api('PUT', `/games/${g.id}`, { ...g, tagline: 'Editado', status: 'draft' });
    assert.equal(upd.status, 200);
    assert.equal((await get('/jogos/jogo-api')).status, 404, 'rascunho não aparece no site');
    assert.equal((await api('DELETE', `/games/${g.id}`)).status, 200);
    assert.equal((await api('GET', `/games/${g.id}`)).status, 404);
  });
  it('upload recusa extensão perigosa e aceita imagem', async () => {
    const bad = new FormData(); bad.append('file', new Blob(['MZ']), 'virus.exe');
    assert.equal((await get('/api/admin/upload/rom', { method: 'POST', headers: { cookie, 'x-csrf-token': csrf }, body: bad })).status, 400);
    const bad2 = new FormData(); bad2.append('file', new Blob(['<script>']), 'x.html');
    assert.equal((await get('/api/admin/upload/image', { method: 'POST', headers: { cookie, 'x-csrf-token': csrf }, body: bad2 })).status, 400);
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==', 'base64');
    const ok = new FormData(); ok.append('file', new Blob([png], { type: 'image/png' }), 'pixel.png');
    const r = await get('/api/admin/upload/image', { method: 'POST', headers: { cookie, 'x-csrf-token': csrf }, body: ok });
    assert.equal(r.status, 201);
    const { url } = await r.json();
    assert.match(url, /^\/uploads\/img\/.+pixel\.png$/);
    assert.equal((await get(url)).status, 200);
    rmSync(join(process.cwd(), 'public', url), { force: true });
  });
  it('logout encerra a sessão', async () => {
    assert.equal((await api('POST', '/logout')).status, 200);
    assert.equal((await api('GET', '/games')).status, 401);
  });
});
