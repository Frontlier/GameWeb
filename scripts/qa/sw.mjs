// Service worker: registra, controla a página, não atrapalha o player isolado e serve páginas já visitadas offline.
import { BASE, launch, sleep, watch } from './lib.mjs';

const browser = await launch();
const page = await browser.newPage();
const errors = watch(page);
page.on('dialog', (d) => d.accept());
await page.goto(BASE + '/', { waitUntil: 'networkidle0' });
await page.evaluate(() => navigator.serviceWorker.ready);
await page.reload({ waitUntil: 'networkidle0' });
console.log('SW controlando a página:', await page.evaluate(() => !!navigator.serviceWorker.controller));
await page.goto(BASE + '/jogos', { waitUntil: 'networkidle0' });
console.log('caches:', await page.evaluate(async () => (await caches.keys()).join(',')), '| itens:', await page.evaluate(async () => (await (await caches.open('gw-v1')).keys()).length));
// player continua isolado e funcionando com o SW ativo
await page.goto(BASE + '/jogar/combat-soccer', { waitUntil: 'networkidle0' });
console.log('player isolado:', await page.evaluate(() => self.crossOriginIsolated));
await page.click('[data-play]');
await sleep(5500);
console.log('EJS iniciou:', await page.evaluate(() => !!window.EJS_emulator && !!document.querySelector('#game canvas')));
// offline: página já visitada deve abrir do cache
await page.goto(BASE + '/jogos', { waitUntil: 'networkidle0' });
await page.setOfflineMode(true);
const res = await page.goto(BASE + '/jogos', { waitUntil: 'domcontentloaded' }).catch((e) => ({ err: e.message }));
console.log('offline /jogos:', res.err ? 'FALHOU ' + res.err : 'status ' + res.status(), '| título:', await page.title());
await page.setOfflineMode(false);
console.log('erros:', errors.filter((e) => !/Translation|favicon|api\/event|ERR_INTERNET_DISCONNECTED/.test(e)));
await browser.close();
