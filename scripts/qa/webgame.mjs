// Testa o jogo HTML5 dentro do player (iframe): teclado e controle.
import { BASE, launch, shot, sleep, watch } from './lib.mjs';

const browser = await launch();
const ignore = /Translation|favicon|api\/event/;

async function run(label, usePad) {
  const page = await browser.newPage();
  const errors = watch(page);
  page.on('dialog', (d) => d.accept());
  await page.evaluateOnNewDocument(() => {
    const mk = () => ({ pressed: false, touched: false, value: 0 });
    window.__pad = { id: 'Fake Pad (STANDARD GAMEPAD)', index: 0, connected: true, mapping: 'standard', timestamp: 0, axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, mk) };
    if (location.search !== '?nopad') navigator.getGamepads = () => [window.__pad, null, null, null];
  });
  await page.goto(BASE + '/jogar/mini-futebol', { waitUntil: 'networkidle0' });
  await page.click('[data-play]');
  await sleep(1500);
  const frame = page.frames().find((f) => f.url().includes('/web/mini-futebol'));
  console.log(label, 'iframe encontrado:', !!frame, '| fase inicial:', await frame.evaluate(() => window.__mf.phase));
  if (usePad) {
    await frame.evaluate(() => { window.__pad.buttons[9].pressed = true; });
    await sleep(250);
    await frame.evaluate(() => { window.__pad.buttons[9].pressed = false; });
  } else {
    await page.keyboard.press('Enter');
  }
  await sleep(1200);
  console.log(label, 'fase após iniciar:', await frame.evaluate(() => window.__mf.phase));
  const before = await frame.evaluate(() => window.__mf.players[0].x);
  if (usePad) await frame.evaluate(() => { window.__pad.axes[0] = 1; }); else await page.keyboard.down('ArrowRight');
  await sleep(900);
  if (usePad) await frame.evaluate(() => { window.__pad.axes[0] = 0; }); else await page.keyboard.up('ArrowRight');
  const after = await frame.evaluate(() => window.__mf.players[0].x);
  console.log(label, 'jogador andou para a direita:', after > before + 20, `(${Math.round(before)} → ${Math.round(after)})`);
  await shot(page, `wg-${label}`);
  console.log(label, 'erros:', errors.filter((e) => !ignore.test(e)));
  await page.close();
}
await run('teclado', false);
await run('controle', true);
await browser.close();
