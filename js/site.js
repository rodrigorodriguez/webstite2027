(function() {
  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }

  function toggleTheme() {
    var current = document.documentElement.getAttribute('data-theme') || 'dark';
    setTheme(current === 'dark' ? 'light' : 'dark');
  }

  var saved = localStorage.getItem('theme');
  document.documentElement.setAttribute('data-theme', saved === 'light' ? 'light' : 'dark');

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
  });
  document.addEventListener('htmx:afterSwap',function(){
    closeMenus();
  });
})();

/* Lightbox (press/media lightbox: zoom + captions, like store viewers) */
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

  function zoomLevels(){ return [1, 1.35, 1.8, 2.6]; }
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
