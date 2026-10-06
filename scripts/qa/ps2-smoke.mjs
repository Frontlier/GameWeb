// Smoke test do Play!.js (PS2): carrega a página local, lista a UI e os erros.
import { BASE, launch, shot, sleep, watch } from './lib.mjs';

const browser = await launch();
const page = await browser.newPage();
const errors = watch(page);
await page.goto(process.argv[2] || BASE + '/emu/play/', { waitUntil: 'load' });
await sleep(6000);
await shot(page, 'ps2-1');
const info = await page.evaluate(() => ({
  coi: self.crossOriginIsolated,
  title: document.title,
  inputs: [...document.querySelectorAll('input,button,select')].map((e) => `${e.tagName}:${e.type || ''}:${e.id || e.className}:${(e.value || e.textContent || '').slice(0, 30)}`),
  rootHtml: document.getElementById('root')?.innerHTML.slice(0, 600),
  canvas: !!document.getElementById('outputCanvas'),
}));
console.log(JSON.stringify(info, null, 1));
console.log('erros:', errors.slice(0, 15));
await browser.close();
