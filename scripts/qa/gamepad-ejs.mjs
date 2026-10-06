// Teste do controle (gamepad) no EmulatorJS em dois cenários:
//   A) controle já visível ANTES de clicar em "Jogar" (usuário apertou um botão na tela inicial)
//   B) controle aparece DEPOIS do jogo iniciar
import { BASE, launch, shot, sleep, watch } from './lib.mjs';

const browser = await launch();
const ignore = /Translation|favicon|api\/event/;

async function scenario(label, visibleBefore) {
  const page = await browser.newPage();
  const errors = watch(page);
  page.on('dialog', (d) => d.accept());
  await page.evaluateOnNewDocument((vis) => {
    const mk = () => ({ pressed: false, touched: false, value: 0 });
    window.__pad = { id: 'Xbox 360 Controller (STANDARD GAMEPAD Vendor: 045e Product: 028e)', index: 0, connected: true, mapping: 'standard', timestamp: 0, axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, mk) };
    window.__vis = vis;
    navigator.getGamepads = () => (window.__vis ? [window.__pad, null, null, null] : [null, null, null, null]);
  }, visibleBefore);
  await page.goto(BASE + '/jogar/combat-soccer', { waitUntil: 'networkidle0' });
  await sleep(500);
  await page.click('[data-play]');
  await sleep(6500);
  if (!visibleBefore) { await page.evaluate(() => { window.__vis = true; }); await sleep(600); }
  const press = async (i, ms = 200) => {
    await page.evaluate((k) => { window.__pad.buttons[k].pressed = true; window.__pad.buttons[k].value = 1; window.__pad.timestamp += 1; }, i);
    await sleep(ms);
    await page.evaluate((k) => { window.__pad.buttons[k].pressed = false; window.__pad.buttons[k].value = 0; window.__pad.timestamp += 1; }, i);
    await sleep(300);
  };
  await shot(page, `gp-${label}-1`);
  await press(9); await sleep(1500);   // Start
  await shot(page, `gp-${label}-2`);
  const before = await page.screenshot({ encoding: 'base64' });
  await page.evaluate(() => { window.__pad.buttons[15].pressed = true; window.__pad.timestamp += 1; });
  await sleep(1500);
  await page.evaluate(() => { window.__pad.buttons[15].pressed = false; window.__pad.timestamp += 1; });
  await sleep(300);
  const after = await page.screenshot({ encoding: 'base64' });
  await shot(page, `gp-${label}-3`);
  console.log(`cenário ${label}: tela mudou após direcional? ${before !== after} | erros:`, errors.filter((e) => !ignore.test(e)));
  await page.close();
}
await scenario('A', true);
await scenario('B', false);
await browser.close();
