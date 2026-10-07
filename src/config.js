import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// carrega .env (se existir) sem dependências externas
try {
  if (existsSync(join(ROOT, '.env'))) process.loadEnvFile(join(ROOT, '.env'));
} catch { /* .env opcional */ }

const int = (v, d) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : d;
};

export const config = {
  root: ROOT,
  port: int(process.env.PORT, 3000),
  host: process.env.HOST || '0.0.0.0',
  isProd: process.env.NODE_ENV === 'production',
  // Domínio público (ex.: https://meusite.com.br). Vazio = deduz da requisição.
  siteUrl: (process.env.SITE_URL || '').trim().replace(/\/+$/, ''),
  // Atrás de proxy/CDN (Cloudflare, Nginx...) use TRUST_PROXY=1
  trustProxy: process.env.TRUST_PROXY ? (/^\d+$/.test(process.env.TRUST_PROXY) ? Number(process.env.TRUST_PROXY) : process.env.TRUST_PROXY) : false,
  cookieSecure: process.env.COOKIE_SECURE === '1',
  // Vercel: disco só-leitura, exceto /tmp (temporário, some a cada reinício)
  dataDir: process.env.DATA_DIR ? resolve(process.env.DATA_DIR) : process.env.VERCEL ? '/tmp/gameweb-data' : join(ROOT, 'data'),
  publicDir: join(ROOT, 'public'),
  uploadDir: process.env.VERCEL ? '/tmp/gameweb-uploads' : join(ROOT, 'public', 'uploads'),
  // Hosts externos de ROM liberados no player (CSP connect-src), separados por espaço. Ex.: "https://*.gofile.io"
  romHosts: (process.env.ROM_HOSTS || '').split(/[\s,]+/).filter((h) => /^https:\/\/[\w*.-]+(:\d+)?$/.test(h)),
  // Pasta local com os jogos (ex.: pasta sincronizada do Google Drive para computador). Servida em /library/
  romsDir: process.env.ROMS_DIR ? resolve(process.env.ROMS_DIR) : '',
  maxRomMb: int(process.env.MAX_ROM_MB, 700),
  maxImageMb: 8,
  sessionHours: int(process.env.SESSION_HOURS, 8),
  // primeira execução: se definidos, criam o admin inicial (senão gera senha aleatória)
  adminUser: (process.env.ADMIN_USER || 'admin').trim(),
  adminPassword: process.env.ADMIN_PASSWORD || '',
};
