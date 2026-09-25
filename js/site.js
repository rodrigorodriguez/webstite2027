(function() {
  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('theme', theme); } catch (e) {}
  }

  function toggleTheme() {
    var current = document.documentElement.getAttribute('data-theme') || 'dark';
    setTheme(current === 'dark' ? 'light' : 'dark');
  }

  try {
    var saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') {
      document.documentElement.setAttribute('data-theme', saved);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }

  function bindCommon() {
    document.getElementById('theme-btn')?.addEventListener('click', toggleTheme);
    document.getElementById('mobile-theme-btn')?.addEventListener('click', toggleTheme);
    var t = document.getElementById('mobile-toggle');
    var o = document.getElementById('mobile-overlay');
    var c = document.getElementById('mobile-overlay-close');
    if (t && o && !t._bound) {
      t._bound = true;
      t.addEventListener('click', function() { o.classList.toggle('open'); });
    }
    if (c && o && !c._bound) {
      c._bound = true;
      c.addEventListener('click', function() { o.classList.remove('open'); });
    }
    if (o && !o._bound) {
      o._bound = true;
      o.addEventListener('click', function(e) {
        if (e.target.closest('#mobile-overlay a')) o.classList.remove('open');
      });
    }
    var ls = document.getElementById('lang-select');
    if (ls && !ls._listening) {
      ls._listening = true;
      ls.addEventListener('change', function() {
        if (window.__switchLang) window.__switchLang(this.value);
      });
    }
    if (window.__apply) window.__apply();
    if (window.__currentLang) {
      var l = window.__currentLang();
      var sel = document.getElementById('lang-select');
      if (sel) sel.value = l;
    }
  }

  bindCommon();
  document.addEventListener('htmx:afterSwap', bindCommon);
})();

