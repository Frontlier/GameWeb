// QA visual e de erros das páginas públicas (desktop e celular). Uso: node scripts/qa/site.mjs [desktop|mobile|all]
import { BASE, launch, shot, sleep, watch } from './lib.mjs';

const mode = process.argv[2] || 'all';
const PAGES = [
  ['home', '/'], ['jogos', '/jogos'], ['jogo', '/jogos/combat-soccer'], ['console-psp', '/consoles/psp'], ['console-ps2', '/consoles/ps2'],
  ['consoles', '/consoles'], ['ajuda', '/ajuda'], ['legal', '/legal'], ['emulador', '/emulador'],
];

async function run(label, viewport, isMobile) {
  const browser = await launch({ viewport: { ...viewport, isMobile, hasTouch: isMobile, deviceScaleFactor: isMobile ? 2 : 1 } });
  const page = await browser.newPage();
  const errors = watch(page);
  page.on('dialog', (d) => d.accept());
  for (const [name, path] of PAGES) {
    errors.length = 0;
    await page.goto(BASE + path, { waitUntil: 'networkidle0' });
    await sleep(900);
    // rola a página para disparar as animações de entrada
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < h; y += 500) { await page.evaluate((yy) => scrollTo(0, yy), y); await sleep(70); }
    await sleep(900);
    const hidden = await page.evaluate(() => document.querySelectorAll('.reveal:not(.is-in)').length);
    await page.evaluate(() => scrollTo(0, 0));
    await sleep(400);
    await shot(page, `${label}-${name}`, { fullPage: true });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    console.log(`${label.padEnd(8)} ${path.padEnd(24)} h=${h} reveal-pendentes=${hidden} overflowX=${overflow} erros=${errors.filter((e) => !/Translation/.test(e)).length}`);
    for (const e of errors.filter((x) => !/Translation/.test(x)).slice(0, 5)) console.log('    ', e);
  }
  await browser.close();
}

if (mode === 'desktop' || mode === 'all') await run('desktop', { width: 1366, height: 800 }, false);
if (mode === 'mobile' || mode === 'all') await run('mobile', { width: 390, height: 844 }, true);
