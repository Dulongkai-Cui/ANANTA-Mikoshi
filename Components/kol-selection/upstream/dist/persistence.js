(() => {
  let version=null, savedAt=null;
  window.KOLPersistence={
    get savedAt(){return savedAt;},
    async load(){
      const r=await fetch('/api/state',{cache:'no-store'});
      if(!r.ok)throw Error('无法读取本机工作台，请刷新后重试。');
      const j=await r.json();
      version=j.version;
      savedAt=j.savedAt||null;
      return j.state;
    },
    async save(state){
      const r=await fetch('/api/state',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({state,version})});
      const j=await r.json();
      if(!r.ok)throw Error(j.error||'本机数据库保存失败。');
      version=j.version;
      savedAt=j.savedAt;
      return j;
    }
  };
})();
