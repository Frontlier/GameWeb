// Testes unitários (npm test). Usam uma pasta de dados temporária.
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';

const DATA = mkdtempSync(join(tmpdir(), 'gameweb-test-'));
process.env.DATA_DIR = DATA;
process.env.ADMIN_PASSWORD = 'Senha-de-Teste-123!';

const util = await import('../src/util.js');
const crypto = await import('../src/crypto.js');
const db = await import('../src/db.js');
const seo = await import('../src/seo.js');
const { SYSTEMS, systemById, systemBySlug, systemFaq } = await import('../src/systems.js');

before(async () => { await db.initDb(); });
after(async () => { await db.flushAll(); rmSync(DATA, { recursive: true, force: true }); });

describe('util', () => {
  it('slugify remove acentos e símbolos', () => {
    assert.equal(util.slugify('Ação & Aventura: Edição 2!'), 'acao-aventura-edicao-2');
    assert.equal(util.slugify('  --  '), '');
  });
  it('html`` escapa valores e preserva HTML confiável', () => {
    const evil = '<img src=x onerror=alert(1)>';
    assert.equal(String(util.html`<p>${evil}</p>`), '<p>&lt;img src=x onerror=alert(1)&gt;</p>');
    assert.equal(String(util.html`<p>${util.raw('<b>ok</b>')}</p>`), '<p><b>ok</b></p>');
    assert.equal(String(util.html`<ul>${['a', '<b>'].map((x) => util.html`<li>${x}</li>`)}</ul>`), '<ul><li>a</li><li>&lt;b&gt;</li></ul>');
  });
  it('truncate respeita limite e palavras', () => {
    const t = util.truncate('uma frase bem longa para cortar no limite certo', 20);
    assert.ok(t.length <= 20 && t.endsWith('…'));
  });
  it('paragraphs separa parágrafos e escapa', () => {
    assert.equal(String(util.paragraphs('a\n\n<b>')), '<p>a</p><p>&lt;b&gt;</p>');
  });
});

describe('crypto', () => {
  it('hash e verificação de senha (scrypt)', async () => {
    const h = await crypto.hashPassword('minha-senha');
    assert.match(h, /^scrypt\$/);
    assert.equal(await crypto.verifyPassword('minha-senha', h), true);
    assert.equal(await crypto.verifyPassword('outra', h), false);
    assert.equal(await crypto.verifyPassword('x', 'lixo'), false);
  });
  it('política de senha', () => {
    assert.ok(crypto.passwordProblem('curta'));
    assert.ok(crypto.passwordProblem('somenteminusculas'));
    assert.ok(crypto.passwordProblem('Admin-Senha-1!x', 'admin'));
    assert.equal(crypto.passwordProblem('Boa-Senha-2026!'), null);
  });
  it('senha gerada é forte e legível', () => {
    const p = crypto.generatePassword();
    assert.match(p, /^[A-Za-z2-9]{4}(-[A-Za-z2-9]{4}){3}$/);
    assert.equal(crypto.passwordProblem(p.replaceAll('-', '') + '!'), null);
  });
});

describe('sistemas', () => {
  it('ids e slugs únicos, campos obrigatórios', () => {
    assert.equal(new Set(SYSTEMS.map((s) => s.id)).size, SYSTEMS.length);
    assert.equal(new Set(SYSTEMS.map((s) => s.slug)).size, SYSTEMS.length);
    for (const s of SYSTEMS) {
      for (const k of ['name', 'short', 'slug', 'title', 'description', 'intro', 'color', 'pad', 'requirements']) assert.ok(s[k], `${s.id} sem ${k}`);
      assert.ok(s.title.length <= 70, `${s.id}: título longo (${s.title.length})`);
      assert.ok(s.description.length <= 170, `${s.id}: descrição longa (${s.description.length})`);
      if (s.engine === 'ejs') assert.ok(s.core, `${s.id} sem core`);
    }
  });
  it('busca por id/slug e FAQ gerado', () => {
    assert.equal(systemBySlug('ps1').id, 'psx');
    assert.equal(systemById('psp').short, 'PSP');
    assert.ok(systemFaq(systemById('psp')).length >= 4);
  });
});

