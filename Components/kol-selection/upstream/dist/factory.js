'use strict';
const KOLFactory = (() => {
  const kinds = {
    base:{label:'创意底板',icon:'▤'}, node:{label:'节点',icon:'◷'},
    sell:{label:'卖点',icon:'✦'}, kol:{label:'UP',icon:'◎'},
    price:{label:'报价计算器',icon:'＋'}, note:{label:'便签',icon:'▧'}
  };
  const uiState={selected:'',x:24,y:24,scale:1};
  const readOnly=()=>window.KOLPersistence?.readonly === true;
  const data=()=>state.brainFactory || {schema:1,blocks:[],templates:[]};
  const byId=id=>data().blocks.find(b=>b.id===id);
  const uid=()=>crypto.randomUUID();
  const money=v=>v==null?'待询价':fmt(v)+' 万';
  const children=id=>data().blocks.filter(b=>b.parent===id);
  const selectedBase=()=>{const b=byId(uiState.selected);return b?.type==='base'?b:byId(b?.parent);};
  const button=(label,action,id='',cls='')=>`<button type="button" class="btn small ${cls}" data-fact-action="${action}" data-id="${esc(id)}">${esc(label)}</button>`;
  const field=(label,ctrl)=>`<label class="plan-field"><span>${esc(label)}</span>${ctrl}</label>`;
  const input=(name,v='')=>`<input name="${name}" value="${esc(v)}" maxlength="240">`;
  const textArea=(name,v='')=>`<textarea name="${name}" rows="4">${esc(v)}</textarea>`;
  const stamp=()=>new Date().toISOString();

  function validate(state) {
    const f=state.brainFactory;if(!f)return;
    if(f.schema!==1||!Array.isArray(f.blocks)||!Array.isArray(f.templates))throw Error('脑暴画布的格式无效。');
    const templateIds=new Set();
    for(const t of f.templates){
      if(!t||typeof t.id!=='string'||!t.id||templateIds.has(t.id)||typeof t.label!=='string'||!t.label.trim())throw Error('标准件模板无效或重复。');
      templateIds.add(t.id);
    }
    const ids=new Set(),bases=new Set();
    for(const b of f.blocks){
      if(!b||!kinds[b.type]||typeof b.id!=='string'||!b.id||ids.has(b.id)||!Number.isFinite(b.x)||!Number.isFinite(b.y))throw Error('画布存在无效或重复的组件。');
      ids.add(b.id);if(b.type==='base')bases.add(b.id);
    }
    for(const b of f.blocks)if(b.parent&&(!bases.has(b.parent)||b.type==='base'))throw Error('标准件须连接到同一画布里的创意底板。');
  }
  async function commit(change,msg){
    if(readOnly())return false;
    return transact(()=>{
      state.brainFactory ||= {schema:1,blocks:[],templates:[]};
      change(state.brainFactory);validate(state);
    },msg);
  }
  function go(){ui.view='factory';render();window.scrollTo(0,0);}
  function block(type,attrs={}) {
    return {id:uid(),type,x:0,y:0,parent:'',label:'',body:'',ref:'',manual:null,...attrs};
  }
  function nextSpot(type='base') {
    const viewport=document.querySelector('.fac-viewport');
    const width=type==='base'?342:154,height=type==='base'?120:55;
    const left=Math.round((20-uiState.x)/uiState.scale),top=Math.round((32-uiState.y)/uiState.scale);
    const visible=(viewport?.clientWidth||800)/uiState.scale;
    const occupied=data().blocks.filter(b=>!b.parent).map(b=>{
      const key=CSS.escape(b.id),el=viewport?.querySelector(b.type==='base'?'[data-fbase="'+key+'"]':'[data-fblock="'+key+'"]');
      return {x:b.x,y:b.y,w:el?.offsetWidth||(b.type==='base'?342:154),h:el?.offsetHeight||(b.type==='base'?120:55)};
    });
    for(let row=0;row<=occupied.length+2;row++){
      for(let col=0;col<Math.max(1,Math.floor((visible-20)/(width+22)));col++){
        const x=left+col*(width+22),y=top+row*(height+22);
        if(occupied.every(r=>x+width+12<r.x||x>r.x+r.w+12||y+height+12<r.y||y>r.y+r.h+12))return {x,y};
      }
    }
    return {x:left,y:Math.max(top,...occupied.map(r=>r.y+r.h+22))};
  }
  function baseBudget(id){
    const pieces=children(id), kols=[...new Set(pieces.filter(p=>p.type==='kol').map(b=>b.ref))];
    const calc=pieces.find(b=>b.type==='price'), model={kolIds:kols,allocations:[],manualBudget:calc?.manual??null};
    const base=byId(id);const linked=state.ideas.find(i=>i.id===base?.ideaId);
    if(linked)model.allocations=(linked.allocations||[]).filter(a=>kols.includes(a.kolId));
    return {...costing(model),kols,calc,known:allocations(model).some(a=>a.quoteWan!=null||a.quantity===0)};
  }
  function pieceInfo(b){
    if(b.type==='kol'){const k=getKol(b.ref);return {title:k?.name||'UP 待选',sub:k?money(k.quoteWan):'选择账号',pic:k?avatar(k,'sm'):''};}
    if(b.type==='sell'){const s=state.sellingPoints.find(x=>String(x.id)===String(b.ref));return {title:s?.title||'卖点待选',sub:'产品卖点'};}
    if(b.type==='node'){const n=state.planner.nodes.find(x=>x.id===b.ref);return {title:n?.title||'节点已移出',sub:n?.date||'日期待定'};}
    if(b.type==='price'){
      if(!b.parent)return {title:b.manual==null?'自动合价':money(b.manual),sub:'连接底板后计价'};
      const cost=baseBudget(b.parent);return {title:cost.manual?money(cost.total):cost.missing&&!cost.known?'待询价':money(cost.auto),
        sub:cost.manual?'手填总价':cost.missing?cost.missing+' 位待询价':'随 UP 自动合计'};
    }
    return {title:b.label||'自定义便签',sub:b.body||'补充内容或玩法'};
  }
  const studs='<span class="fac-studs" aria-hidden="true"><i></i><i></i><i></i></span>';
  function piece(b,attached){
    const p=pieceInfo(b),style=attached?'':`style="left:${b.x}px;top:${b.y}px"`;
    return `<button class="fac-piece fac-${b.type} ${attached?'attached':'loose'} ${b.id===uiState.selected?'is-selected':''}" data-fblock="${esc(b.id)}" ${style} title="${esc(p.title+' · '+p.sub)}">${studs}<span class="fac-piece-head">${p.pic||`<span class="fac-symbol">${kinds[b.type].icon}</span>`}<strong>${esc(p.title)}</strong></span><small>${esc(p.sub)}</small></button>`;
  }
  function baseView(b){
    const parts=children(b.id),focus=selectedBase()?.id===b.id;
    return `<section class="fac-base ${focus?'active':''}" data-fbase="${esc(b.id)}" style="left:${b.x}px;top:${b.y}px">
      <button class="fac-base-head" data-fblock="${esc(b.id)}" title="拖动整组或点选底板">${studs}<small>创意底板</small><strong>${esc(b.label||'未命名创意')}</strong></button>
      ${b.body?`<p class="fac-base-note">${esc(b.body)}</p>`:''}<div class="fac-attached">${parts.map(p=>piece(p,true)).join('')||'<span class="fac-empty-socket">把标准件拖到这里</span>'}</div></section>`;
  }
  function paletteButton(type,template){
    const label=template?.label||kinds[type].label, key=template?'tpl:'+template.id:type;
    return `<button type="button" class="fac-palette-piece fac-${type}" data-fpalette="${esc(key)}" title="拖出或点选${esc(label)}">${studs}<span>${kinds[type].icon}</span>${esc(label)}</button>`;
  }
  function inspector(){
    const b=byId(uiState.selected),base=selectedBase(),ro=readOnly();
    if(!b)return `<aside class="fac-inspector"><h3>创意组件</h3><p>点选画布上的底板或标准件，查看内容和报价。</p>${!ro?button('新建创意底板','add','base','primary'):''}</aside>`;
    const info=b.type==='base'?{title:b.label,sub:b.body}:pieceInfo(b);
    const cost=base?baseBudget(base.id):null;
    return `<aside class="fac-inspector"><small>${kinds[b.type].label}</small><h3>${esc(info.title||'未命名')}</h3><p>${esc(info.sub||'还没有简介。')}</p>
      ${ro?'':`<div class="fac-actions">${button('编辑','edit',b.id)}${b.templateId&&data().templates.some(t=>t.id===b.templateId)?button('编辑模板','template',b.templateId):''}${b.type!=='base'&&b.parent?button('拆下','detach',b.id):''}${button('移除','remove',b.id,'quiet')}</div>`}
      ${base?`<hr><small>已拼装底板</small><h4>${esc(base.label)}</h4><div class="fac-members">${cost.kols.map(id=>{const k=getKol(id);return k?`<span>${avatar(k,'sm')}${esc(k.name)}</span>`:'';}).join('')||'尚未加入 UP'}</div>
      ${cost.calc?`<div class="fac-bill"><small>${cost.manual?'手填报价':'自动报价'}</small><strong>${cost.missing&&!cost.manual&&!cost.known?'待询价':money(cost.total)}</strong>${cost.missing&&!cost.manual?`<small>另有 ${cost.missing} 位待询价</small>`:''}</div>`:''}
      <div class="fac-actions">${ro?'':button(base.ideaId?'更新提词卡':'生成提词卡','to-idea',base.id,'primary')}${base.ideaId?button('查看提词卡','see-idea',base.ideaId):''}</div>`:''}</aside>`;
  }
  function view(){
    const f=data(),ro=readOnly();
    return `<div class="fac-work"><header class="fac-heading"><div><small>CREATIVE STUDIO</small><h1>脑暴工厂</h1></div><div class="fac-actions">${button('回到提词板','ideas')}${ro?'':button('载入已有创意','load-idea')+button('＋ 创意底板','add','base','primary')}</div></header>
      ${ro?'':`<div class="fac-palette"><b>标准件</b>${Object.keys(kinds).filter(x=>x!=='base').map(type=>paletteButton(type)).join('')}${f.templates.map(t=>`<span class="fac-template-pair">${paletteButton('note',t)}${button('✎','template',t.id,'fac-template-edit')} </span>`).join('')}${button('＋ 自定义标准件','template')}</div>`}
      <div class="fac-layout"><div class="fac-viewport" tabindex="0" aria-label="创意拼装画布"><div class="fac-world" style="transform:translate(${uiState.x}px,${uiState.y}px) scale(${uiState.scale})">${f.blocks.filter(b=>b.type==='base').map(baseView).join('')}${f.blocks.filter(b=>b.type!=='base'&&!b.parent).map(b=>piece(b,false)).join('')}</div>
      ${!f.blocks.length?`<div class="fac-start"><span class="fac-start-icon" aria-hidden="true">▦</span><h3>第一块创意底板</h3><p>写下一句话，再把节点、卖点和 UP 拼进来。</p>${ro?'':button('新建底板','add','base','primary')+button('从提词卡开始','load-idea')}</div>`:''}
      <div class="fac-zoom">${button('−','zoom-out')}<span>${Math.round(uiState.scale*100)}%</span>${button('＋','zoom-in')}${button('全览','fit')}</div></div>${inspector()}</div>
      <footer class="fac-footer"><span>${f.blocks.filter(b=>b.type==='base').length} 个底板 · ${f.blocks.filter(b=>b.type!=='base').length} 个标准件</span><span>${ro?'同事只读':'拖近底板可吸附，拖出可拆下；松手后自动保存。'}</span></footer></div>`;
  }
  function spotFor(key,place){
    const pos=place?.point||nextSpot(key);
    return {...pos,parent:place ? place.parent||'' : (key==='base'?'':selectedBase()?.id||'')};
  }
  function addEditor(typeKey,place={},existing=null){
    const template=typeKey.startsWith('tpl:')?data().templates.find(t=>t.id===typeKey.slice(4)):null;
    const type=template?'note':typeKey, current=existing||block(type,{...spotFor(type,place.point?place:null),templateId:template?.id||'',label:template?.label||'',body:template?.body||''});
    const pickable=['node','sell','kol'].includes(type);
    let ref=current.ref;
    const options=type==='kol'?state.kols.map(k=>({id:k.id,name:k.name,sub:[k.category,money(k.quoteWan)].join(' · '),k})):
      type==='node'?state.planner.nodes.map(n=>({id:n.id,name:n.title,sub:n.date||'待定'})):
      type==='sell'?state.sellingPoints.map(s=>({id:String(s.id),name:s.title,sub:''})): [];
    let html='';
    if(pickable)html=field('查找'+kinds[type].label,'<input type="search" class="fac-search" placeholder="输入名称">')+'<div class="fac-picker-list"></div>';
    else if(type==='price')html=field('手填总价（万元）',`<input type="number" min="0" step="any" name="manual" value="${esc(current.manual??'')}" placeholder="留空，按底板的 UP 自动合计">`);
    else html=field(type==='base'?'创意名':'组件名',input('label',current.label))+field(type==='base'?'创意简介':'内容',textArea('body',current.body));
    const form=KOLPlanner.dialog((existing?'编辑':'新建')+kinds[type].label,html,async f=>{
      const next={...current};
      if(pickable){if(!ref)throw Error('请先选一个'+kinds[type].label+'。');next.ref=ref;}
      else if(type==='price'){const v=f.elements.manual.value;next.manual=v===''?null:Number(v);if(next.manual!=null&&(!Number.isFinite(next.manual)||next.manual<0))throw Error('请填写有效金额。');}
      else {next.label=f.elements.label.value.trim();next.body=f.elements.body.value.trim();if(!next.label)throw Error('请输入名称。');}
      const owner=existing?.parent||next.parent;
      if(duplicate(next,owner))throw Error('底板已经有这个标准件。');
      return commit(fac=>{
        if(existing)Object.assign(fac.blocks.find(b=>b.id===next.id),next);else fac.blocks.push(next);
        if(!existing&&place.looseId)joinLoose(fac,next,place.looseId);
        uiState.selected=next.id;
      },existing?'组件已保存':'组件已加入画布');
    });
    if(!pickable)return;
    const list=form.querySelector('.fac-picker-list'),search=form.querySelector('.fac-search');
    function refresh(){
      const q=search.value.toLowerCase().trim();
      const filtered=options.filter(x=>!q||[x.name,x.sub,x.k?.uid].join(' ').toLowerCase().includes(q)).sort((a,b)=>Number(b.id===ref)-Number(a.id===ref)||Number(!!b.k?.selected)-Number(!!a.k?.selected));
      list.innerHTML=filtered.slice(0,65).map(x=>`<button type="button" class="fac-option ${x.id===ref?'picked':''}" data-fref="${esc(x.id)}">${x.k?avatar(x.k,'sm'):''}<span>${esc(x.name)}<small>${esc(x.sub)}</small></span>${x.id===ref?'✓':''}</button>`).join('')||'没有匹配项';
    }
    list.onclick=e=>{const row=e.target.closest('[data-fref]');if(row){ref=row.dataset.fref;refresh();}};search.oninput=refresh;refresh();
  }
  function duplicate(b,parent){
    if(!parent||!['sell','node','kol','price'].includes(b.type))return false;
    return children(parent).some(x=>x.id!==b.id&&x.type===b.type&&(b.type==='price'||x.ref===b.ref));
  }
  function joinLoose(fac,part,otherId){
    const other=fac.blocks.find(b=>b.id===otherId);if(!other||other.parent||other.id===part.id)return;
    if(other.type===part.type&&(part.type==='price'||(['node','sell','kol'].includes(part.type)&&part.ref===other.ref)))throw Error('相同标准件不能重复拼入。');
    const base=block('base',{label:'新创意',x:other.x,y:other.y});
    other.parent=base.id;part.parent=base.id;fac.blocks.push(base);
  }
  function templateEditor(id=''){
    const current=data().templates.find(t=>t.id===id);
    KOLPlanner.dialog(current?'编辑自定义标准件':'自定义标准件',field('标准件名称',input('label',current?.label||''))+field('默认内容',textArea('body',current?.body||'')),f=>{
      const label=f.elements.label.value.trim();if(!label)throw Error('请输入标准件名称。');
      return commit(fac=>{
        const next={id:current?.id||uid(),label,body:f.elements.body.value.trim()};
        if(current)Object.assign(fac.templates.find(t=>t.id===current.id),next);else fac.templates.push(next);
      },current?'标准件模板已更新':'已加入顶部标准件');
    },{onDelete:current?()=>confirm('移除这个模板？画布上的实例会保留。')?commit(fac=>fac.templates=fac.templates.filter(t=>t.id!==id),'模板已移除'):false:null});
  }
  function asIdea(base){
    const parts=children(base.id),{kols,calc}=baseBudget(base.id);
    const linked=state.ideas.find(i=>i.id===base.ideaId),nodes=parts.filter(p=>p.type==='node').map(p=>p.ref);
    const notes=parts.filter(p=>p.type==='note').map(p=>[p.label,p.body].filter(Boolean).join(' · '));
    return {...(linked||{id:'C-'+uid(),type:'内容创意',budgetCategory:state.budgets[0]?.name||'',status:'草案',archived:false,inBudget:false,images:[],sources:[]}),
      title:base.label,description:[base.body,...notes].filter(Boolean).join('\n'),sellingPoints:[...new Set(parts.filter(b=>b.type==='sell').map(b=>Number(b.ref)))],
      kolIds:kols,allocations:kols.map(id=>linked?.allocations?.find(a=>a.kolId===id)||{kolId:id,quantity:1,quoteWan:null}),
      manualBudget:calc?.manual??null,factoryNodeIds:nodes,factoryBaseId:base.id,updatedAt:stamp()};
  }
  async function toIdea(id){
    const base=byId(id);if(!base||base.type!=='base')return;
    const draft=asIdea(base);
    return commit(fac=>{const old=state.ideas.find(i=>i.id===draft.id);if(old)Object.assign(old,draft);else state.ideas.unshift(draft);
      fac.blocks.find(b=>b.id===id).ideaId=draft.id;},base.ideaId?'提词卡已更新':'已生成提词卡草案');
  }
  async function loadIdea(id){
    const idea=state.ideas.find(i=>i.id===id);if(!idea)return;
    const prior=data().blocks.find(b=>b.type==='base'&&b.ideaId===id);
    if(prior){uiState.selected=prior.id;go();focusBase(prior);return;}
    if(readOnly())return;
    const base=block('base',{...nextSpot(),label:idea.title,body:idea.description||'',ideaId:id});
    const parts=[...(idea.factoryNodeIds||[]).map(ref=>block('node',{ref})),
      ...(idea.sellingPoints||[]).map(ref=>block('sell',{ref:String(ref)})),
      ...(idea.kolIds||[]).map(ref=>block('kol',{ref})),block('price',{manual:idea.manualBudget??null})];
    const ok=await commit(fac=>{fac.blocks.push(base,...parts.map(p=>({...p,parent:base.id})));uiState.selected=base.id;},'已载入提词卡');
    if(ok){go();focusBase(base);}
  }
  function chooseIdea(){
    const form=KOLPlanner.dialog('载入已有创意',field('搜索提词卡','<input type="search" class="fac-search">')+'<div class="fac-picker-list"></div>',async f=>{
      if(!f.dataset.pick)throw Error('请选择一张提词卡。');return loadIdea(f.dataset.pick);
    },{label:'载入'});
    const list=form.querySelector('.fac-picker-list'),search=form.querySelector('.fac-search');
    function refresh(){list.innerHTML=state.ideas.filter(i=>i.title.toLowerCase().includes(search.value.toLowerCase())).map(i=>`<button class="fac-option ${form.dataset.pick===i.id?'picked':''}" type="button" data-fref="${esc(i.id)}">${esc(i.title)}</button>`).join('')||'没有匹配项';}
    list.onclick=e=>{const opt=e.target.closest('[data-fref]');if(opt){form.dataset.pick=opt.dataset.fref;refresh();}};search.oninput=refresh;refresh();
  }
  function focusBase(b){uiState.x=24-b.x*uiState.scale;uiState.y=24-b.y*uiState.scale;paintTransform();}
  function paintTransform(){const world=document.querySelector('.fac-world');if(world)world.style.transform=`translate(${uiState.x}px,${uiState.y}px) scale(${uiState.scale})`;}
  function fit(){
    const el=document.querySelector('.fac-viewport');if(!el)return;
    const top=data().blocks.filter(b=>!b.parent);
    if(!top.length){Object.assign(uiState,{x:24,y:24,scale:1});render();return;}
    const rects=top.map(b=>{const node=el.querySelector(b.type==='base'?`[data-fbase="${CSS.escape(b.id)}"]`:`[data-fblock="${CSS.escape(b.id)}"]`);return {x:b.x,y:b.y,w:node?.offsetWidth||200,h:node?.offsetHeight||90};});
    const x=Math.min(...rects.map(r=>r.x)),y=Math.min(...rects.map(r=>r.y)),w=Math.max(...rects.map(r=>r.x+r.w))-x,h=Math.max(...rects.map(r=>r.y+r.h))-y;
    uiState.scale=Math.max(.24,Math.min(1.35,(el.clientWidth-50)/Math.max(w,1),(el.clientHeight-50)/Math.max(h,1)));
    uiState.x=(el.clientWidth-w*uiState.scale)/2-x*uiState.scale;uiState.y=(el.clientHeight-h*uiState.scale)/2-y*uiState.scale;render();
  }
  function zoom(factor){
    const view=document.querySelector('.fac-viewport');if(!view)return;
    const old=uiState.scale,next=Math.max(.24,Math.min(2,old*factor)),cx=view.clientWidth/2,cy=view.clientHeight/2;
    uiState.x=cx-(cx-uiState.x)*next/old;uiState.y=cy-(cy-uiState.y)*next/old;uiState.scale=next;render();
  }
  async function act(action,id){
    if(action==='open'){go();return;}if(action==='ideas'){ui.view='ideas';render();return;}
    if(action==='see-idea'){openIdea(id);return;}if(action==='fit'){fit();return;}
    if(action==='zoom-in'||action==='zoom-out'){zoom(action==='zoom-in'?1.18:1/1.18);return;}
    if(action==='from-idea'){await loadIdea(id);return;}
    if(readOnly())return;
    const b=byId(id);
    if(action==='load-idea')chooseIdea();
    if(action==='template')templateEditor(id);
    if(action==='add')addEditor(id);
    if(action==='edit'&&b)addEditor(b.type,{},b);
    if(action==='to-idea')await toIdea(id);
    if(action==='detach'&&b){const base=byId(b.parent);await commit(()=>Object.assign(b,{parent:'',x:base.x+382,y:base.y+30}),'已拆下标准件');}
    if(action==='remove'&&b){
      if(!confirm(b.type==='base'?'移除底板并把已有标准件拆回画布？':'移除这个标准件？'))return;
      await commit(fac=>{if(b.type==='base')children(b.id).forEach((p,i)=>Object.assign(p,{parent:'',x:b.x+28*i,y:b.y+90+28*i}));
        fac.blocks=fac.blocks.filter(x=>x.id!==id);uiState.selected='';},'组件已移除');
    }
  }
function worldPoint(x,y){
    const v=document.querySelector('.fac-viewport').getBoundingClientRect();
    return {x:Math.round((x-v.left-uiState.x)/uiState.scale),y:Math.round((y-v.top-uiState.y)/uiState.scale)};
  }
  function hitTarget(x,y,id){
    const v=document.querySelector('.fac-viewport');if(!v)return null;
    const vr=v.getBoundingClientRect();if(x<vr.left||x>vr.right||y<vr.top||y>vr.bottom)return null;
    let best=null,bestDist=Infinity;
    for(const el of [...v.querySelectorAll('.fac-base,.fac-piece.loose')].reverse()){
      const key=el.dataset.fbase||el.dataset.fblock;if(key===id)continue;
      const r=el.getBoundingClientRect(),dx=Math.max(r.left-x,0,x-r.right),dy=Math.max(r.top-y,0,y-r.bottom),d=Math.hypot(dx,dy);
      if(d<=28&&d<bestDist){best=el;bestDist=d;}
    }
    return best;
  }
  let gesture=null,skipClick=false;
  function clearDrag(){
    const g=gesture;if(!g)return;
    gesture=null;g.ghost?.remove();document.body.classList.remove('fac-drag-active');
    document.querySelector('.fac-snap')?.classList.remove('fac-snap');
    if(g.el.hasPointerCapture?.(g.pid))g.el.releasePointerCapture(g.pid);
  }
  function move(g,e){
    const dx=e.clientX-g.x,dy=e.clientY-g.y;
    if(!g.drag&&Math.hypot(dx,dy)<6)return;
    if(!g.drag){
      g.drag=true;try{g.el.setPointerCapture(g.pid);}catch{}
      if(!g.pan){
        g.ghost=document.createElement('div');g.ghost.className='fac-ghost fac-'+g.type;
        const b=byId(g.id);g.ghost.textContent=b?(b.type==='base'?b.label:pieceInfo(b).title):(kinds[g.type]?.label||'自定义件');
        document.body.append(g.ghost);document.body.classList.add('fac-drag-active');
      }
    }
    if(e.cancelable)e.preventDefault();
    if(g.pan){uiState.x=g.oldX+dx;uiState.y=g.oldY+dy;paintTransform();return;}
    g.ghost.style.transform=`translate(${e.clientX+10}px,${e.clientY+12}px)`;
    const target=g.type==='base'?null:hitTarget(e.clientX,e.clientY,g.id);
    document.querySelector('.fac-snap')?.classList.remove('fac-snap');target?.classList.add('fac-snap');
  }
  async function release(g,x,y){
    if(g.pan||!g.drag)return;
    const viewport=document.querySelector('.fac-viewport'),r=viewport.getBoundingClientRect();
    if(x<r.left||x>r.right||y<r.top||y>r.bottom)return;
    const point=worldPoint(x,y),target=g.type==='base'?null:hitTarget(x,y,g.id);
    const parent=target?.dataset.fbase||'',looseId=target?.dataset.fblock||'';
    if(g.key){addEditor(g.key,{point,parent,looseId});return;}
    const b=byId(g.id);if(!b)return;
    if(duplicate(b,parent)){toast('底板上已有这个标准件');return;}
    await commit(fac=>{
      b.parent=parent;
      b.x=point.x-g.offsetX;b.y=point.y-g.offsetY;
      if(looseId)joinLoose(fac,b,looseId);
      uiState.selected=b.id;
    },parent||looseId?'组件已吸附':'画布位置已保存');
  }
  document.addEventListener('pointerdown',e=>{
    const v=e.target.closest('.fac-viewport'), palette=e.target.closest('[data-fpalette]'), item=e.target.closest('[data-fblock]');
    if(!v&&!palette||e.button!==0||!e.isPrimary)return;skipClick=false;
    if((palette||item)&&readOnly())return;
    if(!palette&&!item&&(e.target.closest('button,.fac-start,.fac-zoom')||!v))return;
    const el=palette||item||v,b=item&&byId(item.dataset.fblock),key=palette?.dataset.fpalette||'';
    const rect=(b?.type==='base'?item.closest('.fac-base'):el).getBoundingClientRect();
    gesture={pid:e.pointerId,el,key,id:b?.id,type:b?.type||(key.startsWith('tpl:')?'note':key),pan:!item&&!palette,
      x:e.clientX,y:e.clientY,oldX:uiState.x,oldY:uiState.y,offsetX:(e.clientX-rect.left)/uiState.scale,offsetY:(e.clientY-rect.top)/uiState.scale,drag:false};
  },true);
  document.addEventListener('pointermove',e=>{if(gesture?.pid===e.pointerId)move(gesture,e);},{capture:true,passive:false});
  document.addEventListener('pointerup',e=>{
    if(gesture?.pid!==e.pointerId)return;const g=gesture;clearDrag();
    if(g.drag){skipClick=true;if(e.cancelable)e.preventDefault();release(g,e.clientX,e.clientY).catch(err=>toast(err.message,true));}
  },true);
  document.addEventListener('pointercancel',clearDrag,true);window.addEventListener('blur',clearDrag);
  document.addEventListener('dragstart',e=>{if(e.target.closest('.fac-work'))e.preventDefault();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')clearDrag();});
  document.addEventListener('click',e=>{
    const action=e.target.closest('[data-fact-action]'),palette=e.target.closest('[data-fpalette]'),piece=e.target.closest('[data-fblock]');
    if(skipClick&&e.target.closest('.fac-work')&&e.detail){e.preventDefault();e.stopImmediatePropagation();skipClick=false;return;}
    if(!action&&!palette&&!piece)return;
    e.preventDefault();e.stopImmediatePropagation();
    if(action)act(action.dataset.factAction,action.dataset.id||'').catch(err=>toast(err.message,true));
    else if(palette&&!readOnly())addEditor(palette.dataset.fpalette);
    else if(piece){uiState.selected=piece.dataset.fblock;render();}
  },true);
  function openButton(){return button('脑暴工厂','open','','primary');}
  function cardButton(i){
    const b=data().blocks.find(b=>b.type==='base'&&b.ideaId===i.id);
    const nodes=(i.factoryNodeIds||[]).map(id=>state.planner.nodes.find(n=>n.id===id)?.title).filter(Boolean);
    return (nodes.length?`<div class="fac-card-nodes">${nodes.map(n=>pill(n,'blue')).join('')}</div>`:'')+(readOnly()&&!b?'':button(b?'查看拼装':'放进脑暴工厂','from-idea',i.id,'fac-card-link'));
  }
  return {view,openButton,cardButton,validate};
})();

