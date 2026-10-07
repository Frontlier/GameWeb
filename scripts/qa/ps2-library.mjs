// PS2 com jogo da pasta local (ROMS_DIR): sobe uma instância temporária, cadastra o primeiro ISO
// encontrado, abre o player no Chrome headless e acompanha download + inicialização do Play!.
// Uso: node scripts/qa/ps2-library.mjs [trecho-do-nome-do-arquivo]
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { launch, shot, sleep, watch } from './lib.mjs';

try { process.loadEnvFile('.env'); } catch { /* sem .env */ }
if (!process.env.ROMS_DIR) throw new Error('Defina ROMS_DIR no .env');

const DATA = mkdtempSync(join(tmpdir(), 'gameweb-ps2lib-'));
const PASS = 'Senha-de-Teste-123!';
const port = await new Promise((res) => { const s = createServer(); s.listen(0, () => { const { port: p } = s.address(); s.close(() => res(p)); }); });
const BASE = `http://localhost:${port}`;
const server = spawn(process.execPath, ['server.js'], { env: { ...process.env, PORT: String(port), DATA_DIR: DATA, ADMIN_PASSWORD: PASS }, stdio: 'ignore' });
const cleanup = () => { server.kill(); rmSync(DATA, { recursive: true, force: true }); };
process.on('exit', cleanup);

for (let i = 0; i < 60; i++) { try { if ((await fetch(BASE + '/healthz')).ok) break; } catch { /* aguardando */ } await sleep(250); }
const login = await fetch(BASE + '/api/admin/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: 'admin', password: PASS }) });
const cookie = login.headers.get('set-cookie').split(';')[0];
const { csrf } = await login.json();
const api = (method, path, body) => fetch(BASE + '/api/admin' + path, { method, headers: { cookie, 'x-csrf-token': csrf, 'content-type': 'application/json' }, body: body && JSON.stringify(body) });

const lib = await (await api('GET', '/library')).json();
const needle = (process.argv[2] || '').toLowerCase();
const f = lib.files.find((x) => /\.(iso|cso|chd|bin)$/i.test(x.name) && x.name.toLowerCase().includes(needle));
if (!f) throw new Error('Nenhum arquivo de PS2 encontrado na pasta: ' + JSON.stringify(lib.files.map((x) => x.path)));
console.log('arquivo:', f.path, (f.size / 1073741824).toFixed(2) + ' GB');
const created = await api('POST', '/games', { title: 'Teste PS2 Biblioteca', system: 'ps2', status: 'published', rom: { kind: 'file', url: f.url, size: f.size }, rightsConfirmed: true, license: { name: 'Teste local', redistribution: 'owner' } });
const game = await created.json();
if (created.status !== 201) throw new Error('Cadastro falhou: ' + JSON.stringify(game));

const browser = await launch({ viewport: { width: 1280, height: 720 } });
const page = await browser.newPage();
const errors = watch(page);
page.on('dialog', (d) => d.accept());
await page.goto(`${BASE}/jogar/${game.slug}`, { waitUntil: 'load' });
await sleep(2500);
await shot(page, 'ps2lib-1-gate');
await page.click('[data-play]');
const t0 = Date.now();
let lastText = '';
for (let i = 0; i < 90; i++) {
  await sleep(2000);
  const st = await page.evaluate(() => ({
    warn: document.querySelector('[data-gate-warn]')?.textContent || '',
    gateHidden: document.querySelector('[data-gate]')?.hidden || document.querySelector('[data-gate]')?.classList.contains('hide'),
    frame: !!document.querySelector('iframe[title*="PS2"]'),
  })).catch(() => ({}));
  if (st.warn !== lastText) { lastText = st.warn; console.log(`${((Date.now() - t0) / 1000).toFixed(0)}s`, st.warn); }
  if (st.frame && st.gateHidden) break;
}
await sleep(15000);
await shot(page, 'ps2lib-2-running');
const frame = page.frames().find((fr) => fr.url().includes('/emu/play/'));
const info = frame && await frame.evaluate(() => ({
  coi: self.crossOriginIsolated,
  text: document.body.innerText.slice(0, 300),
  canvas: (() => { const c = document.getElementById('outputCanvas'); return c ? [c.width, c.height] : null; })(),
  box: (() => { const r = document.getElementById('outputCanvas').getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; })(),
  gl: (() => { const g = document.getElementById('outputCanvas').getContext('webgl2'); return g && g.getContextAttributes().powerPreference; })(),
})).catch((e) => ({ erro: e.message }));
console.log('play!:', JSON.stringify(info));
console.log('erros:', errors.slice(0, 12));
await frame.click('.gw-aspect', { delay: 50 }).catch(() => {});
await sleep(1500);
await shot(page, 'ps2lib-3-fill');
console.log('preencher:', JSON.stringify(await frame.evaluate(() => { const r = document.getElementById('outputCanvas').getBoundingClientRect(); return { box: [Math.round(r.width), Math.round(r.height)], btn: document.querySelector('.gw-aspect')?.textContent }; })));
await sleep(20000);
await shot(page, 'ps2lib-4-later');
await browser.close();
cleanup();
