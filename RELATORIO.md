# Relatório da noite — GameWeb

Resumo do que foi feito, testado e decidido enquanto você dormia. Detalhes de uso estão no `README.md`.

## Ao acordar (2 minutos)

1. Dê dois cliques em **`iniciar.bat`** (ou `npm start`) → <http://localhost:3000>
2. Painel: <http://localhost:3000/admin>. O usuário e a senha iniciais estão em **`data/CREDENCIAIS-INICIAIS-ADMIN.txt`**; o painel pede para você trocar a senha no primeiro login e apaga esse arquivo.
3. Teste o futebol: **Jogos → Combat Soccer** (emulador) ou **Mini Futebol** (jogo HTML5 próprio). Controle: aperte um botão; teclado: setas + Z/X + Enter.

## O que foi entregue

- **Site** (Node + Express 5, HTML renderizado no servidor): home, catálogo com busca/filtros, página de cada jogo, página de cada console (15), “Abrir meu jogo” (arquivo local), ajuda com teste de controle ao vivo, sobre, legal, 404, PWA, tema escuro/claro e animações fluidas (transição de páginas, revelação ao rolar, brilho no mouse, 3D no controle, marquee).
- **Emuladores**: PSP, PS1, N64, DS, GBA, GBC, GB, SNES, NES, Mega Drive, Master System, Game Gear, PC Engine, Atari 2600 (EmulatorJS, hospedado localmente) e **PS2** (Play!.js, experimental). Páginas do player usam COOP/COEP (necessário para PSP/PS2).
- **Computador básico até o melhor**: teste automático (CPU em Web Worker, memória, GPU/WebGL2, threads) → nível 1–4 → selo “deve rodar bem / pode rodar com ajustes / vai travar” em cada console; qualidade do PSP ajustada pelo nível.
- **Teclado + controle + toque**: mapa de teclas na tela, detecção de controle (nome, botões acendendo ao vivo), botões virtuais no celular, PS1/PSP com botões na posição certa, PS2 com ponte controle→teclado.
- **Painel admin** com login/senha: dashboard, CRUD de jogos com upload (capa, capturas, ROM com SHA-256), jogos HTML5, licença/direitos, consoles, configurações/SEO, FAQ, usuários, atividade. Dados em JSON (`src/db.js` é o único arquivo a trocar quando for para banco).
- **SEO/GEO**: JSON-LD (WebSite, Organization, FAQPage, VideoGame, WebApplication, Breadcrumb, ItemList), meta/OG/canonical, sitemap com imagens, robots (separa IA de busca e IA de treinamento), `llms.txt` + `llms-full.txt`, feed, textos “resposta direta” por console.

## Testes executados

| O quê | Resultado |
|---|---|
| `npm test` (unitários + integração com servidor temporário) | **61/61 OK** |
| Painel ponta a ponta no Chrome (login, bloqueio por força bruta, troca de senha obrigatória, CSRF, cookie, criar/editar/excluir jogo com upload, configurações, consoles, usuários, logout) | **27/27 OK** |
| Player no Chrome: Combat Soccer com teclado e com controle simulado (nos dois cenários de timing), abrir meu jogo (GBA), PS2 (iframe + entrega do arquivo), Mini Futebol (teclado e controle), PSP (núcleo inicializa com threads + WebGL2) | OK, sem erros de console/CSP |
| Celular (emulado): retrato/paisagem, botões virtuais do EmulatorJS, menu, painel inferior | OK |
| Service worker: cache, offline em página visitada, player continua isolado | OK |
| Lighthouse (celular emulado) em 6 páginas | Desempenho 99–100 · Acessibilidade 100 · Boas práticas 100 · SEO 100 (páginas do player são `noindex` de propósito) |
| Carga: 1000 requisições com 25 simultâneas | ~780 req/s, p95 46 ms, 100 MB de RAM |

### Bugs que apareceram nos testes e já foram corrigidos
- **Controle ignorado** se o jogador apertasse um botão do controle na tela inicial *antes* de clicar em Jogar (o EmulatorJS só aceita controles que surgem depois do menu dele). Agora o controle fica “escondido” do emulador até o jogo iniciar.
- Iframe do PS2 bloqueado por falta de cabeçalho COEP; chamada externa do EmulatorJS ao CDN dele (bloqueada pela CSP) agora é respondida localmente (também protege a privacidade).
- Botão de salvar coberto por aviso no painel; contrastes de cor no tema claro; “Voltar” sem nome acessível no celular; toques rápidos de tecla perdidos no Mini Futebol.

