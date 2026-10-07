import { join } from 'node:path';
import compression from 'compression';
import express from 'express';
import { config } from './src/config.js';
import { flushAll, initDb } from './src/db.js';
import { baseHeaders } from './src/security.js';
import { createAdminApi, createAdminPages } from './src/routes/admin.js';
import { createPublicRouter, notFound } from './src/routes/public.js';

const init = await initDb();

const app = express();
app.disable('x-powered-by');
if (config.trustProxy) app.set('trust proxy', config.trustProxy);

app.use(baseHeaders);
app.use(compression());

/* ---------------------------------------------------------------- arquivos estáticos */
const YEAR = 'public, max-age=31536000, immutable';
app.use(express.static(config.publicDir, {
  dotfiles: 'ignore',
  setHeaders(res, filePath) {
    const url = res.req.path;
    if (url.startsWith('/emu/') || url === '/js/bench.js') {
      // o emulador roda em página isolada (SharedArrayBuffer): os recursos precisam de COOP/COEP
      res.set('Cross-Origin-Opener-Policy', 'same-origin');
      res.set('Cross-Origin-Embedder-Policy', 'require-corp');
      res.set('Cross-Origin-Resource-Policy', 'same-origin');
    }
    if (url.startsWith('/roms/') || url.startsWith('/uploads/')) res.set('Cross-Origin-Resource-Policy', 'same-origin');
    if (url.startsWith('/web/')) res.set('X-Robots-Tag', 'noindex'); // jogos HTML5 soltos não devem ser indexados; a página do jogo é a /jogos/:slug
    if (url === '/sw.js' || /^\/emu\/play\/(gameweb-[\w.-]+|index\.html)?$/.test(url)) res.set('Cache-Control', 'no-cache');
    else if (res.req.query.v || url.startsWith('/fonts/')) res.set('Cache-Control', YEAR);
    else if (url.startsWith('/emu/')) res.set('Cache-Control', 'public, max-age=2592000');
    else res.set('Cache-Control', 'public, max-age=86400');
    if (filePath.endsWith('.wasm')) res.type('application/wasm');
  },
}));

/* ---------------------------------------------------------------- rotas */
app.use('/api/admin', createAdminApi());
app.use(createAdminPages());
app.use(createPublicRouter());
app.use('/api', (req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));
app.use(notFound);

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (res.headersSent) return;
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error('[erro]', err);
  res.status(status).type('text/plain').send(status === 400 ? 'Requisição inválida.' : status === 413 ? 'Conteúdo grande demais.' : 'Erro interno do servidor.');
});

// Na Vercel o app roda como função (sem listen); fora dela, servidor normal.
if (!process.env.VERCEL) {
  const server = app.listen(config.port, config.host, () => {
    console.log(`
  GameWeb no ar: http://localhost:${config.port}`);
    console.log(`  Painel admin : http://localhost:${config.port}/admin`);
    if (init.createdAdmin) console.log(`
  Primeiro acesso: usuário e senha iniciais em
  ${init.createdAdmin}
`);
  });

  async function shutdown(signal) {
    console.log(`
${signal}: salvando dados e encerrando…`);
    server.close();
    await flushAll();
    process.exit(0);
  }
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

export default app;
