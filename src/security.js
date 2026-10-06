import { createHash } from 'node:crypto';
import { config } from './config.js';

/** Script inline mínimo para aplicar o tema salvo antes da pintura (evita "flash"). */
export const THEME_SCRIPT = "document.documentElement.className+=' js';try{var t=localStorage.getItem('gw-theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t)}catch(e){}";
const THEME_HASH = `'sha256-${createHash('sha256').update(THEME_SCRIPT).digest('base64')}'`;

/** Cabeçalhos comuns a todas as respostas. */
export function baseHeaders(req, res, next) {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Frame-Options': 'SAMEORIGIN',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), accelerometer=(), gamepad=(self), fullscreen=(self), autoplay=(self), cross-origin-isolated=(self)',
    'X-DNS-Prefetch-Control': 'off',
  });
  if (req.secure) res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
}

/**
 * Política por tipo de página:
 *  site   -> páginas públicas (HTML estático + SSR)
 *  player -> emulador (precisa de COOP/COEP para SharedArrayBuffer/threads do PSP)
 *  admin  -> painel administrativo (mais restrito)
 */
export function setPageHeaders(res, kind, { ga4 = '', plausible = '' } = {}) {
  const analyticsScripts = [ga4 && 'https://www.googletagmanager.com', plausible && 'https://plausible.io'].filter(Boolean).join(' ');
  const analyticsConnect = [ga4 && 'https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com', plausible && 'https://plausible.io'].filter(Boolean).join(' ');
  let csp;
  if (kind === 'player') {
    csp = [
      "default-src 'self'",
      `script-src 'self' ${THEME_HASH} blob: 'wasm-unsafe-eval' 'unsafe-eval'`,
      "style-src 'self' blob:", "style-src-attr 'unsafe-inline'",
      "img-src 'self' data: blob:", "font-src 'self' data:",
      `connect-src 'self' blob: data: ${config.romHosts.join(' ')}`.trim(), "media-src 'self' blob: data:",
      "worker-src 'self' blob:", "frame-src 'self' https:", "child-src 'self' blob: https:",
      "object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'self'", "manifest-src 'self'",
    ].join('; ');
    res.set('Cross-Origin-Opener-Policy', 'same-origin');
    res.set('Cross-Origin-Embedder-Policy', 'require-corp');
  } else if (kind === 'admin') {
    csp = [
      "default-src 'self'", "script-src 'self'", "style-src 'self'", "style-src-attr 'unsafe-inline'",
      "img-src 'self' data: blob: https:", "font-src 'self'", "connect-src 'self'", "media-src 'self'",
      "object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'",
    ].join('; ');
    res.set('X-Frame-Options', 'DENY');
    res.set('Cache-Control', 'no-store');
    res.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  } else {
    csp = [
      "default-src 'self'",
      `script-src 'self' ${THEME_HASH} ${analyticsScripts}`.trim(),
      "style-src 'self'", "style-src-attr 'unsafe-inline'",
      "img-src 'self' data: blob: https:", "font-src 'self'",
      `connect-src 'self' ${analyticsConnect}`.trim(), "media-src 'self'",
      "worker-src 'self'", kind === 'webgame' ? "frame-src 'self' https:" : "frame-src 'self'",
      "object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'self'", "manifest-src 'self'",
    ].join('; ');
  }
  res.set('Content-Security-Policy', csp);
}

/** Limitador simples em memória (janela deslizante) para endpoints públicos. */
export function rateLimit({ windowMs = 60e3, max = 60, keyFn = (req) => req.ip } = {}) {
  const hits = new Map();
  setInterval(() => { const now = Date.now(); for (const [k, v] of hits) if (v.reset < now) hits.delete(k); }, windowMs).unref();
  return (req, res, next) => {
    const key = keyFn(req);
    const now = Date.now();
    let e = hits.get(key);
    if (!e || e.reset < now) { e = { count: 0, reset: now + windowMs }; hits.set(key, e); }
    if (++e.count > max) {
      res.set('Retry-After', String(Math.ceil((e.reset - now) / 1000)));
      return res.status(429).json({ error: 'Muitas requisições. Tente novamente em instantes.' });
    }
    next();
  };
}
