// Pasta local de jogos (ROMS_DIR): listagem, vínculo com jogo, Range e proteção contra acesso indevido.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';

const TMP = mkdtempSync(join(tmpdir(), 'gameweb-lib-test-'));
const DATA = join(TMP, 'data');
const LIB = join(TMP, 'Meu Drive', 'Jogos');
const OUTSIDE = join(TMP, 'segredo');
const PASS = 'Senha-de-Teste-123!';
const BYTES = Buffer.from(Array.from({ length: 5000 }, (_, i) => i % 251));
let BASE = '';
let server;
let cookie = '';
let csrf = '';

const freePort = () => new Promise((res) => { const s = createServer(); s.listen(0, () => { const { port } = s.address(); s.close(() => res(port)); }); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const get = (path, init) => fetch(BASE + path, { redirect: 'manual', ...init });
const api = (method, path, body) => get('/api/admin' + path, {
  method, headers: { cookie, ...(csrf ? { 'x-csrf-token': csrf } : {}), ...(body ? { 'content-type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined,
});

before(async () => {
  mkdirSync(join(LIB, 'PS2'), { recursive: true });
  mkdirSync(OUTSIDE, { recursive: true });
  writeFileSync(join(LIB, 'PS2', 'Jogo de Teste (BR).iso'), BYTES);
  writeFileSync(join(LIB, 'PS2', 'nao-publicado.iso'), BYTES);
  writeFileSync(join(LIB, 'leia-me.txt'), 'não é jogo');
  writeFileSync(join(OUTSIDE, 'fora.iso'), BYTES);
  try { symlinkSync(OUTSIDE, join(LIB, 'atalho'), 'junction'); } catch { /* sem permissão para links */ }

  const port = await freePort();
  BASE = `http://localhost:${port}`;
  server = spawn(process.execPath, ['server.js'], { cwd: process.cwd(), env: { ...process.env, PORT: String(port), DATA_DIR: DATA, ADMIN_PASSWORD: PASS, ROMS_DIR: LIB }, stdio: 'ignore' });
  for (let i = 0; i < 60; i++) { try { if ((await fetch(BASE + '/healthz')).ok) break; } catch { /* aguardando */ } await sleep(250); }
  const r = await get('/api/admin/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: 'admin', password: PASS }) });
  cookie = r.headers.get('set-cookie').split(';')[0];
  csrf = (await r.json()).csrf;
});
after(() => { server?.kill(); rmSync(TMP, { recursive: true, force: true }); });

describe('pasta local de jogos', () => {
  let url = '';
  it('painel lista só arquivos de jogo (inclusive com espaços) e exige login', async () => {
    const noAuth = await get('/api/admin/library');
    assert.equal(noAuth.status, 401);
    const data = await (await api('GET', '/library')).json();
    assert.equal(data.reachable, true);
    const names = data.files.map((f) => f.path).sort();
    assert.ok(names.includes('PS2/Jogo de Teste (BR).iso'));
    assert.ok(!names.some((n) => n.endsWith('.txt')));
    url = data.files.find((f) => f.name.startsWith('Jogo de Teste')).url;
    assert.equal(url, '/library/PS2/Jogo%20de%20Teste%20(BR).iso');
  });

  it('arquivo não vinculado a jogo publicado não é servido', async () => {
    assert.equal((await get(url)).status, 404);
  });

  it('jogo publicado com arquivo da biblioteca: serve com Range e cabeçalhos de isolamento', async () => {
    const created = await api('POST', '/games', { title: 'Jogo Biblioteca', system: 'ps2', status: 'published', rom: { kind: 'file', url, size: BYTES.length }, rightsConfirmed: true, license: { name: 'Teste', redistribution: 'owner' } });
    assert.equal(created.status, 201);
    const full = await get(url);
    assert.equal(full.status, 200);
    assert.equal(full.headers.get('cross-origin-resource-policy'), 'same-origin');
    assert.equal(full.headers.get('accept-ranges'), 'bytes');
    assert.deepEqual(Buffer.from(await full.arrayBuffer()), BYTES);
    const part = await get(url, { headers: { range: 'bytes=100-199' } });
    assert.equal(part.status, 206);
    assert.equal(part.headers.get('content-range'), `bytes 100-199/${BYTES.length}`);
    assert.deepEqual(Buffer.from(await part.arrayBuffer()), BYTES.subarray(100, 200));
  });

  it('outro arquivo da mesma pasta continua bloqueado', async () => {
    assert.equal((await get('/library/PS2/nao-publicado.iso')).status, 404);
  });

  it('não escapa da pasta (../, atalhos, caminhos codificados)', async () => {
    for (const p of ['/library/..%2Fsegredo%2Ffora.iso', '/library/PS2/..%2F..%2Fsegredo%2Ffora.iso', '/library/atalho/fora.iso', '/library/%2e%2e/segredo/fora.iso']) {
      assert.equal((await get(p)).status, 404, p);
    }
  });

  it('o painel recusa vincular caminho inválido da biblioteca', async () => {
    const r = await api('POST', '/games', { title: 'Jogo Ruim', system: 'ps2', status: 'draft', rom: { kind: 'file', url: '/library/../etc/passwd' } });
    const g = await r.json();
    assert.equal(g.rom?.kind ?? 'none', 'none');
  });
});
