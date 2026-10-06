// SEO técnico + GEO (otimização para buscadores com IA): meta tags, JSON-LD, sitemap, robots, llms.txt, feed.
import { config } from './config.js';
import { STATUS_LABEL, TIER_LABEL, systemById, systemFaq } from './systems.js';
import { esc, raw, truncate } from './util.js';

const HOST_RE = /^[a-z0-9]([a-z0-9.-]*[a-z0-9])?(:\d{1,5})?$/i;
/** Origem pública do site. Em produção defina SITE_URL (evita "host header injection" em caches/CDN). */
export function siteOrigin(req, settings) {
  if (config.siteUrl) return config.siteUrl;
  if (settings?.siteUrl) return settings.siteUrl;
  const host = req.get('host') || '';
  return `${req.protocol}://${HOST_RE.test(host) ? host : 'localhost'}`;
}
export const absUrl = (origin, path = '/') => origin + (path.startsWith('/') ? path : '/' + path);
const toAbs = (origin, u) => (!u ? '' : /^https?:\/\//.test(u) ? u : absUrl(origin, u));

export const jsonLdTag = (obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;

/* --------------------------------------------------------------- <head> */
export function headTags({ origin, settings, title, description, path, ogImage, ogType = 'website', noindex = false, jsonld = [], imageAlt = '' }) {
  const url = absUrl(origin, path);
  const image = toAbs(origin, ogImage || settings.seo.ogImage || '/img/og-default.png');
  const desc = truncate(description || settings.description, 160);
  const robots = noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
  const tw = settings.seo.twitterHandle;
  return raw([
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(desc)}">`,
    `<meta name="robots" content="${robots}">`,
    `<link rel="canonical" href="${esc(url)}">`,
    noindex ? '' : `<link rel="alternate" hreflang="pt-BR" href="${esc(url)}"><link rel="alternate" hreflang="x-default" href="${esc(url)}">`,
    `<meta property="og:site_name" content="${esc(settings.siteName)}">`,
    `<meta property="og:locale" content="pt_BR">`,
    `<meta property="og:type" content="${esc(ogType)}">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(desc)}">`,
    `<meta property="og:url" content="${esc(url)}">`,
    `<meta property="og:image" content="${esc(image)}">`,
    `<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">`,
    imageAlt ? `<meta property="og:image:alt" content="${esc(imageAlt)}">` : '',
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${esc(title)}">`,
    `<meta name="twitter:description" content="${esc(desc)}">`,
    `<meta name="twitter:image" content="${esc(image)}">`,
    tw ? `<meta name="twitter:site" content="${esc(tw)}">` : '',
    ...jsonld.map(jsonLdTag),
  ].filter(Boolean).join('\n'));
}

/* --------------------------------------------------------------- JSON-LD */
export function websiteGraph(origin, settings) {
  const sameAs = Object.values(settings.social).filter(Boolean);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite', '@id': origin + '/#website', url: origin + '/', name: settings.siteName, description: settings.description,
        inLanguage: 'pt-BR', publisher: { '@id': origin + '/#org' },
        potentialAction: { '@type': 'SearchAction', target: { '@type': 'EntryPoint', urlTemplate: origin + '/jogos?q={search_term_string}' }, 'query-input': 'required name=search_term_string' },
      },
      {
        '@type': 'Organization', '@id': origin + '/#org', name: settings.siteName, url: origin + '/',
        logo: { '@type': 'ImageObject', url: origin + '/img/icon-512.png', width: 512, height: 512 },
        ...(sameAs.length ? { sameAs } : {}),
        ...(settings.contactEmail ? { email: settings.contactEmail } : {}),
      },
    ],
  };
}

export const breadcrumbLd = (origin, items) => ({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: absUrl(origin, path) })),
});

export const faqLd = (faq) => ({
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
});

export const itemListLd = (origin, name, games) => ({
  '@context': 'https://schema.org', '@type': 'ItemList', name,
  itemListElement: games.map((g, i) => ({ '@type': 'ListItem', position: i + 1, url: absUrl(origin, `/jogos/${g.slug}`), name: g.title })),
});