/* Active nav: highlight the current section link (aria-current) */
(function(){
  function markActive(){
    var path = location.pathname.replace(/^\/(pt|es|fr|de|ja|zh-cn)\//, '/');
    var links = document.querySelectorAll('.nav-desktop > a, .mobile-overlay-inner > a');
    links.forEach(function(a){
      var h = a.getAttribute('href') || '';
      if (!h.startsWith('/')) { a.removeAttribute('aria-current'); return; }
      var target = (h === '/' ? '/' : h.replace(/\/$/, ''));
      var here = (path === '/' || path === '/index.html') ? '/' : path.replace(/\.html$/, '').replace(/\/$/, '');
      var match = (here === target) || (target !== '/' && here.startsWith(target + '/'));
      if (match) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }
  markActive();
  document.addEventListener('htmx:afterSwap', markActive);
  window.addEventListener('pageshow', markActive);
})();

/* Scroll progress rail + hero parallax: rAF batched, no layout thrash */
(function(){
  var bar = null, ticking = false, heroImg = null, toTop = null;
  function ensureBar(){
    if (bar && document.contains(bar)) return;
    bar = document.querySelector('.scroll-rail i');
    heroImg = document.querySelector('.hero-bg img');
  }
  function update(){
    ticking = false;
    ensureBar();
    if (bar) {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var p = max > 0 ? Math.min(1, Math.max(0, (window.scrollY || doc.scrollTop) / max)) : 0;
      bar.style.width = (p * 100).toFixed(2) + '%';
      if (!toTop) toTop = document.querySelector('.to-top');
      if (toTop) toTop.classList.toggle('show', window.scrollY > 700);
    }
    if (heroImg) {
      var rect = heroImg.getBoundingClientRect();
      var shift = rect.bottom > 0 ? Math.min(80, Math.max(0, -rect.top * 0.12)) : 0;
      heroImg.style.setProperty('--hero-shift', shift.toFixed(1) + 'px');
    }
  }
  function onScroll(){
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  document.addEventListener('htmx:afterSwap', onScroll);
  update();
  document.addEventListener('click', function(e){
    var t = e.target.closest('.to-top');
    if (t) window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

/* Discography filters: mono chip row, hide/show timeline items */
(function(){
  function initFilters(){
    var row = document.querySelector('.filter-row');
    if (!row || row._fBound) return;
    row._fBound = true;
    var chips = Array.prototype.slice.call(row.querySelectorAll('.filter-chip'));
    var items = Array.prototype.slice.call(document.querySelectorAll('.timeline .t-item'));
    if (!chips.length || !items.length) return;
    chips.forEach(function(chip){
      chip.addEventListener('click', function(){
        var cat = chip.getAttribute('data-filter');
        chips.forEach(function(c){ c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
        items.forEach(function(it){
          var cats = (it.getAttribute('data-cat') || '').split(/\s+/);
          var show = cat === 'all' || cats.indexOf(cat) !== -1;
          it.classList.toggle('hide', !show);
        });
      });
    });
  }
  initFilters();
  document.addEventListener('htmx:afterSwap', initFilters);
})();

/* Scroll reveal: IntersectionObserver only, no scroll listeners.
   Elements opt in with class="reveal"; optional --reveal-delay for stagger. */
(function() {
  function revealIn(root) {
    var els = (root || document).querySelectorAll('.reveal:not(.in-view)');
    if (!els.length) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      els.forEach(function(el) { el.classList.add('in-view'); });
      return;
    }
    var io = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          el.classList.add('in-view');
          io.unobserve(el);
          window.setTimeout(function() { el.classList.remove('reveal'); }, 950);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function(el) { io.observe(el); });
  }

  window.__reveal = revealIn;
  revealIn(document);
  document.addEventListener('htmx:afterSwap', function() { revealIn(document); });
})();

/* Lyrics console: track index + stage, keyboard nav, progress rail.
   Pure client-side navigation between server-rendered lyrics. */
(function(){
  function initConsole(root){
    if (root._lyrBound) return;
    root._lyrBound = true;
    var items = Array.prototype.slice.call(root.querySelectorAll('.lyr-idx-item'));
    var stage = root.querySelector('.lyr-stage');
    if (!items.length || !stage) return;
    var bar = root.querySelector('.lyr-progress i');
    var pos = root.querySelector('.lyr-pos');

    function select(i, scroll){
      i = (i + items.length) % items.length;
      var it = items[i];
      var html = it.getAttribute('data-lyrics');
      if (html == null) return;
      stage.innerHTML = '<h3 class="lyr-track-title"></h3><div class="lyr-text"></div>';
      stage.querySelector('.lyr-track-title').textContent = it.getAttribute('data-title') || '';
      var body = stage.querySelector('.lyr-text');
      body.textContent = html;
      items.forEach(function(x, j){
        if (j === i) x.setAttribute('aria-current', 'true');
        else x.removeAttribute('aria-current');
      });
      if (pos) {
        var eq = pos.querySelector('.lyr-eq');
        pos.textContent = (i + 1) + ' / ' + items.length;
        if (eq) pos.insertBefore(eq, pos.firstChild);
      }
      if (bar) bar.style.width = (((i + 1) / items.length) * 100) + '%';
      stage.scrollTop = 0;
      if (scroll) {
        var wrap = root.querySelector('.lyr-console');
        if (wrap && wrap.getBoundingClientRect().top < 0) {
          wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }

    items.forEach(function(it, i){
      it.addEventListener('click', function(){ select(i, false); });
    });
    var prev = root.querySelector('[data-lyr="prev"]');
    var next = root.querySelector('[data-lyr="next"]');
    if (prev) prev.addEventListener('click', function(){ select(current() - 1, true); });
    if (next) next.addEventListener('click', function(){ select(current() + 1, true); });
    function current(){
      var i = items.findIndex(function(x){ return x.getAttribute('aria-current') === 'true'; });
      return i < 0 ? 0 : i;
    }
    var copyBtn = root.querySelector('[data-lyr="copy"]');
    if (copyBtn) copyBtn.addEventListener('click', function(){
      var it = items[current()];
      var txt = (it.getAttribute('data-title') || '') + '\n\n' + (it.getAttribute('data-lyrics') || '');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt).then(function(){
          copyBtn.classList.add('lyr-copy-ok');
          window.setTimeout(function(){ copyBtn.classList.remove('lyr-copy-ok'); }, 1600);
        });
      }
    });
    document.addEventListener('keydown', function(e){
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      var r = root.getBoundingClientRect();
      if (r.top > window.innerHeight * 0.8 || r.bottom < window.innerHeight * 0.2) return;
      e.preventDefault();
      select(e.key === 'ArrowDown' ? current() + 1 : current() - 1, true);
    });
    select(0, false);
  }
  function initAll(){
    document.querySelectorAll('.lyr-console').forEach(initConsole);
  }
  initAll();
  document.addEventListener('htmx:afterSwap', initAll);
})();

/* Lazy media embeds: swap data-src when the frame scrolls into view */
(function(){
  function initLazy(){
    var frames=document.querySelectorAll('iframe[data-src]:not([src])');
    if(!frames.length) return;
    if(!('IntersectionObserver' in window)){
      frames.forEach(function(f){ f.src=f.getAttribute('data-src'); });
      return;
    }
    var io=new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(en.isIntersecting){
          en.target.src=en.target.getAttribute('data-src');
          io.unobserve(en.target);
        }
      });
    },{rootMargin:'200px'});
    frames.forEach(function(f){ io.observe(f); });
  }
  initLazy();
  document.addEventListener('htmx:afterSwap', initLazy);
})();

/* i18n multi-language */
(function(){
  var SUPPORTED={en:1,pt:1,es:1,fr:1,de:1,ja:1,'zh-cn':1},DEF='en',lang=DEF,_t=null;
  function detect(){
    var m=location.pathname.match(/^\/(pt|es|fr|de|ja|zh-cn)(\/|$)/);
    if(m) return m[1];
    try{var c=document.cookie.match(/gb_lang=([^;]+)/);if(c&&c[1] in SUPPORTED) return c[1];}catch(e){}
    var n=(navigator.language||'').toLowerCase();
    if(n.startsWith('pt')) return 'pt'; if(n.startsWith('es')) return 'es';
    if(n.startsWith('fr')) return 'fr'; if(n.startsWith('de')) return 'de';
    if(n.startsWith('ja')) return 'ja'; if(n.startsWith('zh')) return 'zh-cn';
    return DEF;
  }
  function load(l,cb){
    var x=new XMLHttpRequest();
    x.open('GET','/lang/'+l+'.json?v='+Date.now(),true);
    x.onload=function(){if(x.status==200) try{cb(JSON.parse(x.responseText))}catch(e){cb(null)}else cb(null)};
    x.onerror=function(){cb(null)}; x.send();
  }
  function apply(t){
    if(!t) return;
    document.querySelectorAll('[data-i18n]').forEach(function(el){
      var k=el.getAttribute('data-i18n'),v=t[k]; if(!v) return;
      if(el.tagName=='INPUT'||el.tagName=='TEXTAREA') el.setAttribute('placeholder',v);
      else if(el.tagName=='IMG') el.setAttribute('alt',v);
      else if(el.tagName=='META') el.setAttribute('content',v);
      else {
        v=v.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&nbsp;/g,'\u00A0');
        if(el.children.length){
          var tag=el.tagName; if(tag=='TD'||tag=='TH'||el.querySelector('div,h1,h2,h3,h4,h5,p,ul,ol,table,section')) return;
          var tn=document.createTreeWalker(el,NodeFilter.SHOW_TEXT,{acceptNode:function(n){return n.parentNode===el?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;}},false);
          var f=tn.firstChild(); if(f){f.nodeValue=v; var n; while(n=tn.nextNode()) n.nodeValue='';}
        } else el.textContent=v;
      }
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(function(el){
      var v=t[el.getAttribute('data-i18n-aria')];
      if(v) el.setAttribute('aria-label',v);
    });
    document.documentElement.classList.remove('i18n-loading');
    document.documentElement.lang = lang;
  }
  function setSelect(){
    var ls=document.getElementById('lang-select');
    if(ls) ls.value=lang;
  }
  function langPrefix(href){
    if(lang===DEF||!href||!href.startsWith('/')||href==='/') return href;
    if(href.startsWith('/'+lang+'/')) return href;
    return '/'+lang+href;
  }
  document.addEventListener('click',function(e){
    if(lang===DEF) return;
    var a=e.target.closest('a');
    if(!a||a.classList.contains('no-lang')) return;
    var h=a.getAttribute('href');
    if(h&&h.startsWith('/')&&h!=='/') {
      var prefixed=langPrefix(h);
      if(prefixed!==h){e.preventDefault();location.href=prefixed;}
    }
  });
  lang=detect();
  load(lang,function(t){if(t){_t=t; apply(t); setSelect();}});
  window.__SEARCH_LABELS = {
    en: {title:"Search", hint:"Type to search", none:"No results", nav:"navigate", open:"open",
         cat:{page:"page", album:"album", artist:"artist", book:"book"}},
    pt: {title:"Buscar", hint:"Digite para buscar", none:"Nenhum resultado", nav:"navegar", open:"abrir",
         cat:{page:"página", album:"álbum", artist:"artista", book:"livro"}},
    es: {title:"Buscar", hint:"Escribe para buscar", none:"Sin resultados", nav:"navegar", open:"abrir",
         cat:{page:"página", album:"álbum", artist:"artista", book:"libro"}},
    fr: {title:"Rechercher", hint:"Tapez pour rechercher", none:"Aucun résultat", nav:"naviguer", open:"ouvrir",
         cat:{page:"page", album:"album", artist:"artiste", book:"livre"}},
    de: {title:"Suchen", hint:"Tippen zum Suchen", none:"Keine Ergebnisse", nav:"navigieren", open:"öffnen",
         cat:{page:"Seite", album:"Album", artist:"Künstler", book:"Buch"}},
    ja: {title:"検索", hint:"入力して検索", none:"結果なし", nav:"移動", open:"開く",
         cat:{page:"ページ", album:"アルバム", artist:"アーティスト", book:"書籍"}},
    "zh-cn": {title:"搜索", hint:"输入以搜索", none:"无结果", nav:"导航", open:"打开",
         cat:{page:"页面", album:"专辑", artist:"艺术家", book:"书册"}}
  };
  window.__searchLabels = window.__SEARCH_LABELS[lang] || window.__SEARCH_LABELS.en;
  window.__switchLang=function(l){
    var p=location.pathname.replace(/^\/(pt|es|fr|de|ja|zh-cn)(\/|$)/,'/');
    location.href=(l===DEF?'':'/'+l)+p;
  };
  window.__apply=function(){
    if(_t) apply(_t);
    setSelect();
  };
  window.__currentLang=function(){return lang;};
})();

(function(){
  function closeMenus(except){
    document.querySelectorAll('.dropdown.open').forEach(function(d){
      if(d!==except) d.classList.remove('open');
    });
  }
  document.addEventListener('click',function(e){
    var dd=e.target.closest('.dropdown');
    if(!dd){
      closeMenus();
      return;
    }
    var trig=e.target.closest('.dropdown-trigger');
    if(trig){
      var p=trig.parentElement;
      var willOpen=!p.classList.contains('open');
      closeMenus(p);
      if(willOpen) p.classList.add('open');
      return;
    }
    closeMenus();
  });
  document.addEventListener('mouseover',function(e){
    var dd=e.target.closest('.dropdown');
    closeMenus(dd);
    if(dd) dd.classList.add('open');
  });
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape') closeMenus();
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){
      var open=document.querySelector('.dropdown.open');
      if(!open) return;
      e.preventDefault();
      var links=Array.prototype.slice.call(open.querySelectorAll('.dropdown-menu a'));
      if(!links.length) return;
      var i=links.indexOf(document.activeElement);
      i=e.key==='ArrowDown'?(i+1+links.length)%links.length:(i-1+links.length)%links.length;
      links[i].focus();
    }
  });
  document.addEventListener('htmx:afterSwap',function(){
    closeMenus();
  });
})();

/* Lightbox (press/media/press clipping viewer: zoom + pan + captions + PDF link) */
(function(){
  if (document.getElementById('__lb')) return;
  var root=document.createElement('div');
  root.id='__lb'; root.className='lb'; root.setAttribute('aria-hidden','true');
  root.innerHTML='<div class="lb-backdrop"></div>'+
    '<div class="lb-panel">'+
      '<button class="lb-close-btn lb-zoom-btn" type="button" aria-label="Close" data-lb="close">&#10005;</button>'+
      '<button class="lb-nav lb-prev" type="button" aria-label="Previous" data-lb="prev">&#10094;</button>'+
      '<button class="lb-nav lb-next" type="button" aria-label="Next" data-lb="next">&#10095;</button>'+
      '<div class="lb-stage"><img id="__lb-img" alt="" draggable="false"/></div>'+
      '<div class="lb-bar">'+
        '<button class="lb-zoom-btn" type="button" aria-label="Zoom out" data-zoom="-1">&#8722;</button>'+
        '<button class="lb-zoom-btn" type="button" aria-label="Fit" data-zoom="0">&#9670;</button>'+
        '<button class="lb-zoom-btn" type="button" aria-label="Zoom in" data-zoom="1">&#43;</button>'+
        '<span class="lb-caption" id="__lb-cap"></span>'+
        '<a class="lb-pdf" id="__lb-pdf" target="_blank" rel="noopener" href="#">PDF</a>'+
      '</div>'+
    '</div>';
  document.body.appendChild(root);
  var panel=root.querySelector('.lb-panel');
  var stage=root.querySelector('.lb-stage');
  var img=document.getElementById('__lb-img');
  var cap=document.getElementById('__lb-cap');
  var pdfA=document.getElementById('__lb-pdf');
  var items=[], idx=-1, zoom=1, isDown=false, startX=0, startY=0, sx=stage.scrollLeft, sy=stage.scrollTop;

  function applyZoom(){
    zoom=Math.min(3.5, Math.max(1, zoom));
    img.style.transform='scale('+zoom+')';
    if(zoom===1){ stage.scrollLeft=0; stage.scrollTop=0; } else { stage.scrollLeft=(stage.scrollWidth-stage.clientWidth)/2; stage.scrollTop=(stage.scrollHeight-stage.clientHeight)/2; }
  }
  function open(i){
    idx=i; var it=items[i]; if(!it) return;
    zoom=1; img.style.transform='';
    img.src=it.src;
    img.alt=it.cap||'';
    cap.textContent=it.cap||'';
    if(it.pdf){ pdfA.href=it.pdf; pdfA.style.display='inline-block'; } else { pdfA.style.display='none'; }
    panel.querySelector('.lb-prev').hidden=(items.length<2);
    panel.querySelector('.lb-next').hidden=(items.length<2);
    stage.scrollLeft=0; stage.scrollTop=0;
    root.classList.add('open'); root.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
  }
  function close(){ root.classList.remove('open'); root.setAttribute('aria-hidden','true'); document.body.style.overflow=''; }
  function step(d){ idx=(idx+d+items.length)%items.length; zoom=1; img.style.transform=''; open(idx); }
  function collect(entry){
    var scope=entry.closest('[data-lightbox-scope]')||document;
    return Array.prototype.slice.call(scope.querySelectorAll('[data-lightbox]'));
  }

  document.addEventListener('click', function(e){
    var el=e.target.closest('[data-lightbox]');
    if(el){
      e.preventDefault();
      items=collect(el).map(function(x){
        return {src:x.getAttribute('data-lightbox')||x.getAttribute('href'), cap:x.getAttribute('data-caption')||x.getAttribute('alt')||'', pdf:x.getAttribute('data-pdf')};
      });
      idx=collect(el).indexOf(el);
      applyZoom(); open(idx);
      return;
    }
    var c=e.target.closest('[data-close],.lb-backdrop');
    if(c){ close(); return; }
    var nav=e.target.closest('[data-lb="prev"],.lb-prev'); if(nav){ step(-1); return; }
    nav=e.target.closest('[data-lb="next"],.lb-next'); if(nav){ step(1); return; }
    var zb=e.target.closest('[data-zoom]');
    if(zb){
      var d=parseInt(zb.getAttribute('data-zoom'),10);
      zoom= d===0 ? 1 : zoom*(d>0?1.3:0.77);
      applyZoom(); return;
    }
  });

  root.addEventListener('dblclick', function(e){
    if(e.target.closest('.lb-panel') && !e.target.closest('button,a')){ zoom=zoom>1?1:1.8; applyZoom(); }
  });

  document.addEventListener('keydown', function(e){
    if(!root.classList.contains('open')) return;
    if(e.key==='Escape') close();
    else if(e.key==='ArrowLeft') step(-1);
    else if(e.key==='ArrowRight') step(1);
  });

  stage.addEventListener('wheel', function(e){ e.preventDefault(); zoom*=(e.deltaY<0?1.12:0.9); applyZoom(); }, {passive:false});

  stage.addEventListener('pointerdown', function(e){
    if(zoom<=1) return;
    isDown=true; stage.classList.add('dragging');
    sx=stage.scrollLeft; sy=stage.scrollTop; startX=e.clientX; startY=e.clientY;
    try{ stage.setPointerCapture(e.pointerId); }catch(err){}
  });
  stage.addEventListener('pointermove', function(e){
    if(!isDown) return;
    stage.scrollLeft=sx-(e.clientX-startX); stage.scrollTop=sy-(e.clientY-startY);
  });
  stage.addEventListener('pointerup', function(){ isDown=false; stage.classList.remove('dragging'); });
  stage.addEventListener('pointercancel', function(){ isDown=false; stage.classList.remove('dragging'); });
})();
