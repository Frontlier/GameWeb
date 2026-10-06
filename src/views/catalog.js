// Páginas: catálogo de jogos, lista de consoles, página de console, página de jogo.
import { breadcrumbLd, faqLd, itemListLd, videoGameLd, webAppLd } from '../seo.js';
import { STATUS_LABEL, systemById, systemFaq, TIER_LABEL } from '../systems.js';
import { fmtBytes, html, paragraphs, raw } from '../util.js';
import { breadcrumbs, controlsTable, faqList, gameCard, icon, sectionHead, statusChip, systemCard } from './components.js';

/* ------------------------------------------------------------------ /jogos */
export function catalogPage(ctx, { q = '', system = '', genre = '' } = {}) {
  const { games, allSystems, origin } = ctx;
  const all = ctx.allGames;
  const counts = {};
  for (const g of all) counts[g.system] = (counts[g.system] || 0) + 1;
  const withGames = allSystems.filter((s) => counts[s.id]);
  const genres = [...new Set(all.flatMap((g) => g.genres))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const filtered = Boolean(q || system || genre);

  const main = html`
  <section class="page-hero">
    <div class="container narrow">
      ${breadcrumbs([['Início', '/'], ['Jogos', '/jogos']])}
      <h1 class="reveal">Jogos grátis para jogar no navegador</h1>
      <p class="lead reveal">Jogos livres e homebrew com licença que permite distribuição, prontos para rodar no PC ou no celular, com teclado ou controle. Quer jogar um título seu? <a href="/emulador">Abra o seu arquivo</a>.</p>
    </div>
  </section>
  <section class="section tight">
    <div class="container" data-catalog>
      <form class="toolbar reveal" role="search" method="get" action="/jogos" data-catalog-form>
        <label class="search"><span class="visually-hidden">Buscar jogos</span>${icon('search')}<input type="search" name="q" value="${q}" placeholder="Buscar por nome, gênero ou tag…" autocomplete="off" data-catalog-q></label>
        <div class="select-wrap"><label class="visually-hidden" for="f-genre">Gênero</label>
          <select name="genero" id="f-genre" data-catalog-genre><option value="">Todos os gêneros</option>${genres.map((g) => html`<option value="${g}" ${g.toLowerCase() === genre.toLowerCase() ? raw('selected') : ''}>${g}</option>`)}</select></div>
        <input type="hidden" name="console" value="${system}" data-catalog-system>
        <button class="btn" type="submit">Filtrar</button>
      </form>
      <div class="chips reveal" role="group" aria-label="Filtrar por console" data-catalog-chips>
        <a class="chip-btn ${system ? '' : 'active'}" href="/jogos" data-sys="">Todos <span>${all.length}</span></a>
        ${withGames.map((s) => html`<a class="chip-btn ${system === s.id ? 'active' : ''}" href="/jogos?console=${s.id}" data-sys="${s.id}" style="--c:${s.color}">${s.short} <span>${counts[s.id]}</span></a>`)}
      </div>
      <p class="muted result-count" aria-live="polite" data-catalog-count>${games.length} ${games.length === 1 ? 'jogo' : 'jogos'}</p>
      <h2 class="visually-hidden">Lista de jogos</h2>
      <div class="grid-games" data-catalog-grid>${games.map((g, i) => gameCard(g, { i }))}</div>
      <div class="empty ${games.length ? '' : 'show'}" data-catalog-empty>
        ${icon('search')}<h2>Nenhum jogo encontrado</h2><p class="muted">Tente outro termo ou limpe os filtros. Também dá para <a href="/emulador">abrir o seu próprio arquivo</a>.</p>
        <a class="btn btn-ghost" href="/jogos">Limpar filtros</a>
      </div>
    </div>
  </section>`;

  return {
    main,
    noindex: filtered,
    jsonld: [breadcrumbLd(origin, [['Início', '/'], ['Jogos', '/jogos']]), itemListLd(origin, 'Jogos grátis para jogar no navegador', all.map((g) => g))],
  };
}

/* ------------------------------------------------------------------ /consoles */
export function consolesPage(ctx) {
  const { systems, allGames, origin } = ctx;
  const counts = {};
  for (const g of allGames) counts[g.system] = (counts[g.system] || 0) + 1;
  const main = html`
  <section class="page-hero">
    <div class="container narrow">
      ${breadcrumbs([['Início', '/'], ['Consoles', '/consoles']])}
      <h1 class="reveal">Consoles suportados</h1>
      <p class="lead reveal">Emule PS2, PSP, PS1, Nintendo 64, Nintendo DS, Game Boy Advance e mais, direto no navegador. Veja o que cada console exige do seu aparelho e comece a jogar.</p>
    </div>
  </section>
  <section class="section tight"><div class="container">
    <div class="grid-cards">${systems.map((s, i) => systemCard(s, { i, count: counts[s.id] }))}</div>
  </div></section>
  <section class="section"><div class="container">
    ${sectionHead({ eyebrow: 'Comparativo', title: 'Qual console roda no meu aparelho?', lead: 'Resumo dos emuladores, formatos aceitos e do nível de desempenho exigido.' })}
    <div class="table-wrap reveal"><table class="compare">
      <thead><tr><th scope="col">Console</th><th scope="col">Emulador</th><th scope="col">Formatos</th><th scope="col">Exigência</th><th scope="col">Status</th></tr></thead>
      <tbody>${systems.map((s) => html`<tr><th scope="row"><a href="/consoles/${s.slug}">${s.name}</a></th><td>${s.emulator}</td><td>${s.exts.map((e) => '.' + e).join(' ')}</td><td>${TIER_LABEL[s.tier]}</td><td>${STATUS_LABEL[s.status]}</td></tr>`)}</tbody>
    </table></div>
  </div></section>`;
  return { main, jsonld: [breadcrumbLd(origin, [['Início', '/'], ['Consoles', '/consoles']])] };
}

/* ------------------------------------------------------------------ /consoles/:slug */
export function systemPage(ctx, s) {
  const { allGames, systems, origin, settings } = ctx;
  const mine = allGames.filter((g) => g.system === s.id);
  const faq = systemFaq(s);
  const others = systems.filter((x) => x.id !== s.id).slice(0, 4);
  const main = html`
  <section class="page-hero system-hero" style="--c:${s.color}">
    <div class="hero-bg" aria-hidden="true"><span class="orb o1"></span><span class="orb o2"></span></div>
    <div class="container">
      ${breadcrumbs([['Início', '/'], ['Consoles', '/consoles'], [s.nick, '/consoles/' + s.slug]])}
      <div class="system-head">
        <div>
          <p class="eyebrow"><span class="sys-badge">${s.short}</span> ${s.maker} · ${s.year} ${statusChip(s)}</p>
          <h1 class="reveal">${s.h1}</h1>
          <p class="lead answer reveal">${s.intro}</p>
          <div class="hero-cta reveal">
            <a class="btn btn-primary btn-lg" href="/emulador/${s.slug}" data-magnetic>${icon('upload')}Abrir meu jogo de ${s.nick}</a>
            ${mine.length ? html`<a class="btn btn-ghost btn-lg" href="#jogos-do-console">${icon('play')}Jogos livres</a>` : ''}
          </div>
        </div>
        <aside class="card spec reveal" aria-label="Resumo técnico">
          <dl>
            <div><dt>Emulador</dt><dd>${s.emulator}</dd></div>
            <div><dt>Status</dt><dd>${STATUS_LABEL[s.status]}</dd></div>
            <div><dt>Exigência</dt><dd>${TIER_LABEL[s.tier]}</dd></div>
            <div><dt>Formatos</dt><dd>${s.exts.map((e) => html`<kbd>.${e}</kbd> `)}</dd></div>
          </dl>
          <p class="compat" data-compat data-system-id="${s.id}" data-tier="${s.tier}"><span class="dot"></span><span data-compat-text>Exigência: ${TIER_LABEL[s.tier]}</span></p>
        </aside>
      </div>
    </div>
  </section>

  <section class="section tight"><div class="container grid-2">
    <article class="card reveal"><h2 class="h3">${icon('cpu')} Requisitos mínimos</h2><p>${s.requirements.min}</p></article>
    <article class="card reveal"><h2 class="h3">${icon('bolt')} Recomendado</h2><p>${s.requirements.rec}</p></article>
  </div></section>

  <section class="section tight"><div class="container grid-2 align-start">
    <div class="reveal">
      <h2>Destaques</h2>
      <ul class="check-list">${s.highlights.map((h) => html`<li>${icon('check')}${h}</li>`)}</ul>
      ${s.bios ? html`<p class="notice">${icon('info')}<span><strong>${s.bios.label}.</strong> ${s.bios.hint}</span></p>` : ''}
    </div>
    <div class="reveal">
      <h2>Controles no teclado</h2>
      ${controlsTable(s)}
      <p class="muted small">Controle (gamepad): conecte, aperte um botão e jogue. Tudo pode ser remapeado no menu ⚙. <a href="/ajuda#controles">Guia completo</a>.</p>
    </div>
  </div></section>

  ${mine.length ? html`<section class="section" id="jogos-do-console"><div class="container">
    ${sectionHead({ eyebrow: 'Catálogo', title: `Jogos livres de ${s.nick}`, lead: 'Jogue direto no navegador, sem baixar nada.' })}
    <div class="grid-games">${mine.map((g, i) => gameCard(g, { i }))}</div></div></section>` : ''}

  <section class="section"><div class="container narrow">
    ${sectionHead({ eyebrow: 'Dúvidas', title: `Perguntas frequentes sobre ${s.nick}` })}
    ${faqList(faq)}
  </div></section>

  <section class="section tight"><div class="container">
    ${sectionHead({ title: 'Outros consoles' })}
    <div class="grid-cards">${others.map((o, i) => systemCard(o, { i }))}</div>
  </div></section>`;

  return {
    main,
    jsonld: [breadcrumbLd(origin, [['Início', '/'], ['Consoles', '/consoles'], [s.nick, '/consoles/' + s.slug]]), webAppLd(origin, settings, s), faqLd(faq)],
  };
}

/* ------------------------------------------------------------------ /jogos/:slug */
export function gamePage(ctx, g) {
  const { allGames, origin, settings } = ctx;
  const s = systemById(g.system);
  const related = allGames.filter((x) => x.id !== g.id && (x.system === g.system || x.genres.some((t) => g.genres.includes(t)))).slice(0, 4);
  const lic = g.license || {};
  const unverified = lic.redistribution === 'unverified';
  const isWeb = s.engine === 'web';
  const pad = g.controls?.length ? g.controls : s.pad;
  const meta = [
    isWeb ? ['Plataforma', 'Navegador (HTML5)'] : ['Console', html`<a href="/consoles/${s.slug}">${s.name}</a>`],
    g.developer && ['Desenvolvedor', g.developer],
    g.publisher && ['Publicação', g.publisher],
    g.year && ['Ano', g.year],
    g.players && ['Jogadores', g.players],
    g.genres.length && ['Gênero', g.genres.join(', ')],
    g.rom.size && ['Tamanho', fmtBytes(g.rom.size)],
    lic.name && ['Licença', lic.url ? html`<a href="${lic.url}" rel="noopener nofollow">${lic.name}</a>` : lic.name],
    g.source?.url && ['Fonte', html`<a href="${g.source.url}" rel="noopener nofollow">${g.source.name || g.source.url} ${icon('external')}</a>`],
  ].filter(Boolean);
  const shots = [g.cover, ...g.screenshots].filter(Boolean);

  const main = html`
  <section class="page-hero game-hero" style="--c:${s.color}">
    <div class="hero-bg" aria-hidden="true"><span class="orb o1"></span><span class="orb o2"></span></div>
    <div class="container">
      ${breadcrumbs([['Início', '/'], ['Jogos', '/jogos'], [g.title, '/jogos/' + g.slug]])}
      <div class="game-head">
        <div class="game-gallery reveal" data-gallery>
          ${shots.length ? html`<div class="gallery-main"><img class="pixel" id="gallery-main" src="${shots[0]}" alt="Imagem do jogo ${g.title}" width="640" height="480" fetchpriority="high" style="view-transition-name:cover-${g.slug}"></div>
          ${shots.length > 1 ? html`<div class="gallery-thumbs">${shots.map((u, i) => html`<button type="button" class="thumb ${i ? '' : 'active'}" data-src="${u}" aria-label="Ver imagem ${i + 1}"><img class="pixel" src="${u}" alt="" loading="lazy" width="96" height="72"></button>`)}</div>` : ''}`
    : html`<div class="gallery-main empty-media">${icon('gamepad')}</div>`}
        </div>
        <div class="game-info">
          <p class="eyebrow reveal"><span class="sys-badge">${s.short}</span> ${isWeb ? '' : statusChip(s)}</p>
          <h1 class="reveal">${g.title}<span class="visually-hidden"> — jogar online no navegador</span></h1>
          ${g.tagline ? html`<p class="lead reveal">${g.tagline}</p>` : ''}
          <div class="hero-cta reveal">
            <a class="btn btn-primary btn-lg" href="/jogar/${g.slug}" data-magnetic>${icon('play')}Jogar agora</a>
            ${isWeb ? html`<a class="btn btn-ghost btn-lg" href="/jogos">Mais jogos</a>` : html`<a class="btn btn-ghost btn-lg" href="/consoles/${s.slug}">Sobre o ${s.nick}</a>`}
          </div>
          <p class="compat reveal" data-compat data-system-id="${s.id}" data-tier="${g.minTier || s.tier}"><span class="dot"></span><span data-compat-text>Exigência: ${TIER_LABEL[g.minTier || s.tier]}</span></p>
          <dl class="meta-list card reveal">${meta.map(([k, v]) => html`<div><dt>${k}</dt><dd>${v}</dd></div>`)}</dl>
        </div>
      </div>
    </div>
  </section>

  <section class="section tight"><div class="container grid-2 align-start">
    <article class="prose reveal">
      <h2>Sobre o jogo</h2>
      ${g.description ? paragraphs(g.description) : html`<p>${g.title} é um jogo ${isWeb ? 'HTML5' : 'de ' + s.name} que roda direto no navegador, sem instalar nada.</p>`}
      <h2>Como jogar ${g.title} online</h2>
      <p>Clique em <strong>Jogar agora</strong>: ${isWeb ? 'o jogo é carregado no navegador e começa na hora.' : html`o emulador ${s.emulator} é carregado no navegador e o jogo começa na hora.`} Use o teclado, conecte um controle e aperte qualquer botão${isWeb ? '' : ', ou toque nos botões virtuais no celular'}.</p>
      ${unverified ? html`<p class="notice warn">${icon('alert')}<span>Este é um jogo gratuito de terceiros e o autor não declarou uma licença de redistribuição. Se você é o autor e deseja a remoção, entre em contato pela <a href="/legal#contato">página legal</a>.</span></p>` : ''}
    </article>
    <aside class="reveal">
      <h2>Controles</h2>
      ${controlsTable({ pad }, { compact: true })}
      <p class="muted small">Controle (gamepad): aperte um botão para ativar.${isWeb ? '' : ' Remapeie tudo no menu ⚙ dentro do jogo.'}</p>
    </aside>
  </div></section>

  ${related.length ? html`<section class="section"><div class="container">
    ${sectionHead({ title: 'Você também pode gostar' })}
    <div class="grid-games">${related.map((x, i) => gameCard(x, { i }))}</div></div></section>` : ''}`;

  const title = g.seo?.title || `${g.title} — jogar online no navegador${isWeb ? '' : ` (${s.short})`}`;
  return {
    main, title,
    description: g.seo?.description || `Jogue ${g.title}${isWeb ? '' : ` (${s.name})`} grátis no navegador, no PC ou no celular, com teclado ou controle. ${g.tagline || ''}`.trim(),
    jsonld: [breadcrumbLd(origin, [['Início', '/'], ['Jogos', '/jogos'], [g.title, '/jogos/' + g.slug]]), videoGameLd(origin, settings, g)],
    ogImage: g.cover,
  };
}
