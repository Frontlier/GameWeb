// Gera capturas de tela "de vitrine" (site, player, jogo HTML5, painel) em uma instância temporária.
// Uso: node scripts/qa/showcase.mjs [pasta-de-saida]
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { launch, sleep } from './lib.mjs';

const OUT = process.argv[2] || join(process.cwd(), 'qa-output', 'vitrine');
mkdirSync(OUT, { recursive: true });
const PORT = 3300, BASE = `http://localhost:${PORT}`;
const DATA = mkdtempSync(join(tmpdir(), 'gameweb-show-'));
const PASS = 'Vitrine-Teste-2026!x';
const server = spawn(process.execPath, ['server.js'], { cwd: process.cwd(), env: { ...process.env, PORT: String(PORT), DATA_DIR: DATA, ADMIN_PASSWORD: PASS }, stdio: 'ignore' });
for (let i = 0; i < 40; i++) { try { if ((await fetch(BASE + '/healthz')).ok) break; } catch { /* aguardando */ } await sleep(250); }

// um pouco de tráfego fictício para o painel não ficar vazio
for (let i = 0; i < 40; i++) {
  await fetch(BASE + ['/', '/jogos', '/jogos/combat-soccer', '/jogos/mini-futebol', '/consoles/psp'][i % 5], { headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0) Chrome/130' } });
  if (i % 3 === 0) await fetch(BASE + '/api/event', { method: 'POST', headers: { 'content-type': 'application/json', 'user-agent': 'Mozilla/5.0 Chrome/130' }, body: JSON.stringify({ t: 'play', game: i % 2 ? 'combat-soccer' : 'mini-futebol' }) });
  if (i % 4 === 0) await fetch(BASE + '/api/event', { method: 'POST', headers: { 'content-type': 'application/json', 'user-agent': 'Mozilla/5.0 Chrome/130' }, body: JSON.stringify({ t: 'tier', tier: 1 + (i % 4) }) });
}

const browser = await launch();
const shot = async (page, name, o = {}) => { await page.screenshot({ path: join(OUT, name + '.png'), ...o }); console.log('ok', name); };
try {
  const dark = async (page) => page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);

  let page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 800 });
  await dark(page);
  await page.goto(BASE + '/', { waitUntil: 'networkidle0' }); await sleep(1500);
  await shot(page, '01-home');
  await page.evaluate(() => document.querySelector('#aparelho').scrollIntoView()); await sleep(1800);
  await shot(page, '02-teste-do-aparelho');
  await page.goto(BASE + '/jogos/combat-soccer', { waitUntil: 'networkidle0' }); await sleep(1500);
  await shot(page, '03-pagina-do-jogo');

  page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 800 });
  await dark(page);
  await page.goto(BASE + '/jogar/combat-soccer', { waitUntil: 'networkidle0' }); await sleep(600);
  await page.click('[data-play]'); await sleep(6000);
  await page.keyboard.press('Enter'); await sleep(600);
  await page.keyboard.down('Enter'); await sleep(150); await page.keyboard.up('Enter'); await sleep(1500);
  await page.keyboard.down('ArrowRight'); await sleep(500); await page.keyboard.up('ArrowRight'); await sleep(500);
  await shot(page, '04-player-combat-soccer');

  page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 800 });
  await dark(page);
  await page.goto(BASE + '/jogar/mini-futebol', { waitUntil: 'networkidle0' }); await sleep(500);
  await page.click('[data-play]'); await sleep(1500);
  await page.keyboard.press('Enter'); await sleep(500);
  await page.keyboard.down('ArrowRight'); await sleep(1700); await page.keyboard.up('ArrowRight'); await sleep(300);
  await shot(page, '05-player-mini-futebol');

  page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 860 });
  await page.goto(BASE + '/admin', { waitUntil: 'networkidle0' });
  await page.type('#u', 'admin'); await page.type('#p', PASS);
  await page.click('button[type=submit]'); await sleep(1800);
  await shot(page, '06-painel-visao-geral');
  await page.goto(BASE + '/admin#/games', { waitUntil: 'networkidle0' }); await sleep(900);
  await shot(page, '07-painel-jogos');

  page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await dark(page);
  await page.goto(BASE + '/', { waitUntil: 'networkidle0' }); await sleep(1500);
  await shot(page, '08-celular-home');
} finally {
  await browser.close();
  server.kill();
  rmSync(DATA, { recursive: true, force: true });
}
