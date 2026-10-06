// Gera os ícones PNG (PWA), a imagem padrão de compartilhamento (OG) e uma imagem por jogo, usando o Chrome/Edge instalado.
// Uso: npm run og
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';
import { SYSTEMS } from '../src/systems.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PUB = join(ROOT, 'public');
const CHROME = process.env.CHROME_PATH || [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', '/usr/bin/google-chrome', '/usr/bin/chromium',
].find(existsSync);
if (!CHROME) { console.error('Chrome/Edge não encontrado. Defina CHROME_PATH.'); process.exit(1); }

const readJson = (f, d) => { try { return JSON.parse(readFileSync(join(ROOT, 'data', f), 'utf8')); } catch { return d; } };
const settings = readJson('settings.json', {});
const siteName = settings.siteName || 'GameWeb';
const games = readJson('games.json', []).filter((g) => g.status === 'published');
const logo = readFileSync(join(PUB, 'img', 'logo.svg'), 'utf8');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const img = (p) => (p && existsSync(join(PUB, p)) ? 'data:image/png;base64,' + readFileSync(join(PUB, p)).toString('base64') : '');

const BASE_CSS = `*{box-sizing:border-box;margin:0}body{width:100vw;height:100vh;overflow:hidden;font-family:'Segoe UI',system-ui,sans-serif;color:#eef0ff;
background:radial-gradient(900px 500px at 85% -10%,rgba(124,92,255,.55),transparent 60%),radial-gradient(700px 420px at -5% 110%,rgba(34,211,238,.35),transparent 60%),#07080f}
.grad{background:linear-gradient(120deg,#7c5cff,#22d3ee 55%,#ff4fa3);-webkit-background-clip:text;background-clip:text;color:transparent}
.grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.07) 1px,transparent 1px);background-size:48px 48px;
-webkit-mask-image:radial-gradient(ellipse at 50% 30%,#000 10%,transparent 70%)}
.chip{display:inline-block;padding:8px 18px;border-radius:99px;font-weight:700;font-size:26px;background:rgba(255,255,255,.1);border:2px solid rgba(255,255,255,.18)}`;

const iconHtml = (pad) => `<style>*{margin:0}body{width:100vw;height:100vh;background:transparent;display:grid;place-items:center}
svg{width:${100 - pad * 2}%;height:${100 - pad * 2}%}</style>${logo}`;
const maskableHtml = `<style>*{margin:0}body{width:100vw;height:100vh;display:grid;place-items:center;background:linear-gradient(135deg,#7c5cff,#22d3ee 55%,#ff4fa3)}
svg{width:62%;height:62%;filter:drop-shadow(0 6px 14px rgba(0,0,0,.25))}rect{display:none}</style>${logo.replace(/<rect[^>]*\/>/, '')}`;

const defaultOg = `<style>${BASE_CSS}
.wrap{position:absolute;inset:0;padding:64px 72px;display:flex;flex-direction:column;justify-content:space-between}
.brand{display:flex;align-items:center;gap:20px;font-size:44px;font-weight:800;letter-spacing:-.02em}.brand svg{width:72px;height:72px}
h1{font-size:84px;line-height:1.02;letter-spacing:-.035em;max-width:780px}
p{font-size:32px;color:#a3a9ca;max-width:640px;margin-top:22px}.chips{display:flex;gap:14px;margin-top:6px}
.pad{position:absolute;right:-30px;bottom:-10px;width:560px;opacity:.95;transform:rotate(-8deg);filter:drop-shadow(0 30px 50px rgba(124,92,255,.5))}</style>
<div class="grid"></div><div class="wrap"><div class="brand">${logo}<span>${esc(siteName)}</span></div>
<div><h1>Jogue <span class="grad">PS2, PSP</span> e clássicos no navegador</h1><p>Emulador online em português. Teclado, controle ou toque. Sem instalar nada.</p></div>
<div class="chips">${['PSP', 'PS2', 'PS1', 'N64', 'NDS', 'GBA'].map((c) => `<span class="chip">${c}</span>`).join('')}</div></div>
<svg class="pad" viewBox="0 0 520 330"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7c5cff"/><stop offset=".55" stop-color="#22d3ee"/><stop offset="1" stop-color="#ff4fa3"/></linearGradient></defs>
<path d="M130 58H390C440 58 478 96 488 146L508 248C516 298 480 328 438 328C412 328 394 316 378 298L346 260H174L142 298C126 316 108 328 82 328C40 328 4 298 12 248L32 146C42 96 80 58 130 58Z" fill="rgba(255,255,255,.07)" stroke="url(#g)" stroke-width="6"/>
<g fill="rgba(255,255,255,.12)" stroke="rgba(255,255,255,.4)" stroke-width="3"><rect x="110" y="118" width="22" height="26" rx="5"/><rect x="110" y="168" width="22" height="26" rx="5"/><rect x="80" y="146" width="28" height="22" rx="5"/><rect x="134" y="146" width="28" height="22" rx="5"/>
<circle cx="400" cy="120" r="15"/><circle cx="400" cy="190" r="15"/><circle cx="365" cy="155" r="15"/><circle cx="435" cy="155" r="15"/><circle cx="190" cy="226" r="34"/><circle cx="330" cy="226" r="34"/></g></svg>`;

