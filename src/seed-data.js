// Catálogo inicial: jogos homebrew gratuitos (arquivos baixados por scripts/fetch-roms.js).
// Fontes: Homebrew Hub (gbdev/database) e gbadev-org/games.
// redistribution: 'verified'   -> licença aberta declarada pelo autor (MIT, GPL...)
//                 'unverified' -> gratuito, mas sem licença de redistribuição explícita (confirme antes de publicar na internet)

const HUB = 'https://raw.githubusercontent.com/gbdev/database/master/entries/';
const GBA = 'https://raw.githubusercontent.com/gbadev-org/games/HEAD/entries/';
const MIT = { name: 'Licença MIT', url: 'https://opensource.org/license/mit', redistribution: 'verified' };
const GPL3 = { name: 'GNU GPL v3', url: 'https://www.gnu.org/licenses/gpl-3.0.html', redistribution: 'verified' };

export const SEED_GAMES = [
  {
    slug: 'mini-futebol', title: 'Mini Futebol', system: 'web', featured: true, romKind: 'web',
    tagline: 'Futebol 2 contra 2 direto no navegador, com teclado, controle ou toque',
    description: 'Mini Futebol é um jogo de futebol em HTML5 criado para o GameWeb. Você comanda o jogador de camisa azul (marcado com o círculo amarelo) ao lado de um companheiro controlado pela máquina e enfrenta o time vermelho. Vence quem marcar mais gols em 90 segundos.\n\nÉ leve, roda em qualquer aparelho e foi feito para testar todas as formas de controle do site: teclado, controle (Xbox, PlayStation, Switch Pro e genéricos) e toque na tela. O código é livre (licença MIT).',
    genres: ['Esporte', 'Arcade'], tags: ['futebol', 'soccer', 'html5', 'arcade', '2d', 'teclado', 'controle'],
    year: 2026, developer: 'GameWeb', players: '1 jogador (contra a CPU)',
    controls: [['Mover', 'Setas ou W A S D'], ['Chutar', 'Espaço ou Z'], ['Pausar', 'P ou Esc'], ['Controle: mover', 'Analógico ou direcional'], ['Controle: chutar', 'Botão A, X ou R1'], ['Controle: pausar', 'Start'], ['Toque', 'Joystick à esquerda, botão CHUTE à direita']],
    license: { name: 'Licença MIT (código próprio do GameWeb)', url: 'https://opensource.org/license/mit', redistribution: 'owner' },
    source: { name: 'Feito para o GameWeb', url: '' },
    rom: '/web/mini-futebol/index.html', cover: '/covers/mini-futebol.png', screenshots: [],
  },
  {
    slug: 'combat-soccer', title: 'Combat Soccer', system: 'gbc', featured: true,
    tagline: 'Futebol maluco com foguetes de borracha',
    description: 'Combat Soccer é um “futebol” bem maluco para Game Boy Color. Você controla o jogador de cima e precisa marcar 20 pontos contra o jogador de baixo. Para ajudar, você recebe uma arma de foguetes de borracha: os foguetes rebatem a bola para o outro lado e deixam o adversário parado por alguns instantes.\n\nÉ um jogo curto, leve e perfeito para testar o emulador com teclado ou controle.',
    genres: ['Esporte', 'Ação'], tags: ['futebol', 'soccer', 'game boy color', 'homebrew'],
    year: 2011, developer: 'Mike Kasprzak', players: '1 jogador',
    license: { name: 'Homebrew gratuito (sem licença explícita)', url: 'https://hh.gbdev.io/game/combat-soccer', redistribution: 'unverified' },
    source: { name: 'Homebrew Hub', url: 'https://hh.gbdev.io/game/combat-soccer' },
    rom: '/roms/combat-soccer.gbc', cover: '/covers/combat-soccer.png', screenshots: [],
    _dl: [[HUB + 'combat-soccer/CombatSoccer.cgb', 'roms/combat-soccer.gbc'], [HUB + 'combat-soccer/20110402_combat_soccer.png', 'covers/combat-soccer.png']],
  },
  {
    slug: 'tobu-tobu-girl-deluxe', title: 'Tobu Tobu Girl Deluxe', system: 'gb', featured: true,
    tagline: 'Ação vertical sem parar, em um cartucho de Game Boy',
    description: 'Jogo de ação vertical para Game Boy em que você ajuda a heroína a subir cada vez mais alto, desviando de obstáculos e coletando itens. Esta é a versão Deluxe do Tobu Tobu Girl, com mais modos e conteúdo, publicada como software livre sob a licença MIT.',
    genres: ['Ação', 'Plataforma'], tags: ['game boy', 'homebrew', 'código aberto', 'arcade'],
    developer: 'Tangram Games', players: '1 jogador', license: MIT,
    source: { name: 'Código-fonte no GitHub', url: 'https://github.com/SimonLarsen/tobutobugirl-dx' },
    rom: '/roms/tobu-tobu-girl-deluxe.gb', cover: '/covers/tobu-tobu-girl-deluxe.png', screenshots: ['/covers/tobu-tobu-girl-deluxe-2.png', '/covers/tobu-tobu-girl-deluxe-3.png'],
    _dl: [[HUB + 'tobutobugirldeluxe/tobudx.gb', 'roms/tobu-tobu-girl-deluxe.gb'], [HUB + 'tobutobugirldeluxe/1.png', 'covers/tobu-tobu-girl-deluxe.png'],
      [HUB + 'tobutobugirldeluxe/2.png', 'covers/tobu-tobu-girl-deluxe-2.png'], [HUB + 'tobutobugirldeluxe/3.png', 'covers/tobu-tobu-girl-deluxe-3.png']],
  },
  {
    slug: 'apotris', title: 'Apotris', system: 'gba', featured: true,
    tagline: 'Blocos que caem, estilo Tetris, no Game Boy Advance',
    description: 'Apotris é um jogo de empilhar blocos (no estilo Tetris) para Game Boy Advance, com mecânicas modernas e vários modos de jogo. É software livre sob a licença GPL-3.0.',
    genres: ['Puzzle'], tags: ['tetris', 'blocos', 'game boy advance', 'código aberto'],
    developer: 'akouzoukos', players: '1 jogador', license: GPL3,
    source: { name: 'Site oficial', url: 'https://akouzoukos.com/apotris' },
    rom: '/roms/apotris.gba', cover: '/covers/apotris.png', screenshots: ['/covers/apotris-2.png'],
    _dl: [[GBA + 'apotris/Apotris.gba', 'roms/apotris.gba'], [GBA + 'apotris/demo3.png', 'covers/apotris.png'], [GBA + 'apotris/demo4.png', 'covers/apotris-2.png']],
  },
  {
    slug: 'ucity', title: 'uCity', system: 'gbc', featured: true,
    tagline: 'Construa e administre uma cidade no Game Boy Color',
    description: 'uCity é um jogo de construção de cidades para Game Boy Color, no estilo SimCity: construa ruas, zonas residenciais, comerciais e industriais, forneça energia e administre o orçamento enquanto a cidade cresce. É software livre sob a licença GPL-3.0 ou superior.',
    genres: ['Estratégia', 'Simulação'], tags: ['city builder', 'game boy color', 'código aberto', 'simcity'],
    developer: 'AntonioND', players: '1 jogador', license: { ...GPL3, name: 'GNU GPL v3 ou superior' },
    source: { name: 'Código-fonte no GitHub', url: 'https://github.com/AntonioND/ucity' },
    rom: '/roms/ucity.gbc', cover: '/covers/ucity.png', screenshots: [],
    _dl: [[HUB + 'ucity/ucity.gbc', 'roms/ucity.gbc'], [HUB + 'ucity/screenshot1.png', 'covers/ucity.png']],
  },
  {
    slug: 'max-pirate', title: 'Max Pirate', system: 'gb',
    tagline: 'Zumbis, uma âncora e o canhão Bessie',
    description: 'Jogo de ação para Game Boy: esmague zumbis com a sua âncora e com o canhão Bessie. Feito com GBDK-2020 e distribuído sob a licença MIT.',
    genres: ['Ação'], tags: ['zumbis', 'game boy', 'homebrew', 'código aberto'],
    year: 2024, developer: 'Lemmy Hawkins', players: '1 jogador', license: MIT,
    source: { name: 'Código-fonte no GitHub', url: 'https://github.com/MWehrstedt/MaxPirate' },
    rom: '/roms/max-pirate.gb', cover: '/covers/max-pirate.png', screenshots: ['/covers/max-pirate-2.png', '/covers/max-pirate-3.png'],
    _dl: [[HUB + 'maxpirate/maxpirate.gb', 'roms/max-pirate.gb'], [HUB + 'maxpirate/cover.png', 'covers/max-pirate.png'],
      [HUB + 'maxpirate/screen1.png', 'covers/max-pirate-2.png'], [HUB + 'maxpirate/screen2.png', 'covers/max-pirate-3.png']],
  },
  {
    slug: 'meteorain', title: 'MeteoRain', system: 'gba',
    tagline: 'Ação criada para a GBA Jam 2021',
    description: 'MeteoRain é um jogo de ação criado para a GBA Jam 2021 por Dr. Ludos e distribuído sob a licença MIT.',
    genres: ['Ação'], tags: ['game boy advance', 'gba jam', 'homebrew', 'código aberto'],
    year: 2021, developer: 'Dr. Ludos', players: '1 jogador', license: MIT,
    source: { name: 'Código-fonte no GitHub', url: 'https://github.com/drludos/meteorain-gba' },
    rom: '/roms/meteorain.gba', cover: '/covers/meteorain.png', screenshots: ['/covers/meteorain-2.png', '/covers/meteorain-3.png'],
    _dl: [[GBA + 'meteorain-gba-jam-2021/MeteoRain.gba', 'roms/meteorain.gba'], [GBA + 'meteorain-gba-jam-2021/cNaRyT.png', 'covers/meteorain.png'],
      [GBA + 'meteorain-gba-jam-2021/m9CL2Bv.png', 'covers/meteorain-2.png'], [GBA + 'meteorain-gba-jam-2021/YRJKMp.png', 'covers/meteorain-3.png']],
  },
  {
    slug: 'minicraft-gba', title: 'Minicraft para GBA', system: 'gba',
    tagline: 'Explore, colete e sobreviva em 2D',
    description: 'Adaptação do Minicraft, o jogo de exploração e sobrevivência em 2D criado para a Ludum Dare 22, para o Game Boy Advance. Código aberto sob a licença GPL-3.0 ou superior.',
    genres: ['Aventura', 'Sobrevivência'], tags: ['minicraft', 'game boy advance', 'código aberto', 'exploração'],
    developer: 'Vulcalien', players: '1 jogador', license: { ...GPL3, name: 'GNU GPL v3 ou superior' },
    source: { name: 'Código-fonte no GitHub', url: 'https://github.com/Vulcalien/minicraft-gba' },
    rom: '/roms/minicraft-gba.gba', cover: '/covers/minicraft-gba.png', screenshots: ['/covers/minicraft-gba-2.png', '/covers/minicraft-gba-3.png'],
    _dl: [[GBA + 'minicraft-gba/minicraft.gba', 'roms/minicraft-gba.gba'], [GBA + 'minicraft-gba/cover.png', 'covers/minicraft-gba.png'],
      [GBA + 'minicraft-gba/1.png', 'covers/minicraft-gba-2.png'], [GBA + 'minicraft-gba/2.png', 'covers/minicraft-gba-3.png']],
  },
];
