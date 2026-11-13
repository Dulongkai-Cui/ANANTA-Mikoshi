/* Pure collaboration graph model. Neither storage nor DOM access. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.KOLGraphCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const uniq=a=>[...new Set(a)];
  const text=v=>typeof v==='string'?v.trim():v==null?'':String(v);
  const FORMS={coappearance:'同框出镜',coplay:'同局联机',cocreate:'共创署名',collaboration:'明确合作 · 形式待核'};
  const LEVELS={official_page:'官方作品页',official_search_index:'官方页搜索摘要',manual:'人工补录 · 待核',source_record:'来源资料 · 待复核'};
  const todayShanghai=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  function workKey(record){
    const raw=text(record.workId||record.bvid||record.videoId||'');
    const url=text(record.url||record.link||record.videoUrl||'');
    const bv=(raw+' '+url).match(/BV[0-9A-Za-z]{10}/i);
    if(bv)return 'BV'+bv[0].slice(2);
    const cleanRaw=raw.replace(/^(?:id:)+/,'');
    const av=(cleanRaw+' '+url).match(/(?:^|\/)(av\d+)(?:$|[/?# ])/i);
    if(av)return 'https://www.bilibili.com/video/'+av[1].toLowerCase();
    const link=url||(/^https?:\/\//i.test(cleanRaw)?cleanRaw:'');
    if(link){try{const u=new URL(link);if(!['http:','https:'].includes(u.protocol))return '';u.hash='';u.hostname=u.hostname.toLowerCase();u.pathname=u.pathname.replace(/\/+$/,'');const opus=u.hostname.endsWith('bilibili.com')&&u.pathname.match(/^\/opus\/(\d+)$/);if(opus)return 'https://www.bilibili.com/opus/'+opus[1];for(const key of [...u.searchParams.keys()])if(/^(?:utm_|spm|share_|from$|vd_source$|share_source$)/i.test(key))u.searchParams.delete(key);u.searchParams.sort();return u.toString().replace(/\/$/,'');}catch{return '';}}
    if(cleanRaw)return 'id:'+cleanRaw;
    // A title alone does not establish a unique common work.
    return '';
  }
  function normalizeEvidence(record,edge={}){
    if(!record||typeof record!=='object')return null;
    const id=workKey(record);if(!id)return null;
    let type=record.type||record.collaborationForm||edge.type;
    if(!FORMS[type]){const hint=text(record.evidenceType);type=/同局|联机实况|同场联机/.test(hint)?'coplay':/同框/.test(hint)?'coappearance':/署名|共创/.test(hint)?'cocreate':'collaboration';}
    let level=record.evidenceLevel||edge.evidenceLevel;
    if(!LEVELS[level])level=edge.origin==='manual'?'manual':'source_record';
    const rawDate=text(record.date||record.publishedAt||'');
    const matched=rawDate.match(/^\d{4}-\d{2}-\d{2}/);
    const parsed=matched?new Date(matched[0]+'T00:00:00Z'):null;
    const date=parsed&&Number.isFinite(parsed.getTime())&&parsed.toISOString().slice(0,10)===matched[0]?matched[0]:null;
    const ownPoints=Array.isArray(record.suggestedSellingPoints)?record.suggestedSellingPoints:Array.isArray(record.sellingPoints)?record.sellingPoints:null;
    return {...record,workId:id,url:text(record.url||record.link||record.videoUrl||(id.startsWith('BV')?'https://www.bilibili.com/video/'+id:'')),title:text(record.title||record.videoTitle||id),date,type,evidenceLevel:level,sourceCheckedAt:record.sourceCheckedAt||record.checkedAt||edge.sourceCheckedAt||null,contentSummary:record.contentSummary||record.creative||record.description||record.content||edge.contentSummary||'',verificationNote:record.verificationNote||'',recommendationScope:ownPoints?'work':'pair',suggestedSellingPoints:uniq(ownPoints||edge.suggestedSellingPoints||edge.sellingPoints||[]).map(Number).filter(n=>n>=1&&n<=13)};
  }
  function buildGraph(kols,rawEdges=[],ideas=[]){
    const nodes=[],byId=new Map(),identity=new Map(),ambiguous=new Set();
    const workAliases=new Map();
    for(const raw of rawEdges||[]){for(const record of [...(raw.evidence||[]),...(raw.records||[]),...(raw.videos||[]),...((raw.url||raw.workId)?[raw]:[])]){const canonical=workKey(record);if(!canonical)continue;for(const alias of record.alternateIds||[]){const key=workKey(typeof alias==='object'?alias:{workId:alias});if(key&&key!==canonical)workAliases.set(key,canonical);}}}
    function index(v,id){v=text(v);if(!v)return;if(identity.has(v)&&identity.get(v)!==id){identity.delete(v);ambiguous.add(v);}else if(!ambiguous.has(v))identity.set(v,id);}
    for(const k of kols||[]){if(!k||k.id==null)continue;const id=String(k.id);if(byId.has(id))continue;const node={...k,id};nodes.push(node);byId.set(id,node);index(k.uid,id);index(k.name,id);for(const alias of k.aliases||[])index(alias,id);}
    function resolve(v){v=text(typeof v==='object'?v?.id:v);if(!v)return null;if(byId.has(v))return v;return identity.get(v)||null;}
    const map=new Map();
    function pair(a,b,kind){a=resolve(a);b=resolve(b);if(!a||!b||a===b)return null;const ids=[a,b].sort(),id=kind+':'+ids.join('|');if(!map.has(id))map.set(id,{id,a:ids[0],b:ids[1],kind,records:[],recordMap:new Map(),ideas:[],sellingPoints:[],reportedCount:0,sourceNotes:[]});return map.get(id);}
    for(const raw of rawEdges||[]){
      const kind=raw.kind==='proposed'?'proposed':'history';
      const edge=pair(raw.a||raw.fromId||raw.sourceId||raw.from||raw.source||raw.fromUid||raw.sourceUid||raw.fromName||raw.sourceName,raw.b||raw.toId||raw.targetId||raw.to||raw.target||raw.toUid||raw.targetUid||raw.toName||raw.targetName,kind);
      if(!edge)continue;
      edge.reportedCount=Math.max(edge.reportedCount,Number(raw.count)||0,Number(raw.observedCount)||0);
      edge.sellingPoints=uniq([...edge.sellingPoints,...(raw.suggestedSellingPoints||[]),...(raw.sellingPoints||[])]).map(Number).filter(n=>n>=1&&n<=13);
      if(raw.familiarityNote)edge.sourceNotes.push(raw.familiarityNote);
      const records=[...(raw.evidence||[]),...(raw.records||[]),...(raw.videos||[])];
      if(raw.url||raw.videoUrl||raw.workId)records.push(raw);
      for(const r of records){const normalized=normalizeEvidence(r,raw);if(!normalized)continue;normalized.workId=workAliases.get(normalized.workId)||normalized.workId;const existing=edge.recordMap.get(normalized.workId);
        if(!existing)edge.recordMap.set(normalized.workId,{...normalized,forms:[normalized.type],levels:[normalized.evidenceLevel],sourceVersions:[normalized]});
        else {existing.forms=uniq([...existing.forms,normalized.type]);existing.levels=uniq([...existing.levels,normalized.evidenceLevel]);existing.sourceVersions.push(normalized);if(!existing.date&&normalized.date)existing.date=normalized.date;if(!existing.contentSummary&&normalized.contentSummary)existing.contentSummary=normalized.contentSummary;}
      }
    }
    for(const idea of ideas||[]){if(idea.archived)continue;const ids=uniq((idea.kolIds||[]).map(resolve).filter(Boolean));for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){const e=pair(ids[i],ids[j],'proposed');if(!e.ideas.some(x=>x.id===idea.id))e.ideas.push(idea);e.sellingPoints=uniq([...e.sellingPoints,...(idea.sellingPoints||[])]);}}
    const edges=[];for(const edge of map.values()){edge.records=[...edge.recordMap.values()];delete edge.recordMap;edge.count=edge.kind==='history'?edge.records.length:0;edge.unknownDates=edge.records.filter(r=>!r.date).length;edge.sourceNotes=uniq(edge.sourceNotes);if(edge.kind==='proposed'||edge.records.length)edges.push(edge);}
    return {nodes,edges,byId,resolve};
  }
  function matchingVersions(record,options){
    const form=options.form||'all',level=options.evidence||'all';
    // Form and proof must be supported together by the same source version.
    const versions=record.sourceVersions?.length?record.sourceVersions:[record];
    const matches=versions.filter(v=>(form==='all'||v.type===form)&&(level==='all'||v.evidenceLevel===level));
    if(!matches.length)return [];
    if(!options.years||options.years==='all')return matches;
    const dateEnd=options.asOf||todayShanghai(),asOf=new Date(dateEnd+'T00:00:00Z');
    const cutoff=new Date(asOf);cutoff.setUTCFullYear(cutoff.getUTCFullYear()-Number(options.years));
    return matches.filter(v=>!v.date?!!options.includeUnknownDates:v.date>=cutoff.toISOString().slice(0,10)&&v.date<=dateEnd);
  }
  const evidenceMatches=(record,options)=>matchingVersions(record,options).length>0;
  function filterGraph(model,options={}){
    const eligible=new Set(model.nodes.filter(n=>options.people!=='selected'||n.selected).map(n=>n.id));
    const minCount=Math.max(1,Number(options.minCount)||1);
    let history=model.edges.filter(e=>e.kind==='history'&&eligible.has(e.a)&&eligible.has(e.b)).map(e=>{const records=e.records.map(r=>{const matches=matchingVersions(r,options);if(!matches.length)return null;return {...r,...matches[0],sourceVersions:r.sourceVersions,forms:uniq(matches.map(v=>v.type)),levels:uniq(matches.map(v=>v.evidenceLevel)),dateConflicts:uniq((r.sourceVersions||[r]).map(v=>v.date||'未知'))};}).filter(Boolean);return {...e,records,count:records.length,totalRecordedCount:e.records.length,sellingPoints:uniq(records.flatMap(r=>r.suggestedSellingPoints||[])),recommendationScope:records.some(r=>r.recommendationScope==='pair')?'含关系整体建议':'当前作品建议',unknownDates:records.filter(r=>!r.date).length};}).filter(e=>e.count>=minCount);
    const adjacency=new Map([...eligible].map(id=>[id,new Set()]));
    for(const e of history){adjacency.get(e.a).add(e.b);adjacency.get(e.b).add(e.a);}
    const distances=new Map();const focus=model.resolve(options.focus);
    if(focus&&eligible.has(focus)){distances.set(focus,0);const q=[focus];for(let h=0;h<q.length;h++){const id=q[h];for(const other of adjacency.get(id)||[]){if(!distances.has(other)){distances.set(other,distances.get(id)+1);q.push(other);}}}}
    let visible=new Set(eligible);if(options.depth&&options.depth!=='all'&&focus)visible=new Set([...distances].filter(([,d])=>d<=Number(options.depth)).map(([id])=>id));
    if(options.showIsolates===false)visible=new Set([...visible].filter(id=>adjacency.get(id)?.size||id===focus));
    history=history.filter(e=>visible.has(e.a)&&visible.has(e.b));
    const proposed=options.showProposed?model.edges.filter(e=>e.kind==='proposed'&&visible.has(e.a)&&visible.has(e.b)):[];
    const connectedIds=new Set(history.flatMap(e=>[e.a,e.b]));
    const nodes=model.nodes.filter(n=>visible.has(n.id));
    return {nodes,edges:[...history,...proposed],history,proposed,connectedIds,isolates:nodes.filter(n=>!connectedIds.has(n.id)),adjacency,distances,focus,model,options,hiddenCount:model.nodes.length-nodes.length};
  }
  function components(nodes,edges){const ids=new Set(nodes.map(n=>n.id)),adj=new Map([...ids].map(id=>[id,new Set()]));for(const e of edges){if(ids.has(e.a)&&ids.has(e.b)){adj.get(e.a).add(e.b);adj.get(e.b).add(e.a);}}const seen=new Set(),result=[];for(const id of ids){if(seen.has(id)||!adj.get(id).size)continue;const component=[],q=[id];seen.add(id);for(let h=0;h<q.length;h++){const current=q[h];component.push(current);for(const next of adj.get(current)){if(!seen.has(next)){seen.add(next);q.push(next);}}}result.push(component);}return result.sort((a,b)=>b.length-a.length||a[0].localeCompare(b[0]));}
  function layoutGraph(graph,overrides={}){
    const positions=new Map(),groups=components(graph.nodes,graph.history);let cursorX=0,cursorY=0,rowHeight=0;
    const areaWidth=1450;
    for(let gi=0;gi<groups.length;gi++){
      const ids=groups[gi].sort((a,b)=>(graph.adjacency.get(b)?.size||0)-(graph.adjacency.get(a)?.size||0)||a.localeCompare(b));
      let rings=1,capacity=14;while(capacity<ids.length-1){rings++;capacity+=10+rings*4;}
      const radius=145+(rings-1)*95,width=radius*2+160,height=radius*2+130;
      if(cursorX&&cursorX+width>areaWidth){cursorX=0;cursorY+=rowHeight+60;rowHeight=0;}
      const cx=cursorX+width/2,cy=cursorY+height/2;
      if(ids.length===2){positions.set(ids[0],{x:cx-95,y:cy,group:gi});positions.set(ids[1],{x:cx+95,y:cy,group:gi});}
      else if(ids.length===3){positions.set(ids[0],{x:cx,y:cy-120,group:gi});positions.set(ids[1],{x:cx-125,y:cy+95,group:gi});positions.set(ids[2],{x:cx+125,y:cy+95,group:gi});}
      else {positions.set(ids[0],{x:cx,y:cy,group:gi});let index=1;for(let ring=1;index<ids.length;ring++){const count=Math.min(10+ring*4,ids.length-index),r=ring===1?145:145+(ring-1)*95;for(let j=0;j<count;j++){const angle=j/count*Math.PI*2-Math.PI/2;positions.set(ids[index++],{x:cx+Math.cos(angle)*r,y:cy+Math.sin(angle)*r,group:gi});}}}
      cursorX+=width+60;rowHeight=Math.max(rowHeight,height);
    }
    const connectedBounds=boundsOf([...positions.values()]);
    const isolateStartX=groups.length?Math.max(connectedBounds.maxX+240,800):40,isolateStartY=50;
    const isolates=graph.isolates.slice().sort((a,b)=>a.name.localeCompare(b.name,'zh-CN'));
    const columns=Math.max(12,Math.min(30,Math.ceil(Math.sqrt(isolates.length*1.6))));
    isolates.forEach((n,i)=>positions.set(n.id,{x:isolateStartX+(i%columns)*55,y:isolateStartY+Math.floor(i/columns)*59,group:-1}));
    for(const [id,pos] of Object.entries(overrides)){if(positions.has(id)&&Number.isFinite(pos.x)&&Number.isFinite(pos.y))positions.set(id,{...positions.get(id),x:pos.x,y:pos.y});}
    return {positions,groups,connectedBounds:boundsOf([...graph.connectedIds].map(id=>positions.get(id)).filter(Boolean)),allBounds:boundsOf([...positions.values()]),isolateLabel:isolates.length?{x:isolateStartX-10,y:isolateStartY-65,count:isolates.length}:null};
  }
  function boundsOf(points){if(!points.length)return {minX:0,minY:0,maxX:500,maxY:350,width:500,height:350};const xs=points.map(p=>p.x),ys=points.map(p=>p.y),minX=Math.min(...xs)-55,minY=Math.min(...ys)-65,maxX=Math.max(...xs)+55,maxY=Math.max(...ys)+75;return {minX,minY,maxX,maxY,width:maxX-minX,height:maxY-minY};}
  function fitTransform(bounds,width,height,padding=70){const k=Math.max(.08,Math.min(1.65,Math.min((width-padding*2)/Math.max(1,bounds.width),(height-padding*2)/Math.max(1,bounds.height))));return {k,x:width/2-(bounds.minX+bounds.maxX)/2*k,y:height/2-(bounds.minY+bounds.maxY)/2*k};}
  return {FORMS,LEVELS,todayShanghai,workKey,normalizeEvidence,buildGraph,evidenceMatches,filterGraph,components,layoutGraph,boundsOf,fitTransform};
});
