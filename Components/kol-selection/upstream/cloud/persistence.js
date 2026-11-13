(() => {
  let version=null, savedAt=null, csrf=null;
  window.KOLPersistence={
    get savedAt(){return savedAt;},
    async load(){
      const r=await fetch('api/state',{cache:'no-store'});
      const j=await r.json();
      if(!r.ok||!j.state||!j.csrf)throw Error(j.error||'请重新登录团队工作台。');
      version=j.version; savedAt=j.savedAt; csrf=j.csrf;
      return j.state;
    },
    async save(state){
      const r=await fetch('api/state',{method:'PUT',headers:{'Content-Type':'application/json','X-CSRF-Token':csrf},
        body:JSON.stringify({state,version})});
      const j=await r.json();
      if(!r.ok)throw Error(j.error||'服务器保存失败。');
      version=j.version; savedAt=j.savedAt;
      return j;
    }
  };
})();

