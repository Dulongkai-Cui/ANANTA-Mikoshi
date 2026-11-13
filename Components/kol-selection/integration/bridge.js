/* Mikoshi adapter. The preserved upstream application is intentionally unchanged. */
(() => {
  'use strict';
  const channel = 'mikoshi-kol-studio-v1';
  const views = new Set(['overview','kols','ideas','factory','pool','calendar','relations','budgets','selling']);
  if (window.parent === window || new URLSearchParams(location.search).get('embedded') !== '1') return;
  const send = (type, detail = {}) => parent.postMessage({channel, type, ...detail}, location.origin);
  let announced = false, lastView = '', lastDirty = '', drawerIdentity = null, drawerBaseline = '', inFlight = 0;
  const forms = new WeakMap(), factorySelections = new WeakMap();
  const dialogSelector = 'dialog.plan-dialog[open]';
  const readonly = () => window.KOLPersistence?.readonly === true;
  const draftValue = () => typeof modal !== 'undefined' && modal ? JSON.stringify([modal.draft, modal.poolChoice]) : '';
  const formValue = (form) => {
    // Factory pickers keep their selected value in a closure, rather than a form input.
    // Remember actual selections independently of the search-filtered DOM.
    if (!factorySelections.has(form)) factorySelections.set(form,form.querySelector('.fac-option.picked')?.dataset.fref || '');
    return JSON.stringify([
      [...form.querySelectorAll('input,textarea,select')].filter(x => x.type !== 'search' && !x.classList.contains('plan-picker-query')).map(x => [x.name, x.type, x.value, x.checked]),
      [...form.querySelectorAll('.plan-picked [data-pick]')].map(x => x.dataset.pick).sort(),
      form.dataset.pick || factorySelections.get(form),
    ]);
  };
  function inspect() {
    let changed = false;
    const current = typeof modal !== 'undefined' ? modal : null;
    if (current !== drawerIdentity) { drawerIdentity = current; drawerBaseline = draftValue(); }
    if (current && draftValue() !== drawerBaseline) changed = true;
    for (const dialog of document.querySelectorAll(dialogSelector)) {
      const form = dialog.querySelector('form');
      if (!form || !form.querySelector('[type=submit]')) continue;
      if (!forms.has(form)) forms.set(form, formValue(form));
      else if (forms.get(form) !== formValue(form)) changed = true;
    }
    const savingNow = inFlight > 0 || (typeof saving !== 'undefined' && saving);
    return {dirty: !readonly() && changed, saving: savingNow};
  }
  function broadcast() {
    const snapshot = inspect(), key = JSON.stringify(snapshot);
    if (key !== lastDirty) { lastDirty = key; send('dirty', snapshot); }
    if (announced && typeof ui !== 'undefined' && views.has(ui.view) && ui.view !== lastView) {
      lastView = ui.view; send('view', {view: ui.view});
    }
    const breadcrumb = document.querySelector('.topbar .breadcrumb > span:first-child');
    if (breadcrumb && breadcrumb.textContent !== 'KOL工作室') breadcrumb.textContent = 'KOL工作室';
  }
  function discard() {
    if (typeof closeModal === 'function' && typeof modal !== 'undefined' && modal) closeModal();
    document.querySelectorAll(dialogSelector).forEach(panel => panel.close());
    drawerIdentity = null; drawerBaseline = ''; broadcast();
  }
  const pause = ms => new Promise(resolve => setTimeout(resolve,ms));
  window.addEventListener('message', async event => {
    if (event.origin !== location.origin || event.source !== parent || !event.data || event.data.channel !== channel) return;
    const message = event.data;
    if (message.type === 'environment') {
      const root = document.documentElement;
      root.dataset.mikoshiTheme = message.theme === 'dark' ? 'dark' : 'light';
      root.dataset.mikoshiMotion = message.motion === 'reduce' ? 'reduce' : 'auto';
      if (typeof message.fontSize === 'number' && Number.isFinite(message.fontSize)) root.style.fontSize = Math.max(12,Math.min(40,message.fontSize))+'px';
      const mapping = {canvas:'canvas',raised:'surface',subtle:'subtle',fg:'fg','fg-secondary':'secondary','fg-muted':'muted',line:'line',accent:'accent','accent-soft':'accent-soft'};
      if (message.colors && typeof message.colors === 'object') for (const [host,local] of Object.entries(mapping)) {
        const color = message.colors[host];
        if (typeof color === 'string' && color.length < 120 && CSS.supports('color',color)) root.style.setProperty('--'+local,color);
      }
    } else if (message.type === 'prepare-leave' && typeof message.id === 'string') {
      const deadline = Date.now()+9000;
      while (inspect().saving && Date.now()<deadline) await pause(80);
      const snapshot=inspect();
      send('leave-result',{id:message.id,canLeave:!snapshot.dirty&&!snapshot.saving,...snapshot});
    } else if (message.type === 'discard-draft') discard();
    else if (message.type === 'focus-editor') document.querySelector('.drawer input, .drawer textarea, dialog[open] input, dialog[open] textarea')?.focus();
    else if (message.type === 'navigate' && views.has(message.view) && announced) {
      if (message.view === ui.view) { send('view', {view: ui.view}); broadcast(); return; }
      const snapshot = inspect();
      if (snapshot.dirty || snapshot.saving) { send('navigation-blocked',{view:message.view,...snapshot}); return; }
      // Close a read-only or unchanged form before switching, preserving all actual business data.
      discard(); ui.view = message.view; render(); window.scrollTo(0,0); broadcast();
    }
  });
  document.addEventListener('input', () => queueMicrotask(broadcast), true);
  document.addEventListener('change', () => queueMicrotask(broadcast), true);
  document.addEventListener('click', event => {
    const option=event.target.closest?.('.fac-option[data-fref]'), form=option?.closest('form');
    if (form) { factorySelections.set(form,option.dataset.fref); queueMicrotask(broadcast); }
  },true);
  window.addEventListener('beforeunload', event => { const s=inspect(); if(s.dirty||s.saving){event.preventDefault();event.returnValue='';} });
  let scheduled = false;
  new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true; queueMicrotask(() => { scheduled=false; broadcast(); });
  }).observe(document.body,{childList:true,subtree:true});

  // Capture the draft before its first editable event; no writes are triggered by navigation.
  const upstreamRender = render;
  render = function(...args) {
    if (!views.has(ui.view)) ui.view = 'kols';
    return upstreamRender.apply(this,args);
  };
  const upstreamOpen = openModal;
  openModal = function(...args) { const result=upstreamOpen.apply(this,args); drawerIdentity=modal; drawerBaseline=draftValue(); broadcast(); return result; };
  const upstreamPersist = persist;
  persist = async function(...args) { inFlight++; broadcast(); try { return await upstreamPersist.apply(this,args); } finally { inFlight--; broadcast(); } };
  const started = Date.now();
  const readyTimer = setInterval(() => {
    if (window.KOLApp && typeof ui !== 'undefined') {
      clearInterval(readyTimer); announced=true;lastView=ui.view;
      document.documentElement.classList.add('mikoshi-embedded');
      send('ready',{view:ui.view,readonly:readonly()}); broadcast();
    } else if (document.querySelector('#app .boot h2')?.textContent?.includes('暂未成功') || Date.now()-started>42000) {
      clearInterval(readyTimer);
      send('error',{message:document.querySelector('#app .boot p')?.textContent || 'KOL资料服务暂时无法连接。'});
    }
  },100);
})();
