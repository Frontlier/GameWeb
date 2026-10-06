// Teste do Mini Futebol (jogo HTML5): um "robô" joga por ~45 s; checa erros, física estável e gols.
import { BASE, launch, shot, sleep, watch } from './lib.mjs';

const browser = await launch({ viewport: { width: 900, height: 560 } });
const page = await browser.newPage();
const errors = watch(page);
await page.goto(BASE + '/web/mini-futebol/index.html', { waitUntil: 'load' });
await sleep(500);
await shot(page, 'mf-1-menu');
await page.keyboard.press('Enter');
await sleep(300);

const start = Date.now();
let goals = 0, lastScore = '0-0', nan = false, minBallX = 1e9, maxBallX = -1e9;
const held = new Set();
const setKey = async (k, down) => { if (down && !held.has(k)) { held.add(k); await page.keyboard.down(k); } else if (!down && held.has(k)) { held.delete(k); await page.keyboard.up(k); } };
while (Date.now() - start < 45000) {
  const s = await page.evaluate(() => ({ ph: window.__mf.phase, b: { x: window.__mf.ball.x, y: window.__mf.ball.y }, p: { x: window.__mf.players[0].x, y: window.__mf.players[0].y }, sc: window.__mf.score.join('-'), t: window.__mf.time }));
  if ([s.b.x, s.b.y, s.p.x, s.p.y].some((v) => !Number.isFinite(v))) nan = true;
  minBallX = Math.min(minBallX, s.b.x); maxBallX = Math.max(maxBallX, s.b.x);
  if (s.sc !== lastScore) { goals++; lastScore = s.sc; await shot(page, `mf-gol-${goals}`); }
  if (s.ph === 'end') break;
  // robô: vai atrás da bola (posicionando-se do lado esquerdo dela) e chuta para a direita
  const tx = s.b.x - 22, ty = s.b.y;
  const dx = tx - s.p.x, dy = ty - s.p.y;
  await setKey('ArrowRight', dx > 10); await setKey('ArrowLeft', dx < -10);
  await setKey('ArrowDown', dy > 10); await setKey('ArrowUp', dy < -10);
  const near = Math.hypot(s.b.x - s.p.x, s.b.y - s.p.y) < 40;
  await setKey('Space', near);
  await sleep(40);
}
for (const k of [...held]) await setKey(k, false);
await shot(page, 'mf-2-fim');
const fin = await page.evaluate(() => ({ phase: window.__mf.phase, score: window.__mf.score, time: Math.round(window.__mf.time) }));
console.log('estado final:', fin, '| gols vistos:', goals, '| NaN:', nan, '| alcance da bola X:', Math.round(minBallX), '→', Math.round(maxBallX));
console.log('erros:', errors.filter((e) => !/favicon|Translation/.test(e)));
await browser.close();
