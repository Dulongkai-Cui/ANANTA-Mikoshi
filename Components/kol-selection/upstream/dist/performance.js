'use strict';
const KOLPerformance=(()=>{
  let records={},date='',available=false;
  const details=new Map(),loading=new Map();
  async function load(){
    try{const response=await fetch('recent-works.json',{cache:'no-store'});if(!response.ok)return;
      const index=await response.json();if(index.schema===1){records=index.profiles||{};date=index.checkedAt;available=true;}
    }catch{}
  }
  function profile(k){
    const p=records[k.id];if(p)return p;
    const m=k.metrics||{};return {sampleSize:m.sampleSize||0,avg:m.recent20Avg,max:m.recent20Max,checkedAt:m.checkedAt,status:available?'待核实主页':'采样资料暂未载入',caseCount:0,caseKnown:0};
  }
  const plays=v=>v==null?'—':v>=10000?fmt(v/10000)+' 万':fmt(v);
  function age(value){if(!value)return '抓取日期未注明';if(value==='today')return '今日';if(value==='yesterday')return '昨日';return value.replace(/(\d+) (hour|day|week|month|year)s? ago/g,(_,n,u)=>n+({hour:'小时',day:'天',week:'周',month:'个月',year:'年'}[u])+'前').replace(/last month/g,'上月').replace(/last week/g,'上周').replace(/last year/g,'去年');}
  function sourceLabel(p){return p.status==='官网缓存'?'官网清单缓存 · '+age(p.sourceAge):p.checkedAt||p.status;}
  function card(k){
    const p=profile(k);
    return `<div class="perf-card"><div><span>近期均播</span><b>${plays(p.avg)}</b></div><div><span>最高播放</span><b>${plays(p.max)}</b></div><small title="${esc(sourceLabel(p))}">${p.sampleSize?`${p.sampleSize} 条 · ${p.status}`:esc(p.status)}${p.recentCaseKnown?' · 近90天游戏合作均播 '+plays(p.recentCaseAvg):p.peerKnown?' · 近90天共创均播 '+plays(p.peerAvg):''}</small></div>`;
  }
  const evidence=(url,label)=>safeUrl(url)?external(url,label):esc(label);
  function lists(k,p,rows){
    const recent=rows?.recent||[],cases=rows?.cases||[];
    const videoHtml=recent.map((v,i)=>`<tr><td>${i+1}</td><td>${evidence(v.url,v.title||'作者清单第 '+(i+1)+' 条')}</td><td>${esc(v.publishedAt||'—')}</td><td>${esc(v.display||fmt(v.views))}</td></tr>`).join('');
    const caseHtml=cases.map(c=>`<tr><td>${esc(c.game)}</td><td>${evidence(c.url,c.title||c.bvid||'作品链接待补')}</td><td>${c.views==null?'待核':plays(c.views)}</td><td>${esc(c.checkedAt|| (c.sourceAge?age(c.sourceAge):'—'))}</td></tr>`).join('');
    const co=(rows?.coWorks||[]).map(c=>`<tr><td>${esc(c.partners.join('、'))}</td><td>${evidence(c.url,c.title)}</td><td>${plays(c.views)}</td><td>${esc(c.date)}</td></tr>`).join('');
    const coSection=p.peerCount?`<h4>近 90 天 UP 共创</h4><p class="caption">${p.peerKnown} 条有播放 · 共创均播 ${plays(p.peerAvg)}。按作品署名或共同参与记录统计。</p><div class="table-wrap"><table><thead><tr><th>其他参与 UP</th><th>共同作品</th><th>播放</th><th>发布</th></tr></thead><tbody>${co}</tbody></table></div>`:'';
    return `<h4>投稿明细</h4>${videoHtml?`<div class="table-wrap"><table><thead><tr><th>#</th><th>作品</th><th>发布</th><th>播放</th></tr></thead><tbody>${videoHtml}</tbody></table></div>`:`<p class="caption">${esc(rows?.error||p.status)}${p.source?' · '+evidence(p.source,'打开作者投稿页'):''}</p>`}
      ${coSection}<h4>游戏合作案例表现</h4><p class="caption">${p.recentCaseKnown?'近 90 天发布的合作案例中，'+p.recentCaseKnown+' 条有播放，均播 '+plays(p.recentCaseAvg)+'。':p.recentCaseCount?'近 90 天有 '+p.recentCaseCount+' 条合作记录，播放待核。':'近 90 天（8/9—11/6）尚无可计均播的合作作品。'}</p><p class="caption">${p.caseCount?esc(p.caseCount+' 条表内记录，'+p.caseKnown+' 条有播放'+(p.caseKnown?'，已知案例均播 '+plays(p.caseAvg):'')):'当前还没有带来源的合作案例。'}</p>
      ${caseHtml?`<div class="table-wrap"><table><thead><tr><th>合作项目</th><th>作品</th><th>播放</th><th>观测日期</th></tr></thead><tbody>${caseHtml}</tbody></table></div>`:''}`;
  }
  function requestDetail(id){
    if(details.has(id)||loading.has(id))return;
    const promise=fetch('assets/works/'+encodeURIComponent(id)+'.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json();})
      .then(data=>{if(data.id!==id)throw Error();details.set(id,data);}).catch(()=>{details.set(id,{error:'本次明细未能载入，刷新后可重试。'});})
      .finally(()=>{loading.delete(id);const el=document.querySelector('[data-perf-detail="'+CSS.escape(id)+'"]');const k=getKol(id);
        if(el&&k)el.innerHTML=lists(k,profile(k),details.get(id));});
    loading.set(id,promise);
  }
  function detail(k){
    const p=profile(k),has=p.sampleSize||p.caseCount||p.peerCount;
    const members=(p.groupIds||[]).map(getKol).filter(Boolean);
    const group=members.length?`<div class="perf-summary">${members.map(m=>{const x=profile(m);return `<div><small>${esc(m.name)} · ${x.sampleSize} 条</small><strong>${plays(x.avg)}</strong></div>`;}).join('')}</div>`:'';
    if(has)requestDetail(k.id);
    const label=p.sampleSize?`按发布顺序取 ${p.sampleSize} 条；均播为这些作品播放数的算术平均。`:'';
    return `<div class="form-section perf-section"><h3>近期投稿表现 <span class="pill">${p.sampleSize||0} / 20 条</span></h3>
      <div class="perf-summary"><div><small>平均播放</small><strong>${plays(p.avg)}</strong></div><div><small>最高播放</small><strong>${plays(p.max)}</strong></div></div>
      ${group}<p class="caption">${esc([label,sourceLabel(p),p.sampleSize?'播放按平台展示精度折算':''].filter(Boolean).join(' · '))} ${p.source?evidence(p.source,'作者清单'):''}</p>
      <div data-perf-detail="${esc(k.id)}">${has&&!details.has(k.id)?'正在载入作品明细…':lists(k,p,details.get(k.id))}</div></div>`;
  }
  function forExport(workspace){
    const copy=structuredClone(workspace);
    for(const k of copy.kols){
      const p=records[k.id];if(!p)continue;
      k.metrics={...k.metrics,recent20Avg:p.avg,recent20Max:p.max,sampleSize:p.sampleSize,checkedAt:p.checkedAt,
        recentSource:p.source,recentStatus:p.status,sourceAge:p.sourceAge,recentCaseAvg:p.recentCaseAvg,recentCaseCount:p.recentCaseKnown,recentCoWorkAvg:p.peerAvg,recentCoWorkCount:p.peerKnown};
    }
    return copy;
  }
  function matches(k,filter){
    if(!filter)return true;
    const p=profile(k);
    if(filter==='has')return p.sampleSize>0;
    if(filter==='full')return p.sampleSize===20;
    if(filter==='case')return p.recentCaseKnown>0||p.peerKnown>0;
    if(filter==='pending')return !p.sampleSize&&p.status!=='确认零投稿';
    return true;
  }
  return {load,profile,card,detail,forExport,matches};
})();

