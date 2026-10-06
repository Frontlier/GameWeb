// Testa a ponte controle -> teclado do Play!.js com um gamepad falso.
import { BASE, launch, shot, sleep, watch } from './lib.mjs';

const browser = await launch();
const page = await browser.newPage();
const errors = watch(page);
await page.evaluateOnNewDocument(() => {
  const mk = () => ({ pressed: false, touched: false, value: 0 });
  window.__pad = { id: 'Fake Xbox Controller (STANDARD GAMEPAD)', index: 0, connected: true, mapping: 'standard', timestamp: 0, axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, mk) };
  navigator.getGamepads = () => [window.__pad, null, null, null];
});
await page.goto(process.argv[2] || BASE + '/emu/play/', { waitUntil: 'load' });
await sleep(3000);
await page.evaluate(() => {
  window.__ev = [];
  const c = document.getElementById('outputCanvas');
  ['keydown', 'keyup'].forEach((t) => c.addEventListener(t, (e) => window.__ev.push(`${t}:${e.code}:${e.keyCode}`)));
});
await page.evaluate(() => { window.__pad.buttons[9].pressed = true; window.__pad.buttons[0].pressed = true; window.__pad.axes[0] = -0.9; });
await sleep(400);
await page.evaluate(() => { window.__pad.buttons[9].pressed = false; window.__pad.buttons[0].pressed = false; window.__pad.axes[0] = 0; });
await sleep(400);
// teclado físico sem foco no canvas
await page.keyboard.press('ArrowUp');
await sleep(300);
console.log('eventos no canvas:', await page.evaluate(() => window.__ev));
console.log('erros:', errors.slice(0, 10));
await shot(page, 'ps2-bridge');
await browser.close();
