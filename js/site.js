(function() {
  function setTheme(theme) {
    if (theme === 'light') {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
    }
  }

  function toggleTheme() {
    var current = document.documentElement.getAttribute('data-theme') || 'light';
    setTheme(current === 'light' ? 'dark' : 'light');
  }

  var saved = localStorage.getItem('theme');
  if (saved === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else if (!saved && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
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
    var trig=e.target.closest('.dropdown-trigger');
    if(trig){
      var p=trig.parentElement;
      var willOpen=!p.classList.contains('open');
      closeMenus(p);
      if(willOpen) p.classList.add('open');
      e.preventDefault();
      return;
    }
    if(dd){
      closeMenus();
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
