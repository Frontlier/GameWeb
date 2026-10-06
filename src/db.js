// Camada de dados (arquivos JSON). Tudo fica em memória e é gravado de forma atômica em /data.
// Para migrar para um banco depois, basta reimplementar as funções exportadas deste arquivo.
import { existsSync, statSync, readFileSync, unlinkSync } from 'node:fs';
import { copyFile, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { config } from './config.js';
import { generatePassword, hashPassword, randomId, randomToken, sha256 } from './crypto.js';
import { SEED_GAMES } from './seed-data.js';
import { SYSTEMS, systemById } from './systems.js';
import { dayKey, isoDate, slugify } from './util.js';

/* ------------------------------------------------------------------ arquivo JSON */
class JsonFile {
  constructor(name, fallback) {
    this.name = name;
    this.path = join(config.dataDir, name + '.json');
    this.fallback = fallback;
    this.data = structuredClone(fallback);
    this.queue = Promise.resolve();
    this.timer = null;
  }

  async load() {
    try {
      this.data = JSON.parse(await readFile(this.path, 'utf8'));
      return true;
    } catch (err) {
      if (err.code === 'ENOENT') return false;
      const backup = `${this.path}.corrompido-${Date.now()}`;
      await copyFile(this.path, backup).catch(() => {});
      console.error(`[db] ${this.name}.json ilegível (${err.message}). Backup em ${backup}. Usando valores padrão.`);
      this.data = structuredClone(this.fallback);
      return false;
    }
  }

  save(delay = 120) {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), delay);
  }

  flush() {
    clearTimeout(this.timer);
    const json = JSON.stringify(this.data, null, 2);
    this.queue = this.queue.then(async () => {
      const tmp = this.path + '.tmp';
      await writeFile(tmp, json);
      await rename(tmp, this.path);
    }).catch((err) => console.error('[db] erro ao salvar', this.path, err.message));
    return this.queue;
  }
}

const F = {
  settings: new JsonFile('settings', {}),
  games: new JsonFile('games', []),
  systems: new JsonFile('systems', {}),
  users: new JsonFile('users', []),
  sessions: new JsonFile('sessions', {}),
  stats: new JsonFile('stats', { days: {} }),
  audit: new JsonFile('audit', []),
};

export const flushAll = () => Promise.all(Object.values(F).map((f) => f.flush()));

/* ------------------------------------------------------------------ configurações */
export const DEFAULT_SETTINGS = {
  siteName: 'GameWeb',
  tagline: 'Jogue PS2, PSP e clássicos direto no navegador',
  siteUrl: '',
  description: 'Emulador online em português: jogue PS2, PSP, PS1, N64, GBA e mais no navegador, no PC ou no celular, com teclado ou controle. Veja o que roda no seu aparelho.',
  keywords: ['emulador online', 'jogar ps2 no navegador', 'emulador psp online', 'emulador ps1 online', 'jogos retrô no navegador', 'emulador gba online'],
  contactEmail: '',
  social: { twitter: '', instagram: '', youtube: '', discord: '', github: '' },
  analytics: { ga4: '', plausibleDomain: '' },
  seo: { aiSearchBots: true, aiTrainingBots: true, ogImage: '/img/og-default.png', twitterHandle: '' },
  announcement: { enabled: false, text: '', link: '' },
  faq: [
    { q: 'O que é o GameWeb?', a: 'O GameWeb é um emulador online em português. Ele roda consoles como PS2, PSP, PS1, Nintendo 64, Nintendo DS, Game Boy Advance e Super Nintendo direto no navegador, sem instalar nada, no computador ou no celular.' },
    { q: 'Dá para jogar PS2 e PSP no navegador?', a: 'Dá. O PSP funciona bem em computadores com CPU de 4 núcleos ou mais, e o PS2 é experimental e exige um PC potente. O GameWeb testa o seu aparelho e mostra o que deve rodar bem.' },
    { q: 'É grátis? Preciso instalar algum programa?', a: 'É grátis e não precisa instalar nada: basta um navegador atualizado (Chrome, Edge, Firefox ou Safari). Tudo roda na própria página, usando WebAssembly.' },
    { q: 'O GameWeb tem jogos comerciais?', a: 'Não. O catálogo reúne jogos livres e homebrew com licença que permite distribuição. Para jogos comerciais, você abre os seus próprios arquivos (ISO, CSO, ROMs) e eles rodam apenas no seu navegador, sem upload para o servidor.' },
    { q: 'Dá para jogar com controle e teclado?', a: 'Sim. Controles de Xbox, PlayStation, Switch Pro e a maioria dos genéricos são detectados automaticamente: basta apertar um botão. O teclado também funciona e todos os botões podem ser remapeados.' },
    { q: 'Funciona no celular?', a: 'Sim, principalmente para consoles mais leves (Game Boy, NES, SNES, GBA, Mega Drive). Há botões virtuais na tela e suporte a controle Bluetooth. PSP e PS2 exigem um aparelho muito potente.' },
    { q: 'Usar emulador é legal?', a: 'Emuladores são programas legais. O que costuma ser ilegal é copiar ou distribuir jogos protegidos por direitos autorais sem autorização. Use apenas arquivos que você tem direito de usar, como backups de jogos que você possui.' },
  ],
  updatedAt: null,
};

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
function deepMerge(base, over) {
  const out = structuredClone(base);
  for (const [k, v] of Object.entries(over || {})) out[k] = isObj(v) && isObj(out[k]) ? deepMerge(out[k], v) : v;
  return out;
}

