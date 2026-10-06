/* GameWeb — service worker mínimo (PWA): cache de CSS/JS/fontes/imagens e fallback offline para páginas já visitadas.
   Não intercepta emuladores, ROMs, uploads, API nem as páginas do player (isoladas por COOP/COEP). */
const VERSION = 'gw-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== VERSION) await caches.delete(k);
    await self.clients.claim();
  })());
});

const SKIP = /^\/(emu|roms|uploads|api|admin|jogar|emulador|og)(\/|$)/;
const STATIC = /^\/(css|js|fonts|img|covers)\//;

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin || SKIP.test(url.pathname) || url.pathname === '/sw.js') return;

  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
      return res;
    }).catch(async () => (await caches.match(req)) || (await caches.match('/'))
      || new Response('<!doctype html><meta charset="utf-8"><title>Sem conexão</title><body style="font-family:system-ui;padding:2rem"><h1>Você está offline</h1><p>Reconecte-se à internet para continuar jogando.</p>', { status: 503, headers: { 'content-type': 'text/html; charset=utf-8' } })));
    return;
  }
  if (STATIC.test(url.pathname)) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
      return res;
    })));
  }
});
