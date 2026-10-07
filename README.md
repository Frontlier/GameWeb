# GameWeb — emulador online (PS2, PSP e clássicos) com painel administrativo

Site moderno, rápido e responsivo que roda emuladores direto no navegador (computador ou celular), com **teclado, controle (gamepad) e toque**, teste automático do aparelho do visitante, SEO técnico completo e um **painel administrativo com login e senha**. Os dados ficam em arquivos JSON (sem banco por enquanto — veja “Trocar para um banco” mais abaixo).

## Começando (Windows)

1. Tenha o **Node.js 20.12 ou superior** (testado no Node 24).
2. Dê dois cliques em **`iniciar.bat`** — ele instala as dependências, baixa os emuladores e os jogos livres (só na primeira vez), sobe o servidor e abre o navegador.

Ou, no terminal:

```bash
npm install
npm run setup     # baixa EmulatorJS, Play! (PS2) e os jogos livres do catálogo inicial
npm start         # http://localhost:3000
```

- Site: <http://localhost:3000> · Painel: <http://localhost:3000/admin>
- **Primeiro acesso ao painel:** o usuário e a senha iniciais ficam em `data/CREDENCIAIS-INICIAIS-ADMIN.txt`. O sistema **obriga a troca da senha** no primeiro login e apaga esse arquivo em seguida. (Alternativa: defina `ADMIN_USER` e `ADMIN_PASSWORD` no `.env` antes do primeiro start — veja `.env.example`.)

## O que tem no site

| Recurso | Detalhes |
|---|---|
| **Consoles** | PS2 (Play!, experimental), PSP (PPSSPP), PS1, N64, Nintendo DS, GBA, GBC, GB, SNES, NES, Mega Drive, Master System, Game Gear, PC Engine e Atari 2600 (EmulatorJS) + jogos HTML5 próprios |
| **Teste do aparelho** | Mede CPU (em Web Worker), memória, GPU/WebGL2 e suporte a multithreading e classifica de 1 (básico) a 4 (potente). Mostra, console por console, se “deve rodar bem”, “pode rodar com ajustes” ou “vai travar”. Também ajusta a qualidade do PSP automaticamente |
| **Controles** | Teclado (mapa padrão exibido na tela), **controle de Xbox/PlayStation/Switch Pro/genérico** (Gamepad API, com detecção, nome do controle e botões acendendo ao vivo) e toque (botões virtuais no celular). PS2 ganhou uma ponte controle → teclado |
| **Catálogo** | Jogos livres/homebrew com licença e fonte indicadas. Inclui o **Combat Soccer** (futebol) e o **Mini Futebol** (jogo HTML5 próprio, 100% livre) |
| **Abrir meu jogo** | O visitante escolhe o console, arrasta o arquivo (ISO, CSO, ROM…) e joga. **O arquivo nunca é enviado ao servidor** |
| **Visual** | Tema escuro/claro, animações fluidas (transições de página nativas, revelação ao rolar, brilho que segue o mouse, inclinação 3D, botões magnéticos, marquee), respeita “reduzir movimento” |
| **PWA** | Instalável, com cache de CSS/JS/fontes e páginas já visitadas offline |

## Estrutura

```
server.js                 entrada (Express 5)
src/
  config.js  util.js  crypto.js  security.js  auth.js
  db.js                   camada de dados (JSON) — ÚNICO arquivo a trocar ao migrar para banco
  systems.js              consoles + textos de SEO (pt-BR)
  seo.js                  meta tags, JSON-LD, sitemap, robots, llms.txt, feed
  seed-data.js            catálogo inicial
  views/                  páginas renderizadas no servidor (SSR)
  routes/                 public.js (site) e admin.js (API do painel)
public/
  css/ js/ img/ fonts/    interface do site e do painel
  emu/ejs  emu/play       emuladores (baixados por "npm run emu:fetch")
  roms/ covers/ og/       jogos livres, capas e imagens de compartilhamento
  web/mini-futebol        jogo HTML5 próprio
  uploads/                arquivos enviados pelo painel
data/                     "banco" em JSON (settings, games, users, sessions, stats, audit)
scripts/                  baixar emuladores/jogos, gerar imagens (OG/ícones), QA com Chrome headless
tests/                    testes automatizados (npm test)
```

## Painel administrativo (`/admin`)

- **Login com senha**: senhas com scrypt, sessão em cookie `HttpOnly` + `SameSite=Strict` (+ `Secure` em HTTPS), token **CSRF** em toda escrita, limite de tentativas (bloqueio temporário), mensagem de erro genérica, expiração por inatividade, troca obrigatória da senha inicial e política de senha forte.
- **Visão geral**: visitas, partidas iniciadas, gráfico de 14 dias, jogos mais acessados, distribuição de aparelhos dos visitantes (contadores agregados, **sem dados pessoais**) e alertas de jogos sem licença verificada.
- **Jogos**: criar/editar/excluir, upload de capa, capturas e **ROM/ISO** (com barra de progresso e SHA-256), jogos HTML5, licença/fonte, confirmação de direitos antes de publicar, prévia do resultado no Google.
- **Consoles**: ativar/desativar e ordenar.
- **Site e SEO**: nome, descrição, domínio oficial, palavras-chave, imagem de compartilhamento, permitir/bloquear robôs de IA (busca e treinamento), redes sociais, Google Analytics/Plausible (opcional), aviso no topo e editor de FAQ.
- **Usuários**: adicionar administradores (senha temporária gerada), redefinir e excluir. **Atividade**: histórico de ações.

## SEO e visibilidade em IA (GEO)

