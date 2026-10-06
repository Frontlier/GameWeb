/* Inicialização do Google Analytics 4 (o ID vem na query string: /js/ga.js?id=G-XXXX). */
(function () {
  var s = document.currentScript, id = s && new URL(s.src).searchParams.get('id');
  if (!id) return;
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', id, { anonymize_ip: true });
})();
