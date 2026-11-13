/* Navigation/presentation adapter; the original data and calculations are untouched. */
(function () {
  "use strict";
  var MODULE = "__MODULE__";
  /* global __PAGES__ */
  var PAGES_ALLOWED = __PAGES__;
  var CHANNEL = "mikoshi-legacy-v1";
  var root = document.documentElement;
  function currentPage() {
    /* global state */
    return typeof state !== "undefined" && state && PAGES_ALLOWED.includes(state.page) ? state.page : "home";
  }
  function post(message) {
    message.channel = CHANNEL;
    message.module = MODULE;
    parent.postMessage(message, location.origin);
  }
  function publish() { post({ type: "state", page: currentPage() }); }
  function decorate() {
    if (MODULE === "kol") {
      document.querySelectorAll('[data-action="nav"]').forEach(function (node) {
        if (!PAGES_ALLOWED.includes(node.dataset.value)) node.remove();
      });
    }
    // Original runtime templates also contain inline fixed text sizes.
    document.querySelectorAll('[style*="font-size"]').forEach(function (node) {
      if (!node.style || !/^\d+(\.\d+)?px$/.test(node.style.fontSize)) return;
      node.style.fontSize = Math.max(12, parseFloat(node.style.fontSize)) / 16 + "rem";
    });
    document.querySelectorAll(".table-wrap,.tablewrap").forEach(function (node) {
      node.tabIndex = 0;
      node.setAttribute("role", "region");
      node.setAttribute("aria-label", "数据明细，可横向滚动");
    });
    document.querySelectorAll('a[href^="https:"],a[href^="http:"]').forEach(function (link) {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    });
  }
  function environment(message) {
    if (message.theme === "light" || message.theme === "dark") root.dataset.theme = message.theme;
    root.dataset.motion = message.motion === "reduce" ? "reduce" : "auto";
    if (typeof message.fontSize === "number" && message.fontSize >= 12 && message.fontSize <= 64) root.style.fontSize = message.fontSize + "px";
    if (typeof message.letterSpacing === "string") root.style.letterSpacing = message.letterSpacing;
    if (typeof message.wordSpacing === "string") root.style.wordSpacing = message.wordSpacing;
  }
  window.addEventListener("message", function (event) {
    if (event.source !== parent || event.origin !== location.origin) return;
    var message = event.data;
    if (!message || message.channel !== CHANNEL || message.module !== MODULE) return;
    if (message.type === "environment") { environment(message); return; }
    if (message.type !== "navigate" || !PAGES_ALLOWED.includes(message.page)) return;
    if (currentPage() !== message.page) {
      if (MODULE === "kol") {
        var drawer = document.getElementById("detail-drawer");
        if (drawer && drawer.open) drawer.close();
        /* global navigate */
        navigate(message.page);
      } else {
        var overlay = document.getElementById("overlay");
        /* global closeModal, act */
        if (overlay && !overlay.hidden && typeof closeModal === "function") closeModal();
        act("nav", message.page);
      }
    }
    publish();
  });
  var replace = history.replaceState.bind(history);
  history.replaceState = function (data, title, url) {
    if (typeof url === "string" && url.charAt(0) === "#") {
      queueMicrotask(publish);
      return;
    }
    return replace(data, title, url);
  };
  /* global render */
  if (typeof render === "function") {
    var originalRender = render;
    render = function () {
      if (MODULE === "kol" && typeof state !== "undefined" && !PAGES_ALLOWED.includes(state.page)) state.page = "home";
      var result = originalRender.apply(this, arguments);
      decorate();
      queueMicrotask(publish);
      return result;
    };
  }
  document.addEventListener("click", function (event) {
    var link = event.target instanceof Element ? event.target.closest("a[href]") : null;
    if (!link) return;
    var url;
    try { url = new URL(link.getAttribute("href"), location.href); } catch { event.preventDefault(); return; }
    if (!["https:", "http:", "blob:", "data:"].includes(url.protocol)) event.preventDefault();
    if ((url.protocol === "blob:" || url.protocol === "data:") && !link.hasAttribute("download")) event.preventDefault();
    if (url.protocol === "https:" || url.protocol === "http:") {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }
  }, true);
  window.addEventListener("error", function (event) {
    post({ type: "error", message: String(event.message || "页面脚本异常") });
  });
  decorate();
  publish();
})();
