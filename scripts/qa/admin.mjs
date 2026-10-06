// QA ponta a ponta do painel admin, em uma instância separada (porta 3200, dados temporários).
// Uso: node scripts/qa/admin.mjs
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { launch, shot, sleep, watch } from './lib.mjs';

const ROOT = process.cwd();
const PORT = 3200;
const BASE = `http://localhost:${PORT}`;
const DATA = mkdtempSync(join(tmpdir(), 'gameweb-qa-'));
const results = [];
const check = (name, ok, extra = '') => { results.push(ok); console.log(`${ok ? 'OK  ' : 'FALHA'} ${name}${extra ? ' — ' + extra : ''}`); };

const server = spawn(process.execPath, ['server.js'], { cwd: ROOT, env: { ...process.env, PORT: String(PORT), DATA_DIR: DATA }, stdio: ['ignore', 'pipe', 'pipe'] });
let serverLog = '';
server.stdout.on('data', (d) => { serverLog += d; });
server.stderr.on('data', (d) => { serverLog += d; });
for (let i = 0; i < 40; i++) { try { if ((await fetch(BASE + '/healthz')).ok) break; } catch { /* aguardando */ } await sleep(250); }

const browser = await launch({ viewport: { width: 1360, height: 860 } });
const page = await browser.newPage();
const errors = watch(page);
page.on('dialog', (d) => d.accept());
const ignore = /favicon|Translation|status of 4\d\d|ERR_ABORTED/;

