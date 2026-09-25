/*! Galactic starfield | canvas, 2D context, rAF
    Boots after window.load so the rAF loop never competes with the
    critical rendering path. 140+ stars, 3 depth layers, slow drift +
    twinkle; free 3D parallax comes from the existing hero transforms.
    Sleeps when the hero leaves the viewport or the tab hides.
    No-ops under prefers-reduced-motion. */
(function(){
  'use strict';
  function init(){
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var canvas = document.getElementById('starfield');
    if (!canvas || canvas._sf) return;
    canvas._sf = true;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var W = 0, H = 0, stars = [], running = false, raf = 0;

    function resize(){
      W = canvas.width = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
      var count = Math.min(170, Math.floor(W * H / 11000));
      stars = [];
      for (var i = 0; i < count; i++){
        var depth = Math.random();
        stars.push({
          x: Math.random() * W,
          y: Math.random() * H,
          z: depth,
          r: 0.4 + depth * 1.3,
          a: 0.25 + Math.random() * 0.65,
          tw: Math.random() * Math.PI * 2,
          ts: 0.004 + Math.random() * 0.012,
          vy: 0.02 + depth * 0.07
        });
      }
    }

    function draw(){
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < stars.length; i++){
        var s = stars[i];
        s.y += s.vy;
        s.tw += s.ts;
        if (s.y > H + 2) { s.y = -2; s.x = Math.random() * W; }
        var tw = 0.65 + 0.35 * Math.sin(s.tw);
        ctx.globalAlpha = s.a * tw;
        ctx.fillStyle = s.z > 0.72 ? '#bfe9ff' : (s.z > 0.4 ? '#8fd6f2' : '#e8f6ff');
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, 6.2832);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    }

    function start(){
      if (!running){ running = true; raf = requestAnimationFrame(draw); }
    }
    function stop(){
      running = false;
      cancelAnimationFrame(raf);
      ctx.clearRect(0, 0, W, H);
    }

    resize();
    window.addEventListener('resize', function(){ resize(); if (!running) draw(); });

    if ('IntersectionObserver' in window){
      new IntersectionObserver(function(entries){
        entries[0].isIntersecting ? start() : stop();
      }).observe(canvas);
    } else {
      start();
    }
    document.addEventListener('visibilitychange', function(){
      document.hidden ? stop() : start();
    });
  }

  if (document.readyState === 'complete') init();
  else window.addEventListener('load', init, { once: true });
})();