export function videoGameLd(origin, settings, g) {
  const sys = systemById(g.system);
  const url = absUrl(origin, `/jogos/${g.slug}`);
  return {
    '@context': 'https://schema.org', '@type': 'VideoGame', '@id': url + '#game', name: g.title, url,
    description: truncate(g.description || g.tagline, 300),
    ...(g.cover ? { image: toAbs(origin, g.cover) } : {}),
    genre: g.genres, keywords: g.tags.join(', '),
    gamePlatform: (sys?.engine === 'web' ? ['Navegador web'] : [sys?.name, 'Navegador web']).filter(Boolean),
    applicationCategory: 'Game', operatingSystem: 'Qualquer (navegador web)',
    playMode: 'https://schema.org/SinglePlayer',
    ...(g.developer ? { author: { '@type': 'Organization', name: g.developer } } : {}),
    ...(g.year ? { datePublished: String(g.year) } : {}),
    isAccessibleForFree: true, inLanguage: 'pt-BR',
    ...(g.license?.url ? { license: g.license.url } : {}),
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'BRL', availability: 'https://schema.org/InStock', url },
    potentialAction: { '@type': 'PlayAction', target: absUrl(origin, `/jogar/${g.slug}`) },
    publisher: { '@id': origin + '/#org' },
  };
}

export function webAppLd(origin, settings, s) {
  return {
    '@context': 'https://schema.org', '@type': 'WebApplication', name: `Emulador de ${s.nick} online — ${settings.siteName}`,
    url: absUrl(origin, `/consoles/${s.slug}`), description: truncate(s.intro, 300),
    applicationCategory: 'GameApplication', operatingSystem: 'Qualquer (navegador web)',
    browserRequirements: 'Requer JavaScript, WebAssembly e WebGL',
    featureList: s.highlights, inLanguage: 'pt-BR',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'BRL' },
    publisher: { '@id': origin + '/#org' },
  };
}

/* --------------------------------------------------------------- robots / sitemap */
const AI_SEARCH = ['OAI-SearchBot', 'ChatGPT-User', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User', 'DuckAssistBot', 'MistralAI-User'];
const AI_TRAIN = ['GPTBot', 'ClaudeBot', 'Google-Extended', 'Applebot-Extended', 'CCBot', 'Amazonbot', 'Meta-ExternalAgent', 'cohere-ai'];
// Páginas do player ficam rastreáveis de propósito: elas usam "noindex" (o robô precisa ler a tag para respeitá-la).
const BLOCKED_PATHS = ['/admin', '/api/', '/emu/', '/roms/', '/uploads/roms/'];

export function robotsTxt(origin, settings) {
  const dis = BLOCKED_PATHS.map((p) => `Disallow: ${p}`);
  const group = (agents, allow) => [...agents.map((a) => `User-agent: ${a}`), ...(allow ? ['Allow: /', ...dis] : ['Disallow: /']), ''].join('\n');
  return [
    '# GameWeb — robots.txt',
    group(['*'], true),
    '# Buscadores e assistentes de IA (citação/resposta em tempo real)',
    group(AI_SEARCH, settings.seo.aiSearchBots),
    '# Coleta para treinamento de modelos de IA',
    group(AI_TRAIN, settings.seo.aiTrainingBots),
    `Sitemap: ${origin}/sitemap.xml`,
    '',
  ].join('\n');
}

export function sitemapXml(origin, entries) {
  const body = entries.map((e) => [
    '<url>',
    `<loc>${esc(absUrl(origin, e.path))}</loc>`,
    e.lastmod ? `<lastmod>${esc(e.lastmod.slice(0, 10))}</lastmod>` : '',
    `<changefreq>${e.changefreq || 'weekly'}</changefreq><priority>${e.priority ?? 0.6}</priority>`,
    e.image ? `<image:image><image:loc>${esc(toAbs(origin, e.image))}</image:loc>${e.imageTitle ? `<image:title>${esc(e.imageTitle)}</image:title>` : ''}</image:image>` : '',
    '</url>',
  ].filter(Boolean).join('')).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${body}\n</urlset>\n`;
}

/* --------------------------------------------------------------- llms.txt (GEO) */
export function llmsTxt(origin, settings, systems, games) {
  const L = [
    `# ${settings.siteName}`, '',
    `> ${settings.description}`, '',
    'O site roda emuladores em WebAssembly direto no navegador (computador ou celular), com suporte a teclado, controle (Gamepad API) e toque. ' +
    'Não hospeda jogos comerciais: os arquivos que o visitante abre ficam apenas no navegador dele. O catálogo reúne jogos livres/homebrew com licença declarada.', '',
    '## Consoles e emuladores',
    ...systems.map((s) => `- [Emulador de ${s.nick} online](${origin}/consoles/${s.slug}): ${s.description} (${STATUS_LABEL[s.status]}; exigência: ${TIER_LABEL[s.tier]})`), '',
  ];
  if (games.length) {
    L.push('## Jogos livres e homebrew', ...games.map((g) => `- [${g.title}](${origin}/jogos/${g.slug}): ${truncate(g.tagline || g.description, 120)} (${systemById(g.system)?.short || g.system}; licença: ${g.license?.name || 'não informada'})`), '');
  }
  L.push('## Ajuda e informações',
    `- [Perguntas frequentes e guia de controles](${origin}/ajuda): como jogar com teclado e controle, requisitos e solução de problemas`,
    `- [Sobre o ${settings.siteName}](${origin}/sobre): o que é o projeto`,
    `- [Aviso legal, privacidade e licenças](${origin}/legal): direitos autorais, dados e créditos de software livre`, '',
    '## Optional',
    `- [Sitemap](${origin}/sitemap.xml)`, `- [Conteúdo completo em texto](${origin}/llms-full.txt)`, `- [Feed de novidades](${origin}/feed.xml)`, '');
  return L.join('\n');
}

