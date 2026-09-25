/* Site search palette: Ctrl+K / Cmd+K, arrow keys, Enter to go. */
(function () {
  var INDEX = [
    { t: "Home", k: "home start", u: "/", cat: "page" },
    { t: "Disrupção", k: "disrupcao album 2020", u: "/discography/disrupcao", cat: "album" },
    { t: "Linha do Tempo", k: "linha do tempo album 2016", u: "/discography/linha-do-tempo", cat: "album" },
    { t: "Regra Zero", k: "regra zero album 2005", u: "/discography/regra-zero", cat: "album" },
    { t: "Primitive Instrumentals", k: "primitive instrumentals 1998", u: "/discography/primitive-instrumentals", cat: "album" },
    { t: "Do Brasil, Moína", k: "do brasil moina 2010", u: "/discography/do-brasil", cat: "album" },
    { t: "A.M.E, Rodrigo Quik", k: "ame quik 2009", u: "/discography/rodrigo-quik-ame", cat: "album" },
    { t: "Não É Mais Um Disco De Amor", k: "nao disco amor quik 2007", u: "/discography/rodrigo-quik-nao-e-mais-um-disco-de-amor", cat: "album" },
    { t: "Roberto Ferreira & Celso Esteves", k: "roberto ferreira celso esteves 1999", u: "/discography/roberto-ferreira-celso-esteves", cat: "album" },
    { t: "LogX", k: "logx 1998", u: "/discography/logx", cat: "album" },
    { t: "Artists", k: "artists musicians", u: "/artists", cat: "page" },
    { t: "Bernardo Moura", k: "bernardo moura acoustic", u: "/artists/bernardo-moura", cat: "artist" },
    { t: "Celso Esteves", k: "celso esteves lyricist", u: "/artists/celso-esteves", cat: "artist" },
    { t: "Cleidisleia", k: "cleidisleia violin producer", u: "/artists/cleidisleia", cat: "artist" },
    { t: "Felipe Moura", k: "felipe moura bass", u: "/artists/felipe-moura", cat: "artist" },
    { t: "Guilherme Salgueiro", k: "gui salgueiro bass", u: "/artists/gui-salgueiro", cat: "artist" },
    { t: "Jehane Saade", k: "jehane saade singer exotica", u: "/artists/jehane-saade", cat: "artist" },
    { t: "Lauro Rodriguez", k: "lauro rodriguez family first teacher", u: "/artists/lauro-rodriguez", cat: "artist" },
    { t: "Moína Lima", k: "moina lima producer do brasil taiguara", u: "/artists/moina-lima", cat: "artist" },
    { t: "Roberto Ferreira", k: "roberto ferreira guitarist", u: "/artists/roberto-ferreira", cat: "artist" },
    { t: "Rodrigo Garcia", k: "rodrigo garcia", u: "/artists/rodrigo-garcia", cat: "artist" },
    { t: "Rodrigo Cosenza", k: "rodrigo cosenza logx", u: "/artists/rodrigo-cosenza", cat: "artist" },
    { t: "Tajira Kilima", k: "tajira kilima producer regra zero taiguara", u: "/artists/tajira-kilima", cat: "artist" },
    { t: "Wallace Keyboards", k: "wallace keyboards keys", u: "/artists/wallace-keyboards", cat: "artist" },
    { t: "Ygor Helbourn", k: "ygor helbourn drums", u: "/artists/ygor-helbourn", cat: "artist" },
    { t: "Yuri Helbourn", k: "yuri helbourn bass", u: "/artists/yuri-helbourn", cat: "artist" },
    { t: "Books", k: "books library pdf", u: "/books", cat: "page" },
    { t: "O Super Hétero", k: "super hetero so-ocd book", u: "/books/o-super-hetero", cat: "book" },
    { t: "Melhor Ser Corno do Que Feminicida", k: "corno feminicida book", u: "/books/melhor-ser-corno-do-que-feminicida", cat: "book" },
    { t: "Media", k: "media photos videos", u: "/photo-video", cat: "page" },
    { t: "Press", k: "press interviews clippings", u: "/press", cat: "page" },
    { t: "Contact", k: "contact booking email", u: "/contact", cat: "page" }
  ];

  var root = null, input = null, list = null, current = -1, results = [];
  var L = (window.__searchLabels || { title: "Search", hint: "Type to search", none: "No results", cat: {} });

  function build() {
    if (root) return;
    root = document.createElement("div");
    root.className = "srch"; root.setAttribute("aria-hidden", "true");
    root.innerHTML =
      '<div class="srch-backdrop" data-srch-close></div>' +
      '<div class="srch-panel" role="dialog" aria-modal="true" aria-label="' + L.title + '">' +
        '<div class="srch-head">' +
          '<span class="srch-glyph">&#8981;</span>' +
          '<input class="srch-input" type="text" placeholder="' + L.hint + '" aria-label="' + L.title + '"/>' +
          '<kbd class="srch-kbd">ESC</kbd>' +
        '</div>' +
        '<div class="srch-list" role="listbox"></div>' +
        '<div class="srch-foot"><kbd>&#8593;</kbd><kbd>&#8595;</kbd> ' +
          '<span>' + (L.nav || "navigate") + '</span> <kbd>&#8629;</kbd> <span>' + (L.open || "open") + '</span></div>' +
      '</div>';
    document.body.appendChild(root);
    input = root.querySelector(".srch-input");
    list = root.querySelector(".srch-list");
    root.addEventListener("click", function (e) {
      if (e.target.closest("[data-srch-close]")) close();
      var it = e.target.closest(".srch-item");
      if (it) go(it.getAttribute("data-u"));
    });
    input.addEventListener("input", render);
    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
      else if (e.key === "Enter" && results[current]) { go(results[current].u); }
    });
  }

  function normalize(s) {
    return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function render() {
    var q = normalize(input.value.trim());
    results = !q ? INDEX.slice(0, 8) : INDEX.filter(function (it) {
      var hay = normalize(it.t + " " + it.k + " " + it.cat);
      return q.split(/\s+/).every(function (w) { return hay.indexOf(w) !== -1; });
    }).slice(0, 10);
    current = results.length ? 0 : -1;
    if (!results.length) {
      list.innerHTML = '<div class="srch-none">' + L.none + '</div>';
      return;
    }
    list.innerHTML = results.map(function (it, i) {
      var label = (L.cat && L.cat[it.cat]) || it.cat;
      return '<button class="srch-item' + (i === 0 ? " sel" : "") + '" role="option" data-u="' + it.u + '">' +
        '<span class="srch-t">' + it.t + '</span><span class="srch-c">' + label + '</span></button>';
    }).join("");
  }

  function move(d) {
    if (!results.length) return;
    current = (current + d + results.length) % results.length;
    var els = list.querySelectorAll(".srch-item");
    els.forEach(function (el, i) { el.classList.toggle("sel", i === current); });
    if (els[current]) els[current].scrollIntoView({ block: "nearest" });
  }

  function go(u) {
    close();
    if (window.__currentLang && window.__currentLang() !== "en" && u.indexOf("/") === 0) {
      u = "/" + window.__currentLang() + (u === "/" ? "/" : u);
    }
    location.href = u;
  }

  function open() {
    build();
    root.classList.add("open");
    root.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    input.value = ""; render();
    setTimeout(function () { input.focus(); }, 30);
  }

  function close() {
    if (!root) return;
    root.classList.remove("open");
    root.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  document.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) { e.preventDefault(); open(); }
    else if (e.key === "Escape") close();
  });

  window.__openSearch = open;
})();
