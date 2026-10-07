// Mede FPS do PS2 (Play!) com a placa de vídeo REAL (sem SwiftShader), apertando Enter/Z para avançar menus.
// Uso: node scripts/qa/ps2-fps.mjs [trecho-do-nome] [segundos]
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { launch, shot, sleep, watch } from './lib.mjs';

try { process.loadEnvFile('.env'); } catch { /* sem .env */ }
const DATA = mkdtempSync(join(tmpdir(), 'gameweb-ps2fps-'));
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
const api = (m, p, b) => fetch(BASE + '/api/admin' + p, { method: m, headers: { cookie, 'x-csrf-token': csrf, 'content-type': 'application/json' }, body: b && JSON.stringify(b) });
const lib = await (await api('GET', '/library')).json();
const needle = (process.argv[2] || '').toLowerCase();
const f = lib.files.find((x) => /.(iso|cso|chd|bin)$/i.test(x.name) && x.name.toLowerCase().includes(needle));
const game = await (await api('POST', '/games', { title: 'Teste FPS', system: 'ps2', status: 'published', rom: { kind: 'file', url: f.url, size: f.size }, rightsConfirmed: true, license: { name: 'Teste local', redistribution: 'owner' } })).json();

const browser = await launch({ gpu: true, viewport: { width: 1280, height: 720 } });
const page = await browser.newPage();
const errors = watch(page);
const gpu = await browser.newPage();
await gpu.goto('chrome://gpu', { waitUntil: 'load' }).catch(() => {});
await sleep(2500);
const gtxt = await gpu.evaluate(() => document.body.innerText).catch(() => '');
console.log('GPU:', gtxt.split(/\r?\n/).filter((l) => /GL_RENDERER|Hardware accelerated|ANGLE|WebGL2:|Canvas:/.test(l)).slice(0, 8).join(' | '));
await gpu.close();

await page.goto(`${BASE}/jogar/${game.slug}`, { waitUntil: 'load' });
await sleep(2000);
await page.click('[data-play]');
const seconds = Number(process.argv[3]) || 120;
const t0 = Date.now();
const samples = [];
let n = 0;
while ((Date.now() - t0) / 1000 < seconds) {
  await sleep(2000);
  const frame = page.frames().find((fr) => fr.url().includes('/emu/play/'));
  const fps = frame ? await frame.evaluate(() => document.querySelector('span.stats')?.textContent || '').catch(() => '') : '';
  // avança menus/vídeos: Enter e X (cross) alternados
  const key = ['Enter', 'Enter', 'z', 'Enter'][n++ % 4];
  await page.keyboard.press(key).catch(() => {});
  samples.push(fps);
  console.log(`${Math.round((Date.now() - t0) / 1000)}s  ${fps}`);
  if (n % 15 === 0) await shot(page, `ps2fps-${n}`);
}
await shot(page, 'ps2fps-final');
const metrics = await page.metrics();
console.log('erros:', errors.slice(0, 8));
await browser.close();
cleanup();
