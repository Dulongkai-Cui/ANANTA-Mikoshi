'use strict';

const KOLPlan = (() => {
  let defaults;
  const dayMs = 86400000;
  const states = ['暂排', '已确认', '已完成'];
  async function loadDefaults() {
    const reply = await fetch('planner-defaults.json', {cache:'no-cache'});
    if (!reply.ok) throw Error('排期节点未能载入，请刷新重试。');
    defaults = await reply.json();
  }
  function initialize(workspace) {
    if (!workspace.planner) workspace.planner = structuredClone(defaults);
    validate(workspace);
    return workspace.planner;
  }
  function validDay(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
    const day = new Date(value+'T00:00:00Z');
    return Number.isFinite(+day) && day.toISOString().slice(0,10) === value;
  }
  function shift(day, n) {
    return new Date(Date.parse(day+'T00:00:00Z') + n*dayMs).toISOString().slice(0,10);
  }
  function monday(day) {
    return shift(day,-((new Date(day+'T00:00:00Z').getUTCDay()+6)%7));
  }
  function today() {
    const parts = new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
    const part = key => parts.find(p=>p.type===key).value;
    return part('year')+'-'+part('month')+'-'+part('day');
  }
  function days(start,end) {
    const result=[];
    for (let date=start;date<=end;date=shift(date,1)) result.push(date);
    return result;
  }
  function ids(items,label) {
    if (!Array.isArray(items)) throw Error(label+'格式无效。');
    const set = new Set();
    for (const row of items) {
      if (!row || typeof row.id!=='string' || !row.id || set.has(row.id)) throw Error(label+'的记录编号缺失或重复。');
      set.add(row.id);
    }
    return set;
  }
  const unique = list => Array.isArray(list) && list.length===new Set(list).size;
  function validate(workspace) {
    const p = workspace.planner;
    if (!p || p.schema !== 1) throw Error('无法识别此版本的中选池与排期。');
    const people = new Set(workspace.kols.filter(k=>k.selected).map(k=>String(k.id)));
    const ideas = new Set(workspace.ideas.map(i=>String(i.id)));
    if (!unique(p.ideaIds) || p.ideaIds.some(id=>!ideas.has(id))) throw Error('中选创意重复或已不存在。');
    const chosen = new Set(p.ideaIds);
    const matches = ids(p.matches,'组合'), nodes = ids(p.nodes,'节点');
    ids(p.events,'排期');
    const signatures = new Set();
    for (const pair of p.matches) {
      if (!chosen.has(pair.ideaId)) throw Error('创意仍有组合，请先解散组合再移出中选池。');
      if (!unique(pair.kolIds) || !pair.kolIds.length || pair.kolIds.some(id=>!people.has(id))) throw Error('组合中的 UP 需要保留在本轮人选中，请先调整对应组合。');
      const signature=JSON.stringify([pair.ideaId,...[...pair.kolIds].sort()]);
      if (signatures.has(signature)) throw Error('同一创意已有这组人选。');
      signatures.add(signature);
    }
    const byNode = new Map(p.nodes.map(n=>[n.id,n]));
    for (const n of p.nodes) {
      if (!String(n.title||'').trim() || (n.date && !validDay(n.date))) throw Error('请核对节点名称和日期。');
      if (n.parentId && (!byNode.has(n.parentId) || byNode.get(n.parentId).parentId)) throw Error('小节点必须归属一个有效的大节点。');
    }
    const refs = {kol:people,idea:chosen,match:matches};
    for (const e of p.events) {
      const precision=e.precision||'day';
      if (!String(e.title||'').trim() || !['node','week','day'].includes(precision)) throw Error('请填写排期标题并选择安排层级。');
      if (precision==='node') {
        if (!e.nodeId || e.start || e.end || e.time) throw Error('节点暂排需要选择节点，具体日期留空。');
      } else {
        if (!validDay(e.start) || !validDay(e.end) || e.end<e.start || e.end>shift(e.start,365)) throw Error('请选择有效的起止日期，单条排期最长一年。');
        if (precision==='week' && (monday(e.start)!==e.start || shift(e.start,6)!==e.end || e.time)) throw Error('周排期按周一至周日保存。');
      }
      if (e.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(e.time)) throw Error('时间请填写为小时和分钟。');
      if (!states.includes(e.status) || (e.nodeId && !nodes.has(e.nodeId))) throw Error('请核对排期状态与所属节点。');
      if (!Array.isArray(e.refs) || !unique(e.refs.map(ref=>ref.kind+':'+ref.id)) || e.refs.some(ref=>!refs[ref.kind]?.has(ref.id))) throw Error('日历仍在使用这项人选、创意或组合，请先修改相关排期。');
    }
  }
  function poolItems(s) {
    const ideas = new Map(s.ideas.map(i=>[i.id,i]));
    return [
      ...s.kols.filter(k=>k.selected).map(k=>({kind:'kol',id:k.id,label:k.name,people:[k.id],idea:null})),
      ...s.planner.ideaIds.map(id=>({kind:'idea',id,label:ideas.get(id).title,people:[],idea:id})),
      ...s.planner.matches.map(m=>({kind:'match',id:m.id,label:ideas.get(m.ideaId).title+' × '+m.kolIds.map(id=>s.kols.find(k=>k.id===id).name).join('、'),people:m.kolIds,idea:m.ideaId})),
    ];
  }
  const refKey = ref=>ref.kind+':'+ref.id;
  function peopleFor(event, items) {
    const used = new Set(event.refs.map(refKey));
    return new Set(items.filter(it=>used.has(refKey(it))).flatMap(it=>it.people));
  }
  function overlap(event, p, items) {
    const people = peopleFor(event,items);
    if (!people.size || !event.start || !event.end) return [];
    return p.events.filter(e=>e.id!==event.id && e.start && e.end && e.start<=event.end && e.end>=event.start &&
      [...peopleFor(e,items)].some(id=>people.has(id)));
  }
// 节点额度来自 2026-11-06 内部核算表「预算核算」B12:E12，单位万元。
  const calendarBudgetPlan = [
    {id:'node-launch', label:'启宣', limit:200},
    {id:'node-tga', label:'TGA', limit:300},
    {id:'node-trial', label:'试玩', limit:1600},
    {id:'node-release', label:'上线', limit:1900}
  ];
  const budgetCentsPerWan = 1000000;

  function moneySummary() {
    return {cents:0, priced:0, pending:0, bookings:0};
  }

  function quotedAmount(summary, amount) {
    if (amount == null || !Number.isFinite(amount) || amount < 0) {
      summary.pending++;
      return;
    }
    summary.cents += Math.round(amount * budgetCentsPerWan);
    summary.priced++;
  }

  function bookingBudget(event, catalog, ideaAllocations) {
    const summary = moneySummary();
    const singles = new Set();
    const groups = new Map();
    for (const ref of event.refs) {
      const item = catalog.by.get(refKey(ref));
      if (!item) continue;
      if (item.kind === 'kol') {
        singles.add(item.id);
        continue;
      }
      const idea = catalog.ideas.get(item.idea);
      if (!idea) continue;
      if (!groups.has(idea.id)) groups.set(idea.id, {idea, members:new Set(), wholeIdea:false});
      const group = groups.get(idea.id);
      if (item.kind === 'idea') group.wholeIdea = true;
      for (const id of item.people) group.members.add(id);
    }
    if (!singles.size && !groups.size) return summary;
    summary.bookings = 1;

    // One event can reference the same pair, its idea, and an individual member.
    // Merge them before applying the package price or per-person quantities.
    const bundled = new Set();
    for (const group of groups.values()) {
      for (const id of group.members) bundled.add(id);
    }
    for (const id of singles) {
      if (bundled.has(id)) continue;
      const eligible = [...groups.values()].filter(g => g.wholeIdea &&
        (groups.size === 1 || g.idea.kolIds?.includes(id)));
      if (eligible.length === 1) {
        eligible[0].members.add(id);
      } else {
        quotedAmount(summary, numberOrNull(catalog.people.get(id)?.quoteWan));
      }
    }
    for (const {idea, members} of groups.values()) {
      const original = new Set(idea.kolIds || []);
      const sameCast = original.size === members.size && [...members].every(id => original.has(id));
      const manual = numberOrNull(idea.manualBudget);
      if (manual != null && (!members.size || !original.size || sameCast)) {
        quotedAmount(summary, manual);
      } else {
        // A standalone idea carries its board estimate. A booked lineup uses only its members.
        const rows = ideaAllocations(members.size ? {...idea, kolIds:[...members]} : idea);
        if (!rows.length) summary.pending++;
        for (const row of rows) {
          quotedAmount(summary, row.quantity === 0 ? 0 : row.quoteWan == null ? null : row.quoteWan * row.quantity);
        }
      }
    }
    return summary;
  }

  function numberOrNull(value) {
    if (value == null || String(value).trim() === '') return null;
    const amount = Number(value);
    return Number.isFinite(amount) && amount >= 0 ? amount : null;
  }

  function calendarBudgets(catalog, ideaAllocations) {
    const phases = calendarBudgetPlan.map(entry => ({
      ...entry, date:catalog.nodes.get(entry.id)?.date || '', ...moneySummary()
    }));
    const anchors = phases.filter(p => validDay(p.date)).sort((a,b) => a.date.localeCompare(b.date));
    const before = moneySummary(), undated = moneySummary();
    function bucket(date) {
      if (!validDay(date) || !anchors.length) return undated;
      let active = before;
      for (let i = 0; i < anchors.length && anchors[i].date <= date; i++) {
        active = i && anchors[i-1].date === anchors[i].date ? undated : anchors[i];
      }
      return active;
    }
    for (const event of catalog.p.events) {
      const cost = bookingBudget(event, catalog, ideaAllocations);
      if (!cost.bookings) continue;
      let target = bucket(event.start);
      if (event.precision === 'node' || (event.precision === 'week' && bucket(event.end) !== target)) {
        target = undated;
      }
      target.cents += cost.cents;
      target.pending += cost.pending;
      target.priced += cost.priced;
      target.bookings += cost.bookings;
    }
    return {phases, before, undated};
  }

  return {calendarBudgets,budgetCentsPerWan,loadDefaults,initialize,validate,states,validDay,shift,monday,today,days,poolItems,refKey,peopleFor,overlap};
})();