const gameOg = (g) => {
  const sys = SYSTEMS.find((s) => s.id === g.system);
  const cover = img(g.cover);
  return `<style>${BASE_CSS}
.wrap{position:absolute;inset:0;padding:56px 64px;display:grid;grid-template-columns:480px 1fr;gap:56px;align-items:center}
.shot{width:480px;height:360px;border-radius:28px;border:2px solid rgba(255,255,255,.18);display:grid;place-items:center;overflow:hidden;box-shadow:0 30px 70px rgba(0,0,0,.6);
background:radial-gradient(circle at 50% 40%,${sys.color}66,transparent 72%),#12152a}
.shot img{width:84%;image-rendering:${g.system === 'web' ? 'auto' : 'pixelated'};border-radius:12px}h1{font-size:${g.title.length > 22 ? 64 : 80}px;line-height:1.03;letter-spacing:-.03em}
.sub{font-size:32px;color:#a3a9ca;margin:18px 0 26px}.brand{position:absolute;left:64px;bottom:40px;display:flex;align-items:center;gap:14px;font-size:30px;font-weight:800}.brand svg{width:46px;height:46px}
.cta{position:absolute;right:64px;bottom:44px;font-size:28px;font-weight:700;color:#22d3ee}</style>
<div class="grid"></div><div class="wrap"><div class="shot">${cover ? `<img src="${cover}">` : ''}</div>
<div><span class="chip" style="border-color:${sys.color};color:${sys.color}">${esc(sys.name)}</span><h1 style="margin-top:22px">${esc(g.title)}</h1><p class="sub">${esc(g.tagline || 'Jogue grátis no navegador')}</p></div></div>
<div class="brand">${logo}<span>${esc(siteName)}</span></div><div class="cta">Jogue agora, sem instalar →</div>`;
};

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--hide-scrollbars', '--force-color-profile=srgb'] });
const page = await browser.newPage();

/** Captura de tela do Mini Futebol (jogo HTML5 próprio) para usar como capa. */
async function coverMiniFutebol() {
  const src = join(PUB, 'web', 'mini-futebol', 'index.html');
  const dest = join(PUB, 'covers', 'mini-futebol.png');
  if (!existsSync(src)) return;
  const p = await browser.newPage();
  await p.setViewport({ width: 800, height: 480 });
  await p.goto(pathToFileURL(src).href);
  await new Promise((r) => setTimeout(r, 500));
  await p.keyboard.press('Enter');
  await p.keyboard.down('ArrowRight');
  await new Promise((r) => setTimeout(r, 1900));
  await p.keyboard.up('ArrowRight');
  await new Promise((r) => setTimeout(r, 400));
  mkdirSync(dirname(dest), { recursive: true });
  await (await p.$('canvas')).screenshot({ path: dest });
  await p.close();
  console.log('ok ', 'covers\\mini-futebol.png');
}
await coverMiniFutebol();

async function render(htmlStr, w, h, file, opts = {}) {
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  await page.setContent(`<!doctype html><meta charset="utf-8">${htmlStr}`, { waitUntil: 'load' });
  mkdirSync(dirname(file), { recursive: true });
  await page.screenshot({ path: file, omitBackground: !!opts.transparent });
  console.log('ok ', file.slice(PUB.length + 1));
}

await render(iconHtml(0), 192, 192, join(PUB, 'img', 'icon-192.png'), { transparent: true });
await render(iconHtml(0), 512, 512, join(PUB, 'img', 'icon-512.png'), { transparent: true });
await render(iconHtml(0), 180, 180, join(PUB, 'img', 'apple-touch-icon.png'), { transparent: true });
await render(maskableHtml, 512, 512, join(PUB, 'img', 'icon-maskable-512.png'));
await render(defaultOg, 1200, 630, join(PUB, 'img', 'og-default.png'));
for (const g of games) await render(gameOg(g), 1200, 630, join(PUB, 'og', g.slug + '.png'));
await browser.close();
