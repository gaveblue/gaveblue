/* Institutional GB+ landing: directs users to the right existing flow.
 * The financial app, authentication, and PWA installation code are untouched.
 */
(() => {
  'use strict';
  const mobileBrowser = (() => {
    try {
      if (window.matchMedia('(display-mode:standalone)').matches || navigator.standalone === true) return false;
      if (navigator.userAgentData?.mobile === true) return true;
      if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '')) return true;
      return window.matchMedia('(max-width:820px) and (pointer:coarse)').matches;
    } catch { return false; }
  })();

  const target = mobileBrowser
    ? './instalar.html?origem=institucional'
    : './?web=1';

  document.querySelectorAll('[data-start]').forEach(link => {
    link.href = target;
    link.setAttribute('aria-label', mobileBrowser
      ? 'Usar gratuitamente: escolher instalação no celular'
      : 'Usar gratuitamente: abrir GB+ na versão web');
  });

  const menu = document.getElementById('menu-toggle');
  const nav = document.getElementById('site-nav');
  if (!menu || !nav) return;
  const closeMenu = () => {
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', 'Abrir menu');
    nav.classList.remove('is-open');
  };
  menu.addEventListener('click', () => {
    const opening = menu.getAttribute('aria-expanded') !== 'true';
    if (!opening) { closeMenu(); return; }
    menu.setAttribute('aria-expanded', 'true');
    menu.setAttribute('aria-label', 'Fechar menu');
    nav.classList.add('is-open');
  });
  nav.addEventListener('click', event => {
    if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeMenu();
  });
  document.addEventListener('click', event => {
    if (!nav.contains(event.target) && !menu.contains(event.target)) closeMenu();
  });
})();
