// Baixa e hospeda localmente os emuladores usados pelo site.
//   - EmulatorJS (GPL-3.0)  -> public/emu/ejs   (PSP, PS1, N64, NDS, GBA, GB/GBC, SNES, NES, Mega Drive, ...)
//   - Play!.js  (BSD-2)     -> public/emu/play  (PS2, experimental)
//   - Fontes (OFL)          -> public/fonts
// Uso: npm run emu:fetch [-- --force]
import { createWriteStream, existsSync, mkdirSync, statSync, readFileSync, writeFileSync, copyFileSync, renameSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PUB = join(ROOT, 'public');
const FORCE = process.argv.includes('--force');

const EJS_BASE = 'https://cdn.emulatorjs.org/stable/data/';
const EJS_DIR = join(PUB, 'emu', 'ejs');
const PLAY_BASE = 'https://playjs.purei.org/';
const PLAY_DIR = join(PUB, 'emu', 'play');

// núcleos libretro usados (ver src/systems.js)
const CORES = ['ppsspp', 'pcsx_rearmed', 'mupen64plus_next', 'melonds', 'mgba', 'gambatte', 'snes9x', 'fceumm',
  'genesis_plus_gx', 'smsplus', 'mednafen_pce', 'stella2014'];
const VARIANTS = ['-legacy-wasm.data', '-wasm.data', '-thread-legacy-wasm.data', '-thread-wasm.data'];

const manifest = [];

function sha256(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

async function download(url, dest, { optional = false } = {}) {
  mkdirSync(dirname(dest), { recursive: true });
  if (!FORCE && existsSync(dest) && statSync(dest).size > 0) {
    manifest.push({ file: dest.slice(PUB.length + 1).replaceAll('\\', '/'), url, size: statSync(dest).size, sha256: sha256(dest), cached: true });
    return true;
  }
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { redirect: 'follow' });
      if (res.status === 404 && optional) return false;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const tmp = dest + '.part';
      await pipeline(Readable.fromWeb(res.body), createWriteStream(tmp));
      renameSync(tmp, dest);
      const size = statSync(dest).size;
      manifest.push({ file: dest.slice(PUB.length + 1).replaceAll('\\', '/'), url, size, sha256: sha256(dest) });
      console.log(`  ok  ${dest.slice(PUB.length + 1)} (${(size / 1024).toFixed(0)} KB)`);
      return true;
    } catch (err) {
      if (attempt === 3) {
        if (optional) return false;
        throw new Error(`Falha ao baixar ${url}: ${err.message}`);
      }
      await new Promise((r) => setTimeout(r, 800 * attempt));
    }
  }
  return false;
}

async function pool(tasks, limit = 4) {
  const queue = [...tasks];
  await Promise.all(Array.from({ length: limit }, async () => {
    while (queue.length) await queue.shift()();
  }));
}

async function fetchEmulatorJS() {
  console.log('\n[EmulatorJS] baixando de', EJS_BASE);
  const files = [
    'loader.js', 'emulator.min.js', 'emulator.min.css', 'version.json',
    'compression/extract7z.js', 'compression/extractzip.js', 'compression/libunrar.js',
    'localization/pt-BR.json', 'cores/ppsspp-assets.zip',
  ];
  const optional = ['compression/libunrar.js.mem', 'cores/cores.json'];
  const tasks = [];
  for (const f of files) tasks.push(() => download(EJS_BASE + f, join(EJS_DIR, f)));
  for (const f of optional) tasks.push(() => download(EJS_BASE + f, join(EJS_DIR, f), { optional: true }));
  for (const core of CORES) {
    for (const v of VARIANTS) tasks.push(() => download(`${EJS_BASE}cores/${core}${v}`, join(EJS_DIR, 'cores', core + v), { optional: true }));
    tasks.push(() => download(`${EJS_BASE}cores/reports/${core}.json`, join(EJS_DIR, 'cores', 'reports', core + '.json'), { optional: true }));
  }
  await pool(tasks);
  await download('https://raw.githubusercontent.com/EmulatorJS/EmulatorJS/main/LICENSE', join(EJS_DIR, 'LICENSE.txt'), { optional: true });
}

async function fetchPlay() {
  console.log('\n[Play!.js] baixando de', PLAY_BASE);
  const res = await fetch(PLAY_BASE);
  if (!res.ok) throw new Error('Play!.js indisponível: HTTP ' + res.status);
  const original = await res.text();
  mkdirSync(PLAY_DIR, { recursive: true });
  writeFileSync(join(PLAY_DIR, 'index.original.html'), original);

  // arquivos referenciados pelo index.html + os binários do emulador
  const refs = new Set(['Play.js', 'Play.wasm']);
  for (const m of original.matchAll(/(?:src|href)="\/?((?:static|logo|favicon|manifest)[^"]*)"/g)) refs.add(m[1]);
  await pool([...refs].map((f) => () => download(PLAY_BASE + f, join(PLAY_DIR, f), { optional: /favicon|logo|manifest/.test(f) })), 3);
  await download('https://raw.githubusercontent.com/jpd002/Play-/master/LICENSE', join(PLAY_DIR, 'LICENSE.txt'), { optional: true });

  // versão ajustada: caminhos relativos + estilo/ponte de controle do GameWeb
  let html = original
    .replace(/(src|href)="\/(?!\/)/g, '$1="')
    .replace('<head>', '<head><base href="/emu/play/"/><script src="gameweb-gpu.js"></script>')
    .replace('</head>', '<link rel="stylesheet" href="gameweb-play.css"><script defer src="gameweb-bridge.js"></script></head>')
    .replace('<html lang="en">', '<html lang="pt-BR" class="gw-embed">');
  writeFileSync(join(PLAY_DIR, 'index.html'), html);
  console.log('  ok  emu/play/index.html (ajustado)');
}

function copyFonts() {
  console.log('\n[Fontes] copiando de node_modules');
  const out = join(PUB, 'fonts');
  mkdirSync(out, { recursive: true });
  const pairs = [
    ['@fontsource-variable/inter/files/inter-latin-wght-normal.woff2', 'inter-latin.woff2'],
    ['@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2', 'space-grotesk-latin.woff2'],
  ];
  for (const [src, name] of pairs) {
    const from = join(ROOT, 'node_modules', src);
    if (!existsSync(from)) { console.warn('  !! fonte ausente (rode npm install):', src); continue; }
    copyFileSync(from, join(out, name));
    console.log('  ok  fonts/' + name);
  }
}

try {
  await fetchEmulatorJS();
  await fetchPlay();
  copyFonts();
  mkdirSync(join(PUB, 'emu'), { recursive: true });
  writeFileSync(join(PUB, 'emu', 'MANIFEST.json'), JSON.stringify({ generatedAt: new Date().toISOString(), files: manifest }, null, 2));
  const total = manifest.reduce((s, f) => s + f.size, 0);
  console.log(`\nConcluído: ${manifest.length} arquivos, ${(total / 1048576).toFixed(1)} MB. Manifesto em public/emu/MANIFEST.json`);
} catch (err) {
  console.error('\nERRO:', err.message);
  process.exitCode = 1;
}
