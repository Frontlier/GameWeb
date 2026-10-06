// Páginas informativas: ajuda, sobre, legal, 404.
import { breadcrumbLd, faqLd } from '../seo.js';
import { systemById, TIER_LABEL } from '../systems.js';
import { html } from '../util.js';
import { breadcrumbs, controlsTable, faqList, icon, padSvg } from './components.js';

const crumb = (label, path) => breadcrumbs([['Início', '/'], [label, path]]);

/* ------------------------------------------------------------------ /ajuda */
export function helpPage(ctx) {
  const { settings, origin, systems } = ctx;
  const snes = systemById('snes');
  const psx = systemById('psx');
  const problems = [
    { q: 'O controle não é detectado', a: 'Conecte o controle (USB ou Bluetooth) e aperte qualquer botão com a página aberta: os navegadores só liberam o controle depois do primeiro botão. Se continuar sem aparecer, feche outros programas que usem o controle (Steam, emuladores) e reconecte.' },
    { q: 'A tela do jogo fica preta', a: 'Aguarde o carregamento do emulador (consoles maiores baixam alguns megabytes na primeira vez). Se persistir, confira se o formato do arquivo é aceito pelo console, tente outro navegador (Chrome ou Edge) e recarregue a página.' },
    { q: 'Não sai som', a: 'Navegadores só liberam áudio depois de um clique. Clique na tela do jogo e verifique se a aba não está silenciada e se o ícone de volume do emulador está ativo.' },
    { q: 'O jogo está lento ou travando', a: 'Feche outras abas e programas, use Chrome ou Edge, conecte o notebook na tomada e, nos consoles mais pesados (PSP, N64, PS2), reduza a resolução em ⚙ → Opções do núcleo. Veja no teste do seu aparelho se o console escolhido é adequado.' },
    { q: 'Aparece erro de SharedArrayBuffer (PSP)', a: 'O PSP precisa de multithreading, que exige navegador desktop atualizado e a página servida com os cabeçalhos COOP/COEP (o GameWeb já faz isso). Atualize o navegador ou troque para Chrome, Edge ou Firefox.' },
    { q: 'Perdi meu save', a: 'Os saves ficam no armazenamento do navegador. Limpar dados do site, navegar em aba anônima ou trocar de navegador/computador os apaga. Use os botões de exportar/salvar arquivo do emulador para fazer backup.' },
  ];
  const tiers = [1, 2, 3, 4].map((t) => [t, systems.filter((s) => s.tier === t)]);

  const main = html`
  <section class="page-hero"><div class="container narrow">
    ${crumb('Ajuda', '/ajuda')}
    <h1 class="reveal">Ajuda: como jogar com teclado, controle e no celular</h1>
    <p class="lead reveal">Guia rápido para começar, configurar controles, jogar no celular e resolver os problemas mais comuns.</p>
  </div></section>

  <section class="section tight"><div class="container narrow prose">
    <h2 id="comecar" class="reveal">Começando em 3 passos</h2>
    <ol class="reveal">
      <li>Escolha um jogo no <a href="/jogos">catálogo</a> ou abra o seu arquivo em <a href="/emulador">Abrir meu jogo</a>.</li>
      <li>Clique em <strong>Jogar</strong>. Na primeira vez o emulador baixa alguns megabytes; depois ele fica em cache.</li>
      <li>Use o teclado, conecte um controle ou toque nos botões virtuais.</li>
    </ol>

    <h2 id="controles" class="reveal">Controles: teclado e gamepad</h2>
    <h3>Teclado (mapa padrão)</h3>
    <p>O mapa abaixo vale para a maioria dos consoles de 8, 16 e 32 bits. Cada página de console mostra a tabela exata.</p>
    <div class="grid-2 align-start">
      <div><p class="small muted"><strong>Estilo Super Nintendo</strong></p>${controlsTable(snes, { compact: true })}</div>
      <div><p class="small muted"><strong>Estilo PlayStation (PS1/PSP)</strong></p>${controlsTable(psx, { compact: true })}</div>
    </div>
    <h3>Controle (gamepad)</h3>
    <ol>
      <li>Conecte o controle por USB ou Bluetooth (Xbox, PlayStation, Switch Pro ou genérico).</li>
      <li>Com o site aberto, aperte qualquer botão. O GameWeb mostra o nome do controle detectado.</li>
      <li>Jogue. Para ajustar botões, abra ⚙ → Controles dentro do emulador.</li>
    </ol>
    <p class="muted">Teste agora: aperte botões e mexa nos analógicos do seu controle.</p>
  </div>
  <div class="container narrow prose">
    <p class="pad-status" data-gamepad-status aria-live="polite"><span class="dot"></span><span data-gamepad-text>Nenhum controle detectado. Aperte um botão do seu controle.</span></p>
    <div class="pad-demo card" data-pad-demo>${padSvg({ live: true })}</div>
  </div>
  <div class="container narrow prose">
    <h3>Remapear botões e teclas</h3>
    <p>Dentro do jogo, passe o mouse na barra do emulador e abra <strong>⚙ Configurações → Controles</strong>. Clique no campo do botão e aperte a tecla ou o botão do controle desejado.</p>

    <h2 id="celular" class="reveal">No celular</h2>
    <ul>
      <li>Gire o aparelho para a horizontal; os botões virtuais aparecem sobre a tela.</li>
      <li>Consoles leves (Game Boy, NES, SNES, GBA, Mega Drive) rodam bem em quase todos os aparelhos.</li>
      <li>PS1, N64 e NDS funcionam em celulares de gama média e alta. PSP e PS2 exigem muito processamento: prefira o computador.</li>
      <li>Controles Bluetooth funcionam no Android e no iOS: pareie nas configurações do aparelho e aperte um botão na página.</li>
    </ul>

    <h2 id="desempenho" class="reveal">Desempenho: o que o seu aparelho aguenta</h2>
    <p>O GameWeb testa o processador, a memória, os gráficos (WebGL) e o suporte a multithreading do seu navegador e classifica o aparelho de 1 a 4. Quanto maior o nível, mais pesados são os consoles que rodam bem.</p>
    <div class="table-wrap"><table class="compare"><thead><tr><th scope="col">Nível</th><th scope="col">Perfil</th><th scope="col">Consoles</th></tr></thead>
      <tbody>${tiers.map(([t, list]) => html`<tr><th scope="row">${t}</th><td>${TIER_LABEL[t]}</td><td>${list.map((s) => html`<a href="/consoles/${s.slug}">${s.short}</a> `)}</td></tr>`)}</tbody></table></div>

    <h2 id="problemas" class="reveal">Problemas comuns</h2>
  </div>
  <div class="container narrow">${faqList(problems)}</div></section>

  <section class="section"><div class="container narrow">
    <h2 class="reveal">Perguntas frequentes</h2>
    ${faqList(settings.faq)}
  </div></section>`;

  return { main, jsonld: [breadcrumbLd(origin, [['Início', '/'], ['Ajuda', '/ajuda']]), faqLd([...problems, ...settings.faq])] };
}

