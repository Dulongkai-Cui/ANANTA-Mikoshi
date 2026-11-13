'use strict';
const KOLPlanner = (() => {
  const P=KOLPlan;

  const view={poolFilter:'all',query:'',mode:'month',day:'',expanded:'',tray:matchMedia('(min-width:900px)').matches,trayFilter:'all',trayQuery:'',picked:''};
  const preferenceKey='ananta-planner-calendar-v2';
  try {
    const s=JSON.parse(localStorage.getItem(preferenceKey)||'{}');
    if(['month','week'].includes(s.mode))view.mode=s.mode;
    if(P.validDay(s.day))view.day=s.day;
    if(P.validDay(s.expanded))view.expanded=s.expanded;
    if(typeof s.tray==='boolean')view.tray=s.tray;
  }catch{}
  function rememberView(){
    try{const {mode,day,expanded,tray}=view;localStorage.setItem(preferenceKey,JSON.stringify({mode,day,expanded,tray}));}catch{}
  }
  const readOnly=()=>window.KOLPersistence?.readonly===true;
  const weekNames=['周一','周二','周三','周四','周五','周六','周日'];
  const shortDay=d=>d?d.replace(/^\d{4}-/,'').replace('-','/'): '日期待定';
  const allPeople=()=>new Map(state.kols.map(k=>[k.id,k]));
  const allIdeas=()=>new Map(state.ideas.map(i=>[i.id,i]));
  const idFor=prefix=>prefix+'-'+crypto.randomUUID();
  const plan=()=>state.planner;
  const btn=(label,action,id='',style='')=>`<button type="button" class="btn small ${style}" data-plan-action="${action}" data-key="${esc(id)}">${esc(label)}</button>`;
  const editBtn=(...args)=>readOnly()?'':btn(...args);
  const note=(message)=>`<p class="plan-empty">${esc(message)}</p>`;
  const firstLine=(text,max=100)=>String(text||'').length<=max?text:String(text).slice(0,max)+'…';
  function tagList(ids) {
    return (ids||[]).slice(0,3).map(id=>pill(shortSell(id),'blue')).join('');
  }
  function matchesText(value,query) {
    return String(value||'').toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
  }
  function refsText(refs,items) {
    const keys=new Set(refs.map(P.refKey));
    return items.filter(x=>keys.has(P.refKey(x))).map(x=>x.label);
  }
  function datesFor(kind,id) {
    const p=plan();
    const relevant=new Set([kind+':'+id]);
    if(kind!=='match') for(const m of p.matches) {
      if(kind==='kol'?m.kolIds.includes(id):m.ideaId===id) relevant.add('match:'+m.id);
    }
    return p.events.filter(e=>e.refs.some(r=>relevant.has(P.refKey(r)))).sort((a,b)=>a.start.localeCompare(b.start));
  }
  function scheduleFooter(kind,id) {
    const dates=datesFor(kind,id);
    const first=dates.find(e=>e.start);
    const label=first?(first.precision==='week'?shortDay(first.start)+' 当周':shortDay(first.start)+' 起'):dates.length?'待定具体日期':'';
    return `<div class="plan-card-foot"><span>${dates.length?label+' · '+dates.length+' 项排期':'待排期'}</span>${editBtn('排入日历','schedule',kind+':'+id)}</div>`;
  }
  function kolCardView(k) {
    const matched=plan().matches.filter(m=>m.kolIds.includes(k.id)).length;
    return `<article class="plan-card"><div class="plan-card-head"><button class="plan-profile" data-kol="${esc(k.id)}">${avatar(k)}<span><strong>${esc(k.name)}</strong><small>${esc(k.category)} · ${esc(k.contentType||'待分类')}</small></span></button>${pill(matched?matched+' 个组合':'待配创意',matched?'green':'')}</div>${KOLPerformance.card(k)}<div class="tags">${tagList(k.sellingPoints)}</div><div class="plan-card-actions">${editBtn('配创意','pair-kol',k.id)}${editBtn('移出','drop-kol',k.id,'quiet')}</div>${scheduleFooter('kol',k.id)}</article>`;
  }
  function ideaCardView(i) {
    const matched=plan().matches.filter(m=>m.ideaId===i.id).length;
    return `<article class="plan-card"><div class="plan-card-head"><button class="plan-text-link" data-idea="${esc(i.id)}"><strong>${esc(i.title)}</strong></button>${pill(i.archived?'已归档':matched?matched+' 个组合':'待配 UP',matched?'green':'')}</div><p>${esc(firstLine(i.description)||i.type)}</p><div class="tags">${tagList(i.sellingPoints)}</div><div class="plan-card-actions">${editBtn('配 UP','pair-idea',i.id)}${editBtn('移出','drop-idea',i.id,'quiet')}</div>${scheduleFooter('idea',i.id)}</article>`;
  }
  function pairCard(m,people,ideas) {
    const idea=ideas.get(m.ideaId);
    return `<article class="plan-card plan-pair"><div class="plan-pair-idea"><small>创意</small><button class="plan-text-link" data-idea="${esc(idea.id)}"><strong>${esc(idea.title)}</strong></button></div><div class="plan-pair-people"><small>出镜 UP</small><div>${m.kolIds.map(id=>`<button class="plan-person" data-kol="${esc(id)}">${avatar(people.get(id),'sm')}${esc(people.get(id).name)}</button>`).join('')}</div></div><div class="tags">${tagList(idea.sellingPoints)}</div><div class="plan-card-actions">${editBtn('调整阵容','pair-edit',m.id)}${editBtn('解散','drop-match',m.id,'quiet')}</div>${scheduleFooter('match',m.id)}</article>`;
  }
  function poolView() {
    const p=plan(),pe=allPeople(),ide=allIdeas(),q=view.query;
    const filter=view.poolFilter;
    const kolRows=selectedKols().filter(k=>matchesText([k.name,k.uid,k.category,k.contentType].join(' '),q));
    const ideaRows=p.ideaIds.map(id=>ide.get(id)).filter(i=>matchesText([i.title,i.type,i.description].join(' '),q));
    const pairs=p.matches.filter(m=>matchesText([ide.get(m.ideaId).title,...m.kolIds.map(id=>pe.get(id).name)].join(' '),q));
    const column=(label,count,action,actionLabel,visible,html,empty)=> visible?`<section class="plan-column"><header><h2>${label} <span>${count}</span></h2>${editBtn(actionLabel,action)}</header><div class="plan-column-body">${html||note(empty)}</div></section>`:'';
    const solo=filter==='unmatched';
    const k=kolRows.filter(k=>!solo||!p.matches.some(m=>m.kolIds.includes(k.id)));
    const ideas=ideaRows.filter(i=>!solo||!p.matches.some(m=>m.ideaId===i.id));
    return pageHead('KOL + 创意中选池','CAST / SELECTION','先收人选或创意，搭好阵容后排期。单个人选和单个创意也能直接进日历。',btn('查看排期日历','calendar')+editBtn('组合人选与创意','pair-new','','primary'))+
      `<div class="plan-toolbar"><label class="plan-search">${icon('search')}<input id="plan-pool-search" placeholder="搜索人名、分区或创意" value="${esc(q)}"></label><div class="plan-switch">${[['all','全部'],['unmatched','待配对'],['pairs','已组合']].map(([v,t])=>btn(t,'pool-filter',v,v===filter?'is-on':'')).join('')}</div></div><div class="plan-columns ${filter==='pairs'?'only-pairs':solo?'two-columns':''}">${column('中选 UP',k.length,'library-kol','加入 UP',filter!=='pairs',k.map(kolCardView).join(''),'没有符合条件的人选。')}${column('中选创意',ideas.length,'library-idea','加入创意',filter!=='pairs',ideas.map(ideaCardView).join(''),'可从提词板加入创意，之后再配 UP。')}${column('已配组合',pairs.length,'pair-new','新组合',!solo,pairs.map(m=>pairCard(m,pe,ide)).join(''),'从任意一侧点「配创意」或「配 UP」，组合会出现在这里。')}</div>`;
  }
// Dates are civil dates (Asia/Shanghai). A week's tentative plans never become seven daily commitments.
  const phaseColor = {'node-launch':0,'node-tga':1,'node-trial':2,'node-release':3};
  const kindNames={kol:'UP',idea:'创意',match:'组合'};
  const dataOf = (action,key='',cls='',extra='')=>`class="${cls}" data-plan-action="${action}" data-key="${esc(key)}" ${extra}`;
  const ab=(title,action,key,cls='',extra='')=>`<button type="button" ${dataOf(action,key,cls,extra)}>${title}</button>`;
  function monthStart(d){return d.slice(0,7)+'-01';}
  function monthStep(d,n){
    const x=new Date(monthStart(d)+'T00:00:00Z');x.setUTCMonth(x.getUTCMonth()+n);
    return x.toISOString().slice(0,10);
  }
  const monthLabel=d=>Number(d.slice(0,4))+' 年 '+Number(d.slice(5,7))+' 月';
  const dateLabel=d=>Number(d.slice(5,7))+' 月 '+Number(d.slice(8))+' 日';
  const dow=d=>weekNames[(new Date(d+'T00:00:00Z').getUTCDay()+6)%7];
  const when=(a,b)=>(a.time||'99').localeCompare(b.time||'99')||a.title.localeCompare(b.title,'zh-CN');
  function dataset(){
    const p=plan(), items=P.poolItems(state), by=new Map(items.map(x=>[P.refKey(x),x]));
    const nodes=new Map(p.nodes.map(n=>[n.id,n])), roots=p.nodes.filter(n=>!n.parentId).sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999'));
    const root=id=>{const n=nodes.get(id);return n?.parentId?nodes.get(n.parentId):n;};
    const colors=new Map(roots.map((n,i)=>[n.id,'ph'+(phaseColor[n.id]??(i+4)%6)]));
    const dated=roots.filter(n=>n.date);
    const stages=dated.map((n,i)=>{
      const last=[n.date,...p.nodes.filter(x=>x.parentId===n.id&&x.date).map(x=>x.date),...p.events.filter(e=>root(e.nodeId)?.id===n.id&&e.end).map(e=>e.end)].sort().at(-1);
      const next=dated.slice(i+1).find(x=>x.date>n.date);
      return {node:n,from:n.date,to:next?P.shift(next.date,-1):last};
    });
    const phase=d=>stages.filter(s=>s.from<=d&&d<=s.to).at(-1)?.node;
    const marks=d=>p.nodes.filter(n=>n.date===d);
    const daily=d=>p.events.filter(e=>(e.precision||'day')==='day'&&e.start<=d&&e.end>=d).sort(when);
    const weeks=(s,e)=>p.events.filter(x=>x.precision==='week'&&x.start<=e&&x.end>=s).sort(when);
    const ideas=allIdeas(), pairedIdeas=new Map(), libraryIdeas=new Map();
    function add(map,id,title){if(!title)return;if(!map.has(id))map.set(id,new Set());map.get(id).add(title);}
    for(const m of p.matches)for(const id of m.kolIds)add(pairedIdeas,id,ideas.get(m.ideaId)?.title);
    for(const i of state.ideas)if(!i.archived)for(const id of (i.kolIds||[]))add(libraryIdeas,id,i.title);
    return {p,items,by,people:allPeople(),ideas,pairedIdeas,libraryIdeas,nodes,roots,root,colors,phase,marks,daily,weeks};
  }
  function defaultDay(c){
    const today=P.today();
    const dates=[...c.p.nodes.map(n=>n.date),...c.p.events.flatMap(e=>[e.start,e.end])].filter(P.validDay).sort();
    if(dates.some(d=>d.slice(0,7)===today.slice(0,7))||c.p.events.some(e=>e.start&&e.start<=today&&today<=e.end))return today;
    return dates.find(d=>d>=today)||dates.at(-1)||today;
  }
  function faces(list,limit=3){
    if(!list.length)return '';
    return `<span class="cal-faces" aria-hidden="true">${list.slice(0,limit).map(k=>avatar(k,'sm')).join('')}${list.length>limit?`<b>+${list.length-limit}</b>`:''}</span>`;
  }
  const ideaIcon='<span class="cal-idea-icon" aria-hidden="true">✦</span>';
  function objectText(item,c){
    const people=item.people.map(id=>c.people.get(id)).filter(Boolean), idea=c.ideas.get(item.idea);
    let subtitle=people.length?people.map(k=>k.name).join(' · '):'待配 UP';
    if(item.kind==='kol'){
      const pairs=c.pairedIdeas.get(item.id),suggestions=c.libraryIdeas.get(item.id);
      subtitle=pairs?.size?'已配：'+[...pairs].join(' / '):suggestions?.size?'提词板：'+[...suggestions].join(' / '):'待配创意';
    }
    return {people,title:idea?.title||people[0]?.name||item.label,subtitle};
  }
  function eventText(e,c){
    const refs=e.refs.map(r=>c.by.get(P.refKey(r))).filter(Boolean);
    const people=[...new Set(refs.flatMap(it=>it.people))].map(id=>c.people.get(id)).filter(Boolean);
    const titles=[...new Set(refs.map(it=>c.ideas.get(it.idea)?.title).filter(Boolean))];
    const deduced=refs.length&&e.title===refs.map(it=>it.label).join('、');
    const heading=deduced&&titles.length?titles.join(' / '):e.title;
    const extra=titles.filter(t=>!heading.includes(t));
    const names=people.map(k=>k.name).join(' · ');
    return {people,heading,extra,subtitle:people.length?(names===heading&&!titles.length?'创意待定':names):titles.length?'待配 UP':''};
  }
  function eventPreview(e,c,full=false){
    const a=eventText(e,c), r=c.root(e.nodeId);
    const main=esc(a.heading), sub=[...a.extra,a.subtitle].filter(Boolean).join(' · ');
    const facesHtml=faces(a.people,full?5:2)||(e.refs.some(r=>r.kind==='idea')?ideaIcon:'');
    return ab(`${facesHtml}<span class="cal-event-text"><strong>${e.time&&!full?esc(e.time)+' ':''}${main}</strong>${sub&&sub!==a.heading?`<small>${esc(sub)}</small>`:''}</span>${full?`<span class="cal-event-meta">${e.time||'时间待定'} · ${esc(e.status)}</span>`:''}`,'edit-event',e.id,
      `cal-event ${full?'full':''} ${c.colors.get(r?.id)||'ph-none'}`,`title="${esc([a.heading,sub,e.status].filter(Boolean).join(' · '))}"`);
  }
  function dayCell(d,c){
    const phase=c.phase(d), cls=c.colors.get(phase?.id)||'ph-none', marks=c.marks(d), ev=c.daily(d), off=d.slice(0,7)!==view.day.slice(0,7)&&view.mode==='month';
    const compactNodes=marks.slice(0,view.mode==='week'?4:2), compactEv=ev.slice(0,view.mode==='week'?7:2);
    const hidden=marks.length+ev.length-compactNodes.length-compactEv.length;
    return `<div class="cal-cell ${cls} ${off?'outside':''} ${d===view.expanded?'active':''} ${P.today()===d?'is-today':''}" data-cal-date="${d}">
      ${ab(`<span class="cal-day-num">${Number(d.slice(8))}</span>${P.today()===d?'<small>今天</small>':''}`,'cal-day',d,'cal-date-btn',`aria-label="${d} ${dow(d)}，${ev.length} 项排期" aria-expanded="${view.expanded===d}"`)}
      <div class="cal-cell-lines">${compactNodes.map(n=>ab(`<i></i>${esc(n.title)}`,'cal-day',d,`cal-mark ${!n.parentId?'major':''} ${c.colors.get(c.root(n.id)?.id)||'ph-none'}`,`title="${esc(n.title)}"`)).join('')}${compactEv.map(e=>eventPreview(e,c)).join('')}${hidden?ab('另有 '+hidden+' 项 ›','cal-day',d,'cal-more'):''}</div>
    </div>`;
  }
  function dayDetail(d,c){
    const phase=c.phase(d),marks=c.marks(d),ev=c.daily(d),cls=c.colors.get(phase?.id)||'ph-none';
    return `<section class="cal-detail ${cls}" aria-label="${dateLabel(d)}详情" data-detail-date="${d}" data-cal-date="${d}">
      <div class="cal-detail-head"><div><small>当日安排</small><h3>${dateLabel(d)}<span>${dow(d)}</span></h3></div><div class="cal-detail-actions">${editBtn('＋ 添加排期','add-on-day','loose@'+d)}${btn('收起 ↑','collapse-day')}</div></div>
      ${marks.length?`<div class="cal-detail-nodes">${marks.map(n=>`<span class="cal-legend-bit ${c.colors.get(c.root(n.id)?.id)||'ph-none'}"><i></i>${esc(n.title)}</span>`).join('')}</div>`:''}
      ${ev.length?`<div class="cal-detail-events">${ev.map(e=>eventPreview(e,c,true)).join('')}</div>`:`<div class="cal-day-empty">${readOnly()?'这一天还没有排期。':'这一天还没有排期，可从底部中选池拖入人选或创意。'}</div>`}
    </section>`;
  }
  function calendarGrid(c){
    const week=view.mode==='week',start=week?P.monday(view.day):P.monday(monthStart(view.day)),
      end=week?P.shift(start,6):P.shift(P.monday(P.shift(monthStep(view.day,1),-1)),6);
    let html='';
    for(let first=start;first<=end;first=P.shift(first,7)){
      const last=P.shift(first,6), coarse=c.weeks(first,last);
      if(coarse.length)html+=`<div class="cal-week-hold"><span>本周待定日</span>${coarse.map(e=>ab(esc(eventText(e,c).heading),'edit-event',e.id,'cal-week-chip')).join('')}</div>`;
      html+=`<div class="cal-week-row">${P.days(first,last).map(d=>dayCell(d,c)).join('')}</div>`;
      if(view.expanded&&view.expanded>=first&&view.expanded<=last) html+=dayDetail(view.expanded,c);
    }
    return `<div class="cal-grid ${week?'one-week':''}" style="--cal-weeks:${P.days(start,end).length/7}"><div class="cal-weekdays">${weekNames.map(x=>`<span>${x}</span>`).join('')}</div>${html}</div>`;
  }
  function stageStrip(c){
    const items=c.roots.map(n=>ab(`<i></i><b>${esc(n.title)}</b><small>${esc(shortDay(n.date))}</small>`,'stage',n.id,'cal-phase '+c.colors.get(n.id),`title="${esc(n.title)} · ${esc(n.date||'日期待定')}"`)).join('');
    return `<div class="cal-phases"><span class="cal-phase-label">传播节点</span>${items||'<small>尚无传播节点</small>'}</div>`;
  }
  function filterItems(c){
    const f=view.trayFilter,q=view.trayQuery.trim().toLowerCase();
    return ['match','kol','idea'].filter(kind=>f==='all'||kind===f).flatMap(kind=>c.items.filter(x=>x.kind===kind)).filter(x=>{
      if(!q)return true;
      const who=x.people.map(id=>c.people.get(id)).filter(Boolean);
      return [x.label,...who.flatMap(k=>[k.name,k.category,k.uid]),c.ideas.get(x.idea)?.title,objectText(x,c).subtitle].join(' ').toLowerCase().includes(q);
    });
  }
  function trayCards(c){
    const rows=filterItems(c);
    return rows.map(it=>{
      const a=objectText(it,c),key=P.refKey(it), active=view.picked===key;
      const upper=it.kind==='kol'?esc(a.people[0]?.category||'中选 UP'):kindNames[it.kind];
      return `<button type="button" class="cal-token ${active?'picked':''} token-${it.kind}" data-token="${esc(key)}" aria-pressed="${active}" ${readOnly()?'aria-disabled="true"':''} title="${esc([a.title,a.subtitle].join(' · '))}">
        ${faces(a.people,2)||ideaIcon}<span class="cal-token-text"><small>${upper}</small><strong>${esc(a.title)}</strong><em>${esc(a.subtitle)}</em></span>${readOnly()?'':'<span class="cal-grip" aria-hidden="true">⠿</span>'}</button>`;
    }).join('')||`<div class="cal-tray-empty">${view.trayQuery?'没有匹配项，试试人名或创意名。':view.trayFilter==='match'?'还没有组合。可到完整中选池把 UP 和创意配在一起。':'这里暂时没有条目，可到完整中选池加入。'}</div>`;
  }
  function trayTabs(c){
    return [['all','全部'],['kol','UP'],['idea','创意'],['match','组合']].map(([f,l])=>ab(esc(l)+' <b>'+ (f==='all'?c.items.length:c.items.filter(i=>i.kind===f).length)+'</b>','tray-filter',f,'cal-tray-tab '+(view.trayFilter===f?'on':''),`aria-pressed="${view.trayFilter===f}"`)).join('');
  }
  function trayView(c){
    const preview=c.items.filter(i=>i.kind==='kol').slice(0,4).map(i=>c.people.get(i.id)).filter(Boolean);
    const picked=c.by.get(view.picked);
    return `<section class="cal-tray ${view.tray?'open':''}" aria-label="KOL + 创意中选池"><button class="cal-tray-toggle" type="button" data-plan-action="tray-toggle" data-dock-handle aria-expanded="${view.tray}">
      <span class="cal-pull-line"></span><span class="cal-tray-caption"><span class="cal-tray-symbol">${icon('pair')}</span><strong>KOL + 创意中选池</strong><b>${c.items.length}</b></span>
      <span class="cal-dock-faces">${faces(preview,4)}</span><span class="cal-tray-hint">${readOnly()?'查看中选人选与创意':picked?'已选 '+esc(objectText(picked,c).title)+' · 点击日期排入':'拖到日期格排期，也可先点卡片再点日期'}</span><span class="cal-open-label">${view.tray?'收起 ↓':'拉出选人 ↑'}</span></button>
      ${view.tray?`<div class="cal-tray-tools"><div class="cal-tray-tabs">${trayTabs(c)}</div><label class="cal-tray-search">${icon('search')}<input id="cal-tray-query" type="search" value="${esc(view.trayQuery)}" placeholder="搜 UP 或创意" aria-label="搜索中选池"></label>${btn('完整中选池 ↗','pool')}</div><div class="cal-tray-items">${trayCards(c)}</div>`:''}</section>`;
  }
const budgetNumber = new Intl.NumberFormat('zh-CN', {maximumFractionDigits:6});
  function budgetDisplay(bucket) {
    return bucket.priced || !bucket.pending ? budgetNumber.format(bucket.cents / P.budgetCentsPerWan) : '待估';
  }

  function nodeBudgetTable(c) {
    const {phases, before, undated} = P.calendarBudgets(c, allocations);
    const notes = [[before,'首节点前'],[undated,'日期待定']].filter(([bucket]) => bucket.bookings);
    const extras = notes.map(([bucket,label]) => {
      const amount = bucket.priced ? budgetDisplay(bucket) + ' 万元' : '';
      const pending = bucket.pending ? bucket.pending + ' 项待估' : '';
      return `<span data-budget-extra="${label}">${label} · ${[amount,pending].filter(Boolean).join('，')}</span>`;
    }).join('');
    const nodeNames = phases.map(p =>
      `<th scope="col" title="${esc(p.date ? p.date + ' 起' : '节点日期待定')}"><span class="cal-budget-node ${c.colors.get(p.id) || 'ph-none'}"><i></i>${esc(p.label)}</span></th>`
    ).join('');
    const estimates = phases.map(p => {
      const detail = p.bookings + ' 项排期，' + p.pending + ' 项费用待估';
      const unknown = p.pending && p.priced ? `<small>+${p.pending} 项待估</small>` : '';
      return `<td data-budget-used="${p.id}" title="${esc(detail)}" class="${p.cents > p.limit * P.budgetCentsPerWan ? 'over' : ''}">${budgetDisplay(p)}${unknown}</td>`;
    }).join('');
    const limits = phases.map(p => `<td>${budgetNumber.format(p.limit)}</td>`).join('');
    return `<div class="cal-budget-wrap"><table class="cal-budget-table" aria-label="全期节点预算，单位万元">
      <thead><tr><th scope="col">节点预算 <small>万元</small></th>${nodeNames}</tr></thead>
      <tbody><tr class="cal-budget-used"><th scope="row" title="按排期开始日归属，累计所有月份的已知报价">已排预估</th>${estimates}</tr>
      <tr class="cal-budget-limit"><th scope="row" title="11 月 6 日节点与采购预算核算">节点额度</th>${limits}</tr></tbody></table>
      ${extras ? `<div class="cal-budget-notes">${extras}</div>` : ''}</div>`;
  }

  function calendarView(){
    const c=dataset();
    if(!P.validDay(view.day))view.day=defaultDay(c);
    if(view.picked&&!c.by.has(view.picked))view.picked='';
    rememberView();
    const isWeek=view.mode==='week', first=P.monday(view.day),last=P.shift(first,6);
    const pending=c.p.events.filter(e=>e.precision==='node'||e.precision==='week').length;
    return `<div class="cal-workspace"><header class="cal-heading"><div><small>CALENDAR / SCHEDULE</small><h1>排期日历</h1></div>${nodeBudgetTable(c)}<div class="cal-heading-actions">${btn('节点管理','node-manager')}${btn('日期待定 '+pending,'pending-events')}${editBtn('＋ 添加排期','event-new','','primary')}</div></header>
      <div class="cal-scroll"><div class="cal-board"><div class="cal-nav"><div class="cal-month-title"><h2>${monthLabel(view.day)}</h2>${isWeek?`<small>${shortDay(first)}–${shortDay(last)}</small>`:''}</div>
      <div class="cal-nav-controls">${ab('‹','prev','','cal-arrow','aria-label="上一'+(isWeek?'周':'月')+'"')}${ab('今天','today','','cal-today')}${ab('›','next','','cal-arrow','aria-label="下一'+(isWeek?'周':'月')+'"')}</div>
      <div class="cal-mode">${ab('月历','mode','month',!isWeek?'on':'')}${ab('周历','mode','week',isWeek?'on':'')}</div></div>${stageStrip(c)}${calendarGrid(c)}</div></div>
      ${trayView(c)}</div>`;
  }
  function dialog(title,html,onSave,{label='保存',onDelete=null,editable=true}={}) {
    const panel=document.createElement('dialog');
    panel.className='plan-dialog';
    panel.innerHTML=`<form><header><h2>${esc(title)}</h2><button type="button" data-dismiss aria-label="关闭">×</button></header><div class="plan-form-body">${html}</div><p class="plan-form-error" role="alert"></p><footer>${onDelete?'<button type="button" class="btn danger" data-delete>删除</button>':''}<span></span><button type="button" class="btn" data-dismiss>${editable?'取消':'关闭'}</button>${editable?`<button class="btn primary" type="submit">${esc(label)}</button>`:''}</footer></form>`;
    document.body.append(panel);
    const form=panel.querySelector('form'), error=panel.querySelector('[role=alert]');
    let busy=false;
    async function run(task) {
      if(busy||readOnly()) return;
      busy=true;
      const submit=form.querySelector('[type=submit]');
      if(submit) submit.disabled=true;
      try {
        if(await task()!==false) panel.close();
        else error.textContent='修改尚未保存，请核对页面提示。';
      } catch(err){error.textContent=err.message;}
      finally{busy=false;if(submit) submit.disabled=false;}
    }
    panel.addEventListener('close',()=>panel.remove(),{once:true});
    panel.querySelectorAll('[data-dismiss]').forEach(b=>b.onclick=()=>panel.close());
    if(onDelete) panel.querySelector('[data-delete]').onclick=()=>run(onDelete);
    form.onsubmit=e=>{e.preventDefault();if(editable)run(()=>onSave(form));};
    if(!editable) for(const el of form.querySelectorAll('input,textarea,select')) el.disabled=true;
    panel.showModal();
    return form;
  }
  function fieldHtml(label,control) {return `<label class="plan-field"><span>${esc(label)}</span>${control}</label>`;}
  function input(name,value='',type='text',required=false) {
    return `<input name="${name}" type="${type}" value="${esc(value)}" ${required?'required':''}>`;
  }
  const opts=(rows,selected)=>rows.map(([v,t])=>`<option value="${esc(v)}" ${v===selected?'selected':''}>${esc(t)}</option>`).join('');
  const pickBox=(label,placeholder)=>`<fieldset class="plan-picker"><legend>${esc(label)}</legend><input type="search" class="plan-picker-query" placeholder="${esc(placeholder)}"><div class="plan-picked"></div><div class="plan-pick-list"></div></fieldset>`;
  function setupPicker(form,rows,selected,editable=true) {
    const root=form.querySelector('.plan-picker'),search=root.querySelector('input'),list=root.querySelector('.plan-pick-list'),chips=root.querySelector('.plan-picked');
    function draw() {
      const filtered=rows.filter(x=>matchesText(x.search||x.label,search.value));
      chips.innerHTML=rows.filter(x=>selected.has(x.id)).map(x=>`<button type="button" class="plan-chip" data-pick="${esc(x.id)}" ${editable?'':'disabled'}>${esc(x.label)}${editable?' ×':''}</button>`).join('')||'<span class="caption">尚未选择</span>';
      list.innerHTML=editable?(filtered.slice(0,60).map(x=>`<label><input type="checkbox" data-pick="${esc(x.id)}" ${selected.has(x.id)?'checked':''}><span><strong>${esc(x.label)}</strong>${x.note?`<small>${esc(x.note)}</small>`:''}</span></label>`).join('')||note('没有匹配结果。'))+(filtered.length>60?'<small>输入名称可查找其余结果</small>':''):'';
    }
    root.addEventListener('click',e=>{
      const b=e.target.closest('button[data-pick]');
      if(b&&editable){selected.delete(b.dataset.pick);draw();}
    });
    root.addEventListener('change',e=>{
      if(!editable||!e.target.matches('input[data-pick]')) return;
      if(e.target.checked) selected.add(e.target.dataset.pick); else selected.delete(e.target.dataset.pick);
      draw();
    });
    search.oninput=draw;
    if(!editable) search.hidden=true;
    draw();
  }
  function library(kind) {
    const isKol=kind==='kol', chosen=new Set();
    const rows=isKol?state.kols.filter(k=>!k.selected).map(k=>({id:k.id,label:k.name,note:k.category,search:[k.name,k.uid,k.category,k.contentType].join(' ')})):
      state.ideas.filter(i=>!i.archived&&!plan().ideaIds.includes(i.id)).map(i=>({id:i.id,label:i.title,note:i.type,search:[i.title,i.type,i.description].join(' ')}));
    const form=dialog(isKol?'加入中选 UP':'加入中选创意',pickBox('可多选',isKol?'搜人名、UID 或分区':'搜创意标题或类型'),()=>{
      if(!chosen.size) throw Error('请先选择至少一项。');
      return transact(()=>{
        if(isKol) for(const id of chosen) getKol(id).selected=true;
        else plan().ideaIds.push(...chosen);
      },'已加入中选池');
    },{label:'加入中选池'});
    setupPicker(form,rows,chosen);
  }
  function pairEditor({id='',kolId='',ideaId=''}={}) {
    const pair=plan().matches.find(m=>m.id===id);
    const selected=new Set(pair?.kolIds||[kolId].filter(Boolean));
    const chosenIdea=pair?.ideaId||ideaId;
    const ideas=state.ideas.filter(i=>!i.archived||plan().ideaIds.includes(i.id)).sort((a,b)=>Number(plan().ideaIds.includes(b.id))-Number(plan().ideaIds.includes(a.id)));
    const choices=[['','请选择创意'],...ideas.map(i=>[i.id,(plan().ideaIds.includes(i.id)?'已入池 · ':'')+i.title])];
    const people=[...state.kols].sort((a,b)=>Number(b.selected)-Number(a.selected)).map(k=>({id:k.id,label:k.name,note:(k.selected?'已入池 · ':'')+k.category,search:[k.name,k.uid,k.category,k.contentType].join(' ')}));
    const form=dialog(pair?'调整组合阵容':'组合人选与创意',fieldHtml('创意',`<select name="idea" required>${opts(choices,chosenIdea)}</select>`)+pickBox('出镜 UP · 可多选','搜人名、UID 或分区')+'<p class="caption">保存组合时，新选的 UP 和创意会一起入池。</p>',f=>{
      const idea=f.elements.idea.value;
      if(!idea||!selected.size) throw Error('请选择一个创意和至少一位 UP。');
      return transact(()=>{
        if(!plan().ideaIds.includes(idea)) plan().ideaIds.push(idea);
        for(const k of selected) getKol(k).selected=true;
        const next={id:pair?.id||idFor('match'),ideaId:idea,kolIds:[...selected]};
        if(pair) plan().matches[plan().matches.findIndex(m=>m.id===id)]=next; else plan().matches.unshift(next);
      },'组合已保存');
    },{label:'保存组合'});
    setupPicker(form,people,selected);
  }
  function nodeEditor(id='',parentId='') {
    const node=plan().nodes.find(n=>n.id===id);
    const parent=node?.parentId||parentId;
    const parents=plan().nodes.filter(n=>!n.parentId&&n.id!==id);
    const formHtml=fieldHtml('节点名称',input('title',node?.title||'','text',true))+fieldHtml('计划日期',input('date',node?.date||'','date'))+
      (parent?fieldHtml('所属大节点',`<select name="parent" required>${opts(parents.map(n=>[n.id,n.title]),parent)}</select>`):'');
    dialog(node?'编辑节点':parent?'新建小节点':'新建大节点',formHtml,f=>{
      const title=f.elements.title.value.trim(),date=f.elements.date.value;
      if(!title) throw Error('请填写节点名称。');
      return transact(()=>{
        const record={id:node?.id||idFor('node'),parentId:f.elements.parent?.value||'',title,date,source:node?.source&&node.title===title&&node.date===date?node.source:'工作台自建或调整'};
        if(node) plan().nodes[plan().nodes.findIndex(n=>n.id===id)]=record; else plan().nodes.push(record);
        if(record.date){view.day=record.date;view.expanded=record.date;}
      },'节点已保存');
    },{onDelete:node?()=>{
      if(plan().nodes.some(n=>n.parentId===id)||plan().events.some(e=>e.nodeId===id)) throw Error('请先移动这个节点下的小节点和排期。');
      return confirm('删除这个空节点？')?transact(()=>plan().nodes=plan().nodes.filter(n=>n.id!==id),'节点已删除'):false;
    }:null});
  }

  function eventEditor({id='',nodeId='',date='',ref=null,precision='day'}={}) {
    const e=plan().events.find(x=>x.id===id);
    const items=P.poolItems(state), itemMap=new Map(items.map(it=>[P.refKey(it),it]));
    const enabled=!readOnly();
    const selected=new Set(e?e.refs.map(P.refKey):ref?[ref]:[]);
    const day=e?.start||date||view.day||defaultDay(dataset());
    const nodeOpts=[['','未归节点']];
    for(const n of plan().nodes.filter(x=>!x.parentId)){
      nodeOpts.push([n.id,n.title]);
      for(const child of plan().nodes.filter(x=>x.parentId===n.id)) nodeOpts.push([child.id,'　↳ '+child.title]);
    }
    const granularity=e?.precision||(e?'day':precision);
    const html=fieldHtml('排期标题',input('title',e?.title||'').replace('type="text"','type="text" placeholder="例如：联机试玩直播；也可沿用所选对象的名称"'))+
      fieldHtml('安排到',`<select name="precision">${opts([['node','节点 · 具体日期待定'],['week','某一周 · 具体日期待定'],['day','具体日期']],granularity)}</select>`)+
      `<div class="plan-form-grid">${fieldHtml('开始日期',input('start',day,'date',true))}${fieldHtml('结束日期',input('end',e?.end||day,'date',true))}${fieldHtml('开始时间（可选）',input('time',e?.time||'','time'))}${fieldHtml('状态',`<select name="status">${opts(P.states.map(v=>[v,v]),e?.status||'暂排')}</select>`)}</div>`+
      fieldHtml('传播节点',`<select name="nodeId">${opts(nodeOpts,e?.nodeId||nodeId)}</select>`)+pickBox('排期对象','搜中选 UP、创意或组合')+
      '<div class="plan-conflicts" role="status"></div>'+fieldHtml('执行备注',`<textarea name="note" rows="2">${esc(e?.note||'')}</textarea>`);
    function draft(f) {
      const refs=[...selected].map(key=>{const it=itemMap.get(key);return {kind:it.kind,id:it.id};});
      const precision=f.elements.precision.value;
      let start=precision==='node'?'':f.elements.start.value, end=precision==='node'?'':f.elements.end.value;
      if(precision==='week'&&P.validDay(start)){start=P.monday(start);end=P.shift(start,6);}
      return {id:e?.id||idFor('event'),title:f.elements.title.value.trim()||refsText(refs,items).join('、'),refs,nodeId:f.elements.nodeId.value,
        precision,start,end,time:precision==='day'?f.elements.time.value:'',status:f.elements.status.value,note:f.elements.note.value.trim()};
    }
    const form=dialog(enabled?(e?'编辑排期':'添加排期'):'排期详情',html,async f=>{
      const next=draft(f);
      if(!next.title) throw Error('请填写标题，或选择至少一个排期对象。');
      const ok=await transact(()=>{
        if(e) plan().events[plan().events.findIndex(row=>row.id===id)]=next;
        else plan().events.push(next);
      },'排期已保存');
      if(ok){

        const anchor=next.start||plan().nodes.find(n=>n.id===next.nodeId)?.date;
        if(anchor)view.day=anchor;
        view.expanded=(next.precision||'day')==='day'?next.start:'';
        if(next.precision==='week')view.mode='week';
        go('calendar');
      }
      return ok;
    },{editable:enabled,label:'保存排期',onDelete:enabled&&e?()=>{
      if(!confirm('删除这条日历排期？')) return false;
      return transact(()=>plan().events=plan().events.filter(row=>row.id!==id),'排期已删除');
    }:null});
    const typeLabel={kol:'UP',idea:'创意',match:'组合'};
    setupPicker(form,items.map(it=>({id:P.refKey(it),label:it.label,note:typeLabel[it.kind],search:it.label+' '+typeLabel[it.kind]})),selected,enabled);
    function showDateFields() {
      const level=form.elements.precision.value;
      for(const key of ['start','end','time']){
        const box=form.elements[key].closest('label');
        box.hidden=level==='node'||(level==='week'&&key!=='start');
        form.elements[key].required=!box.hidden&&key!=='time';
      }
      form.elements.nodeId.required=level==='node';
      form.elements.start.closest('label').querySelector('span').textContent=level==='week'?'所在周（任选一天）':'开始日期';
    }
    form.elements.precision.onchange=showDateFields;
    showDateFields();
    let lastDay=day;
    form.elements.start.onchange=()=>{
      if(form.elements.end.value===lastDay||form.elements.end.value<form.elements.start.value) form.elements.end.value=form.elements.start.value;
      lastDay=form.elements.start.value;
    };
    function showOverlap(){
      const next=draft(form);
      const overlaps=P.overlap(next,plan(),items);
      form.querySelector('.plan-conflicts').textContent=overlaps.length?'同一位 UP 在这段时间还排了：'+overlaps.map(x=>x.title).join('、'):'';
    }
    form.addEventListener('change',showOverlap);
    form.addEventListener('click',e=>{if(e.target.closest('.plan-picked'))showOverlap();});
    showOverlap();
  }
  async function toggleIdea(id) {
    const removing=plan().ideaIds.includes(id);
    return transact(()=>{
      if(removing) plan().ideaIds=plan().ideaIds.filter(x=>x!==id); else plan().ideaIds.push(id);
    },removing?'已移出中选池':'创意已入池');
  }
  function go(name) { ui.view=name;render();window.scrollTo(0,0); }
  function historyPanel() {
    return readOnly()?'':`<div class="panel section-gap"><div class="panel-head"><div><h3>本机数据库</h3><p>每次保存都会写入 SQLite。可下载最近 12 次修改前的版本，再按需导入。</p></div>${btn('查看历史版本','history')}</div></div>`;
  }
  async function openHistory(){
    const response=await fetch('/api/history',{cache:'no-store'});
    if(!response.ok) throw Error('暂时无法读取本机历史版本。');
    const {items}=await response.json();
    const list=items.map(x=>`<a class="plan-history-row" href="/api/history/${encodeURIComponent(x.version)}" download>${esc(new Date(x.savedAt).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'}))}<span>下载 JSON ↓</span></a>`).join('');
    dialog('历史版本',list||note('首次保存后，这里会出现之前的版本。'),()=>{},{editable:false});
  }
function repaint({scrollDay=false,top=false}={}){
    const scroll=document.querySelector('.cal-scroll')?.scrollTop||0;
    const tray=document.querySelector('.cal-tray-items'), rail=[tray?.scrollTop||0,tray?.scrollLeft||0];
    render();
    const box=document.querySelector('.cal-scroll'),items=document.querySelector('.cal-tray-items');
    if(box)box.scrollTop=top?0:scroll;
    if(items){items.scrollTop=rail[0];items.scrollLeft=rail[1];}
    if(scrollDay&&box&&view.expanded){
      const panel=box.querySelector('[data-detail-date="'+view.expanded+'"]');
      if(panel){
        const a=box.getBoundingClientRect(),b=panel.getBoundingClientRect();
        if(b.bottom>a.bottom-8)box.scrollTop+=Math.min(b.top-a.top-34,b.bottom-a.bottom+8);
        else if(b.top<a.top)box.scrollTop+=b.top-a.top-10;
      }
    }
  }
  function jump(day,{expand=false}={}){
    if(!P.validDay(day))return;
    view.day=day;view.expanded=expand?day:'';
    repaint({scrollDay:expand,top:true});
  }
  function manageNodes(){
    const c=dataset();
    const row=n=>`<div class="cal-manage-row"><span class="cal-legend-bit ${c.colors.get(c.root(n.id)?.id)||'ph-none'}"><i></i>${esc(n.title)}</span><time>${esc(n.date||'日期待定')}</time><span>${n.date?btn('定位','stage',n.id):''}${editBtn('编辑','edit-node',n.id)}${!n.parentId?editBtn('＋ 小节点','child-node',n.id):''}${editBtn('暂挂排期','node-schedule',n.id)}</span></div>`;
    const html=c.roots.map(n=>`<div class="cal-manage-group">${row(n)}${c.p.nodes.filter(x=>x.parentId===n.id).map(row).join('')}</div>`).join('');
    dialog('传播节点',editBtn('＋ 新建大节点','new-node')+(html||note('暂无传播节点。')),()=>{},{editable:false});
  }
  function pendingEvents(){
    const c=dataset(),events=c.p.events.filter(e=>e.precision==='node'||e.precision==='week');
    const list=events.map(e=>`<div class="cal-pending-row"><small>${e.precision==='week'?esc(shortDay(e.start)+'–'+shortDay(e.end)+' 当周'):esc(c.nodes.get(e.nodeId)?.title||'节点')} · 具体日期待定</small>${eventPreview(e,c,true)}</div>`).join('');
    dialog('日期待定的排期',list||note('目前没有只定节点或只定周的排期。'),()=>{},{editable:false});
  }
  function pick(key){
    if(readOnly())return;
    view.picked=view.picked===key?'':key;
    repaint();
    document.querySelector('.cal-token.picked')?.focus({preventScroll:true});
  }
  let assigning=false;
  async function assign(key,date){
    if(readOnly()||assigning||!P.validDay(date))return;
    const c=dataset(),it=c.by.get(key);
    if(!it)return;
    const existing=c.p.events.find(e=>(e.precision||'day')==='day'&&e.start===date&&e.end===date&&e.refs.length===1&&P.refKey(e.refs[0])===key);
    if(existing){view.picked='';jump(date,{expand:true});toast('这项已经排在当天，点开可调整。');return;}
    const candidates=c.marks(date).filter(n=>n.parentId),stage=c.phase(date);
    const node=candidates.length===1?candidates[0]:stage;
    const event={id:idFor('event'),title:it.label,nodeId:node?.id||'',start:date,end:date,time:'',status:'暂排',note:'',precision:'day',refs:[{kind:it.kind,id:it.id}]};
    const conflict=P.overlap(event,c.p,c.items).length;
    assigning=true;
    const oldScroll=document.querySelector('.cal-scroll')?.scrollTop||0;
    try{
      const ok=await transact(()=>plan().events.push(event),dateLabel(date)+'已暂排'+(conflict?' · 同一 UP 当天另有安排':''));
      if(ok){view.picked='';view.day=date;view.expanded=date;repaint({scrollDay:true});}
      else {const box=document.querySelector('.cal-scroll');if(box)box.scrollTop=oldScroll;}
    }finally{assigning=false;}
  }
  function clickedDate(date){
    if(view.picked&&!readOnly())return assign(view.picked,date);
    if(view.expanded===date){view.expanded='';repaint();}else{view.day=date;view.expanded=date;repaint({scrollDay:true});}
  }
  const calActions={
    'cal-day':clickedDate,
    'collapse-day':()=>{view.expanded='';repaint();},
    'tray-toggle':()=>{view.tray=!view.tray;if(!view.tray)view.picked='';repaint();},
    'tray-filter':id=>{view.trayFilter=id;view.picked='';repaint();},
    'stage':id=>{const n=plan().nodes.find(x=>x.id===id);if(n?.date)jump(n.date,{expand:true});else manageNodes();},
    'node-manager':manageNodes,'pending-events':pendingEvents,
    'mode':id=>{if(id==='week'||id==='month'){view.mode=id;repaint({top:true});}},
    'today':()=>jump(P.today(),{expand:false}),
    'prev':()=>jump(view.mode==='week'?P.shift(view.day,-7):monthStep(view.day,-1)),
    'next':()=>jump(view.mode==='week'?P.shift(view.day,7):monthStep(view.day,1))
  };
  // One pointer gesture works with mouse, pen and touch. The typed reference is looked up again on save.
  let gesture=null, suppressClick=0, edgeFrame=0;
  function hit(x,y){return document.elementFromPoint(x,y)?.closest('[data-cal-date]');}
  function highlight(el){
    const prev=document.querySelector('.cal-drop-target');if(prev!==el){prev?.classList.remove('cal-drop-target');el?.classList.add('cal-drop-target');}
  }
  function autoScroll(){
    if(!gesture?.drag||!gesture.ghost){edgeFrame=0;return;}
    const scroll=document.querySelector('.cal-scroll');
    if(scroll){const r=scroll.getBoundingClientRect(), y=gesture.y;
      if(y>=r.top&&y<=r.bottom&&gesture.x>=r.left&&gesture.x<=r.right){
        const delta=y<r.top+38?-11:y>r.bottom-38?11:0;
        if(delta){scroll.scrollTop+=delta;highlight(hit(gesture.x,y));}
      }
    }
    edgeFrame=requestAnimationFrame(autoScroll);
  }
  function endGesture(){
    if(!gesture)return;
    const g=gesture;gesture=null;
    cancelAnimationFrame(edgeFrame);edgeFrame=0;
    if(g.el.hasPointerCapture?.(g.id))g.el.releasePointerCapture(g.id);
    g.ghost?.remove();g.el.classList.remove('drag-origin');document.body.classList.remove('cal-dragging');highlight(null);
    return g;
  }
  document.addEventListener('pointerdown',e=>{
    if(gesture||!e.isPrimary||e.button!==0)return;
    // A new pointer press is an intentional click, even immediately after a drop.
    suppressClick=0;
    const token=e.target.closest('.cal-token'),handle=e.target.closest('[data-dock-handle]');
    if(!handle&&(!token||readOnly()))return;
    const el=token||handle;
    gesture={el,id:e.pointerId,x0:e.clientX,y0:e.clientY,x:e.clientX,y:e.clientY,token:token?.dataset.token||'',drag:false,ghost:null};
  },true);
  document.addEventListener('pointermove',e=>{
    const g=gesture;if(!g||g.id!==e.pointerId)return;
    g.x=e.clientX;g.y=e.clientY;
    if(!g.drag){
      if((g.token?Math.hypot(g.x-g.x0,g.y-g.y0):Math.abs(g.y-g.y0))<7)return;
      g.drag=true;try{g.el.setPointerCapture(g.id);}catch{}
      if(g.token){
        g.ghost=g.el.cloneNode(true);g.ghost.removeAttribute('data-token');g.ghost.classList.add('cal-ghost');g.ghost.tabIndex=-1;
        g.ghost.setAttribute('aria-hidden','true');document.body.append(g.ghost);
        g.el.classList.add('drag-origin');document.body.classList.add('cal-dragging');
        if(!edgeFrame)edgeFrame=requestAnimationFrame(autoScroll);
      }
    }
    if(e.cancelable)e.preventDefault();
    if(g.ghost){g.ghost.style.transform=`translate(${Math.min(g.x+12,Math.max(0,innerWidth-196))}px,${g.y+10}px)`;highlight(hit(g.x,g.y));}
  },{capture:true,passive:false});
  document.addEventListener('pointerup',e=>{
    if(!gesture||gesture.id!==e.pointerId)return;
    const target=gesture.drag&&gesture.token?hit(e.clientX,e.clientY)?.dataset.calDate:null;
    const g=endGesture();if(!g.drag)return;
    suppressClick=performance.now()+350;if(e.cancelable)e.preventDefault();
    if(g.token){if(target)assign(g.token,target).catch(err=>toast(err.message,true));}
    else if(Math.abs(e.clientY-g.y0)>16){view.tray=e.clientY<g.y0;if(!view.tray)view.picked='';repaint();}
  },true);
  document.addEventListener('pointercancel',()=>endGesture(),true);
  window.addEventListener('blur',()=>endGesture());
  document.addEventListener('dragstart',e=>{if(e.target.closest('.cal-token'))e.preventDefault();});
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&(gesture||view.picked)&&document.querySelector('.cal-workspace')&&!document.querySelector('dialog[open]')){
      endGesture();view.picked='';repaint();e.preventDefault();
    }
  });
  document.addEventListener('click',e=>{
    const el=e.target.closest('.cal-workspace');if(!el)return;
    if(performance.now()<suppressClick && e.detail){e.preventDefault();e.stopImmediatePropagation();return;}
    const token=e.target.closest('.cal-token'),cell=e.target.closest('.cal-cell');
    if(token||(cell&&(view.picked||!e.target.closest('[data-plan-action]')))){
      e.preventDefault();e.stopImmediatePropagation();
      if(token)pick(token.dataset.token);else Promise.resolve(clickedDate(cell.dataset.calDate)).catch(err=>toast(err.message,true));
    }
  },true);


  const browse=new Set(['pool','calendar','pool-filter','edit-event',...Object.keys(calActions)]);
  async function action(name,id) {
    if(readOnly()&&!browse.has(name)) return;
    if(document.querySelector('.cal-manage-group,.cal-pending-row') && ['new-node','edit-node','child-node','node-schedule','stage','edit-event'].includes(name))document.querySelector('.plan-dialog[open]')?.close();
    if(Object.hasOwn(calActions,name))return calActions[name](id);
    switch(name) {
      case 'calendar': case 'pool': go(name); break;
      case 'pool-filter': view.poolFilter=id;render();break;
      case 'library-kol': case 'library-idea': library(name==='library-kol'?'kol':'idea');break;
      case 'pair-new': pairEditor();break;
      case 'pair-kol': pairEditor({kolId:id});break;
      case 'pair-idea': pairEditor({ideaId:id});break;
      case 'pair-edit': pairEditor({id});break;
      case 'drop-kol': await transact(()=>getKol(id).selected=false,'已移出中选池');break;
      case 'drop-idea': case 'toggle-idea': await toggleIdea(id);break;
      case 'drop-match':
        if(confirm('解散组合，保留池中的人选和创意？')) await transact(()=>plan().matches=plan().matches.filter(m=>m.id!==id),'组合已解散');
        break;
      case 'schedule': eventEditor({ref:id});break;
      case 'event-new': eventEditor();break;
      case 'edit-event': eventEditor({id});break;
      case 'new-node': nodeEditor();break;
      case 'child-node': nodeEditor('',id);break;
      case 'edit-node': nodeEditor(id);break;
      case 'node-schedule': eventEditor({nodeId:id,date:plan().nodes.find(n=>n.id===id)?.date,precision:'node'});break;
      case 'add-on-week': {
        const [node,date]=id.split('@');eventEditor({nodeId:node==='loose'?'':node,date,precision:'week'});break;
      }
      case 'add-on-day': {
        const [node,date]=id.split('@'); eventEditor({nodeId:node==='loose'?'':node,date});break;
      }

      case 'history': await openHistory();break;
    }
  }
  document.addEventListener('click',e=>{
    const el=e.target.closest('[data-plan-action]');
    if(!el)return;
    e.preventDefault();e.stopImmediatePropagation();
    action(el.dataset.planAction,el.dataset.key).catch(err=>toast(err.message,true));
  },true);
  document.addEventListener('input',e=>{
    if(e.target.id==='plan-pool-search'){view.query=e.target.value;render();}
  });

  document.addEventListener('input',e=>{
    if(e.target.id!=='cal-tray-query')return;
    view.trayQuery=e.target.value;
    const list=document.querySelector('.cal-tray-items');
    if(list){list.innerHTML=trayCards(dataset());list.scrollTop=0;list.scrollLeft=0;}
  });
  function ideaButton(i){
    if(readOnly()||i.archived&&!plan().ideaIds.includes(i.id)) return '';
    return editBtn(plan().ideaIds.includes(i.id)?'已入中选池 · 移出':'加入中选池','toggle-idea',i.id);
  }
  return {poolView,calendarView,ideaButton,historyPanel,dialog};
})();


