/* GameWeb: pede à placa de vídeo dedicada (alto desempenho) para o WebGL do Play!.js (PS2).
   Roda antes do emulador criar o contexto; o navegador decide, mas em PCs com duas GPUs isso
   costuma trocar a Intel integrada pela NVIDIA/AMD. */
(() => {
  'use strict';
  const orig = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, attrs) {
    if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') {
      attrs = { ...(attrs || {}), powerPreference: 'high-performance', desynchronized: false };
    }
    return orig.call(this, type, attrs);
  };
})();