/* ------------------------------------------------------------------ /sobre */
export function aboutPage(ctx) {
  const { settings, origin } = ctx;
  const main = html`
  <section class="page-hero"><div class="container narrow">
    ${crumb('Sobre', '/sobre')}
    <h1 class="reveal">Sobre o ${settings.siteName}</h1>
    <p class="lead reveal">${settings.description}</p>
  </div></section>
  <section class="section tight"><div class="container narrow prose">
    <h2>O que é</h2>
    <p>O ${settings.siteName} é um emulador online em português. Ele reúne, em um só lugar, emuladores de consoles clássicos e portáteis que rodam direto no navegador, sem instalação, no computador ou no celular.</p>
    <h2>Como funciona</h2>
    <p>Os consoles são emulados com WebAssembly: o <a href="https://emulatorjs.org" rel="noopener">EmulatorJS</a> executa núcleos libretro (como PPSSPP para PSP e mGBA para GBA) e o <a href="https://purei.org" rel="noopener">Play!</a> cuida do PS2, ainda em fase experimental. O código do emulador roda no seu aparelho, e é por isso que o desempenho depende do seu processador e da sua placa de vídeo.</p>
    <h2>O que não fazemos</h2>
    <p>O ${settings.siteName} não hospeda nem distribui jogos comerciais. O catálogo reúne jogos livres e homebrew com licença que permite a distribuição. Quando você abre o seu próprio arquivo, ele é lido localmente pelo navegador e não é enviado ao servidor.</p>
    <h2>Fale com a gente</h2>
    <p>${settings.contactEmail ? html`Sugestões, correções ou pedidos de remoção: <a href="mailto:${settings.contactEmail}">${settings.contactEmail}</a>.` : 'Sugestões, correções ou pedidos de remoção: use o contato informado pelo administrador do site.'}</p>
  </div></section>`;
  return { main, jsonld: [breadcrumbLd(origin, [['Início', '/'], ['Sobre', '/sobre']])] };
}