export function llmsFullTxt(origin, settings, systems, games) {
  const L = [`# ${settings.siteName} — conteúdo completo`, '', `> ${settings.description}`, ''];
  for (const s of systems) {
    L.push(`## Emulador de ${s.name} (${s.short}) online`, `URL: ${origin}/consoles/${s.slug}`, '', s.intro, '',
      `- Emulador: ${s.emulator} · Status: ${STATUS_LABEL[s.status]} · Exigência: ${TIER_LABEL[s.tier]}`,
      `- Formatos aceitos: ${s.exts.map((e) => '.' + e).join(', ')}`,
      `- Requisitos mínimos: ${s.requirements.min}`, `- Recomendado: ${s.requirements.rec}`,
      '- Controles de teclado: ' + s.pad.map(([a, b]) => `${a} = ${b}`).join('; '), '');
    for (const f of systemFaq(s)) L.push(`**${f.q}**`, f.a, '');
  }
  if (games.length) {
    L.push('## Catálogo de jogos', '');
    for (const g of games) L.push(`### ${g.title} (${systemById(g.system)?.name})`, `URL: ${origin}/jogos/${g.slug}`, g.description, `Desenvolvedor: ${g.developer || '—'} · Licença: ${g.license?.name || '—'}`, '');
  }
  L.push('## Perguntas frequentes', '');
  for (const f of settings.faq) L.push(`**${f.q}**`, f.a, '');
  return L.join('\n');
}

/* --------------------------------------------------------------- feed Atom */
export function atomFeed(origin, settings, games) {
  const updated = games[0]?.updatedAt || new Date().toISOString();
  const entries = games.slice(0, 30).map((g) => `<entry><title>${esc(g.title)}</title><link href="${esc(origin)}/jogos/${esc(g.slug)}"/><id>${esc(origin)}/jogos/${esc(g.slug)}</id><updated>${esc(g.updatedAt)}</updated><summary>${esc(truncate(g.tagline || g.description, 200))}</summary></entry>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="pt-BR"><title>${esc(settings.siteName)} — novos jogos</title><link href="${esc(origin)}/feed.xml" rel="self"/><link href="${esc(origin)}/"/><id>${esc(origin)}/</id><updated>${esc(updated)}</updated>${entries}</feed>\n`;
}
