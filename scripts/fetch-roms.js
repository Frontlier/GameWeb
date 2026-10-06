// Baixa os jogos homebrew do catálogo inicial (ROMs + capas) para public/roms e public/covers.
// Uso: npm run roms:fetch
import { createWriteStream, existsSync, mkdirSync, renameSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { SEED_GAMES } from '../src/seed-data.js';

const PUB = join(resolve(dirname(fileURLToPath(import.meta.url)), '..'), 'public');
let ok = 0, fail = 0;

for (const game of SEED_GAMES) {
  for (const [url, rel] of game._dl || []) {
    const dest = join(PUB, rel);
    if (existsSync(dest) && statSync(dest).size > 0) { ok++; continue; }
    mkdirSync(dirname(dest), { recursive: true });
    try {
      const res = await fetch(url, { redirect: 'follow' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      await pipeline(Readable.fromWeb(res.body), createWriteStream(dest + '.part'));
      renameSync(dest + '.part', dest);
      console.log(`ok  ${rel} (${(statSync(dest).size / 1024).toFixed(0)} KB)  <- ${url}`);
      ok++;
    } catch (err) {
      console.error(`ERRO ${rel}: ${err.message}  <- ${url}`);
      fail++;
    }
  }
}
console.log(`\nConcluído: ${ok} arquivos ok, ${fail} falhas.`);
if (fail) process.exitCode = 1;