/* ------------------------------------------------------------------ /legal */
export function legalPage(ctx) {
  const { settings, origin, allGames, systems } = ctx;
  const main = html`
  <section class="page-hero"><div class="container narrow">
    ${crumb('Aviso legal e privacidade', '/legal')}
    <h1 class="reveal">Aviso legal, privacidade e licenças</h1>
    <p class="lead reveal">Como tratamos direitos autorais, dados e o software livre que faz o ${settings.siteName} funcionar.</p>
  </div></section>
  <section class="section tight"><div class="container narrow prose">
    <h2 id="direitos">Direitos autorais e jogos</h2>
    <p>Emuladores são programas legais. O que costuma ser ilegal é copiar ou distribuir jogos protegidos por direitos autorais sem autorização. O ${settings.siteName} <strong>não hospeda jogos comerciais</strong>. O catálogo traz apenas títulos livres ou homebrew, cada um com a sua licença e fonte indicadas. Ao abrir o seu próprio arquivo, use somente jogos que você tem o direito de usar, como backups de títulos que você possui.</p>
    <h2 id="contato">Contato e remoção de conteúdo</h2>
    <p>Se você é titular de direitos de algum material listado aqui e deseja a remoção, ${settings.contactEmail ? html`escreva para <a href="mailto:${settings.contactEmail}">${settings.contactEmail}</a>` : 'entre em contato pelo canal informado pelo administrador do site'}, identificando o conteúdo e a URL da página. Atenderemos prontamente.</p>
    <h2 id="privacidade">Privacidade</h2>
    <ul>
      <li><strong>Seus arquivos de jogo</strong> são lidos localmente pelo navegador e não são enviados ao servidor.</li>
      <li><strong>Saves e configurações do emulador</strong> ficam no armazenamento do seu navegador (IndexedDB e localStorage).</li>
      <li><strong>Teste do aparelho</strong>: a análise de processador, memória e gráficos acontece no seu navegador; guardamos só o nível resultante (1 a 4), de forma agregada e anônima, para estatísticas.</li>
      <li><strong>Contadores</strong> de visitas e de jogos iniciados são agregados por dia, sem identificar visitantes.</li>
      <li><strong>Cookies</strong>: o site público não usa cookies de rastreamento. O painel administrativo usa um cookie de sessão. ${settings.analytics.ga4 || settings.analytics.plausibleDomain ? 'Este site usa um serviço de análise de audiência (Google Analytics ou Plausible), conforme configurado pelo administrador.' : ''}</li>
    </ul>
    <h2 id="licencas">Licenças de software</h2>
    <p>O ${settings.siteName} usa software livre. Os textos completos das licenças acompanham os arquivos e os repositórios dos projetos.</p>
    <ul>
      <li><a href="https://github.com/EmulatorJS/EmulatorJS" rel="noopener">EmulatorJS</a> — GPL-3.0 (interface e carregador). Os núcleos libretro têm licenças próprias (GPL, MPL e outras), disponíveis em <a href="https://github.com/EmulatorJS/cores" rel="noopener">EmulatorJS/cores</a>.</li>
      <li><a href="https://github.com/jpd002/Play-" rel="noopener">Play!</a> (PS2) — BSD-2-Clause.</li>
      <li>Fontes Inter e Space Grotesk — SIL Open Font License 1.1.</li>
      <li>Emuladores utilizados: ${[...new Set(systems.map((s) => s.emulator))].join(', ')}.</li>
    </ul>
    ${allGames.length ? html`<h2 id="catalogo">Jogos do catálogo: licenças e fontes</h2>
    <div class="table-wrap"><table class="compare"><thead><tr><th scope="col">Jogo</th><th scope="col">Console</th><th scope="col">Autor</th><th scope="col">Licença</th><th scope="col">Fonte</th></tr></thead>
      <tbody>${allGames.map((g) => html`<tr><th scope="row"><a href="/jogos/${g.slug}">${g.title}</a></th><td>${systemById(g.system)?.short}</td><td>${g.developer || '—'}</td>
        <td>${g.license?.url ? html`<a href="${g.license.url}" rel="noopener nofollow">${g.license.name}</a>` : g.license?.name || '—'}</td>
        <td>${g.source?.url ? html`<a href="${g.source.url}" rel="noopener nofollow">${g.source.name || 'Fonte'}</a>` : '—'}</td></tr>`)}</tbody></table></div>` : ''}
  </div></section>`;
  return { main, jsonld: [breadcrumbLd(origin, [['Início', '/'], ['Aviso legal', '/legal']])] };
}

/* ------------------------------------------------------------------ 404 */
export function notFoundPage(ctx) {
  const { systems } = ctx;
  const main = html`
  <section class="page-hero"><div class="container narrow center">
    <p class="eyebrow">Erro 404</p>
    <h1>Página não encontrada</h1>
    <p class="lead">O endereço pode ter mudado ou nunca existiu. Que tal um destes caminhos?</p>
    <div class="hero-cta center-row"><a class="btn btn-primary btn-lg" href="/jogos">${icon('play')}Ver jogos</a><a class="btn btn-ghost btn-lg" href="/">Página inicial</a></div>
    <div class="chips center-row">${systems.slice(0, 8).map((s) => html`<a class="chip-btn" href="/consoles/${s.slug}" style="--c:${s.color}">${s.short}</a>`)}</div>
  </div></section>`;
  return { main };
}
