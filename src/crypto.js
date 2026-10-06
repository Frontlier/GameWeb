import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);
const N = 16384, R = 8, P = 1, KEYLEN = 64;

/** Hash de senha com scrypt (salt aleatório por senha). Formato: scrypt$N$r$p$salt$hash */
export async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt, KEYLEN, { N, r: R, p: P, maxmem: 64 * 1024 * 1024 });
  return `scrypt$${N}$${R}$${P}$${salt.toString('base64')}$${key.toString('base64')}`;
}

export async function verifyPassword(password, stored) {
  try {
    const [algo, n, r, p, saltB64, hashB64] = String(stored).split('$');
    if (algo !== 'scrypt') return false;
    const expected = Buffer.from(hashB64, 'base64');
    const key = await scryptAsync(password, Buffer.from(saltB64, 'base64'), expected.length,
      { N: +n, r: +r, p: +p, maxmem: 64 * 1024 * 1024 });
    return key.length === expected.length && timingSafeEqual(key, expected);
  } catch {
    return false;
  }
}

export const randomToken = (bytes = 32) => randomBytes(bytes).toString('base64url');
export const sha256 = (data) => createHash('sha256').update(data).digest('hex');
export const randomId = (prefix = '') => prefix + randomBytes(8).toString('hex');

/** Senha aleatória legível (sem caracteres ambíguos), ex.: Kd7m-Pq4x-Tn8w-Hz3c */
export function generatePassword() {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const bytes = randomBytes(16);
  let out = '';
  for (let i = 0; i < 16; i++) {
    out += alphabet[bytes[i] % alphabet.length];
    if (i % 4 === 3 && i < 15) out += '-';
  }
  return out;
}

export function passwordProblem(password, username = '') {
  if (typeof password !== 'string' || password.length < 10) return 'A senha deve ter pelo menos 10 caracteres.';
  if (password.length > 128) return 'A senha é longa demais (máximo de 128 caracteres).';
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(password)).length;
  if (classes < 3) return 'Use ao menos 3 tipos de caractere: minúsculas, maiúsculas, números e símbolos.';
  if (username && password.toLowerCase().includes(username.toLowerCase())) return 'A senha não pode conter o nome de usuário.';
  return null;
}