Feito: HTML renderizado no servidor (rastreável sem JavaScript), `title`/`description`/canonical/Open Graph/Twitter por página, **JSON-LD** (WebSite+SearchAction, Organization, BreadcrumbList, FAQPage, VideoGame, WebApplication, ItemList), `sitemap.xml` (com imagens), `robots.txt` (separa buscadores de IA e coleta de treinamento, configurável), **`llms.txt` e `llms-full.txt`**, feed Atom, páginas por console com respostas diretas (“Dá para jogar PS2 no navegador?”) e FAQ, `lang=pt-BR`, hierarquia de títulos, texto alternativo, URLs limpas. **Lighthouse (celular emulado, teste local): 99–100 em Desempenho e 100 em Acessibilidade, Boas práticas e SEO** nas páginas públicas (as páginas do player são `noindex` de propósito).

> Ninguém consegue **garantir** o topo do Google ou das IAs: isso depende também de conteúdo, tempo, domínio e links de outros sites. O que dá para garantir é a base técnica — pronta aqui. Depois de publicar:
> 1. Defina o domínio em **Painel → Site e SEO → Endereço oficial** (ou `SITE_URL` no `.env`).
> 2. Cadastre o site no **Google Search Console** e no **Bing Webmaster Tools** e envie `https://seudominio/sitemap.xml`.
> 3. Publique conteúdo útil com frequência (novos jogos, guias de controles e desempenho) e consiga links de comunidades de jogos.
> 4. Acompanhe os Core Web Vitals no Search Console.

## Jogos e direitos autorais (importante)

- O site **não hospeda jogos comerciais**. O catálogo inicial usa homebrew com licença aberta (MIT/GPL) **e um jogo gratuito sem licença explícita: o Combat Soccer**, escolhido como jogo de futebol de teste. Ele aparece com o aviso “Licença?” no painel. **Antes de publicar na internet, peça permissão ao autor (Mike Kasprzak) ou troque/despublique** — o **Mini Futebol** é próprio e livre.
- O painel exige confirmar que você tem licença/permissão para cada arquivo hospedado antes de publicar.
- Para PS2/PSP/PS1 etc., o visitante usa o **próprio arquivo**, que fica só no navegador dele.
- Atenção a **licenças dos emuladores** se for monetizar: alguns núcleos (por exemplo, Snes9x e Genesis Plus GX) têm licença não comercial. Revise a página `/legal` e os repositórios antes de colocar anúncios.

## Jogos numa pasta local (ex.: Google Drive para computador)

Para testar sem gastar com armazenamento, aponte `ROMS_DIR` (no `.env`) para uma pasta do computador, como a pasta sincronizada do **Google Drive para computador**:

```
ROMS_DIR=G:Meu DriveJogos
```

No painel, em **Jogos → (jogo) → Escolher da pasta de jogos**, você escolhe o arquivo (ISO, CSO, ROM…). Os arquivos **não são copiados** para o projeto: são servidos em `/library/…`, com suporte a Range, e **só se estiverem vinculados a um jogo publicado** (o resto da pasta não fica acessível). Isso vale só para o computador onde o servidor roda; para o ar, troque por R2/GoFile (o site guarda apenas o endereço do arquivo, então a troca não afeta o catálogo).

## Publicando na internet

- Use **HTTPS** e defina `SITE_URL`, `TRUST_PROXY=1` (atrás de Nginx/Cloudflare) e `COOKIE_SECURE=1`.
- As páginas do player precisam sair com `Cross-Origin-Opener-Policy: same-origin` e `Cross-Origin-Embedder-Policy: require-corp` (necessário para o PSP e o PS2). O servidor já envia; **não remova esses cabeçalhos no proxy**.
- Faça backup de `data/` e `public/uploads/`. Há um `Dockerfile` pronto (monte volumes nessas duas pastas).

## Trocar o JSON por um banco de dados

Toda a persistência está em `src/db.js` (jogos, configurações, usuários, sessões, estatísticas, auditoria). Para migrar, reimplemente as funções exportadas desse arquivo mantendo as assinaturas; o restante do código não muda. Os formatos dos registros estão em `sanitizeGame`, `DEFAULT_SETTINGS` e `createUser`.

## Testes

```bash
npm test             # testes (unitários + integração com servidor temporário)
npm run qa:site      # capturas desktop/celular e verificação de erros (precisa do servidor rodando)
npm run qa:player    # player: catálogo, controle, abrir meu jogo, PS2
npm run qa:admin     # painel ponta a ponta (sobe uma instância própria)
npm run qa:webgame   # jogo HTML5 dentro do player, com teclado e controle simulado
npm run qa:mobile    # player em celular (retrato/paisagem) com botões virtuais
npm run qa:sw        # service worker (cache, offline, player continua isolado)
npm run qa:vitrine   # gera capturas de tela do site e do painel (instância temporária)
npm run og           # (re)gera ícones, imagem de compartilhamento e capas
```

Os testes de navegador usam o Chrome/Edge instalado (puppeteer-core). Defina `CHROME_PATH` se não for detectado.

## Limitações conhecidas

- **PS2 no navegador é experimental** (Play!): só parte dos jogos funciona e exige PC potente. O arquivo do jogo é entregue ao emulador automaticamente, mas não foi possível validar com um jogo real (não há PS2 homebrew livre à mão e jogos comerciais não foram usados).
- O **PSP** foi validado até a inicialização do núcleo (threads + WebGL2); a execução de um jogo real não foi testada pelo mesmo motivo.
- Contadores e sessões ficam em memória e são gravados em JSON: bom para um servidor único; para vários servidores migre para um banco.

## Créditos e licenças

EmulatorJS (GPL-3.0), Play! (BSD-2-Clause), fontes Inter e Space Grotesk (OFL). Os jogos do catálogo têm licença e fonte indicadas em `/legal`.
