import { timingSafeEqual } from 'node:crypto';
import { config } from './config.js';
import { verifyPassword, hashPassword } from './crypto.js';
import { getSession, getUserById } from './db.js';

export const COOKIE = 'gw_sid';

export function parseCookies(header = '') {
  const out = {};
  for (const part of String(header).split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    try { out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim()); } catch { /* cookie inválido */ }
  }
  return out;
}

export function setSessionCookie(req, res, token) {
  res.cookie(COOKIE, token, {
    httpOnly: true, sameSite: 'strict', path: '/',
    secure: config.cookieSecure || req.secure,
    maxAge: 7 * 86400e3,
  });
}
export const clearSessionCookie = (res) => res.clearCookie(COOKIE, { path: '/' });

/** Anexa req.auth = { token, session, user } quando há sessão válida. */
export function attachAuth(req, res, next) {
  const token = parseCookies(req.headers.cookie)[COOKIE];
  const session = getSession(token);
  const user = session ? getUserById(session.userId) : null;
  req.auth = session && user ? { token, session, user } : null;
  next();
}

export function requireAuth(req, res, next) {
  if (!req.auth) return res.status(401).json({ error: 'Sessão expirada. Faça login novamente.', code: 'unauthenticated' });
  next();
}

export function requireCsrf(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const sent = Buffer.from(String(req.get('x-csrf-token') || ''));
  const real = Buffer.from(req.auth?.session.csrf || '');
  if (!sent.length || sent.length !== real.length || !timingSafeEqual(sent, real)) {
    return res.status(403).json({ error: 'Token de segurança inválido. Recarregue a página.', code: 'csrf' });
  }
  next();
}

/** Bloqueia o painel até a senha inicial ser trocada. */
export function requirePasswordChanged(req, res, next) {
  if (req.auth?.user.mustChangePassword) {
    return res.status(403).json({ error: 'Troque a senha inicial para continuar.', code: 'password_change_required' });
  }
  next();
}

/* ---- proteção contra força bruta no login ---- */
const WINDOW = 15 * 60e3;
const MAX_PER_USER = 6;
const MAX_PER_IP = 30;
const fails = new Map(); // chave -> { count, reset }

setInterval(() => { const now = Date.now(); for (const [k, v] of fails) if (v.reset < now) fails.delete(k); }, 60e3).unref();

const keys = (req, username) => [`ip:${req.ip}`, `u:${String(username || '').toLowerCase()}|${req.ip}`];

export function loginBlockedFor(req, username) {
  const now = Date.now();
  const [ipKey, userKey] = keys(req, username);
  const ip = fails.get(ipKey), u = fails.get(userKey);
  const wait = Math.max(ip && ip.count >= MAX_PER_IP && ip.reset > now ? ip.reset - now : 0, u && u.count >= MAX_PER_USER && u.reset > now ? u.reset - now : 0);
  return wait ? Math.ceil(wait / 1000) : 0;
}
export function loginFailed(req, username) {
  const now = Date.now();
  for (const k of keys(req, username)) {
    const e = fails.get(k);
    if (!e || e.reset < now) fails.set(k, { count: 1, reset: now + WINDOW }); else e.count++;
  }
}
export function loginSucceeded(req, username) { fails.delete(keys(req, username)[1]); }

// hash falso para igualar o tempo de resposta quando o usuário não existe
let dummyHash;
export async function dummyVerify(password) {
  dummyHash ??= await hashPassword('dummy-password-for-timing');
  await verifyPassword(password, dummyHash);
}
