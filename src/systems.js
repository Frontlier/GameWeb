// Registro dos consoles suportados + conteúdo de SEO (pt-BR).
// engine: 'ejs'  -> EmulatorJS (núcleos libretro em WebAssembly)
//         'play' -> Play!.js (PS2, experimental)
// tier: exigência de hardware  1=qualquer aparelho · 2=intermediário · 3=bom (desktop) · 4=potente (desktop)

// Teclado padrão do EmulatorJS (jogador 1), usado nos painéis de ajuda.
const PAD_CLASSIC = (extra = []) => [
  ['Direcional', 'Setas ← ↑ → ↓'], ['A', 'Z'], ['B', 'X'], ...extra, ['Start', 'Enter'], ['Select', 'V'],
];

const PADS = {
  nes: PAD_CLASSIC(),
  gb: PAD_CLASSIC(),
  gba: PAD_CLASSIC([['L', 'Q'], ['R', 'E']]),
  snes: PAD_CLASSIC([['X', 'A'], ['Y', 'S'], ['L', 'Q'], ['R', 'E']]),
  nds: PAD_CLASSIC([['X', 'A'], ['Y', 'S'], ['L', 'Q'], ['R', 'E'], ['Tela de toque', 'Mouse / dedo']]),
  md: [['Direcional', 'Setas ← ↑ → ↓'], ['A', 'S'], ['B', 'X'], ['C', 'Z'], ['X', 'Q'], ['Y', 'A'], ['Z', 'E'], ['Start', 'Enter'], ['Mode', 'V']],
  sms: [['Direcional', 'Setas ← ↑ → ↓'], ['Botão 1', 'X'], ['Botão 2', 'Z'], ['Pause', 'Enter']],
  gg: [['Direcional', 'Setas ← ↑ → ↓'], ['Botão 1', 'X'], ['Botão 2', 'Z'], ['Start', 'Enter']],
  pce: [['Direcional', 'Setas ← ↑ → ↓'], ['Botão I', 'Z'], ['Botão II', 'X'], ['Run', 'Enter'], ['Select', 'V']],
  atari: [['Direcional', 'Setas ← ↑ → ↓'], ['Fogo', 'X'], ['Reset', 'Enter'], ['Select', 'V']],
  n64: [['Direcional / Analógico', 'Setas ou F · H · T · G'], ['A', 'X'], ['B', 'S'], ['Z (gatilho)', 'Tab'], ['L', 'Q'], ['R', 'E'], ['Botões C', 'J · L · I · K'], ['Start', 'Enter']],
  psx: [['Direcional', 'Setas ← ↑ → ↓'], ['✕ (Cross)', 'X'], ['○ (Círculo)', 'Z'], ['□ (Quadrado)', 'S'], ['△ (Triângulo)', 'A'], ['L1 / R1', 'Q / E'], ['L2 / R2', 'Tab / R'], ['Start', 'Enter'], ['Select', 'V']],
  psp: [['Direcional', 'Setas ← ↑ → ↓'], ['Analógico', 'F · H · T · G'], ['✕ (Cross)', 'X'], ['○ (Círculo)', 'Z'], ['□ (Quadrado)', 'S'], ['△ (Triângulo)', 'A'], ['L / R', 'Q / E'], ['Start', 'Enter'], ['Select', 'V']],
  ps2: [['Direcional', 'Setas ← ↑ → ↓'], ['Analógico esq.', 'F · H · T · G'], ['Analógico dir.', 'J · L · I · K'], ['✕ (Cross)', 'Z'], ['○ (Círculo)', 'X'], ['□ (Quadrado)', 'A'], ['△ (Triângulo)', 'S'], ['L1 / R1', '1 / 8'], ['L2 / R2', '2 / 9'], ['L3 / R3', '3 / 0'], ['Start', 'Enter'], ['Select', 'Backspace']],
};

const EASY = 'Qualquer computador ou celular dos últimos 10 anos, com Chrome, Edge, Firefox ou Safari atualizado.';

