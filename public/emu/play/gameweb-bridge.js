/* GameWeb: ponte de entrada para o Play!.js (PS2).
   - Controle (Gamepad API) -> eventos de teclado no canvas (o Play! só lê teclado).
   - Encaminha o teclado para o canvas mesmo sem foco (sem precisar clicar no jogo). */
(() => {
  'use strict';
  const canvas = document.getElementById('outputCanvas');
  if (!canvas) return;
  canvas.setAttribute('tabindex', '0');

  // mapa do Play!.js (ver tabela de controles do emulador)
  const KEYS = {
    Enter: ['Enter', 'Enter', 13], Backspace: ['Backspace', 'Backspace', 8],
    ArrowUp: ['ArrowUp', 'ArrowUp', 38], ArrowDown: ['ArrowDown', 'ArrowDown', 40],
    ArrowLeft: ['ArrowLeft', 'ArrowLeft', 37], ArrowRight: ['ArrowRight', 'ArrowRight', 39],
    z: ['z', 'KeyZ', 90], x: ['x', 'KeyX', 88], a: ['a', 'KeyA', 65], s: ['s', 'KeyS', 83],
    1: ['1', 'Digit1', 49], 2: ['2', 'Digit2', 50], 3: ['3', 'Digit3', 51],
    8: ['8', 'Digit8', 56], 9: ['9', 'Digit9', 57], 0: ['0', 'Digit0', 48],
    f: ['f', 'KeyF', 70], h: ['h', 'KeyH', 72], t: ['t', 'KeyT', 84], g: ['g', 'KeyG', 71],
    j: ['j', 'KeyJ', 74], l: ['l', 'KeyL', 76], i: ['i', 'KeyI', 73], k: ['k', 'KeyK', 75],
  };
  // layout "standard" da Gamepad API -> botões do PS2
  const BUTTONS = { 0: 'z', 1: 'x', 2: 'a', 3: 's', 4: '1', 5: '8', 6: '2', 7: '9', 8: 'Backspace', 9: 'Enter', 10: '3', 11: '0', 12: 'ArrowUp', 13: 'ArrowDown', 14: 'ArrowLeft', 15: 'ArrowRight' };
  const CODES = new Set(Object.values(KEYS).map((k) => k[1]));
  const held = new Set();

  function fire(name, type) {
    const [key, code, keyCode] = KEYS[name];
    canvas.dispatchEvent(new KeyboardEvent(type, { key, code, keyCode, which: keyCode, bubbles: true, cancelable: true }));
  }

  function poll() {
    const pads = (navigator.getGamepads && navigator.getGamepads()) || [];
    let pad = null;
    for (const p of pads) { if (p && p.connected) { pad = p; break; } }
    const want = new Set();
    if (pad) {
      pad.buttons.forEach((b, i) => { if ((b.pressed || b.value > 0.5) && BUTTONS[i]) want.add(BUTTONS[i]); });
      const T = 0.4, [lx = 0, ly = 0, rx = 0, ry = 0] = pad.axes;
      if (lx < -T) want.add('f'); else if (lx > T) want.add('h');
      if (ly < -T) want.add('t'); else if (ly > T) want.add('g');
      if (rx < -T) want.add('j'); else if (rx > T) want.add('l');
      if (ry < -T) want.add('i'); else if (ry > T) want.add('k');
    }
    for (const n of want) if (!held.has(n)) { held.add(n); fire(n, 'keydown'); }
    for (const n of [...held]) if (!want.has(n)) { held.delete(n); fire(n, 'keyup'); }
    requestAnimationFrame(poll);
  }
  requestAnimationFrame(poll);

  // teclado físico -> canvas (o Play! escuta somente o canvas)
  const isField = (t) => t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
  function forward(e) {
    if (!e.isTrusted || e.target === canvas || !CODES.has(e.code)) return;
    if (isField(e.target) && e.target.type !== 'file') return;
    e.preventDefault();
    canvas.dispatchEvent(new KeyboardEvent(e.type, { key: e.key, code: e.code, keyCode: e.keyCode, which: e.keyCode, repeat: e.repeat, bubbles: true, cancelable: true }));
  }
  document.addEventListener('keydown', forward, true);
  document.addEventListener('keyup', forward, true);
  canvas.addEventListener('pointerdown', () => canvas.focus());
  document.addEventListener('change', (e) => {
    if (e.target && e.target.type === 'file') { e.target.blur(); canvas.focus(); window.parent?.postMessage({ type: 'gw-ps2-file', name: e.target.files?.[0]?.name || '' }, '*'); }
  });
  window.addEventListener('blur', () => { for (const n of [...held]) { held.delete(n); fire(n, 'keyup'); } });

  // proporção da imagem: ajustar (4:3) ou preencher (estica até as bordas); lembra a escolha
  const stage = canvas.parentElement;
  stage.classList.add('gw-stage');
  const KEY = 'gw-ps2-aspect';
  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'gw-aspect';
  const apply = (stretch) => { document.documentElement.classList.toggle('gw-stretch', stretch); btn.textContent = stretch ? 'Tela: preencher' : 'Tela: ajustar (4:3)'; btn.setAttribute('aria-pressed', String(stretch)); };
  let stretch = false;
  try { stretch = localStorage.getItem(KEY) === 'fill'; } catch { /* sem armazenamento */ }
  apply(stretch);
  btn.addEventListener('click', () => { stretch = !stretch; apply(stretch); try { localStorage.setItem(KEY, stretch ? 'fill' : 'fit'); } catch { /* ok */ } canvas.focus(); });
  stage.append(btn);
  window.parent?.postMessage({ type: 'gw-ps2-ready' }, '*');
})();