try {
  /* ---- login ---- */
  await page.goto(BASE + '/admin', { waitUntil: 'networkidle0' });
  check('tela de login aparece', !!(await page.$('.login-card')));
  await shot(page, 'ad-1-login');
  await page.type('#u', 'admin'); await page.type('#p', 'senha-errada-123');
  await page.click('button[type=submit]'); await sleep(900);
  const errTxt = await page.$eval('.login-card .err', (e) => e.textContent);
  check('login com senha errada é recusado', /incorretos/.test(errTxt), errTxt);

  const creds = readFileSync(join(DATA, 'CREDENCIAIS-INICIAIS-ADMIN.txt'), 'utf8');
  const user = creds.match(/Usuário\s*:\s*(.+)/)[1].trim();
  const pass0 = creds.match(/Senha\s*:\s*(.+)/)[1].trim();
  await page.$eval('#p', (e) => { e.value = ''; });
  await page.type('#u', '', { delay: 0 });
  await page.type('#p', pass0);
  await page.click('button[type=submit]'); await sleep(1200);
  check('primeiro acesso exige trocar a senha', !!(await page.$('#pw1')));
  await shot(page, 'ad-2-trocar-senha');

  // API bloqueada até trocar a senha
  const blocked = await page.evaluate(async () => (await fetch('/api/admin/games')).status);
  check('API bloqueada antes de trocar a senha (403)', blocked === 403, String(blocked));

  const NEWPW = 'Qa-Painel-2026!x';
  await page.type('#pw0', pass0); await page.type('#pw1', 'curta'); await page.type('#pw2', 'curta');
  await page.click('button[type=submit]'); await sleep(800);
  check('senha fraca é recusada', /pelo menos 10/.test(await page.$eval('form p.err', (e) => e.textContent)));
  for (const id of ['#pw1', '#pw2']) { await page.$eval(id, (e) => { e.value = ''; }); }
  await page.type('#pw1', NEWPW); await page.type('#pw2', NEWPW);
  await page.click('button[type=submit]'); await sleep(1500);
  check('senha trocada e painel carregado', !!(await page.$('.shell')));
  check('arquivo de credenciais iniciais removido', !existsSync(join(DATA, 'CREDENCIAIS-INICIAIS-ADMIN.txt')));
  await shot(page, 'ad-3-dashboard');

  /* ---- segurança: cookie e CSRF ---- */
  const cookies = await page.cookies();
  const sid = cookies.find((c) => c.name === 'gw_sid');
  check('cookie de sessão HttpOnly + SameSite=Strict', !!sid && sid.httpOnly && sid.sameSite === 'Strict', JSON.stringify({ httpOnly: sid?.httpOnly, sameSite: sid?.sameSite }));
  const noCsrf = await page.evaluate(async () => (await fetch('/api/admin/settings', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: '{}' })).status);
  check('PUT sem token CSRF é bloqueado (403)', noCsrf === 403, String(noCsrf));

  /* ---- lista de jogos ---- */
  await page.goto(BASE + '/admin#/games', { waitUntil: 'networkidle0' }); await sleep(800);
  const rows = await page.$$eval('tbody tr', (r) => r.length);
  check('lista mostra os 7 jogos do catálogo inicial', rows === 7, `linhas=${rows}`);
  await shot(page, 'ad-4-jogos');

  /* ---- criar jogo com upload ---- */
  await page.goto(BASE + '/admin#/games/new', { waitUntil: 'networkidle0' }); await sleep(600);
  await page.type('#title', 'Teste E2E Futebol');
  check('slug automático', (await page.$eval('#slug', (e) => e.value)) === 'teste-e2e-futebol');
  await page.select('#system', 'gb');
  await page.type('#tagline', 'Jogo criado pelo teste automatizado');
  await page.type('#description', 'Primeiro parágrafo.\n\nSegundo parágrafo.');
  const fileInputs = await page.$$('input[type=file]');
  const byAccept = async (re) => { for (const h of fileInputs) { if (re.test(await h.evaluate((e) => e.accept))) return h; } return null; };
  await (await byAccept(/image\/png/)).uploadFile(join(ROOT, 'public', 'covers', 'ucity.png')); await sleep(900);
  await (await byAccept(/\.gba/)).uploadFile(join(ROOT, 'public', 'roms', 'max-pirate.gb')); await sleep(1500);
  const romInfo = await page.$$eval('.hint', (els) => els.map((e) => e.textContent).find((t) => t.includes('/uploads/roms/')) || '');
  check('upload de ROM concluído', romInfo.includes('/uploads/roms/'), romInfo.slice(0, 90));
  // tentar publicar sem confirmar direitos
  await page.click('input[name=status][value=published]');
  await page.click('.sticky-save button[type=submit]'); await sleep(900);
  const rightsErr = await page.$eval('[data-err=rightsConfirmed]', (e) => e.textContent);
  check('publicar sem confirmar direitos é recusado', rightsErr.length > 10, rightsErr.slice(0, 70));
  await shot(page, 'ad-5-form-erro');
  await page.type('#licname', 'MIT'); await page.select('#redist', 'verified');
  await page.click('#rights');
  await page.click('.sticky-save button[type=submit]'); await sleep(1500);
  const hash = await page.evaluate(() => location.hash);
  check('jogo criado e redirecionado para edição', /#\/games\/g_/.test(hash), hash);
  const pub = await fetch(BASE + '/jogos/teste-e2e-futebol');
  const pubHtml = await pub.text();
  check('página pública do jogo criado (200, JSON-LD VideoGame)', pub.status === 200 && pubHtml.includes('"@type":"VideoGame"') && pubHtml.includes('Teste E2E Futebol'));
  check('jogo aparece no sitemap', (await (await fetch(BASE + '/sitemap.xml')).text()).includes('/jogos/teste-e2e-futebol'));
  check('player do jogo criado (200)', (await fetch(BASE + '/jogar/teste-e2e-futebol')).status === 200);
  const uploaded = readdirSync(join(ROOT, 'public', 'uploads', 'roms')).length;
  await shot(page, 'ad-6-form-salvo');

  /* ---- excluir pelo painel ---- */
  await page.goto(BASE + '/admin#/games', { waitUntil: 'networkidle0' }); await sleep(700);
  const delBtn = await page.$('button[aria-label="Excluir Teste E2E Futebol"]');
  await delBtn.click(); await sleep(400);
  await shot(page, 'ad-7-confirma-exclusao');
  await page.evaluate(() => { [...document.querySelectorAll('dialog button')].find((b) => b.textContent === 'Excluir').click(); });
  await sleep(1200);
  check('jogo excluído (some da página pública)', (await fetch(BASE + '/jogos/teste-e2e-futebol')).status === 404);
  const left = existsSync(join(ROOT, 'public', 'uploads', 'roms')) ? readdirSync(join(ROOT, 'public', 'uploads', 'roms')).length : 0;
  check('arquivo enviado foi removido do disco', left === uploaded - 1, `${uploaded} -> ${left}`);

  /* ---- configurações ---- */
  await page.goto(BASE + '/admin#/settings', { waitUntil: 'networkidle0' }); await sleep(800);
  await shot(page, 'ad-8-config');
  const nameInput = (await page.$$('.card input.input'))[0];
  await nameInput.evaluate((e) => { e.focus(); e.select(); });
  await nameInput.type('GameWeb QA');
  await page.click('.sticky-save button[type=submit]');
  await sleep(1200);
  check('nome do site atualizado no site público', (await (await fetch(BASE + '/')).text()).includes('<title>GameWeb QA:'));

  /* ---- consoles ---- */
  await page.goto(BASE + '/admin#/systems', { waitUntil: 'networkidle0' }); await sleep(800);
  const ps2Switch = await page.$('input[aria-label="Ativar PS2"]');
  await ps2Switch.click(); await sleep(800);
  check('console desativado some do site (404)', (await fetch(BASE + '/consoles/ps2')).status === 404);
  await ps2Switch.click(); await sleep(800);
  check('console reativado volta ao site (200)', (await fetch(BASE + '/consoles/ps2')).status === 200);

  /* ---- usuários ---- */
  await page.goto(BASE + '/admin#/users', { waitUntil: 'networkidle0' }); await sleep(800);
  await page.type('input[aria-label="Nome de usuário"]', 'editor.qa');
  await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Adicionar administrador')).click());
  await sleep(1200);
  check('novo usuário mostra senha temporária', !!(await page.$('dialog .pwbox')));
  await shot(page, 'ad-9-novo-usuario');
  await page.evaluate(() => [...document.querySelectorAll('dialog button')].find((b) => b.textContent === 'Fechar').click());
  await sleep(900);
  const userRows = await page.$$eval('tbody tr', (r) => r.length);
  check('lista de usuários tem 2 linhas', userRows === 2, String(userRows));

  /* ---- atividade e logout ---- */
  await page.goto(BASE + '/admin#/audit', { waitUntil: 'networkidle0' }); await sleep(700);
  await shot(page, 'ad-10-atividade');
  await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Sair')).click());
  await sleep(1200);
  check('logout volta à tela de login', !!(await page.$('.login-card')));
  check('API protegida após logout (401)', (await page.evaluate(async () => (await fetch('/api/admin/games')).status)) === 401);

  /* ---- limitador de tentativas ---- */
  const codes = [];
  for (let i = 0; i < 8; i++) {
    codes.push(await page.evaluate(async () => (await fetch('/api/admin/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: 'admin', password: 'x-errada-' + Math.random() }) })).status));
  }
  check('força bruta: bloqueio 429 após várias falhas', codes.includes(429), codes.join(','));

  console.log('\nerros de console:', errors.filter((e) => !ignore.test(e)).slice(0, 10));
} catch (err) {
  console.error('ERRO NO TESTE:', err);
  results.push(false);
  await shot(page, 'ad-erro').catch(() => {});
} finally {
  await browser.close();
  server.kill();
  rmSync(DATA, { recursive: true, force: true });
  const ok = results.filter(Boolean).length;
  console.log(`\nResultado: ${ok}/${results.length} verificações OK`);
  if (/Error|erro/i.test(serverLog)) console.log('log do servidor:', serverLog.slice(-600));
  process.exitCode = ok === results.length ? 0 : 1;
}