export const SYSTEMS = [
  {
    id: 'ps2', slug: 'ps2', name: 'PlayStation 2', short: 'PS2', maker: 'Sony', year: 2000, engine: 'play', core: null,
    emulator: 'Play!', exts: ['iso', 'cso', 'chd', 'isz', 'bin', 'elf'], tier: 4, status: 'experimental', color: '#3b82f6', pad: PADS.ps2,
    title: 'Emulador de PS2 online no navegador (experimental)',
    description: 'Jogue PlayStation 2 no navegador com o emulador Play! em WebAssembly. Veja requisitos, formatos aceitos (ISO, CHD, CSO) e controles de teclado e controle.',
    h1: 'Emulador de PS2 online',
    intro: 'Dá para jogar PS2 no navegador? Sim, de forma experimental. O GameWeb usa o Play!, um emulador de PlayStation 2 compilado para WebAssembly que roda em Chrome, Edge e Firefox recentes, sem instalar nada. Como o PS2 é um console complexo, só parte dos jogos funciona bem e é preciso um computador potente. Você escolhe o arquivo do seu próprio jogo (ISO, CSO, CHD, ISZ, BIN ou ELF) e ele roda localmente: nada é enviado ao servidor.',
    requirements: {
      min: 'PC com CPU de 4 núcleos (3,5 GHz ou mais), 8 GB de RAM e Chrome, Edge ou Firefox atualizado.',
      rec: 'CPU de alto desempenho (Ryzen 5 ou Core i5 recentes, ou melhor), 16 GB de RAM e GPU dedicada. Não recomendado para celulares.',
    },
    highlights: ['Não exige BIOS: o Play! usa um BIOS próprio', 'Aceita ISO, CSO, CHD, ISZ, BIN e ELF', 'Teclado e controle (Gamepad API)', 'Experimental: parte dos jogos apresenta falhas gráficas ou de áudio'],
    faq: [
      { q: 'Preciso do BIOS do PS2?', a: 'Não. O Play! usa um BIOS próprio e compatível, então basta o arquivo do jogo.' },
      { q: 'Por que o PS2 roda mais devagar que PSP ou PS1 no navegador?', a: 'O hardware do PS2 é bem mais complexo: CPU Emotion Engine, GPU Graphics Synthesizer e dois processadores vetoriais. Emular tudo isso em WebAssembly exige muito processamento; mesmo em PCs fortes, alguns jogos ficam abaixo de 60 FPS.' },
      { q: 'Quais jogos de PS2 funcionam?', a: 'A lista de compatibilidade é mantida pelo próprio projeto Play! (github.com/jpd002/Play-Compatibility). Se o seu jogo travar, tente Chrome ou Edge, feche outras abas e use um computador mais potente.' },
    ],
  },
  {
    id: 'psp', slug: 'psp', name: 'PlayStation Portable', short: 'PSP', maker: 'Sony', year: 2004, engine: 'ejs', core: 'psp',
    emulator: 'PPSSPP', exts: ['iso', 'cso', 'pbp', 'elf', 'prx'], tier: 3, status: 'beta', color: '#6366f1', pad: PADS.psp, psLayout: true,
    title: 'Emulador de PSP online no navegador (PPSSPP)',
    description: 'Jogue PSP no navegador com o PPSSPP em WebAssembly. Requisitos, formatos (ISO, CSO, PBP), controles de teclado e controle e dicas para rodar melhor.',
    h1: 'Emulador de PSP online',
    intro: 'Dá para jogar PSP no navegador? Dá. O GameWeb usa o PPSSPP (via EmulatorJS) compilado para WebAssembly, com WebGL2 e multithreading. Funciona melhor em computadores com CPU de 4 ou mais núcleos e uma GPU decente; em celulares e notebooks básicos o desempenho cai. Abra o arquivo do seu jogo (ISO, CSO ou PBP): ele é lido localmente e não é enviado a nenhum servidor.',
    requirements: {
      min: 'CPU de 4 núcleos, 8 GB de RAM e navegador desktop com WebGL2 e SharedArrayBuffer (Chrome, Edge ou Firefox).',
      rec: 'CPU de 6 ou mais núcleos, GPU dedicada ou integrada recente e 16 GB de RAM.',
    },
    highlights: ['Resolução e filtros ajustáveis no menu ⚙', 'Salvar e carregar estado (save state) no navegador', 'Aceita ISO, CSO (comprimido), PBP e ELF', 'Imagens grandes usam muita memória: prefira CSO em PCs com 8 GB'],
    faq: [
      { q: 'Meu jogo de PSP trava ou fica lento. O que fazer?', a: 'Feche outras abas, use Chrome ou Edge no computador, mantenha a resolução em 1x (480×272) e ative o pulo de quadros no menu ⚙ > Opções do núcleo. No Windows, force o navegador a usar a GPU dedicada em Configurações > Sistema > Tela > Gráficos.' },
      { q: 'Qual o tamanho máximo do jogo?', a: 'O arquivo é carregado na memória do navegador. ISOs de 1 GB ou mais podem falhar em aparelhos com pouca RAM; converta para CSO para reduzir o tamanho.' },
      { q: 'Por que aparece um erro de SharedArrayBuffer?', a: 'O PSP precisa de multithreading, que só funciona em navegadores desktop recentes e com o site servido com os cabeçalhos COOP/COEP (o GameWeb já faz isso). Em navegadores muito antigos, atualize ou troque para Chrome ou Edge.' },
    ],
  },
  {
    id: 'psx', slug: 'ps1', name: 'PlayStation 1', short: 'PS1', maker: 'Sony', year: 1994, engine: 'ejs', core: 'psx',
    emulator: 'PCSX ReARMed', exts: ['bin', 'cue', 'img', 'mdf', 'pbp', 'ccd', 'm3u'], tier: 2, status: 'stable', color: '#94a3b8', pad: PADS.psx, psLayout: true,
    bios: { label: 'BIOS do PlayStation (opcional)', hint: 'Exemplo: scph1001.bin. Só é necessário para os poucos jogos que não rodam com o BIOS simulado.' },
    title: 'Emulador de PS1 (PlayStation) online no navegador',
    description: 'Jogue PlayStation 1 no navegador. Aceita BIN/CUE, PBP e mais, com BIOS opcional, save states e controle ou teclado. Veja requisitos e controles.',
    h1: 'Emulador de PS1 online',
    intro: 'Dá para jogar PlayStation 1 no navegador? Sim, e roda bem na maioria dos computadores atuais. O GameWeb usa o núcleo PCSX ReARMed via EmulatorJS. Para jogos em CD, envie o arquivo .bin junto do .cue dentro de um .zip, ou use um .pbp ou .img. Muitos jogos funcionam sem BIOS; para os que exigem, você pode informar o seu próprio arquivo de BIOS (opcional).',
    requirements: {
      min: 'Computador de 2 núcleos ou celular intermediário (3 GB de RAM).',
      rec: 'PC com CPU de 4 núcleos ou celular com 4 GB de RAM ou mais.',
    },
    highlights: ['Save states e rebobinar pelo menu', 'Aceita BIN/CUE (em .zip), PBP e IMG', 'BIOS opcional para jogos específicos', 'Controle de PlayStation ou Xbox com os botões na posição certa'],
    faq: [
      { q: 'Preciso do BIOS do PlayStation?', a: 'Nem sempre. O núcleo tem um BIOS simulado (HLE) que roda a maioria dos jogos, mas alguns exigem o BIOS original. Nesse caso, informe o seu arquivo (por exemplo, scph1001.bin) no campo opcional antes de iniciar.' },
      { q: 'Como carrego um jogo com .bin e .cue?', a: 'Coloque o .cue e o(s) .bin dentro de um único arquivo .zip e escolha esse .zip. Também funcionam arquivos .pbp e .img.' },
    ],
  },
  {
    id: 'n64', slug: 'nintendo-64', name: 'Nintendo 64', short: 'N64', maker: 'Nintendo', year: 1996, engine: 'ejs', core: 'n64',
    emulator: 'Mupen64Plus-Next', exts: ['z64', 'n64', 'v64'], tier: 2, status: 'beta', color: '#22c55e', pad: PADS.n64,
    title: 'Emulador de Nintendo 64 online no navegador',
    description: 'Jogue Nintendo 64 no navegador com o Mupen64Plus em WebAssembly. Aceita .z64, .n64 e .v64, com controle ou teclado. Veja requisitos e dicas.',
    h1: 'Emulador de Nintendo 64 online',
    intro: 'Dá para jogar Nintendo 64 no navegador? Dá, com bom desempenho em computadores medianos. O GameWeb usa o Mupen64Plus-Next (via EmulatorJS) com renderização em WebGL2. Envie a ROM do seu cartucho (.z64, .n64 ou .v64) e jogue com teclado ou controle. A ROM é lida localmente e não é enviada a servidor algum.',
    requirements: {
      min: 'CPU de 2 núcleos (2,5 GHz ou mais) e GPU integrada recente.',
      rec: 'CPU de 4 núcleos e GPU dedicada para usar resoluções maiores.',
    },
    highlights: ['Aceita .z64, .n64 e .v64', 'Resolução ajustável no menu ⚙', 'Save states instantâneos', 'Alguns jogos pesados pedem mais GPU'],
    faq: [
      { q: 'O que fazer se o jogo de N64 travar?', a: 'Reduza a resolução interna em ⚙ > Opções do núcleo, feche outras abas e prefira Chrome ou Edge. Alguns jogos com muitos efeitos exigem GPU mais forte.' },
    ],
  },
  {
    id: 'nds', slug: 'nintendo-ds', name: 'Nintendo DS', short: 'NDS', maker: 'Nintendo', year: 2004, engine: 'ejs', core: 'nds',
    emulator: 'melonDS', exts: ['nds'], tier: 2, status: 'beta', color: '#38bdf8', pad: PADS.nds,
    title: 'Emulador de Nintendo DS online no navegador',
    description: 'Jogue Nintendo DS no navegador com o melonDS em WebAssembly. Duas telas, toque com mouse ou dedo e controle ou teclado. Veja requisitos e controles.',
    h1: 'Emulador de Nintendo DS online',
    intro: 'Dá para jogar Nintendo DS no navegador? Dá. O GameWeb usa o melonDS (via EmulatorJS). Envie o arquivo .nds do seu jogo: as duas telas aparecem e o toque funciona com o mouse ou com o dedo no celular. O BIOS é opcional, porque o melonDS tem um substituto embutido. O arquivo é lido localmente no seu navegador.',
    requirements: {
      min: 'CPU de 2 núcleos ou celular intermediário (3 GB de RAM).',
      rec: 'PC com CPU de 4 núcleos ou celular de gama média/alta.',
    },
    highlights: ['Tela de toque via mouse ou dedo', 'Aceita arquivos .nds', 'Save states e salvamento no navegador', 'Funciona em celulares intermediários'],
    faq: [
      { q: 'Como uso a tela de toque do DS?', a: 'No computador, clique com o mouse na tela de baixo. No celular, toque diretamente nela.' },
    ],
  },
  {
    id: 'gba', slug: 'game-boy-advance', name: 'Game Boy Advance', short: 'GBA', maker: 'Nintendo', year: 2001, engine: 'ejs', core: 'gba',
    emulator: 'mGBA', exts: ['gba'], tier: 1, status: 'stable', color: '#8b5cf6', pad: PADS.gba,
    title: 'Emulador de Game Boy Advance online (GBA) no navegador',
    description: 'Jogue Game Boy Advance no navegador com o mGBA em WebAssembly: leve, com save states, teclado, controle e toque. Funciona até em celulares básicos.',
    h1: 'Emulador de Game Boy Advance online',
    intro: 'Dá para jogar Game Boy Advance no navegador? Sim, e roda em praticamente qualquer aparelho, inclusive celulares básicos. O GameWeb usa o mGBA (via EmulatorJS). Escolha um jogo livre do catálogo ou abra o arquivo .gba do seu cartucho: ele é lido localmente e não é enviado ao servidor.',
    requirements: { min: EASY, rec: EASY },
    highlights: ['Roda leve em qualquer aparelho', 'Save states e salvamento persistente', 'Teclado, controle e botões virtuais no celular', 'Catálogo com jogos homebrew livres'],
    faq: [
      { q: 'Preciso do BIOS do GBA?', a: 'Não. O mGBA tem um BIOS simulado que roda praticamente todos os jogos.' },
    ],
  },
  {
    id: 'gbc', slug: 'game-boy-color', name: 'Game Boy Color', short: 'GBC', maker: 'Nintendo', year: 1998, engine: 'ejs', core: 'gb',
    emulator: 'Gambatte', exts: ['gbc', 'gb'], tier: 1, status: 'stable', color: '#f59e0b', pad: PADS.gb,
    title: 'Emulador de Game Boy Color online no navegador',
    description: 'Jogue Game Boy Color no navegador com o Gambatte, leve e preciso. Teclado, controle e toque, com save states. Funciona em qualquer aparelho.',
    h1: 'Emulador de Game Boy Color online',
    intro: 'Dá para jogar Game Boy Color no navegador? Sim, em qualquer computador ou celular. O GameWeb usa o Gambatte (via EmulatorJS), um emulador muito preciso. Jogue os títulos livres do catálogo ou abra o arquivo .gbc do seu cartucho, que é lido localmente no seu navegador.',
    requirements: { min: EASY, rec: EASY },
    highlights: ['Emulação precisa com o Gambatte', 'Save states e salvamento persistente', 'Controles virtuais no celular', 'Compatível com jogos de Game Boy e Game Boy Color'],
    faq: [],
  },
  {
    id: 'gb', slug: 'game-boy', name: 'Game Boy', short: 'GB', maker: 'Nintendo', year: 1989, engine: 'ejs', core: 'gb',
    emulator: 'Gambatte', exts: ['gb', 'dmg'], tier: 1, status: 'stable', color: '#84cc16', pad: PADS.gb,
    title: 'Emulador de Game Boy online no navegador',
    description: 'Jogue Game Boy clássico no navegador com o Gambatte. Leve, com save states, teclado, controle e toque. Funciona em qualquer computador ou celular.',
    h1: 'Emulador de Game Boy online',
    intro: 'Dá para jogar Game Boy no navegador? Sim, e funciona em qualquer aparelho. O GameWeb usa o Gambatte (via EmulatorJS). Escolha um jogo livre do catálogo ou abra o arquivo .gb do seu cartucho: ele é lido localmente e não é enviado ao servidor.',
    requirements: { min: EASY, rec: EASY },
    highlights: ['Roda em qualquer aparelho', 'Save states e salvamento persistente', 'Teclado, controle e toque', 'Catálogo com homebrews livres'],
    faq: [],
  },
  {
    id: 'snes', slug: 'super-nintendo', name: 'Super Nintendo', short: 'SNES', maker: 'Nintendo', year: 1990, engine: 'ejs', core: 'snes',
    emulator: 'Snes9x', exts: ['sfc', 'smc', 'swc', 'fig'], tier: 1, status: 'stable', color: '#a78bfa', pad: PADS.snes,
    title: 'Emulador de Super Nintendo (SNES) online no navegador',
    description: 'Jogue Super Nintendo no navegador com o Snes9x: leve, rápido e com save states. Teclado, controle e toque. Ideal para computadores simples e celulares.',
    h1: 'Emulador de Super Nintendo online',
    intro: 'Dá para jogar Super Nintendo no navegador? Sim, com excelente desempenho. O GameWeb usa o Snes9x (via EmulatorJS) e aceita ROMs .sfc, .smc e similares. É ideal para computadores simples e celulares. O arquivo do seu jogo é lido localmente e não é enviado ao servidor.',
    requirements: { min: EASY, rec: EASY },
    highlights: ['Aceita .sfc, .smc, .swc e .fig', 'Save states e rebobinar', 'Botões virtuais no celular', 'Filtros de vídeo (CRT) no menu ⚙'],
    faq: [],
  },
  {
    id: 'nes', slug: 'nintendinho-nes', name: 'Nintendo 8 bits (NES)', short: 'NES', maker: 'Nintendo', year: 1985, engine: 'ejs', core: 'nes',
    emulator: 'FCEUmm', exts: ['nes', 'fds', 'unf', 'unif'], tier: 1, status: 'stable', color: '#ef4444', pad: PADS.nes,
    title: 'Emulador de NES (Nintendinho) online no navegador',
    description: 'Jogue NES (Nintendinho) no navegador com o FCEUmm. Leve, com save states, teclado, controle e toque. Abra sua ROM .nes ou jogue homebrews livres.',
    h1: 'Emulador de NES (Nintendinho) online',
    intro: 'Dá para jogar NES (Nintendinho) no navegador? Sim, roda leve em qualquer aparelho. O GameWeb usa o FCEUmm (via EmulatorJS). Envie a ROM (.nes) ou o disco .fds do Famicom Disk System e jogue com teclado, controle ou toque na tela. O arquivo é lido localmente e não é enviado ao servidor.',
    requirements: { min: EASY, rec: EASY },
    highlights: ['Aceita .nes, .fds, .unf e .unif', 'Save states e salvamento persistente', 'Teclado, controle e toque', 'Roda em qualquer aparelho'],
    faq: [],
  },
  {
    id: 'md', slug: 'mega-drive', name: 'Mega Drive (Genesis)', short: 'MD', maker: 'Sega', year: 1988, engine: 'ejs', core: 'segaMD',
    emulator: 'Genesis Plus GX', exts: ['md', 'gen', 'smd', 'bin'], tier: 1, status: 'stable', color: '#0ea5e9', pad: PADS.md,
    title: 'Emulador de Mega Drive (Genesis) online no navegador',
    description: 'Jogue Mega Drive (Genesis) no navegador com o Genesis Plus GX. Preciso, leve e com save states. Teclado, controle e toque, em qualquer aparelho.',
    h1: 'Emulador de Mega Drive online',
    intro: 'Dá para jogar Mega Drive (Genesis) no navegador? Sim, com ótima precisão e desempenho. O GameWeb usa o Genesis Plus GX (via EmulatorJS) e aceita ROMs .md, .gen, .smd e .bin. O arquivo é lido localmente no seu navegador e não é enviado ao servidor.',
    requirements: { min: EASY, rec: EASY },
    highlights: ['Aceita .md, .gen, .smd e .bin', 'Controle de 3 e 6 botões', 'Save states e salvamento', 'Roda em qualquer aparelho'],
    faq: [],
  },
  {
    id: 'sms', slug: 'master-system', name: 'Master System', short: 'SMS', maker: 'Sega', year: 1985, engine: 'ejs', core: 'segaMS',
    emulator: 'SMS Plus', exts: ['sms'], tier: 1, status: 'stable', color: '#f43f5e', pad: PADS.sms,
    title: 'Emulador de Master System online no navegador',
    description: 'Jogue Master System no navegador com o SMS Plus. Leve, com save states, teclado, controle e toque. Abra sua ROM .sms em qualquer aparelho.',
    h1: 'Emulador de Master System online',
    intro: 'Dá para jogar Master System no navegador? Sim, roda em qualquer aparelho. O GameWeb usa o SMS Plus (via EmulatorJS). Abra o arquivo .sms do seu jogo e use teclado, controle ou toque na tela. O arquivo é lido localmente e não é enviado ao servidor.',
    requirements: { min: EASY, rec: EASY },
    highlights: ['Aceita arquivos .sms', 'Save states e salvamento', 'Teclado, controle e toque', 'Roda em qualquer aparelho'],
    faq: [],
  },
  {
    id: 'gg', slug: 'game-gear', name: 'Game Gear', short: 'GG', maker: 'Sega', year: 1990, engine: 'ejs', core: 'segaGG',
    emulator: 'Genesis Plus GX', exts: ['gg'], tier: 1, status: 'stable', color: '#14b8a6', pad: PADS.gg,
    title: 'Emulador de Game Gear online no navegador',
    description: 'Jogue Game Gear no navegador com o Genesis Plus GX. Leve, com save states, teclado, controle e toque. Abra sua ROM .gg em qualquer aparelho.',
    h1: 'Emulador de Game Gear online',
    intro: 'Dá para jogar Game Gear no navegador? Sim, em qualquer aparelho. O GameWeb usa o Genesis Plus GX (via EmulatorJS). Abra o arquivo .gg do seu jogo e jogue com teclado, controle ou toque. O arquivo é lido localmente e não é enviado ao servidor.',
    requirements: { min: EASY, rec: EASY },
    highlights: ['Aceita arquivos .gg', 'Save states e salvamento', 'Teclado, controle e toque', 'Roda em qualquer aparelho'],
    faq: [],
  },
  {
    id: 'pce', slug: 'pc-engine', name: 'PC Engine (TurboGrafx-16)', short: 'PCE', maker: 'NEC', year: 1987, engine: 'ejs', core: 'pce',
    emulator: 'Beetle PCE', exts: ['pce'], tier: 1, status: 'stable', color: '#f97316', pad: PADS.pce,
    title: 'Emulador de PC Engine (TurboGrafx-16) online no navegador',
    description: 'Jogue PC Engine (TurboGrafx-16) no navegador com o Beetle PCE. Leve, com save states, teclado, controle e toque. Abra sua ROM .pce.',
    h1: 'Emulador de PC Engine online',
    intro: 'Dá para jogar PC Engine (TurboGrafx-16) no navegador? Sim, roda em qualquer aparelho. O GameWeb usa o Beetle PCE (via EmulatorJS). Abra o arquivo .pce do seu jogo e use teclado, controle ou toque. O arquivo é lido localmente e não é enviado ao servidor.',
    requirements: { min: EASY, rec: EASY },
    highlights: ['Aceita arquivos .pce', 'Save states e salvamento', 'Teclado, controle e toque', 'Roda em qualquer aparelho'],
    faq: [],
  },
  {
    id: 'a2600', slug: 'atari-2600', name: 'Atari 2600', short: '2600', maker: 'Atari', year: 1977, engine: 'ejs', core: 'atari2600',
    emulator: 'Stella', exts: ['a26', 'bin'], tier: 1, status: 'stable', color: '#d97706', pad: PADS.atari,
    title: 'Emulador de Atari 2600 online no navegador',
    description: 'Jogue Atari 2600 no navegador com o Stella. Leve, com save states, teclado, controle e toque. Abra sua ROM .a26 ou .bin em qualquer aparelho.',
    h1: 'Emulador de Atari 2600 online',
    intro: 'Dá para jogar Atari 2600 no navegador? Sim, em qualquer aparelho. O GameWeb usa o Stella (via EmulatorJS). Abra o arquivo .a26 ou .bin do seu jogo e use teclado, controle ou toque. O arquivo é lido localmente e não é enviado ao servidor.',
    requirements: { min: EASY, rec: EASY },
    highlights: ['Aceita .a26 e .bin', 'Save states e salvamento', 'Teclado, controle e toque', 'Roda em qualquer aparelho'],
    faq: [],
  },
];

