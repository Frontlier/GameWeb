// Player no celular (retrato e paisagem): botões virtuais do EmulatorJS e painel inferior.
import { BASE, launch, shot, sleep, watch } from './lib.mjs';

const browser = await launch();
const ignore = /Translation|favicon|api\/event/;
for (const [label, w, h] of [['retrato', 390, 844], ['paisagem', 844, 390]]) {
  const page = await browser.newPage();
  const errors = watch(page);
  page.on('dialog', (d) => d.accept());
  await page.setUserAgent('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36');
  await page.setViewport({ width: w, height: h, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await page.goto(BASE + '/jogar/combat-soccer', { waitUntil: 'networkidle0' });
  await sleep(500);
  await shot(page, `mp-${label}-1-gate`);
  await page.tap('[data-play]');
  await sleep(6500);
  await shot(page, `mp-${label}-2-jogando`);
  const info = await page.evaluate(() => ({
    virtual: !!document.querySelector('.ejs_virtualGamepad_open, .ejs_virtualGamepad_parent, [class*=virtualGamepad]'),
    canvas: !!document.querySelector('canvas'),
    iso: self.crossOriginIsolated,
  }));
  console.log(label, JSON.stringify(info));
  // abre o painel de controles
  await page.tap('[data-panel-toggle]');
  await sleep(700);
  await shot(page, `mp-${label}-3-painel`);
  console.log(label, 'erros:', errors.filter((e) => !ignore.test(e)));
  await page.close();
}
await browser.close();
