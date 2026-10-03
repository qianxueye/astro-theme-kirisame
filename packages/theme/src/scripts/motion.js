/* Kirisame — finite, interruptible motion. No library or network dependency.
 * Content is never hidden by default. Reduced motion always takes precedence.
 */
export function createMotion() {
  'use strict';
  const root = document.documentElement;
  const system = matchMedia('(prefers-reduced-motion: reduce)');
  const active = new Set();
  const owners = new WeakMap();
  const markers = new WeakMap();
  let mode = 'auto';
  let observer = null;
  let themeTimer;
  const EASE = 'cubic-bezier(.22, 1, .36, 1)';
  const reduced = () => mode === 'off' || system.matches;

  function stop(element) {
    const animation = owners.get(element);
    if (animation) animation.cancel();
  }
  function play(element, frames, options = {}) {
    if (!element || reduced() || document.hidden || typeof element.animate !== 'function') return null;
    stop(element);
    const animation = element.animate(frames, {
      duration: 360, easing: EASE, fill: 'backwards', iterations: 1, ...options
    });
    active.add(animation);
    owners.set(element, animation);
    const clean = () => {
      active.delete(animation);
      if (owners.get(element) === animation) owners.delete(element);
    };
    animation.finished.then(clean, clean);
    return animation;
  }
  function stopAll() {
    observer?.disconnect();
    for (const animation of [...active]) animation.cancel();
    root.classList.remove('theme-shifting');
  }
  function setPreference(value = 'auto') {
    mode = value === 'off' ? 'off' : 'auto';
    root.dataset.motion = reduced() ? 'off' : 'on';
    if (reduced()) stopAll();
    window.dispatchEvent(new CustomEvent('kirisame:motion-change'));
  }
  system.addEventListener('change', () => setPreference(mode));
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopAll(); });
  window.addEventListener('beforeprint', stopAll);

  function reveal(element, delay = 0, distance = 14, duration = 480) {
    if (!element?.getClientRects().length) return null;
    return play(element, [
      { opacity: 0, transform: `translateY(${distance}px)` },
      { opacity: 1, transform: 'translateY(0px)' }
    ], { duration, delay });
  }
  function entrance(page, initial = false, sectionLinked = false) {
    observer?.disconnect();
    for (const animation of [...active]) {
      const target = animation.effect?.target;
      if (target?.closest?.('[data-page]')) animation.cancel();
    }
    if (!page || reduced() || sectionLinked) return;
    if (initial) reveal(document.querySelector('.header-inner'), 0, 5, 340);
    let targets;
    if (page.dataset.page === 'home') {
      targets = [...page.querySelectorAll('.hero > div:first-child > *, .hero-note, .featured, .latest > .section-heading, .filters, .home-aside > *')];
    } else if (page.dataset.page.startsWith('article/')) {
      targets = [...page.querySelectorAll('.article-header > *, .reading-grid')];
    } else {
      targets = [...page.querySelectorAll('.index-heading > *, .topic-card, .simple-page > .prose, .archive-layout > h2')];
      if (page.classList.contains('simple-page')) targets.push(...page.querySelectorAll(':scope > .prose'));
    }
    let index = 0;
    for (const element of new Set(targets)) {
      const rect = element.getBoundingClientRect();
      if (rect.height && rect.top < innerHeight + 30 && rect.bottom > 0) {
        reveal(element, Math.min(index++ * 45, 225), 14, 500);
      }
    }
    // Observe lists only. Paragraphs stay visible while the reader scrolls.
    const rows = [...page.querySelectorAll('.post-row')].filter(el => !el.hidden);
    let rowIndex = 0;
    const remaining = [];
    rows.forEach(element => {
      const rect = element.getBoundingClientRect();
      if (rect.top < innerHeight && rect.bottom > 0) reveal(element, 170 + Math.min(rowIndex++ * 45, 120), 12, 450);
      else remaining.push(element);
    });
    if ('IntersectionObserver' in window && remaining.length) {
      observer = new IntersectionObserver(entries => {
        let order = 0;
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          observer?.unobserve(entry.target);
          if (entry.target.hidden || page.hidden) return;
          reveal(entry.target, Math.min(order++ * 40, 100), 10, 400);
        });
      }, { rootMargin: '0px 0px 30px 0px', threshold: 0.01 });
      remaining.forEach(el => observer.observe(el));
    }
  }

  function placeMarker(container, target, type, animate = true) {
    if (!container || !target || !container.getClientRects().length) return;
    let state = markers.get(container);
    if (!state) {
      const node = document.createElement('span');
      node.className = `${type}-marker`;
      node.setAttribute('aria-hidden', 'true');
      container.append(node);
      container.classList.add('has-motion-marker');
      state = { node, box: null };
      markers.set(container, state);
    }
    const outer = container.getBoundingClientRect();
    const rect = target.getBoundingClientRect();
    const box = type === 'nav' ? {
      left: rect.left - outer.left + rect.width / 2 - 8,
      top: rect.bottom - outer.top - 10, width: 16, height: 3
    } : {
      left: rect.left - outer.left, top: rect.top - outer.top,
      width: rect.width, height: rect.height
    };
    const previous = state.box;
    Object.assign(state.node.style, {
      left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px`
    });
    if (previous && animate) {
      play(state.node, [
        { transform: `translate(${previous.left - box.left}px, ${previous.top - box.top}px) scale(${previous.width / box.width}, ${previous.height / box.height})` },
        { transform: 'translate(0px, 0px) scale(1, 1)' }
      ], { duration: 300 });
    }
    state.box = box;
  }
  function indicators(animate = true) {
    placeMarker(document.querySelector('.desktop-nav'), document.querySelector('.desktop-nav [aria-current="page"]'), 'nav', animate);
    placeMarker(document.querySelector('.filters'), document.querySelector('.filter.active'), 'filter', animate);
  }

  let filterGeneration = 0;
  function filterList(list, update) {
    const generation = ++filterGeneration;
    observer?.disconnect();
    stop(list);
    list.querySelectorAll('.post-row').forEach(stop);
    const before = list.getBoundingClientRect().height;
    update();
    const after = list.getBoundingClientRect().height;
    indicators();
    if (reduced()) return;
    const animation = play(list, [{ height: `${before}px` }, { height: `${after}px` }], { duration: 300 });
    if (animation) {
      list.classList.add('list-resizing');
      const clean = () => { if (generation === filterGeneration) list.classList.remove('list-resizing'); };
      animation.finished.then(clean, clean);
    }
    [...list.querySelectorAll('.post-row:not([hidden])')].forEach((row, index) => {
      reveal(row, Math.min(index * 40, 120), 10, 350);
    });
  }
  function themeChange(update) {
    clearTimeout(themeTimer);
    if (!reduced()) root.classList.add('theme-shifting');
    update();
    const icon = document.querySelector(root.dataset.theme === 'dark' ? '.theme-toggle .moon-icon' : '.theme-toggle .sun-icon');
    play(icon, [{ transform: 'rotate(-65deg) scale(.7)', opacity: .2 }, { transform: 'rotate(0deg) scale(1)', opacity: 1 }], { duration: 400 });
    themeTimer = setTimeout(() => root.classList.remove('theme-shifting'), 360);
  }
  setPreference();
  return { play, stop, stopAll, reveal, entrance, indicators, filterList, themeChange, setPreference, reduced, system };
}
