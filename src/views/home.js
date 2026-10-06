import { faqLd, websiteGraph } from '../seo.js';
import { html, raw } from '../util.js';
import { faqList, gameCard, icon, padSvg, sectionHead, systemCard } from './components.js';

const POPULAR = ['ps2', 'psp', 'psx', 'n64', 'nds', 'gba'];

export function homePage(ctx) {
  const { settings, systems, games, origin } = ctx;
  const featured = (games.filter((g) => g.featured).length ? games.filter((g) => g.featured) : games).slice(0, 4);
  const counts = {};
  for (const g of games) counts[g.system] = (counts[g.system] || 0) + 1;
  const popular = POPULAR.map((id) => systems.find((s) => s.id === id)).filter(Boolean);
  const marquee = systems.map((s) => html`<span class="mq-item"><b>${s.short}</b> ${s.name}</span>`);

  const main = html`
  <section class="hero">
    <div class="hero-bg" aria-hidden="true"><span class="orb o1"></span><span class="orb o2"></span><span class="orb o3"></span><div class="grid-lines"></div></div>
    <div class="container hero-grid">
      <div class="hero-copy">
        <p class="eyebrow reveal"><span class="pulse"></span>Emulador online · sem instalar nada</p>
        <h1 class="reveal">Jogue <span class="gradient-text">PS2, PSP</span> e clássicos direto no navegador</h1>
        <p class="lead reveal">Teclado, controle ou toque na tela. Em segundos, o ${settings.siteName} testa o seu aparelho e mostra o que vai rodar bem, no PC ou no celular.</p>
        <div class="hero-cta reveal">
          <a class="btn btn-primary btn-lg" href="/jogos" data-magnetic>${icon('play')}Explorar jogos</a>
          <a class="btn btn-ghost btn-lg" href="/emulador">${icon('upload')}Abrir meu jogo</a>
        </div>
        <ul class="hero-points reveal">
          <li>${icon('shield')}Seus arquivos não saem do navegador</li><li>${icon('gamepad')}Controle e teclado prontos</li><li>${icon('phone')}Funciona no celular</li>
        </ul>
      </div>
      <div class="hero-visual reveal" data-tilt-root aria-hidden="true">
        <div class="pad-wrap" data-tilt>${padSvg()}</div>
        <span class="float-chip c1">PSP</span><span class="float-chip c2">PS2</span><span class="float-chip c3">GBA</span><span class="float-chip c4">N64</span><span class="float-chip c5">NDS</span>
      </div>
    </div>
  </section>

  <div class="marquee" aria-hidden="true"><div class="marquee-track">${marquee}${marquee}</div></div>

  <section class="section" id="aparelho">
    <div class="container">
      ${sectionHead({ eyebrow: 'Teste automático', title: 'Seu aparelho aguenta?', lead: 'O teste roda no seu navegador, não envia nada para ninguém e leva menos de um segundo.' })}
      <div class="device-card card reveal" data-device-card>
        <div class="device-score">
          <div class="score-ring" data-score-ring style="--p:0"><span data-score-num>…</span></div>
          <div><h3 data-device-title>Analisando o seu aparelho…</h3><p class="muted" data-device-sub>Isso leva só um instante.</p></div>
        </div>
        <ul class="meters">
          <li><span>Processador</span><div class="meter"><i data-meter="cpu"></i></div><b data-meter-text="cpu">—</b></li>
          <li><span>Memória</span><div class="meter"><i data-meter="mem"></i></div><b data-meter-text="mem">—</b></li>
          <li><span>Gráficos</span><div class="meter"><i data-meter="gpu"></i></div><b data-meter-text="gpu">—</b></li>
          <li><span>Multitarefa (PSP/PS2)</span><div class="meter"><i data-meter="thr"></i></div><b data-meter-text="thr">—</b></li>
        </ul>
        <div class="device-recs" data-device-recs></div>
        <noscript><p class="muted">Ative o JavaScript para testar o seu aparelho.</p></noscript>
      </div>
    </div>
  </section>

  <section class="section" id="consoles">
    <div class="container">
      ${sectionHead({ eyebrow: 'Consoles', title: 'Do Game Boy ao PS2, em um só lugar', lead: 'Cada console mostra o que exige do seu aparelho. Escolha, abra o seu jogo e divirta-se.' })}
      <div class="grid-cards">${popular.map((s, i) => systemCard(s, { i, count: counts[s.id] }))}</div>
      <p class="center reveal"><a class="btn btn-ghost" href="/consoles">Ver todos os ${systems.length} consoles ${icon('arrow')}</a></p>
    </div>
  </section>

  ${featured.length ? html`<section class="section" id="jogos">
    <div class="container">
      ${sectionHead({ eyebrow: 'Catálogo', title: 'Jogos livres para começar agora', lead: 'Homebrew e jogos de código aberto, com licença que permite distribuição. Para jogos comerciais, abra o seu próprio arquivo.' })}
      <div class="grid-games">${featured.map((g, i) => gameCard(g, { i }))}</div>
      <p class="center reveal"><a class="btn btn-ghost" href="/jogos">Ver todo o catálogo ${icon('arrow')}</a></p>
    </div>
  </section>` : ''}

  <section class="section" id="como-funciona">
    <div class="container">
      ${sectionHead({ eyebrow: 'Como funciona', title: 'Do clique ao jogo em 3 passos' })}
      <ol class="steps">
        <li class="step card reveal" style="--i:0"><span class="step-n">1</span>${icon('layers', 'step-i')}<h3>Escolha o console</h3><p class="muted">Veja o que cada um exige e se o seu aparelho dá conta.</p></li>
        <li class="step card reveal" style="--i:1"><span class="step-n">2</span>${icon('file', 'step-i')}<h3>Abra um jogo</h3><p class="muted">Use um jogo livre do catálogo ou arraste o arquivo do seu jogo. Ele roda só no seu navegador.</p></li>
        <li class="step card reveal" style="--i:2"><span class="step-n">3</span>${icon('gamepad', 'step-i')}<h3>Jogue do seu jeito</h3><p class="muted">Teclado, controle (Xbox, PlayStation, Switch Pro) ou toque na tela, com save states.</p></li>
      </ol>
    </div>
  </section>

  <section class="section" id="controle">
    <div class="container pad-section">
      <div class="reveal">
        <p class="eyebrow">Controle e teclado</p>
        <h2>Conecte e jogue</h2>
        <p class="lead">Controles de Xbox, PlayStation, Switch Pro e genéricos são detectados automaticamente. Aperte um botão do seu controle para testar agora:</p>
        <p class="pad-status" data-gamepad-status aria-live="polite"><span class="dot"></span><span data-gamepad-text>Nenhum controle detectado. Aperte um botão do seu controle.</span></p>
        <ul class="kbd-list">
          <li><span><kbd>←</kbd><kbd>↑</kbd><kbd>→</kbd><kbd>↓</kbd></span> mover</li>
          <li><span><kbd>Z</kbd><kbd>X</kbd></span> botões A e B</li>
          <li><span><kbd>Enter</kbd></span> Start</li>
          <li><span><kbd>V</kbd></span> Select</li>
        </ul>
        <p class="muted">Dá para remapear qualquer tecla ou botão no menu ⚙ do emulador. <a href="/ajuda#controles">Guia completo de controles</a>.</p>
      </div>
      <div class="pad-demo card reveal" data-pad-demo>${padSvg({ live: true })}</div>
    </div>
  </section>

  <section class="section" id="privacidade">
    <div class="container">
      ${sectionHead({ eyebrow: 'Privacidade', title: 'Seus jogos ficam com você' })}
      <div class="grid-3">
        <article class="card pillar reveal" style="--i:0">${icon('shield')}<h3>Sem upload</h3><p class="muted">Os arquivos que você abre são lidos localmente pelo navegador. Nada é enviado ao servidor.</p></article>
        <article class="card pillar reveal" style="--i:1">${icon('zap')}<h3>Sem cadastro</h3><p class="muted">Não há conta nem senha para jogar. Os saves ficam guardados no próprio navegador.</p></article>
        <article class="card pillar reveal" style="--i:2">${icon('layers')}<h3>Emuladores abertos</h3><p class="muted">Usamos EmulatorJS e Play!, projetos de software livre. Veja as licenças na <a href="/legal#licencas">página legal</a>.</p></article>
      </div>
    </div>
  </section>

  <section class="section" id="faq">
    <div class="container narrow">
      ${sectionHead({ eyebrow: 'Dúvidas', title: 'Perguntas frequentes' })}
      ${faqList(settings.faq)}
    </div>
  </section>

  <section class="section cta-band">
    <div class="container reveal">
      <div class="cta-card">
        <h2>Pronto para jogar?</h2>
        <p class="lead">Abra um jogo livre agora ou traga o seu próprio arquivo.</p>
        <div class="hero-cta"><a class="btn btn-primary btn-lg" href="/jogos" data-magnetic>${icon('play')}Ver jogos</a><a class="btn btn-ghost btn-lg" href="/emulador">${icon('upload')}Abrir meu jogo</a></div>
      </div>
    </div>
  </section>`;

  const data = JSON.stringify(systems.map((s) => ({ id: s.id, slug: s.slug, short: s.short, tier: s.tier }))).replace(/</g, '\\u003c');
  return {
    main: html`${main}<script type="application/json" id="systems-data">${raw(data)}</script>`,
    jsonld: [websiteGraph(origin, settings), faqLd(settings.faq)],
  };
}
