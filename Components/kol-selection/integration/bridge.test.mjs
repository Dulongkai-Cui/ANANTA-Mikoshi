import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';

const source = await readFile(new URL('./bridge.js', import.meta.url), 'utf8');
function harness() {
  const messages=[], handlers={}, intervals=[];
  let writes=0,dialogs=[];
  const parent={postMessage(message){messages.push(message);}};
  const document={body:{},documentElement:{dataset:{},style:{setProperty(){}},classList:{add(){}}},querySelector(){return null;},querySelectorAll(){return dialogs;},addEventListener(type,fn){handlers['doc:'+type]=fn;}};
  const context={document,parent,location:{origin:'https://mikoshi.test',search:'?embedded=1'},URLSearchParams,JSON,Set,WeakMap,Date,Promise,CSS:{supports(){return true;}},setTimeout,clearTimeout,queueMicrotask,MutationObserver:class{observe(){}},setInterval(fn){intervals.push(fn);return 1;},clearInterval(){},ui:{view:'kols'},modal:null,saving:false,openModal(){},closeModal(){context.modal=null;},persist:async()=>{writes++;},render(){},};
  context.window={parent,KOLApp:{},addEventListener(type,fn){handlers[type]=fn;},scrollTo(){}};
  vm.runInNewContext(source,context);
  intervals[0]();
  return {context,messages,handlers,setDialogs(value){dialogs=value;},get writes(){return writes;},async send(message,{origin='https://mikoshi.test',source=parent}={}){await handlers.message({origin,source,data:{channel:'mikoshi-kol-studio-v1',...message}});}};
}

test('rejects wrong-origin and wrong-window messages, including attempted draft discard',async()=>{
  const h=harness();h.context.modal={draft:{name:'before'}};h.context.openModal();h.context.modal.draft.name='unsaved';
  await h.send({type:'discard-draft'},{origin:'https://other.test'});
  await h.send({type:'discard-draft'},{source:{}});
  assert.equal(h.context.modal.draft.name,'unsaved');
  await h.send({type:'navigate',view:'not-a-page'});assert.equal(h.context.ui.view,'kols');
});
test('retired source view normalizes without persistence and same-view navigation acknowledges the host',async()=>{
  const h=harness();h.context.ui.view='sources';h.context.render();
  assert.equal(h.context.ui.view,'kols');assert.equal(h.writes,0);
  await h.send({type:'navigate',view:'kols'});
  assert.equal(h.messages.some(m=>m.type==='view'&&m.view==='kols'),true);
  await h.send({type:'navigate',view:'sources'});assert.equal(h.context.ui.view,'kols');
});
test('dirty editor blocks both navigation and leave; explicit discard releases it without a data write',async()=>{
  const h=harness();h.context.modal={draft:{name:'original'}};h.context.openModal();h.context.modal.draft.name='unsaved';
  await h.send({type:'prepare-leave',id:'leave-1'});
  assert.equal(h.messages.at(-1).canLeave,false);assert.equal(h.messages.at(-1).dirty,true);
  await h.send({type:'navigate',view:'calendar'});
  assert.equal(h.context.ui.view,'kols');assert.equal(h.messages.at(-1).type,'navigation-blocked');
  await h.send({type:'discard-draft'});await h.send({type:'navigate',view:'calendar'});
  assert.equal(h.context.ui.view,'calendar');assert.equal(h.context.modal,null);assert.equal(h.writes,0);
  await h.send({type:'prepare-leave',id:'leave-2'});assert.equal(h.messages.at(-1).canLeave,true);
});
test('refresh guard prevents losing an edited form, and view changes never create save revisions',async()=>{
  const h=harness();await h.send({type:'navigate',view:'relations'});await h.send({type:'navigate',view:'kols'});assert.equal(h.writes,0);
  h.context.modal={draft:{name:'old'}};h.context.openModal();h.context.modal.draft.name='new';
  let prevented=false;h.handlers.beforeunload({preventDefault(){prevented=true;},returnValue:undefined});assert.equal(prevented,true);
});
test('factory picker changes are guarded even though the selected ID lives outside normal inputs',async()=>{
  const h=harness(),form={dataset:{},querySelectorAll(){return [];},querySelector(selector){return selector==='[type=submit]'?{}:null;}};
  h.setDialogs([{querySelector(){return form;}}]);
  await h.send({type:'prepare-leave',id:'clean'});assert.equal(h.messages.at(-1).canLeave,true);
  h.handlers['doc:click']({target:{closest(){return {dataset:{fref:'up-new'},closest(){return form;}};}}});
  await h.send({type:'prepare-leave',id:'picked'});
  const reply=h.messages.find(message=>message.type==='leave-result'&&message.id==='picked');
  assert.equal(reply.canLeave,false);assert.equal(reply.dirty,true);
});
