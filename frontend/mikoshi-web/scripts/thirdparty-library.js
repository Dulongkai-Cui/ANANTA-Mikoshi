/* Presentation extension for the unchanged third-party snapshot. Loaded before the host bridge. */
/* global library, act, state, render, registry, profiles, byId, A, avatar, cover, esc, compact, decimal, pct, V, R */
(function () {
  "use strict";
  var KEY = "mikoshi-thirdparty-library-layout-v1";
  var layouts = { accounts: "cards", works: "table" };
  var storageNote = "";
  var valid = function (value) { return value === "cards" || value === "table"; };
  try {
    var raw = localStorage.getItem(KEY);
    if (raw) {
      var saved = JSON.parse(raw);
      if (!saved || saved.schema !== 1 || !valid(saved.accounts) || !valid(saved.works)) throw new Error("Invalid layout preference");
      layouts = { accounts: saved.accounts, works: saved.works };
    }
  } catch {
    storageNote = "布局偏好未能读取，当前使用默认布局；原保存内容没有改动。";
  }

  function accountTable(cards) {
    return '<section class="card mk-library-table"><div class="tablewrap" tabindex="0" role="region" aria-label="账号贡献表，可横向滚动"><table class="data-table"><thead><tr><th scope="col">账号 / UID</th><th scope="col">供应商 / 投放</th><th scope="col" class="num">发布作品</th><th scope="col" class="num">累计播放</th><th scope="col" class="num">报价 CPM</th><th scope="col" class="num">10万+作品</th><th scope="col" class="num">互动覆盖</th><th scope="col">操作</th></tr></thead><tbody>' + cards.map(function (card) {
      var entry = registry.get(card.dataset.value);
      if (!entry || !entry.rows.length) throw new Error("账号布局缺少原始作品引用");
      var rows = entry.rows, id = rows[0].account, p = profiles.get(id), g = A(rows);
      card.dataset.accountId = id;
      return '<tr data-account-id="' + esc(id) + '"><td><div class="mk-account-cell">' + avatar(id) + '<div><button class="link" data-action="drill" data-value="' + esc(card.dataset.value) + '">' + esc(p?.name || rows[0].name || id) + '</button><span class="sub">' + (p?.uid ? "UID " + esc(p.uid) : "UID 未提供") + '</span></div></div></td><td>' + esc([...new Set(rows.map(function (r) { return r.supplier; }))].join(" / ")) + '<span class="sub">' + esc([...new Set(rows.map(function (r) { return r.module; }))].join(" / ")) + '</span></td><td class="num">' + g.count + '</td><td class="num">' + compact(g.view) + '</td><td class="num">' + decimal(g.cpm) + '</td><td class="num">' + g.hot + '</td><td class="num">' + g.engCoverage + ' / ' + g.count + '</td><td><button class="small" data-action="drill" data-value="' + esc(card.dataset.value) + '">查看作品</button></td></tr>';
    }).join("") + '</tbody></table></div></section>';
  }

  function workCards(rows) {
    return '<div class="mk-work-grid">' + rows.map(function (row) {
      var id = row.querySelector('[data-action="detail"]')?.dataset.value;
      var r = byId.get(id);
      if (!r) throw new Error("作品布局缺少原始记录引用");
      row.dataset.workId = id;
      return '<article class="card mk-work-card" data-work-id="' + esc(id) + '"><div class="mk-work-preview">' + cover(r) + '</div><div class="mk-work-body"><button class="link mk-work-title" data-action="detail" data-value="' + esc(r.id) + '">' + esc(r.title) + '</button><p>' + esc(r.name) + ' · ' + esc(r.type) + '</p><p>' + esc(r.date) + ' ' + esc(r.time || "时间未填") + ' · ' + esc(r.supplier) + ' / ' + esc(r.module) + '</p><dl class="mk-work-metrics"><div><dt>累计播放</dt><dd>' + compact(r.view) + '</dd></div><div><dt>合作报价</dt><dd>' + (V(r.baseCost) ? '¥' + decimal(r.baseCost) : '—') + '</dd></div><div><dt>互动率</dt><dd>' + pct(V(r.interactions) ? R(r.interactions, r.view) : null) + '</dd></div></dl><div class="mk-work-footer"><span>' + esc(r.status) + '</span><a href="' + esc(r.link) + '" target="_blank" rel="noopener noreferrer">原视频 ↗</a></div></div></article>';
    }).join("") + '</div>';
  }

  var originalLibrary = library;
  library = function () {
    // Let the original implementation choose filters, order, page size and page first.
    var template = document.createElement("template");
    template.innerHTML = originalLibrary.apply(this, arguments);
    var fragment = template.content;
    var mode = state.libraryMode === "works" ? "works" : "accounts";
    var layout = layouts[mode];
    var label = mode === "accounts" ? "账号" : "作品";
    var toolbar = fragment.querySelector(".toolbar");
    if (!toolbar) throw new Error("历史账号与作品工具栏无法识别");
    toolbar.insertAdjacentHTML("beforeend", '<div class="mk-library-layout" role="group" aria-label="' + label + '布局"><span>布局</span>' + ["cards", "table"].map(function (value) {
      return '<button type="button" class="small ' + (layout === value ? "selected" : "") + '" data-action="library-layout" data-value="' + value + '" aria-label="' + label + (value === "cards" ? "卡片布局" : "横向表格布局") + '" aria-pressed="' + (layout === value) + '">' + (value === "cards" ? "卡片" : "横向表格") + '</button>';
    }).join("") + '</div>');
    fragment.querySelectorAll('[data-action="library-mode"]').forEach(function (button) {
      button.setAttribute("aria-pressed", String(button.dataset.value === mode));
    });
    if (mode === "accounts") {
      var grid = fragment.querySelector(".accountgrid");
      if (!grid) throw new Error("历史账号卡片无法识别");
      var cards = [...grid.querySelectorAll('[data-action="drill"]')];
      // Computing this from the already selected cards retains the exact original page.
      var table = accountTable(cards);
      if (layout === "table") grid.outerHTML = table;
    } else {
      var tableRows = [...fragment.querySelectorAll(".data-table tbody tr")];
      var cardsHtml = workCards(tableRows);
      if (layout === "cards" && tableRows.length) {
        var section = fragment.querySelector("section.card");
        if (!section) throw new Error("历史作品表无法识别");
        section.outerHTML = cardsHtml;
      }
    }
    if (storageNote) toolbar.insertAdjacentHTML("afterend", '<p class="callout mk-layout-note" role="status">' + esc(storageNote) + '</p>');
    return template.innerHTML;
  };

  var originalAct = act;
  act = function (action, value) {
    if (action !== "library-layout") return originalAct.apply(this, arguments);
    if (!valid(value)) return;
    var mode = state.libraryMode === "works" ? "works" : "accounts";
    layouts[mode] = value;
    try {
      localStorage.setItem(KEY, JSON.stringify({ schema: 1, accounts: layouts.accounts, works: layouts.works }));
      storageNote = "";
    } catch {
      storageNote = "布局已切换，但浏览器未能保存偏好；刷新后可能恢复原布局。";
    }
    // Unlike object mode switches, changing layout never resets libPage or filters.
    render();
    document.querySelector('[data-action="library-layout"][data-value="' + value + '"]')?.focus({ preventScroll: true });
  };
  if (state.page === "library") render();
})();