// Pseudo-console para jogos HTML5 próprios do catálogo (não aparece na lista de consoles).
SYSTEMS.push({
  id: 'web', slug: 'jogos-web', name: 'Jogos Web (HTML5)', short: 'WEB', maker: 'Navegador', year: 2011, engine: 'web', core: null, hidden: true,
  emulator: 'HTML5', exts: [], tier: 1, status: 'stable', color: '#10b981',
  pad: [['Mover', 'Setas ou W A S D'], ['Ação', 'Espaço'], ['Pausar', 'P']],
  title: 'Jogos HTML5 grátis para jogar no navegador', description: 'Jogos feitos para o navegador (HTML5), sem emulador e sem instalar nada.',
  h1: 'Jogos web (HTML5)', intro: 'Jogos HTML5 rodam direto no navegador, sem emulador. Os controles variam de jogo para jogo.',
  requirements: { min: EASY, rec: EASY }, highlights: [], faq: [],
});

// Nome curto usado em frases ("Emulador de Mega Drive online"); "short" é a sigla compacta dos cartões.
const NICK = { psx: 'PS1', n64: 'Nintendo 64', nds: 'Nintendo DS', gba: 'Game Boy Advance', gbc: 'Game Boy Color', gb: 'Game Boy', snes: 'Super Nintendo', md: 'Mega Drive', sms: 'Master System', gg: 'Game Gear', pce: 'PC Engine', a2600: 'Atari 2600', web: 'Jogos Web' };
for (const s of SYSTEMS) s.nick = NICK[s.id] || s.short;

