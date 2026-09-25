/* Share row: native share when available, clipboard fallback + toast. */
(function () {
  var toastEl = null, toastTimer = null;

  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "toast";
      toastEl.setAttribute("role", "status");
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 2200);
  }

  function doShare(btn) {
    var url = btn.getAttribute("data-share-url") || location.href;
    var title = btn.getAttribute("data-share-title") || document.title;
    if (navigator.share) {
      navigator.share({ title: title, url: url }).catch(function () {});
      return;
    }
    var text = btn.getAttribute("data-share-text");
    if (btn.getAttribute("data-share-net") === "x") {
      window.open("https://twitter.com/intent/tweet?text=" + encodeURIComponent((text || title) + " " + url), "_blank", "noopener");
      return;
    }
    if (btn.getAttribute("data-share-net") === "wa") {
      window.open("https://wa.me/?text=" + encodeURIComponent((text || title) + " " + url), "_blank", "noopener");
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () {
        toast(btn.getAttribute("data-toast-ok") || "Link copied");
      }, function () { toast(url); });
    } else {
      toast(url);
    }
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".share-btn");
    if (btn) { e.preventDefault(); doShare(btn); }
  });
})();
