/* Interações leves das páginas do blog (independente do script.js da home) */
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

  // menu mobile: checkbox controla a classe .open da navegação
  var checkbox = document.getElementById('checkbox');
  var navLinks = document.getElementById('navLinks');
  if (checkbox && navLinks) {
    checkbox.addEventListener('change', function () {
      navLinks.classList.toggle('open', checkbox.checked);
    });
    navLinks.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        checkbox.checked = false;
        navLinks.classList.remove('open');
      });
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
