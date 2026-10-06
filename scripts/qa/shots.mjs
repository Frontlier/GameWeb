// Capturas de viewport (não full-page) com tema e tamanho escolhidos.
// Uso: node scripts/qa/shots.mjs <rota> <nome> [dark|light] [largura] [altura] [scrollY...]
import { BASE, launch, shot, sleep, watch } from './lib.mjs';

const [route = '/', name = 'shot', scheme = 'dark', w = '1366', h = '800', ...ys] = process.argv.slice(2);
const mobile = +w < 700;
const browser = await launch({ viewport: { width: +w, height: +h, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: mobile ? 2 : 1 } });
const page = await browser.newPage();
const errors = watch(page);
await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: scheme }]);
await page.goto(BASE + route, { waitUntil: 'networkidle0' });
await sleep(1200);
const list = ys.length ? ys.map(Number) : [0];
for (const y of list) {
  await page.evaluate((yy) => scrollTo(0, yy), y);
  await sleep(1300);
  await shot(page, `${name}-${y}`);
}
console.log('erros:', errors.filter((e) => !/Translation|api\/event/.test(e)));
await browser.close();
