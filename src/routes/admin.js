import { createReadStream } from 'node:fs';
import { mkdir, unlink } from 'node:fs/promises';
import { createHash, randomBytes } from 'node:crypto';
import { basename, extname, join, resolve, sep } from 'node:path';
import express from 'express';
import multer from 'multer';
import { config } from '../config.js';
import {
  attachAuth, clearSessionCookie, dummyVerify, loginBlockedFor, loginFailed, loginSucceeded,
  requireAuth, requireCsrf, requirePasswordChanged, setSessionCookie,
} from '../auth.js';
import { generatePassword, passwordProblem, verifyPassword } from '../crypto.js';
import {
  audit, createSession, createUser, dashboardStats, destroySession, destroyUserSessions, getGame, getSession,
  getSettings, getUserById, getUserByName, listAudit, listGames, listSystems, listUsers, removeGame,
  removeInitialCredentialsFile, removeUser, sanitizeGame, saveGame, saveSettings, setUserPassword, touchLogin,
  updateSystemOverride,
} from '../db.js';
import { listLibrary } from '../library.js';
import { setPageHeaders } from '../security.js';
import { SYSTEMS } from '../systems.js';
import { asset } from '../views/layout.js';

const publicUser = (u) => ({ id: u.id, username: u.username, role: u.role, mustChangePassword: !!u.mustChangePassword, lastLoginAt: u.lastLoginAt });
const str = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '');
const EXT_IMG = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif']);
const EXT_ROM = new Set([...SYSTEMS.flatMap((s) => s.exts), 'zip', '7z'].map((e) => '.' + e));

/* ---------------------------------------------------------------- upload */
const safeName = (n) => basename(String(n)).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^[-.]+/, '').slice(-60) || 'arquivo';

function uploader(subdir, allowed, maxBytes) {
  const dir = join(config.uploadDir, subdir);
  return multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => mkdir(dir, { recursive: true }).then(() => cb(null, dir), cb),
      filename: (req, file, cb) => cb(null, `${Date.now().toString(36)}-${randomBytes(4).toString('hex')}-${safeName(file.originalname)}`),
    }),
    limits: { fileSize: maxBytes, files: 1, fields: 4 },
    fileFilter: (req, file, cb) => (allowed.has(extname(file.originalname).toLowerCase()) ? cb(null, true)
      : cb(Object.assign(new Error('Formato de arquivo não permitido.'), { code: 'BAD_EXT' }))),
  }).single('file');
}
const imageUpload = uploader('img', EXT_IMG, config.maxImageMb * 1048576);
const romUpload = uploader('roms', EXT_ROM, config.maxRomMb * 1048576);

const run = (mw) => (req, res, next) => mw(req, res, (err) => {
  if (!err) return next();
  const msg = err.code === 'LIMIT_FILE_SIZE' ? 'Arquivo maior que o limite permitido.' : err.code === 'BAD_EXT' ? err.message : 'Falha no envio do arquivo.';
  res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({ error: msg });
});

function hashFile(path) {
  return new Promise((resolveHash, reject) => {
    const h = createHash('sha256');
    createReadStream(path).on('data', (d) => h.update(d)).on('end', () => resolveHash(h.digest('hex'))).on('error', reject);
  });
}

/** Remove um arquivo enviado pelo painel (somente dentro de /uploads). */
async function removeUploaded(url) {
  if (!url || !url.startsWith('/uploads/')) return;
  const target = resolve(config.publicDir, '.' + url);
  if (!target.startsWith(config.uploadDir + sep)) return;
  await unlink(target).catch(() => {});
}

