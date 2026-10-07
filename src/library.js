import { existsSync, realpathSync } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import { extname, join, relative, resolve, sep } from 'node:path';
import { config } from './config.js';
import { SYSTEMS } from './systems.js';

/**
 * Biblioteca local de jogos: uma pasta do computador (ex.: a pasta sincronizada do Google Drive
 * para computador) apontada por ROMS_DIR. Os arquivos são servidos em /library/<caminho> e
 * NUNCA copiados para dentro do projeto.
 */
const EXTS = new Set([...SYSTEMS.flatMap((s) => s.exts), 'zip', '7z'].map((e) => '.' + e.toLowerCase()));
const MAX_DEPTH = 5;
const MAX_FILES = 3000;
const SKIP_DIR = /^(\.|\$|node_modules$|System Volume Information$)/;

let rootCache = { dir: null, real: null };

/** Caminho real da biblioteca, ou null se não configurada / inacessível. */
export function libraryRoot() {
  const dir = config.romsDir;
  if (!dir) return null;
  if (rootCache.dir !== dir) {
    let real = null;
    try { if (existsSync(dir)) real = realpathSync(dir); } catch { /* inacessível */ }
    rootCache = { dir, real };
  }
  return rootCache.real;
}

/** "/library/Meu%20Jogo.iso" a partir do caminho relativo (usa "/" e escapa cada trecho). */
export const libraryUrl = (rel) => '/library/' + rel.split(/[\\/]/).map((p) => encodeURIComponent(p).replace(/'/g, '%27')).join('/');

/** Caminho relativo (decodificado) a partir de uma URL /library/..., ou null. */
export function libraryRelFromUrl(url) {
  if (typeof url !== 'string' || !url.startsWith('/library/')) return null;
  try { return decodeURIComponent(url.slice('/library/'.length)); } catch { return null; }
}

/** Lista os arquivos de jogo da biblioteca (recursivo, com limites). */
export async function listLibrary() {
  const root = libraryRoot();
  if (!root) return { configured: !!config.romsDir, reachable: false, files: [], truncated: false };
  const files = [];
  let truncated = false;
  async function walk(dir, depth) {
    let entries;
    try { entries = await readdir(dir, { withFileTypes: true }); } catch { return; }
    entries.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    for (const e of entries) {
      if (files.length >= MAX_FILES) { truncated = true; return; }
      const full = join(dir, e.name);
      if (e.isDirectory()) {
        if (depth < MAX_DEPTH && !SKIP_DIR.test(e.name)) await walk(full, depth + 1);
      } else if (e.isFile() && EXTS.has(extname(e.name).toLowerCase())) {
        const st = await stat(full).catch(() => null);
        if (!st) continue;
        const rel = relative(root, full).split(sep).join('/');
        files.push({ name: e.name, path: rel, url: libraryUrl(rel), size: st.size });
      }
    }
  }
  await walk(root, 0);
  return { configured: true, reachable: true, files, truncated };
}

/** Resolve um caminho relativo para um arquivo permitido dentro da biblioteca, ou null. */
export function resolveLibraryFile(rel) {
  const root = libraryRoot();
  if (!root || !rel || rel.includes('\0')) return null;
  const abs = resolve(root, rel);
  if (!abs.startsWith(root + sep)) return null;
  if (!EXTS.has(extname(abs).toLowerCase())) return null;
  try {
    const real = realpathSync(abs); // bloqueia atalhos/links que escapem da pasta
    if (!real.startsWith(root + sep)) return null;
    return real;
  } catch { return null; }
}