## Decisões que você precisa conhecer

1. **Jogo de futebol / licença.** Procurei um jogo de futebol com licença aberta e **não encontrei**. Usei o **Combat Soccer** (homebrew gratuito de Game Boy Color, Mike Kasprzak, via Homebrew Hub), que **não declara licença de redistribuição**. Está publicado só para você testar e aparece com o aviso “Licença?” no painel. **Antes de colocar o site na internet, peça permissão ao autor ou despublique.** Por isso criei também o **Mini Futebol** (código meu, MIT), que é seguro para publicar. Os outros 6 jogos do catálogo têm licença aberta (MIT/GPL).
2. **Não hospedo jogos comerciais.** PS2/PSP/PS1 etc. funcionam com o arquivo do próprio visitante (fica só no navegador). O painel exige confirmar direitos antes de publicar qualquer arquivo.
3. **Antigravity IDE:** não usei. Esta sessão não tinha ferramenta de controle de tela/desktop, e comandar outra IDE por capturas de tela gastaria mais tokens do que escrever o código direto. Os testes foram feitos com o Chrome instalado em modo headless.
4. **Garantir o topo do Google/IAs é impossível**; entreguei a base técnica completa. Passos pós-publicação estão no README (domínio em `SITE_URL`, Search Console, Bing, sitemap, conteúdo e links).
5. **Licenças dos emuladores** se for monetizar: alguns núcleos (ex.: Snes9x e Genesis Plus GX) têm licença não comercial. Revise antes de colocar anúncios.

## Limitações (honestas)

- **PS2 e PSP não foram testados com jogos reais** (não usei jogos comerciais e não há homebrew de PS2/PSP livre à mão). Validei até onde dá: o PSP inicializa o núcleo com threads/WebGL2; o PS2 carrega, recebe o arquivo e a ponte de controle gera os eventos certos. Espere desempenho limitado no PS2 (é experimental no próprio projeto).
- Testei só no **Chrome** (headless) e com **controle simulado** pela Gamepad API; não havia controle físico nem celular real, nem Firefox/Safari.
- Cabeçalhos COOP/COEP precisam ser mantidos por proxies/CDN em produção (README).

## Arquivos baixados da internet

| Origem | O quê | Tamanho |
|---|---|---|
| `cdn.emulatorjs.org/stable` (EmulatorJS 4.2.3, GPL-3.0) | loader, 12 núcleos (PPSSPP, PCSX ReARMed, Mupen64Plus-Next, melonDS, mGBA, Gambatte, Snes9x, FCEUmm, Genesis Plus GX, SMS Plus, Beetle PCE, Stella) em todas as variantes, assets do PPSSPP, idioma pt-BR | ~62 MB (lista com SHA-256 em `public/emu/MANIFEST.json`) |
| `playjs.purei.org` (Play!, BSD-2) | `Play.js`, `Play.wasm`, interface | ~2,8 MB |
| GitHub `gbdev/database` e `gbadev-org/games` (raw) | 7 jogos homebrew + capturas: Combat Soccer, Tobu Tobu Girl Deluxe, uCity, Max Pirate, Apotris, MeteoRain, Minicraft GBA | ~6,2 MB |
| npm | express, compression, multer, puppeteer-core, fontes Inter/Space Grotesk | — |
| npx (temporário) | Lighthouse, só para medir | — |

Tudo pode ser refeito com `npm run setup`.

## Próximos passos sugeridos

1. Definir o domínio e publicar (HTTPS + proxy com COOP/COEP) e cadastrar no Search Console/Bing.
2. Resolver a licença do Combat Soccer (ou despublicar) e adicionar mais jogos livres.
3. Testar PS2/PSP com jogos que você possui e, se for o caso, ajustar dicas por jogo.
4. Migrar `src/db.js` para um banco (você disse que faremos depois).
5. Opcional: mais idiomas (hreflang), mais jogos HTML5 próprios, ranking, contas de jogadores.
