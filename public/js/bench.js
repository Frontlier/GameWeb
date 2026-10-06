/* Microbenchmark de CPU executado em um Worker (não bloqueia a página). */
const t0 = performance.now();
let x = 0;
for (let i = 1; i < 2.4e6; i++) x += Math.sqrt(i) * Math.sin(i);
postMessage({ ms: performance.now() - t0 + (x === Infinity ? 1 : 0) });
