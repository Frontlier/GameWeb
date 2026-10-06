// Teste do player: jogo do catálogo, "abrir meu jogo" (arquivo local) e entrada por teclado/controle.
import { join } from 'node:path';
import { BASE, launch, shot, sleep, watch } from './lib.mjs';

const ROOT = process.cwd();
const browser = await launch();
const ignore = /Translation|favicon|api\/event/;

async function open(path, opts = {}) {
  const page = await browser.newPage();
  const errors = watch(page);
  page.on('dialog', (d) => d.accept());
  if (opts.fakePad) {
    await page.evaluateOnNewDocument(() => {
      const mk = () => ({ pressed: false, touched: false, value: 0 });
      window.__pad = { id: 'Xbox 360 Controller (STANDARD GAMEPAD Vendor: 045e Product: 028e)', index: 0, connected: true, mapping: 'standard', timestamp: 0, axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, mk) };
      navigator.getGamepads = () => [window.__pad, null, null, null];
    });
  }
  await page.goto(BASE + path, { waitUntil: 'networkidle0' });
  return { page, errors };
}
const pressPad = async (page, idx, ms = 160) => {
  await page.evaluate((i) => { window.__pad.buttons[i].pressed = true; window.__pad.buttons[i].value = 1; }, idx);
  await sleep(ms);
  await page.evaluate((i) => { window.__pad.buttons[i].pressed = false; window.__pad.buttons[i].value = 0; }, idx);
  await sleep(120);
};
const report = (label, errors) => console.log(label, 'erros:', errors.filter((e) => !ignore.test(e)).slice(0, 8));

/* 1) jogo do catálogo com teclado */
{
  const { page, errors } = await open('/jogar/combat-soccer');
  await sleep(600);
  await shot(page, 'pl-1-gate');
  await page.click('[data-play]');
  await sleep(6000);
  await shot(page, 'pl-2-jogando');
  for (const k of ['Enter', 'z']) { await page.keyboard.down(k); await sleep(120); await page.keyboard.up(k); await sleep(900); }
  for (let i = 0; i < 5; i++) { await page.keyboard.down('ArrowRight'); await sleep(220); await page.keyboard.up('ArrowRight'); }
  await sleep(800);
  await shot(page, 'pl-3-teclado');
  console.log('isolado:', await page.evaluate(() => self.crossOriginIsolated), '| EJS:', await page.evaluate(() => !!window.EJS_emulator));
  report('catálogo', errors);
  await page.close();
}

/* 2) controle (gamepad) no EmulatorJS */
{
  const { page, errors } = await open('/jogar/combat-soccer', { fakePad: true });
  await sleep(500);
  console.log('status do controle:', await page.$eval('[data-gamepad-text]', (e) => e.textContent));
  await page.click('[data-play]');
  await sleep(6000);
  await pressPad(page, 9); await sleep(800); await pressPad(page, 0); await sleep(800);
  await shot(page, 'pl-4-pad-antes');
  await page.evaluate(() => { window.__pad.axes[0] = 1; window.__pad.buttons[15].pressed = true; });
  await sleep(1400);
  await page.evaluate(() => { window.__pad.axes[0] = 0; window.__pad.buttons[15].pressed = false; });
  await sleep(500);
  await shot(page, 'pl-5-pad-depois');
  report('gamepad', errors);
  await page.close();
}

/* 3) abrir meu jogo (GBA) a partir de um arquivo local */
{
  const { page, errors } = await open('/emulador');
  await shot(page, 'pl-6-byo');
  const gba = join(ROOT, 'public', 'roms', 'apotris.gba');
  await page.evaluate(() => document.querySelector('[data-pick-system="gba"]').click());
  const input = await page.$('[data-file]');
  await input.uploadFile(gba);
  await sleep(500);
  await shot(page, 'pl-7-byo-arquivo');
  console.log('botão iniciar habilitado:', await page.$eval('[data-play]', (b) => !b.disabled), '| url:', page.url());
  await page.click('[data-play]');
  await sleep(7000);
  await page.keyboard.press('Enter'); await sleep(1500);
  await shot(page, 'pl-8-byo-jogando');
  report('byo-gba', errors);
  await page.close();
}

/* 4) abrir meu jogo (PS2) — valida iframe do Play! e entrega do arquivo */
{
  const { page, errors } = await open('/emulador/ps2');
  const input = await page.$('[data-file]');
  await input.uploadFile(join(ROOT, 'public', 'roms', 'ucity.gbc')); // arquivo qualquer só para testar o fluxo
  await sleep(300);
  await page.click('[data-play]');
  await sleep(6000);
  await shot(page, 'pl-9-ps2');
  const frames = page.frames().map((f) => f.url());
  console.log('frames:', frames);
  const pf = page.frames().find((f) => f.url().includes('/emu/play/'));
  if (pf) console.log('Play! isolado:', await pf.evaluate(() => self.crossOriginIsolated), '| arquivo no input:', await pf.evaluate(() => document.querySelector('input[type=file]')?.files?.[0]?.name));
  report('byo-ps2', errors);
  await page.close();
}
await browser.close();
