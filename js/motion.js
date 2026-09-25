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

  /* ---- 1. Hero scene: copy rises once; photo zooms out on scrub.
          Scale goes through --hero-scale so it composes with the
          site.js --hero-shift parallax inside a single transform. ---- */
  safe(function(){
    var hero = document.querySelector('.hero');
    if (!hero) return;
    var img = hero.querySelector('.hero-bg img');
    var copy = hero.querySelectorAll('.hero-kicker, .hero h1, .hero-sub, .hero-actions');
    if (img) {
      gsap.fromTo(img,
        { '--hero-scale': 1.07 },
        {
          '--hero-scale': 1,
          ease: 'none',
          scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6 }
        });
    }
    if (copy.length) {
      gsap.fromTo(copy,
        { y: 40, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.9, ease: 'power3.out',
          stagger: 0.08, clearProps: 'transform,opacity',
          scrollTrigger: { trigger: hero, start: 'top 75%' }
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

  var REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (REDUCE.addEventListener) REDUCE.addEventListener('change', function(e){
    if (e.matches) ScrollTrigger.getAll().forEach(function(t){ t.kill(); });
  });
})();
