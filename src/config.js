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
  dataDir: process.env.DATA_DIR ? resolve(process.env.DATA_DIR) : join(ROOT, 'data'),
  publicDir: join(ROOT, 'public'),
  uploadDir: join(ROOT, 'public', 'uploads'),
  maxRomMb: int(process.env.MAX_ROM_MB, 700),
  maxImageMb: 8,
  sessionHours: int(process.env.SESSION_HOURS, 8),
  // primeira execução: se definidos, criam o admin inicial (senão gera senha aleatória)
  adminUser: (process.env.ADMIN_USER || 'admin').trim(),
  adminPassword: process.env.ADMIN_PASSWORD || '',
};
