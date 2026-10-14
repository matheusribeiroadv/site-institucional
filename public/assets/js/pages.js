/* Interações leves das páginas internas — blog, artigos e Política de Privacidade
   (menu, ano no rodapé…). Independente do main.js, que é só da home. */
(function () {
  'use strict';

  // ano no rodapé
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // header ganha fundo ao rolar
  var header = document.getElementById('siteHeader');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('scrolled', window.scrollY > 20);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // menu mobile/tablet: botão hambúrguer ↔ X (mesmo comportamento da home)
  var menuToggle = document.getElementById('menuToggle');
  var navLinks = document.getElementById('navLinks');
  var navOverlay = document.getElementById('navOverlay');
  if (menuToggle && navLinks) {
    var setMenuOpen = function (open, returnFocus) {
      navLinks.classList.toggle('open', open);
      if (navOverlay) navOverlay.classList.toggle('open', open);
      document.body.classList.toggle('menu-open', open);   // trava a rolagem da página atrás
      menuToggle.setAttribute('aria-expanded', String(open));
      menuToggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
      if (open) {
        var first = navLinks.querySelector('a');
        if (first) first.focus({ preventScroll: true });
      } else if (returnFocus) {
        menuToggle.focus();
      }
    };
    menuToggle.addEventListener('click', function () { setMenuOpen(!navLinks.classList.contains('open')); });
    if (navOverlay) navOverlay.addEventListener('click', function () { setMenuOpen(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navLinks.classList.contains('open')) setMenuOpen(false, true);
    });
    navLinks.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setMenuOpen(false); });
    });
    window.matchMedia('(max-width: 1100px)').addEventListener('change', function (e) {
      if (!e.matches) setMenuOpen(false);
    });
  }

  // revela elementos .reveal ao entrar na viewport
  var reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.style.transition = 'opacity .7s var(--ease,ease), transform .7s var(--ease,ease)';
            e.target.style.opacity = '1';
            e.target.style.transform = 'none';
            io.unobserve(e.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
      reveals.forEach(function (el) { io.observe(el); });
    } else {
      reveals.forEach(function (el) { el.style.opacity = '1'; el.style.transform = 'none'; });
    }
  }
})();
