/*! Motion layer | Rodrigo Rodriguez site | GSAP + ScrollTrigger
    Division of labor: CSS owns entrances (off main thread) and the
    marquee; site.js owns the scroll rail and --hero-shift parallax;
    GSAP owns scroll-scrubbed scenes and orchestrated staggers only.
    Everything no-ops under prefers-reduced-motion or if gsap is missing. */
(function(){
  'use strict';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.dataset.motion = '1';

  function safe(fn){
    try { fn(); } catch (err) { /* motion must never break content */ }
  }

  /* ---- 1. Hero scene: photo zooms out on scrub (CSS owns the copy
          entrance via hero-in keyframes; GSAP must not double it). ---- */
  safe(function(){
    var hero = document.querySelector('.hero');
    if (!hero) return;
    var img = hero.querySelector('.hero-bg img');
    if (img) {
      gsap.fromTo(img,
        { '--hero-scale': 1.07 },
        {
          '--hero-scale': 1,
          ease: 'none',        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6 }
      });
    }
  });

  /* ---- 2. Album pages: cover enters with cinematic scale, meta trails ---- */
  safe(function(){
    var cover = document.querySelector('.album-hero .album-cover');
    if (!cover) return;
    var meta = document.querySelectorAll('.album-hero .album-meta > *');
    gsap.fromTo(cover,
      { scale: 0.94, opacity: 0, rotateX: 7 },
      {
        scale: 1, opacity: 1, rotateX: 0, duration: 1.0, ease: 'power3.out',
        clearProps: 'transform,opacity',
        scrollTrigger: { trigger: '.album-hero', start: 'top 78%' }
      });
    if (meta.length) {
      gsap.fromTo(meta,
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.65, ease: 'power3.out', stagger: 0.06, delay: 0.14,
          clearProps: 'transform,opacity',
          scrollTrigger: { trigger: '.album-hero', start: 'top 78%' } });
    }
    /* inner image drifts on scrub: separate element, composes with the
       cover entrance instead of fighting it for the same transform */
    var cimg = cover.querySelector('img');
    if (cimg) {
      gsap.fromTo(cimg,
        { yPercent: 0, scale: 1.12 },
        {
          yPercent: -7, scale: 1.12, ease: 'none',
          scrollTrigger: { trigger: '.album-hero', start: 'top top', end: 'bottom top', scrub: 0.6 }
        });
    }
  });

  /* ---- 3. Grids: staggered rise (artists/discography cards, timeline) ---- */
  safe(function(){
    ['.grid-3 .card', '.timeline .t-item'].forEach(function(sel){
      var els = document.querySelectorAll(sel);
      if (!els.length) return;
      gsap.fromTo(els,
        { y: 26, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.6, ease: 'power3.out',
          stagger: { amount: 0.45, from: 'start' },
          clearProps: 'transform,opacity',
          scrollTrigger: { trigger: els[0].closest('section, main, body') || els[0].parentNode, start: 'top 82%' }
        });
    });
  });

  /* ---- 4. Lyrics console: equalizer dances when lyrics change, then rests ---- */
  safe(function(){
    var eq = document.querySelector('.lyr-eq');
    var stage = document.querySelector('.lyr-stage');
    if (!eq || !stage) return;
    var bars = eq.querySelectorAll('i');
    if (!bars.length) return;
    var tw = null, rest = null;
    function dance(){
      if (tw) return;
      tw = gsap.to(bars, {
        scaleY: function(){ return gsap.utils.random(0.35, 1); },
        duration: 0.21, ease: 'power1.inOut',
        repeat: -1, yoyo: true,
        stagger: { each: 0.045, from: 'center' },
        transformOrigin: '50% 100%'
      });
    }
    function rest2(){
      if (rest) clearTimeout(rest);
      rest = setTimeout(function(){
        if (tw) { tw.kill(); tw = null; }
        gsap.to(bars, { scaleY: 1, duration: 0.3, ease: 'power2.out' });
      }, 2400);
    }
    new MutationObserver(function(){ dance(); rest2(); })
      .observe(stage, { subtree: true, childList: true, characterData: true });
    /* gentle idle float on the console itself */
    gsap.to('.lyr-console', { y: -5, duration: 2.8, yoyo: true, repeat: -1, ease: 'sine.inOut' });
  });

  /* ---- 5. Pointer-fine delight: 3D tilt + magnetic buttons.
          Gated to hover:hover + pointer:fine (no touch false-hovers). */
  safe(function(){
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    function makeTilt(el, max, lift){
      if (el._tilt) return;
      el._tilt = true;
      el.classList.add('tilt');
      gsap.set(el, { transformPerspective: 900 });
      var rx = gsap.quickTo(el, 'rotationX', { duration: 0.4, ease: 'power3.out', overwrite: 'auto' });
      var ry = gsap.quickTo(el, 'rotationY', { duration: 0.4, ease: 'power3.out', overwrite: 'auto' });
      var yy = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3.out', overwrite: 'auto' });
      el.addEventListener('mousemove', function(e){
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        el.classList.add('is-tilting');
        ry(px * max * 2);
        rx(-py * max * 2);
        yy(lift ? -6 : 0);
      });
      el.addEventListener('mouseleave', function(){
        el.classList.remove('is-tilting');
        rx(0); ry(0); yy(0);
      });
    }

    function makeMagnetic(el){
      if (el._mag) return;
      el._mag = true;
      var qx = gsap.quickTo(el, 'x', { duration: 0.35, ease: 'power3.out', overwrite: 'auto' });
      var qy = gsap.quickTo(el, 'y', { duration: 0.35, ease: 'power3.out', overwrite: 'auto' });
      el.addEventListener('mousemove', function(e){
        var r = el.getBoundingClientRect();
        qx((e.clientX - (r.left + r.width / 2)) * 0.22);
        qy((e.clientY - (r.top + r.height / 2)) * 0.3);
      });
      el.addEventListener('mouseleave', function(){ qx(0); qy(0); });
    }

    function initDelight(){
      var cover = document.querySelector('.album-hero .album-cover');
      if (cover) makeTilt(cover, 9, false);
      document.querySelectorAll('.artist-photo').forEach(function(el){ makeTilt(el, 7, false); });
      document.querySelectorAll('.grid-3 .card, .book-card').forEach(function(el){ makeTilt(el, 5, true); });
      document.querySelectorAll('.hero-actions .btn, .album-actions .btn').forEach(makeMagnetic);
    }

    initDelight();
    document.addEventListener('htmx:afterSwap', initDelight);
  });

  /* ---- 6. Listen panels: click-to-play opens Spotify search in a new
          tab (no autoplay hijack) and the local equalizer dances. ---- */
  safe(function(){
    document.addEventListener('click', function(e){
      var btn = e.target.closest('.listen-btn');
      if (!btn) return;
      var url = btn.getAttribute('data-listen');
      if (url) window.open(url, '_blank', 'noopener');
      btn.classList.add('playing');
      document.querySelectorAll('.listen-btn.playing').forEach(function(b){
        if (b !== btn) { b.classList.remove('playing'); }
      });
      clearTimeout(btn._eqT);
      btn._eqT = setTimeout(function(){ btn.classList.remove('playing'); }, 32000);
    });
  });

  /* ---- 7. Keyboard shortcuts: "/" opens the search palette;
          the Konami-style code (arrow keys) unlocks cosmic mode. ---- */
  safe(function(){
    var SEQ = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
    var pos = 0;
    document.addEventListener('keydown', function(e){
      var tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) return;
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey){
        e.preventDefault();
        if (typeof window.__searchOpen === 'function') window.__searchOpen();
        return;
      }
      if (e.key === SEQ[pos]){
        pos++;
        if (pos === SEQ.length){
          pos = 0;
          document.documentElement.setAttribute('data-cosmic', '1');
          if (typeof window.__toast === 'function') window.__toast('COSMIC MODE ON: esse site e de uma pessoa boa');
        }
      } else {
        pos = e.key === SEQ[0] ? 1 : 0;
      }
    });
  });

  var REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (REDUCE.addEventListener) REDUCE.addEventListener('change', function(e){
    if (e.matches) ScrollTrigger.getAll().forEach(function(t){ t.kill(); });
  });
})();