describe('jogos (validação)', () => {
  const base = () => ({
    title: 'Jogo de Teste', system: 'gba', status: 'draft',
    rom: { kind: 'file', url: '/roms/apotris.gba' }, license: { name: 'MIT', redistribution: 'verified' }, rightsConfirmed: true,
  });
  it('catálogo inicial foi criado', () => {
    const slugs = db.listGames().map((g) => g.slug);
    for (const s of ['combat-soccer', 'mini-futebol', 'apotris']) assert.ok(slugs.includes(s), s);
  });
  it('exige título e console válidos', () => {
    const { errors } = db.sanitizeGame({ ...base(), title: 'x', system: 'nao-existe' });
    assert.ok(errors.title && errors.system);
  });
  it('slug é gerado e deve ser único', () => {
    const ok = db.sanitizeGame(base());
    assert.equal(ok.value.slug, 'jogo-de-teste');
    const dup = db.sanitizeGame({ ...base(), title: 'Combat Soccer' });
    assert.ok(dup.errors.slug);
  });
  it('publicar arquivo hospedado exige confirmar direitos', () => {
    assert.ok(db.sanitizeGame({ ...base(), status: 'published', rightsConfirmed: false }).errors.rightsConfirmed);
    assert.deepEqual(db.sanitizeGame({ ...base(), status: 'published' }).errors, {});
  });
  it('publicar sem arquivo é recusado', () => {
    assert.ok(db.sanitizeGame({ ...base(), status: 'published', rom: { kind: 'none' } }).errors.rom);
  });
  it('URLs perigosas são descartadas', () => {
    const { value } = db.sanitizeGame({ ...base(), cover: 'javascript:alert(1)', source: { name: 'x', url: 'http://inseguro.com' }, license: { name: 'MIT', url: 'data:text/html,x' } });
    assert.equal(value.cover, '');
    assert.equal(value.source.url, '');
    assert.equal(value.license.url, '');
    assert.equal(db.safeUrl('/uploads/img/a.png'), '/uploads/img/a.png');
    assert.equal(db.safeUrl('//evil.com/x'), '');
    assert.equal(db.safeUrl('/a/../b'), '');
    assert.equal(db.safeUrl('https://ok.com/a'), 'https://ok.com/a');
  });
  it('caminho do arquivo é restrito a /roms e /uploads/roms', () => {
    assert.equal(db.sanitizeGame({ ...base(), rom: { kind: 'file', url: '/data/users.json' } }).value.rom.kind, 'none');
    assert.equal(db.sanitizeGame({ ...base(), rom: { kind: 'file', url: '/uploads/roms/a.gba' } }).value.rom.kind, 'file');
  });
  it('jogo web força o console WEB; WEB não aceita ROM', () => {
    assert.equal(db.sanitizeGame({ ...base(), rom: { kind: 'web', url: '/web/x/index.html' } }).value.system, 'web');
    assert.ok(db.sanitizeGame({ ...base(), system: 'web' }).errors.system);
  });
  it('controles são normalizados', () => {
    const { value } = db.sanitizeGame({ ...base(), controls: [['Mover', 'Setas'], ['', 'x'], ['Chutar', '']] });
    assert.deepEqual(value.controls, [['Mover', 'Setas']]);
  });
  it('publishedGames respeita console desativado', () => {
    const before = db.publishedGames().length;
    db.updateSystemOverride('gba', { enabled: false });
    assert.ok(db.publishedGames().length < before);
    assert.ok(db.publishedGames().every((g) => g.system !== 'gba'));
    db.updateSystemOverride('gba', { enabled: true });
    assert.equal(db.publishedGames().length, before);
  });
});

describe('usuários e sessões', () => {
  it('admin inicial criado com a senha do ambiente', async () => {
    const u = db.getUserByName('ADMIN');
    assert.ok(u);
    assert.equal(await crypto.verifyPassword('Senha-de-Teste-123!', u.passwordHash), true);
    assert.equal(u.mustChangePassword, false);
  });
  it('sessão expira e é destruída', () => {
    const u = db.getUserByName('admin');
    const token = db.createSession(u.id, { ip: '127.0.0.1', get: () => 'teste' });
    assert.ok(db.getSession(token));
    db.destroySession(token);
    assert.equal(db.getSession(token), null);
  });
});

describe('SEO', () => {
  const settings = db.getSettings();
  it('robots.txt respeita as opções de IA', () => {
    const on = seo.robotsTxt('https://x.com', settings);
    assert.match(on, /User-agent: GPTBot[\s\S]*?Allow: \//);
    assert.match(on, /Sitemap: https:\/\/x\.com\/sitemap\.xml/);
    assert.match(on, /Disallow: \/admin/);
    const off = seo.robotsTxt('https://x.com', { ...settings, seo: { ...settings.seo, aiTrainingBots: false } });
    assert.match(off, /User-agent: GPTBot[\s\S]*?Disallow: \/\n/);
  });
  it('sitemap tem URLs absolutas e imagens', () => {
    const xml = seo.sitemapXml('https://x.com', [{ path: '/jogos/a', image: '/covers/a.png', imageTitle: 'A & B' }]);
    assert.match(xml, /<loc>https:\/\/x\.com\/jogos\/a<\/loc>/);
    assert.match(xml, /<image:loc>https:\/\/x\.com\/covers\/a\.png<\/image:loc>/);
    assert.match(xml, /A &amp; B/);
  });
  it('llms.txt lista consoles e jogos', () => {
    const t = seo.llmsTxt('https://x.com', settings, db.listSystems(), db.publishedGames());
    assert.match(t, /^# GameWeb/);
    assert.match(t, /\[Emulador de PSP online\]\(https:\/\/x\.com\/consoles\/psp\)/);
    assert.match(t, /\/jogos\/combat-soccer/);
  });
  it('JSON-LD não permite fechar a tag script', () => {
    const tag = seo.jsonLdTag({ a: '</script><script>alert(1)</script>' });
    assert.ok(!tag.slice(0, -9).includes('</script>'));
  });
  it('meta tags: canonical, OG e robots', () => {
    const h = String(seo.headTags({ origin: 'https://x.com', settings, title: 'T "q"', description: 'D', path: '/p', noindex: true }));
    assert.match(h, /rel="canonical" href="https:\/\/x\.com\/p"/);
    assert.match(h, /content="noindex, follow"/);
    assert.match(h, /og:title" content="T &quot;q&quot;"/);
  });
});
