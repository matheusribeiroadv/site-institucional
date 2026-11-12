/* Transições entre páginas (View Transitions) e o monograma que se desenha.
   Carregado no <head> de todas as páginas com cabeçalho, ANTES de pintar a tela:
   - a classe html.traco precisa existir antes de o logo aparecer (senão ele pisca cheio e depois some);
   - o evento "pagereveal" só é ouvido se registrado antes da primeira pintura.
   Navegador sem suporte (ex.: Firefox): nada disso roda e as páginas abrem como sempre. */
(function () {
  'use strict';
  var d = document, h = d.documentElement;
  var calmo = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ss = null;
  try { ss = window.sessionStorage; } catch (e) { /* armazenamento bloqueado: segue sem */ }

  // 1) Monograma se desenhando: só na PRIMEIRA página vista nesta aba (nas seguintes ele já está lá).
  try {
    if (!calmo && ss && !ss.getItem('mra-traco')) {
      h.classList.add('traco');
      ss.setItem('mra-traco', '1');
    }
  } catch (e) { /* sem sessionStorage: logo aparece pronto */ }

  // 2) Capa "viajando": a imagem do card do blog cresce até virar a capa do artigo (e volta no "voltar").
  //    Os dois lados recebem o mesmo nome de transição ("capa"); o navegador faz o caminho entre eles.

  // endereço → caminho comparável: "/blog/x.html", "/blog/x/" e "/blog/x" viram "/blog/x"
  var caminho = function (u) {
    try {
      var p = new URL(u, location.href).pathname.replace(/\.html$/, '').replace(/\/index$/, '/');
      return p.length > 1 ? p.replace(/\/$/, '') : p;
    } catch (e) { return ''; }
  };
  var naTela = function (el) {
    var r = el.getBoundingClientRect();
    return r.width > 0 && r.bottom > 0 && r.top < window.innerHeight;
  };
  var limpar = function () {
    var v = d.querySelectorAll('[data-vt-capa]');
    for (var i = 0; i < v.length; i++) { v[i].style.viewTransitionName = ''; v[i].removeAttribute('data-vt-capa'); }
  };
  // marca a imagem que faz par com a OUTRA página da navegação:
  // num artigo, a capa; numa lista (home, blog), o card que leva a esse artigo.
  var marcar = function (outra) {
    limpar();
    var el = d.querySelector('.article-cover');
    if (!el) {
      var alvo = caminho(outra), links = d.querySelectorAll('a[href]');
      for (var i = 0; i < links.length && !el; i++) {
        var img = links[i].querySelector('img');
        if (img && caminho(links[i].href) === alvo && naTela(img)) el = img;
      }
    }
    if (!el || !naTela(el)) return;   // fora da tela: não "voa" de longe, só esmaece com a página
    // card ainda escondido pelo efeito de entrada (.reveal): mostra já, senão a capa chegaria a um card invisível
    var rv = el.closest('.reveal');
    if (rv) { rv.style.transition = 'none'; rv.style.opacity = '1'; rv.style.transform = 'none'; rv.dataset.vtVisivel = '1'; }
    el.style.viewTransitionName = 'capa';
    el.setAttribute('data-vt-capa', '');
  };

  // página que SAI: sabe para onde vai
  window.addEventListener('pageswap', function (e) {
    if (!e.viewTransition || !e.activation || !e.activation.entry) return;
    var destino = e.activation.entry.url;
    marcar(destino);
    try { if (ss) ss.setItem('mra-vt', JSON.stringify({ de: caminho(location.href), para: caminho(destino) })); } catch (x) {}
  });

  // página que ENTRA: descobre de onde veio (API Navigation; no Safari, pelo registro acima)
  window.addEventListener('pagereveal', function (e) {
    limpar();
    if (!e.viewTransition) return;
    var de = null;
    if (window.navigation && window.navigation.activation && window.navigation.activation.from) {
      de = window.navigation.activation.from.url;
    } else {
      try {
        var r = JSON.parse(ss.getItem('mra-vt'));
        if (r && r.para === caminho(location.href)) de = r.de;
      } catch (x) {}
    }
    if (!de) return;
    marcar(de);
    e.viewTransition.finished.then(limpar, limpar);
  });
})();