export const TIER_LABEL = { 1: 'Qualquer aparelho', 2: 'Intermediário', 3: 'Bom (computador)', 4: 'Potente (computador)' };
export const STATUS_LABEL = { stable: 'Estável', beta: 'Beta', experimental: 'Experimental' };

const BY_ID = new Map(SYSTEMS.map((s) => [s.id, s]));
const BY_SLUG = new Map(SYSTEMS.map((s) => [s.slug, s]));
export const systemById = (id) => BY_ID.get(id) || null;
export const systemBySlug = (slug) => BY_SLUG.get(slug) || null;

/** FAQ completo de um console: específicas + genéricas. */
export function systemFaq(s) {
  const mobile = s.tier <= 1
    ? 'Sim. Funciona bem em celulares e tablets, com botões virtuais na tela e suporte a controle Bluetooth.'
    : s.tier === 2
      ? 'Depende do aparelho. Em celulares de gama média ou alta costuma funcionar; em aparelhos básicos pode travar. O teste automático do GameWeb mostra o que seu dispositivo aguenta.'
      : 'Não é recomendado. Esse console exige muito processamento e memória; use um computador com CPU e GPU potentes.';
  return [
    ...s.faq,
    { q: `Preciso instalar algum programa para jogar ${s.nick}?`, a: 'Não. O emulador roda dentro do navegador (Chrome, Edge, Firefox ou Safari atualizados). Basta abrir a página e escolher o jogo.' },
    { q: `O meu arquivo de ${s.nick} é enviado para o servidor?`, a: 'Não. Ao abrir o seu arquivo, ele é lido localmente pelo navegador e não sai do seu aparelho. O GameWeb não hospeda nem distribui jogos comerciais: use apenas jogos que você possui legalmente.' },
    { q: `Dá para jogar ${s.nick} com controle e teclado?`, a: 'Sim. Controles de Xbox, PlayStation, Switch Pro e a maioria dos genéricos são detectados automaticamente (basta apertar um botão). O teclado também funciona e você pode remapear tudo no menu ⚙ > Controles.' },
    { q: `${s.nick} funciona no celular?`, a: mobile },
  ];
}

/** Extensões aceitas no seletor de arquivo (inclui compactados para EmulatorJS). */
export function acceptList(s) {
  const list = s.engine === 'ejs' ? [...s.exts, 'zip', '7z'] : s.exts;
  return list.map((e) => '.' + e).join(',');
}
