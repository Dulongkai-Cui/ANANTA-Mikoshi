(() => {
  'use strict';
  const readonly = '同事只读 · 刷新看最新';
  window.KOLPersistence = Object.freeze({
    readonly:true,
    async load() {
      const r = await fetch('/api/state', {cache:'no-store'});
      if (!r.ok) throw Error('这条分享已失效或暂时无法连接。');
      const {state} = await r.json();
      if (!state || !Array.isArray(state.kols)) throw Error('没有可预览的资料。');
      return state;
    },
    async save() { throw Error('同事预览不能保存修改。'); },
  });
  const inputs = '[data-select-kol],[data-edit],[data-edit-sell],[data-add-member],[data-allocation],[data-upload-image],[data-avatar-upload],[data-remove-image],[data-remove-member]';
  const writes = '[data-action="new-kol"],[data-action="new-idea"],[data-action="idea-from-selected"],[data-action="edit-budgets"],[data-action="new-edge"],[data-action="import"],[data-action="export"],[data-action="save-modal"],[data-action="archive-idea"],[data-action="add-selected"]';
  function patch() {
    const indicator = document.getElementById('save-state');
    if (indicator && indicator.textContent !== readonly) {
      indicator.textContent = readonly;
      indicator.title = '刷新页面，即可查看分享人最近保存的选人、创意和预算。';
    }
    for (const node of document.querySelectorAll(inputs)) {
      if (node.matches('textarea,input:not([type="checkbox"]):not([type="file"])')) node.readOnly=true;
      else node.disabled=true;
    }
    const close = document.querySelector('.drawer-footer [data-action="close-modal"]');
    if (close && close.textContent === '取消') close.textContent='关闭';
    if (location.hash.startsWith('#view=')) history.replaceState(null,'',location.pathname);
  }
  document.addEventListener('click', e => {
    if (e.target.closest(writes)) { e.preventDefault(); e.stopImmediatePropagation(); }
  },true);
  new MutationObserver(patch).observe(document.body,{childList:true,subtree:true});
  patch();
})();
