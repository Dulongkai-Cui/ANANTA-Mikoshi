/* Executed before the original page scripts. The original sources remain read-only. */
(function () {
  "use strict";
  var params = new URLSearchParams(location.search);
  var user = params.get("user");
  var allowed = typeof user === "string" && /^[a-zA-Z0-9_-]{1,80}$/.test(user);
  var prefix = "mikoshi.legacy.v1:" + (allowed ? user : "standalone") + ":__MODULE__:";
  var nativeStorage;
  try { nativeStorage = window.localStorage; } catch { /* Native methods below fail explicitly. */ }
  function requireStorage() {
    if (!nativeStorage) throw new Error("浏览器存储不可用，本次操作未保存。");
    return nativeStorage;
  }
  // Original keys never read another account's notes, comments or saved pivot.
  var scopedStorage = {
    getItem: function (key) { return requireStorage().getItem(prefix + key); },
    setItem: function (key, value) { requireStorage().setItem(prefix + key, String(value)); },
    removeItem: function (key) { requireStorage().removeItem(prefix + key); },
    clear: function () {
      var store = requireStorage();
      for (var i = store.length - 1; i >= 0; i--) {
        var key = store.key(i);
        if (key && key.indexOf(prefix) === 0) store.removeItem(key);
      }
    },
  };
  Object.defineProperty(window, "localStorage", { value: scopedStorage });
  window.fetch = function () {
    return Promise.reject(new Error("在线读取尚未接入 MIKOSHI，本页只显示内置历史快照。"));
  };
  var root = document.documentElement;
  root.dataset.workspace = "__MODULE__";
  root.dataset.theme = params.get("theme") === "dark" ? "dark" : "light";
  root.dataset.motion = params.get("motion") === "reduce" ? "reduce" : "auto";
  var fontSize = Number(params.get("font"));
  if (fontSize >= 12 && fontSize <= 64) root.style.fontSize = fontSize + "px";
})();
