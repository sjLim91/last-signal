/* LAST SIGNAL V4 / G2 — isolated prologue media progressive enhancement.
 * Existing V3 branching, saves and inline legacy assets are intentionally unchanged.
 * An approved new scene is shown only when its own dedicated file successfully loads.
 */
(() => {
  'use strict';
  const CONTRACT = Object.freeze({
    p0: {title:'전국 긴급 속보', file:'assets/scenes/p0.webp', cast:[]},
    p1: {title:'침묵한 도시', file:'assets/scenes/p1.webp', cast:[]},
    p2: {title:'뒤틀린 계단', file:'assets/scenes/p2.webp', cast:['seoa']},
    p3: {title:'윤서아', file:'assets/scenes/p3.webp', cast:['seoa']}
  });
  const checks = new Map();
  const ready = new Set();
  let observedRoot = null, observer = null;
  let manualScrollEpoch = 0;

  const isStoryControl = e => !!(e.target && e.target.closest && e.target.closest('#storyScroll'));
  const rememberManual = e => { if (isStoryControl(e)) manualScrollEpoch = performance.now(); };
  document.addEventListener('wheel', rememberManual, {passive:true,capture:true});
  document.addEventListener('touchmove', rememberManual, {passive:true,capture:true});
  document.addEventListener('pointerdown', rememberManual, {passive:true,capture:true});
  document.addEventListener('keydown', e => {
    if(isStoryControl(e) && ['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(e.key))
      manualScrollEpoch = performance.now();
  }, true);

  function loadOnce(id) {
    if (checks.has(id)) return checks.get(id);
    const entry = CONTRACT[id];
    if (!entry) return Promise.resolve(false);
    const result = new Promise(resolve => {
      const image = new Image();
      image.onload = () => { ready.add(id); resolve(true); };
      image.onerror = () => resolve(false);
      image.decoding = 'async';
      image.src = new URL(entry.file, document.baseURI).href;
    });
    checks.set(id,result);
    return result;
  }

  function sceneId(article) {
    const heading = article.querySelector('.sceneheading');
    if (!heading) return null;
    const title = heading.textContent.split('·')[0].trim();
    return Object.keys(CONTRACT).find(id => CONTRACT[id].title === title) || null;
  }

  function activate(article,id) {
    const item = CONTRACT[id];
    if (!article.isConnected || article.dataset.g2Scene === id) return;
    const shot = article.querySelector('img.sceneimage');
    if (!shot) return;

    const frame = shot.closest('.charframe');
    const previousSrc = shot.getAttribute('src');
    const previousAlt = shot.alt;
    const nextSrc = new URL(item.file, document.baseURI).href;
    let settled = false;
    const clean = () => {
      shot.removeEventListener('load', onDisplayLoad);
      shot.removeEventListener('error', onDisplayError);
    };
    function onDisplayLoad() {
      if (settled) return;
      settled = true;
      clean();
      if (!article.isConnected) return;
      // Do not hide the legacy portrait until the displayed still has actually loaded.
      article.dataset.g2Scene = id;
      article.classList.add('g2-shot', 'g2-ready');
      if (frame) frame.classList.add('g2-ready');
    }
    function onDisplayError() {
      if (settled) return;
      settled = true;
      clean();
      article.dataset.g2Missing = id;
      article.classList.remove('g2-ready');
      if (frame) frame.classList.remove('g2-ready');
      shot.alt = previousAlt;
      if (previousSrc) shot.src = previousSrc;
    }

    shot.addEventListener('load', onDisplayLoad, {once:true});
    shot.addEventListener('error', onDisplayError, {once:true});
    shot.alt = item.title + ' · 고유 실사 장면';
    shot.setAttribute('fetchpriority', id === 'p0' ? 'high' : 'auto');
    shot.setAttribute('decoding', 'async');
    shot.loading = id === 'p0' ? 'eager' : 'lazy';
    shot.src = nextSrc;
    // Some browsers report a cached image as already complete.
    if (shot.complete && shot.naturalWidth > 0) queueMicrotask(onDisplayLoad);
  }

  function enhance(){
    const root = document.getElementById('app');
    if(!root) return;
    if (root !== observedRoot) {
      observedRoot = root;
      observer?.disconnect();
      observer = new MutationObserver(() => queueMicrotask(enhance));
      observer.observe(root, {childList:true,subtree:true});
    }
    const articles = [...root.querySelectorAll('.story-article')];
    const scenes = articles.map(article => [article,sceneId(article)]).filter(x=>x[1]);
    for(const [article,id] of scenes) {
      if(article.dataset.g2Scene === id || article.dataset.g2Attempt === id) continue;
      article.dataset.g2Attempt = id;
      loadOnce(id).then(ok => {
        if(ok) activate(article,id);
        else article.dataset.g2Missing = id;
      });
    }
    // Only prefetch the scene following the current prologue scene.
    const current = scenes.at(-1)?.[1];
    if (current && current !== 'p3') {
      const next = {p0:'p1',p1:'p2',p2:'p3'}[current];
      if(next) loadOnce(next);
    }
  }

  function init() {
    enhance();
    // Make the script testable without taking over the V3 story engine.
    window.LAST_SIGNAL_G2 = Object.freeze({
      version:'G2.1', ids:Object.keys(CONTRACT),
      ready:() => [...ready], assets:() => Object.values(CONTRACT).map(v=>v.file),
      lastManualScroll:()=>manualScrollEpoch,
      refresh:enhance
    });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