/* ---------------------------------------------------------------- shell HTML do painel */
function adminShell() {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow, noarchive">
<title>Painel · GameWeb</title>
<link rel="icon" href="/img/logo.svg" type="image/svg+xml">
<link rel="stylesheet" href="${asset('/css/admin.css')}">
</head>
<body>
<div id="app" class="boot"><p class="boot-msg">Carregando painel…</p></div>
<noscript><p style="padding:2rem;font-family:sans-serif">O painel precisa de JavaScript.</p></noscript>
<script src="${asset('/js/admin.js')}" defer></script>
</body>
</html>`;
}

export function createAdminPages() {
  const r = express.Router();
  r.get(['/admin', '/admin/'], (req, res) => {
    setPageHeaders(res, 'admin');
    res.type('html').send(adminShell());
  });
  return r;
}

/* ---------------------------------------------------------------- API */
export function createAdminApi() {
  const api = express.Router();
  api.use((req, res, next) => { res.set('Cache-Control', 'no-store'); res.set('X-Robots-Tag', 'noindex'); next(); });
  api.use(attachAuth);
  api.use(express.json({ limit: '1mb' }));

  api.get('/me', (req, res) => {
    if (!req.auth) return res.json({ authenticated: false });
    res.json({ authenticated: true, user: publicUser(req.auth.user), csrf: req.auth.session.csrf });
  });

  api.post('/login', async (req, res) => {
    const username = str(req.body?.username, 80).trim();
    const password = str(req.body?.password, 200);
    if (!username || !password) return res.status(400).json({ error: 'Informe usuário e senha.' });
    const wait = loginBlockedFor(req, username);
    if (wait) {
      res.set('Retry-After', String(wait));
      return res.status(429).json({ error: `Muitas tentativas. Tente novamente em ${Math.ceil(wait / 60)} min.` });
    }
    const user = getUserByName(username);
    const ok = user ? await verifyPassword(password, user.passwordHash) : (await dummyVerify(password), false);
    if (!ok) {
      loginFailed(req, username);
      audit(username, 'login_falhou', req.ip);
      return res.status(401).json({ error: 'Usuário ou senha incorretos.' });
    }
    loginSucceeded(req, username);
    touchLogin(user.id);
    const token = createSession(user.id, req);
    setSessionCookie(req, res, token);
    audit(user.username, 'login', req.ip);
    res.json({ ok: true, user: publicUser(user), csrf: getSession(token).csrf });
  });

  // a partir daqui: exige sessão + token CSRF
  api.use(requireAuth, requireCsrf);

  api.post('/logout', (req, res) => {
    audit(req.auth.user.username, 'logout');
    destroySession(req.auth.token);
    clearSessionCookie(res);
    res.json({ ok: true });
  });

  api.post('/password', async (req, res) => {
    const user = req.auth.user;
    const current = str(req.body?.current, 200), next = str(req.body?.next, 200);
    if (!(await verifyPassword(current, user.passwordHash))) return res.status(400).json({ error: 'A senha atual está incorreta.' });
    if (next === current) return res.status(400).json({ error: 'A nova senha deve ser diferente da atual.' });
    const problem = passwordProblem(next, user.username);
    if (problem) return res.status(400).json({ error: problem });
    await setUserPassword(user.id, next, false);
    destroyUserSessions(user.id, req.auth.session.key);
    removeInitialCredentialsFile();
    audit(user.username, 'senha_alterada');
    res.json({ ok: true, user: publicUser(getUserById(user.id)) });
  });

  // o painel fica bloqueado até a senha inicial ser trocada
  api.use(requirePasswordChanged);

  api.get('/dashboard', (req, res) => res.json(dashboardStats()));

  /* ---- jogos */
  api.get('/games', (req, res) => {
    const sys = Object.fromEntries(SYSTEMS.map((s) => [s.id, s.short]));
    res.json(listGames().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map((g) => ({ ...g, systemShort: sys[g.system] || g.system })));
  });
  api.get('/games/:id', (req, res) => { const g = getGame(req.params.id); return g ? res.json(g) : res.status(404).json({ error: 'Jogo não encontrado.' }); });

  api.post('/games', (req, res) => {
    const { value, errors } = sanitizeGame(req.body || {});
    if (Object.keys(errors).length) return res.status(422).json({ error: 'Corrija os campos destacados.', errors });
    audit(req.auth.user.username, 'jogo_criado', value.title);
    res.status(201).json(saveGame(value));
  });

  api.put('/games/:id', (req, res) => {
    const existing = getGame(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Jogo não encontrado.' });
    const { value, errors } = sanitizeGame(req.body || {}, existing);
    if (Object.keys(errors).length) return res.status(422).json({ error: 'Corrija os campos destacados.', errors });
    audit(req.auth.user.username, 'jogo_editado', value.title);
    res.json(saveGame(value));
    // limpa arquivos enviados que deixaram de ser usados
    if (existing.rom.url !== value.rom.url) removeUploaded(existing.rom.url);
    if (existing.cover !== value.cover) removeUploaded(existing.cover);
    for (const u of existing.screenshots) if (!value.screenshots.includes(u)) removeUploaded(u);
  });

  api.delete('/games/:id', async (req, res) => {
    const g = removeGame(req.params.id);
    if (!g) return res.status(404).json({ error: 'Jogo não encontrado.' });
    audit(req.auth.user.username, 'jogo_excluido', g.title);
    await Promise.all([g.rom.url, g.cover, ...g.screenshots].map(removeUploaded));
    res.json({ ok: true });
  });

  // arquivos disponíveis na pasta local de jogos (ROMS_DIR)
  api.get('/library', async (req, res) => res.json({ ...(await listLibrary()), dir: config.romsDir ? basename(config.romsDir) : '' }));

  api.post('/upload/image', run(imageUpload), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
    res.status(201).json({ url: `/uploads/img/${req.file.filename}`, size: req.file.size });
  });

  api.post('/upload/rom', run(romUpload), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
    const sha256 = await hashFile(req.file.path);
    audit(req.auth.user.username, 'upload_rom', req.file.originalname);
    res.status(201).json({ url: `/uploads/roms/${req.file.filename}`, size: req.file.size, sha256, name: req.file.originalname });
  });

  /* ---- configurações */
  api.get('/settings', (req, res) => res.json(getSettings()));
  api.put('/settings', (req, res) => {
    const s = saveSettings(req.body || {});
    audit(req.auth.user.username, 'configuracoes_salvas');
    res.json(s);
  });

  /* ---- consoles */
  api.get('/systems', (req, res) => res.json(listSystems({ all: true }).map((s) => ({
    id: s.id, name: s.name, short: s.short, emulator: s.emulator, status: s.status, tier: s.tier, color: s.color, enabled: s.enabled, order: s.order, slug: s.slug,
  }))));
  api.put('/systems/:id', (req, res) => {
    const s = updateSystemOverride(req.params.id, { enabled: typeof req.body?.enabled === 'boolean' ? req.body.enabled : undefined, order: Number(req.body?.order) });
    if (!s) return res.status(404).json({ error: 'Console não encontrado.' });
    audit(req.auth.user.username, 'console_atualizado', `${s.short}: ${s.enabled ? 'ativo' : 'desativado'}`);
    res.json({ id: s.id, enabled: s.enabled, order: s.order });
  });

  /* ---- usuários */
  api.get('/users', (req, res) => res.json(listUsers()));
  api.post('/users', async (req, res) => {
    const username = str(req.body?.username, 40).trim();
    if (!/^[a-zA-Z0-9._-]{3,40}$/.test(username)) return res.status(422).json({ error: 'Usuário: 3 a 40 caracteres (letras, números, ponto, hífen ou sublinhado).' });
    if (getUserByName(username)) return res.status(422).json({ error: 'Já existe um usuário com esse nome.' });
    const password = generatePassword();
    const u = await createUser({ username, password, mustChangePassword: true });
    audit(req.auth.user.username, 'usuario_criado', username);
    res.status(201).json({ user: listUsers().find((x) => x.id === u.id), temporaryPassword: password });
  });
  api.post('/users/:id/reset', async (req, res) => {
    const u = getUserById(req.params.id);
    if (!u) return res.status(404).json({ error: 'Usuário não encontrado.' });
    const password = generatePassword();
    await setUserPassword(u.id, password, true);
    destroyUserSessions(u.id, u.id === req.auth.user.id ? req.auth.session.key : undefined);
    audit(req.auth.user.username, 'senha_redefinida', u.username);
    res.json({ temporaryPassword: password });
  });
  api.delete('/users/:id', (req, res) => {
    const u = getUserById(req.params.id);
    if (!u) return res.status(404).json({ error: 'Usuário não encontrado.' });
    if (u.id === req.auth.user.id) return res.status(400).json({ error: 'Você não pode excluir o seu próprio usuário.' });
    removeUser(u.id);
    audit(req.auth.user.username, 'usuario_excluido', u.username);
    res.json({ ok: true });
  });

  api.get('/audit', (req, res) => res.json(listAudit(150)));

  api.use((req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));
  api.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
    const status = err.status || err.statusCode || 500;
    if (status >= 500) console.error('[admin api]', err);
    res.status(status).json({ error: status === 400 ? 'Requisição inválida (JSON malformado).' : status === 413 ? 'Conteúdo grande demais.' : 'Erro interno do servidor.' });
  });
  return api;
}