export const getSettings = () => deepMerge(DEFAULT_SETTINGS, F.settings.data);

export function saveSettings(input) {
  const s = getSettings();
  const t = (v, max) => String(v ?? '').trim().slice(0, max);
  const url = (v) => { v = t(v, 300); return /^https?:\/\/[^\s<>"']+$/i.test(v) ? v.replace(/\/+$/, '') : ''; };
  const next = {
    siteName: t(input.siteName, 40) || s.siteName,
    tagline: t(input.tagline, 120),
    siteUrl: url(input.siteUrl),
    description: t(input.description, 300),
    keywords: (Array.isArray(input.keywords) ? input.keywords : String(input.keywords ?? '').split(',')).map((k) => t(k, 60)).filter(Boolean).slice(0, 20),
    contactEmail: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t(input.contactEmail, 120)) ? t(input.contactEmail, 120) : '',
    social: Object.fromEntries(['twitter', 'instagram', 'youtube', 'discord', 'github'].map((k) => [k, url(input.social?.[k])])),
    analytics: {
      ga4: /^G-[A-Z0-9]{4,14}$/.test(t(input.analytics?.ga4, 20)) ? t(input.analytics.ga4, 20) : '',
      plausibleDomain: /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(t(input.analytics?.plausibleDomain, 80)) ? t(input.analytics.plausibleDomain, 80) : '',
    },
    seo: {
      aiSearchBots: !!input.seo?.aiSearchBots,
      aiTrainingBots: !!input.seo?.aiTrainingBots,
      ogImage: /^\/[^\s<>"'\\]*$/.test(t(input.seo?.ogImage, 200)) || /^https:\/\/[^\s<>"']+$/.test(t(input.seo?.ogImage, 300)) ? t(input.seo.ogImage, 300) : '/img/og-default.png',
      twitterHandle: /^@?\w{1,15}$/.test(t(input.seo?.twitterHandle, 20)) ? '@' + t(input.seo.twitterHandle, 20).replace('@', '') : '',
    },
    announcement: {
      enabled: !!input.announcement?.enabled,
      text: t(input.announcement?.text, 200),
      link: /^(\/[^\s<>"'\\]*|https?:\/\/[^\s<>"']+)$/.test(t(input.announcement?.link, 300)) ? t(input.announcement.link, 300) : '',
    },
    faq: (Array.isArray(input.faq) ? input.faq : []).map((f) => ({ q: t(f?.q, 160), a: t(f?.a, 1200) })).filter((f) => f.q && f.a).slice(0, 20),
    updatedAt: isoDate(),
  };
  F.settings.data = next;
  F.settings.save();
  return getSettings();
}

/* ------------------------------------------------------------------ consoles */
/** all: inclui desativados e ocultos (painel). hidden: inclui ocultos (ex.: pseudo-console "WEB"), mas não os desativados. */
export function listSystems({ all = false, hidden = false } = {}) {
  const ov = F.systems.data;
  return SYSTEMS
    .map((s, i) => ({ ...s, enabled: ov[s.id]?.enabled !== false, order: ov[s.id]?.order ?? i }))
    .filter((s) => all || (s.enabled && (hidden || !s.hidden)))
    .sort((a, b) => a.order - b.order);
}

export function updateSystemOverride(id, { enabled, order }) {
  if (!systemById(id)) return null;
  const cur = F.systems.data[id] || {};
  if (typeof enabled === 'boolean') cur.enabled = enabled;
  if (Number.isFinite(order)) cur.order = Math.max(0, Math.min(999, Math.trunc(order)));
  F.systems.data[id] = cur;
  F.systems.save();
  return listSystems({ all: true }).find((s) => s.id === id);
}

/* ------------------------------------------------------------------ jogos */
const str = (v, max) => String(v ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);
const list = (v, maxItems, maxLen) => (Array.isArray(v) ? v : String(v ?? '').split(','))
  .map((x) => str(x, maxLen)).filter(Boolean).filter((x, i, a) => a.indexOf(x) === i).slice(0, maxItems);

export function safeUrl(u, { https = true } = {}) {
  u = String(u ?? '').trim();
  if (!u) return '';
  if (u.startsWith('/') && !u.startsWith('//') && !u.includes('..') && !u.includes('\\') && !/[\s<>"']/.test(u)) return u.slice(0, 300);
  if (https && /^https:\/\/[^\s<>"']+$/i.test(u)) return u.slice(0, 400);
  return '';
}

const clone = (g) => structuredClone(g);
export const listGames = () => F.games.data.map(clone);
export const getGame = (id) => { const g = F.games.data.find((x) => x.id === id); return g ? clone(g) : null; };
export const getGameBySlug = (slug) => { const g = F.games.data.find((x) => x.slug === slug); return g ? clone(g) : null; };

export function publishedGames({ system, q, genre } = {}) {
  const disabled = new Set(listSystems({ all: true }).filter((s) => !s.enabled).map((s) => s.id));
  const needle = String(q || '').toLowerCase().trim();
  return F.games.data
    .filter((g) => g.status === 'published' && !disabled.has(g.system))
    .filter((g) => !system || g.system === system)
    .filter((g) => !genre || g.genres.map((x) => x.toLowerCase()).includes(String(genre).toLowerCase()))
    .filter((g) => !needle || [g.title, g.tagline, g.developer, ...g.genres, ...g.tags].join(' ').toLowerCase().includes(needle))
    .sort((a, b) => (b.featured - a.featured) || (new Date(b.createdAt) - new Date(a.createdAt)))
    .map(clone);
}

/** Valida e normaliza os dados de um jogo. Retorna { value, errors }. */
export function sanitizeGame(input, existing = null) {
  const errors = {};
  const title = str(input.title, 80);
  if (title.length < 2) errors.title = 'Informe o título (mínimo de 2 caracteres).';
  const slug = slugify(input.slug || title);
  if (!slug) errors.slug = 'Endereço (slug) inválido.';
  else if (F.games.data.some((x) => x.slug === slug && x.id !== existing?.id)) errors.slug = 'Já existe um jogo com esse endereço (slug).';
  let system = String(input.system || '');
  const status = ['draft', 'published'].includes(input.status) ? input.status : 'draft';

  const kind = ['file', 'web', 'none'].includes(input.rom?.kind) ? input.rom.kind : 'none';
  if (kind === 'web') system = 'web';
  if (!systemById(system)) errors.system = 'Escolha um console válido.';
  else if (system === 'web' && kind !== 'web') errors.system = 'O console WEB é só para jogos HTML5. Escolha o tipo "Jogo web" ou outro console.';
  let romUrl = safeUrl(input.rom?.url);
  if (kind === 'file' && romUrl && !/^\/(roms|uploads\/roms)\/[^/]+$/.test(romUrl) && !romUrl.startsWith('https://')) romUrl = '';
  if (kind === 'web' && romUrl && !/^\/(web|uploads\/web)\//.test(romUrl) && !romUrl.startsWith('https://')) romUrl = '';
  const rom = { kind: romUrl ? kind : 'none', url: romUrl, size: Math.max(0, Math.trunc(Number(input.rom?.size) || 0)), sha256: /^[a-f0-9]{64}$/.test(input.rom?.sha256 || '') ? input.rom.sha256 : '' };

  const year = Math.trunc(Number(input.year));
  const license = {
    name: str(input.license?.name, 80),
    url: safeUrl(input.license?.url),
    redistribution: ['verified', 'unverified', 'owner'].includes(input.license?.redistribution) ? input.license.redistribution : 'unverified',
  };
  const rightsConfirmed = !!input.rightsConfirmed;
  if (status === 'published') {
    if (rom.kind === 'none') errors.rom = 'Informe o arquivo do jogo (ou deixe como rascunho).';
    if (rom.kind === 'file' && !rightsConfirmed) errors.rightsConfirmed = 'Para publicar um arquivo hospedado no site, confirme que você tem licença ou permissão para distribuí-lo.';
  }

  const now = isoDate();
  const value = {
    id: existing?.id || randomId('g_'),
    slug, title, system, status,
    featured: !!input.featured,
    tagline: str(input.tagline, 120),
    description: str(input.description, 4000),
    genres: list(input.genres, 6, 30),
    tags: list(input.tags, 12, 30),
    year: year >= 1970 && year <= 2100 ? year : null,
    developer: str(input.developer, 80),
    publisher: str(input.publisher, 80),
    players: str(input.players, 40),
    controls: (Array.isArray(input.controls) ? input.controls : []).map((c) => [str(c?.[0], 40), str(c?.[1], 60)]).filter(([a, b]) => a && b).slice(0, 14),
    cover: safeUrl(input.cover),
    screenshots: (Array.isArray(input.screenshots) ? input.screenshots : []).map((u) => safeUrl(u)).filter(Boolean).slice(0, 8),
    rom, license, rightsConfirmed,
    source: { name: str(input.source?.name, 60), url: safeUrl(input.source?.url) },
    seo: { title: str(input.seo?.title, 70), description: str(input.seo?.description, 170) },
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
  return { value, errors };
}

export function saveGame(value) {
  const i = F.games.data.findIndex((g) => g.id === value.id);
  if (i >= 0) F.games.data[i] = value; else F.games.data.push(value);
  F.games.save();
  return clone(value);
}

export function removeGame(id) {
  const i = F.games.data.findIndex((g) => g.id === id);
  if (i < 0) return null;
  const [g] = F.games.data.splice(i, 1);
  F.games.save();
  return g;
}

/* ------------------------------------------------------------------ usuários e sessões */
export const listUsers = () => F.users.data.map(({ passwordHash, ...u }) => u);
export const getUserById = (id) => F.users.data.find((u) => u.id === id) || null;
export const getUserByName = (name) => F.users.data.find((u) => u.username.toLowerCase() === String(name || '').trim().toLowerCase()) || null;

export async function createUser({ username, password, role = 'admin', mustChangePassword = true }) {
  const u = { id: randomId('u_'), username: String(username).trim(), passwordHash: await hashPassword(password), role, mustChangePassword, createdAt: isoDate(), lastLoginAt: null };
  F.users.data.push(u);
  F.users.save();
  return u;
}

export async function setUserPassword(id, password, mustChangePassword = false) {
  const u = getUserById(id);
  if (!u) return null;
  u.passwordHash = await hashPassword(password);
  u.mustChangePassword = mustChangePassword;
  F.users.save();
  return u;
}

export function removeUser(id) {
  const i = F.users.data.findIndex((u) => u.id === id);
  if (i < 0) return false;
  F.users.data.splice(i, 1);
  for (const [h, s] of Object.entries(F.sessions.data)) if (s.userId === id) delete F.sessions.data[h];
  F.users.save(); F.sessions.save();
  return true;
}

export const touchLogin = (id) => { const u = getUserById(id); if (u) { u.lastLoginAt = isoDate(); F.users.save(); } };

export function createSession(userId, req) {
  const token = randomToken(32);
  const now = Date.now();
  F.sessions.data[sha256(token)] = {
    userId, csrf: randomToken(24), createdAt: now, lastSeen: now,
    expiresAt: now + config.sessionHours * 3600e3,
    ip: req.ip, ua: String(req.get('user-agent') || '').slice(0, 160),
  };
  F.sessions.save();
  return token;
}

export function getSession(token) {
  if (!token) return null;
  const key = sha256(token);
  const s = F.sessions.data[key];
  if (!s) return null;
  const now = Date.now();
  // expira por inatividade (expiresAt desliza) ou após 7 dias absolutos
  if (s.expiresAt < now || now - s.createdAt > 7 * 86400e3) { delete F.sessions.data[key]; F.sessions.save(); return null; }
  if (now - s.lastSeen > 60e3) { s.lastSeen = now; s.expiresAt = now + config.sessionHours * 3600e3; F.sessions.save(2000); }
  return { key, ...s };
}

export function destroySession(token) {
  delete F.sessions.data[sha256(token || '')];
  F.sessions.save();
}

export function destroyUserSessions(userId, exceptKey) {
  for (const [k, s] of Object.entries(F.sessions.data)) if (s.userId === userId && k !== exceptKey) delete F.sessions.data[k];
  F.sessions.save();
}

export function pruneSessions() {
  const now = Date.now();
  for (const [k, s] of Object.entries(F.sessions.data)) if (s.expiresAt < now) delete F.sessions.data[k];
  F.sessions.save();
}

/* ------------------------------------------------------------------ auditoria */
export function audit(username, action, detail = '') {
  F.audit.data.unshift({ at: isoDate(), user: username, action, detail: String(detail).slice(0, 200) });
  if (F.audit.data.length > 500) F.audit.data.length = 500;
  F.audit.save(500);
}
export const listAudit = (n = 100) => F.audit.data.slice(0, n);

/* ------------------------------------------------------------------ estatísticas (agregadas, sem dados pessoais) */
function bucket() {
  const days = F.stats.data.days;
  const k = dayKey();
  if (!days[k]) {
    days[k] = { views: 0, plays: 0, tiers: {}, games: {}, systems: {} };
    const keys = Object.keys(days).sort();
    while (keys.length > 120) delete days[keys.shift()];
  }
  return days[k];
}
export function recordView(gameSlug) {
  const b = bucket();
  b.views++;
  if (gameSlug) (b.games[gameSlug] ??= { views: 0, plays: 0 }).views++;
  F.stats.save(5000);
}
export function recordPlay({ game, system }) {
  const b = bucket();
  b.plays++;
  if (game) (b.games[game] ??= { views: 0, plays: 0 }).plays++;
  if (system) b.systems[system] = (b.systems[system] || 0) + 1;
  F.stats.save(5000);
}
export function recordTier(tier) {
  const b = bucket();
  b.tiers[tier] = (b.tiers[tier] || 0) + 1;
  F.stats.save(5000);
}

export function dashboardStats() {
  const days = F.stats.data.days;
  const series = [];
  for (let i = 13; i >= 0; i--) {
    const k = dayKey(Date.now() - i * 86400e3);
    series.push({ day: k, views: days[k]?.views || 0, plays: days[k]?.plays || 0 });
  }
  const sum = (n) => {
    const acc = { views: 0, plays: 0, tiers: {}, games: {}, systems: {} };
    for (let i = 0; i < n; i++) {
      const d = days[dayKey(Date.now() - i * 86400e3)];
      if (!d) continue;
      acc.views += d.views; acc.plays += d.plays;
      for (const [t, c] of Object.entries(d.tiers)) acc.tiers[t] = (acc.tiers[t] || 0) + c;
      for (const [s, c] of Object.entries(d.systems)) acc.systems[s] = (acc.systems[s] || 0) + c;
      for (const [g, c] of Object.entries(d.games)) { const a = (acc.games[g] ??= { views: 0, plays: 0 }); a.views += c.views; a.plays += c.plays; }
    }
    return acc;
  };
  const d30 = sum(30), d7 = sum(7), today = days[dayKey()] || { views: 0, plays: 0 };
  const titles = Object.fromEntries(F.games.data.map((g) => [g.slug, g.title]));
  const top = Object.entries(d30.games).map(([slug, c]) => ({ slug, title: titles[slug] || slug, ...c }))
    .sort((a, b) => (b.plays + b.views) - (a.plays + a.views)).slice(0, 8);
  const games = F.games.data;
  return {
    totals: { games: games.length, published: games.filter((g) => g.status === 'published').length, drafts: games.filter((g) => g.status !== 'published').length, systems: listSystems().length },
    today, last7: { views: d7.views, plays: d7.plays }, last30: { views: d30.views, plays: d30.plays },
    series, top, tiers: d30.tiers, systems: d30.systems,
  };
}

/* ------------------------------------------------------------------ inicialização / seed */
function fileInfo(urlPath) {
  const p = join(config.publicDir, urlPath.replace(/^\//, ''));
  if (!existsSync(p)) return null;
  return { size: statSync(p).size, sha256: sha256(readFileSync(p)) };
}

export async function initDb() {
  await mkdir(config.dataDir, { recursive: true });
  await Promise.all(Object.values(F).map((f) => f.load()));
  const result = { createdAdmin: null };

  if (!existsSync(F.games.path)) {
    const base = Date.now() - SEED_GAMES.length * 60e3;
    F.games.data = SEED_GAMES.map((s, i) => {
      const { _dl, rom, romKind, ...rest } = s; // eslint-disable-line no-unused-vars
      const info = romKind === 'web' ? null : fileInfo(rom);
      return {
        id: randomId('g_'), status: 'published', featured: false, publisher: '', year: null, screenshots: [], controls: [], seo: { title: '', description: '' },
        ...rest,
        rom: romKind === 'web' ? { kind: 'web', url: rom, size: 0, sha256: '' }
          : info ? { kind: 'file', url: rom, size: info.size, sha256: info.sha256 } : { kind: 'none', url: '', size: 0, sha256: '' },
        rightsConfirmed: s.license.redistribution !== 'unverified',
        createdAt: isoDate(base + i * 60e3), updatedAt: isoDate(base + i * 60e3),
      };
    }).filter((g) => g.rom.kind !== 'none');
    F.games.save(0);
  }

  if (!existsSync(F.settings.path)) { F.settings.data = { ...DEFAULT_SETTINGS, updatedAt: isoDate() }; F.settings.save(0); }

  if (F.users.data.length === 0) {
    const password = config.adminPassword || generatePassword();
    await createUser({ username: config.adminUser, password, mustChangePassword: !config.adminPassword });
    if (!config.adminPassword) {
      const file = join(config.dataDir, 'CREDENCIAIS-INICIAIS-ADMIN.txt');
      await writeFile(file, [
        'GameWeb — acesso inicial ao painel administrativo',
        '==================================================',
        `Endereço : /admin`,
        `Usuário  : ${config.adminUser}`,
        `Senha    : ${password}`,
        '',
        'No primeiro login o sistema pedirá para você trocar a senha.',
        'Depois disso este arquivo é apagado automaticamente.',
        '',
      ].join('\r\n'));
      result.createdAdmin = file;
    }
  }
  await flushAll();
  pruneSessions();
  return result;
}

export function removeInitialCredentialsFile() {
  try { unlinkSync(join(config.dataDir, 'CREDENCIAIS-INICIAIS-ADMIN.txt')); } catch { /* já removido */ }
}
