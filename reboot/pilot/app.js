/* LAST SIGNAL — Immersive film viewport with real actor interactions.
 * Existing episode graph and old save key remain intact.
 */
(function(){
'use strict';
const model=window.LastSignalPilot;
const actors=window.LastSignalActors;
if(!model||!actors)throw Error('Load episode.js and actors.js first');
const KEY='last_signal_pilot_ep0_v2';
const SCENE_STILLS=Object.freeze({ring:'p0',hidden:'p2',editor_docs:'p1'});
const $=id=>document.getElementById(id);
const ui={
 hero:$('hero'),photo:$('heroPhoto'),portraitSlot:$('portraitSlot'),portrait:$('portraitImage'),
 title:$('sceneTitle'),copy:$('sceneCopy'),clock:$('clock'),place:$('place'),speaker:$('speakerName'),
 trust:$('portraitTrust'),step:$('stepLabel'),progress:$('progress'),fill:$('progressFill'),
 still:$('stillLabel'),next:$('beatNext'),indicators:$('beatIndicators'),
 choiceZone:$('choiceZone'),choices:$('choices'),decisionLabel:$('decisionLabel'),choiceCount:$('choiceCount'),
 consequence:$('consequence'),ending:$('endingNote'),actionFooter:document.querySelector('.action-footer'),
 talkButton:$('talkOpen'),talkPanel:$('talkPanel'),talkLabel:$('talkLabel'),
 talkChoices:$('talkChoices'),talkReply:$('talkReply'),talkClose:$('talkClose'),
 drawer:$('casePanel'),evidence:$('evidenceList'),relations:$('relations'),log:$('decisionLog'),
 trail:$('trail'),stats:$('stats'),counter:$('evidenceCounter'),
 fullscreen:$('fullScreen')
};
const elem=(tag,cls,txt)=>{
 const e=document.createElement(tag);
 if(cls)e.className=cls;
 if(txt!==undefined)e.textContent=String(txt);
 return e;
};
function restore(){
 try{
  const value=JSON.parse(localStorage.getItem(KEY));
  if(model.valid(value))return value;
 }catch(_){}
 return model.initial();
}
let state=restore();
let beat=0;
let mediaEpoch=0,portraitEpoch=0,drawerOpen=false,talkOpen=false,changing=false;
let portraitCatalog=null,portraitRequest=null;
const cloneState=()=>JSON.parse(JSON.stringify(state));
function save(){
 state.updated=Date.now();
 try{localStorage.setItem(KEY,JSON.stringify(state));}catch(_){/* Game remains usable in ephemeral mode */}
}
function scene(){return model.nodes[state.scene];}
function spec(){return actors.specFor(state.scene,state);}
function currentBeats(node){
 const parts=node.paragraphs.map(text=>({text,kind:'story'}));
 for(const cond of node.conditions||[]){
  if(state.flags[cond.flag])parts.push({text:cond.text,kind:'reaction'});
 }
 return parts;
}
const isQuoted=text=>text.includes('“')||text.includes('"');
function showBeat(){
 const node=scene(),beats=currentBeats(node);
 beat=Math.min(beat,beats.length-1);
 const turn=beats[beat];
 const person=spec();
 ui.copy.replaceChildren(elem('p','',turn.text));
 ui.copy.scrollTop=0;
 ui.speaker.textContent=(person&&(isQuoted(turn.text)||turn.kind==='reaction'))?actors.names[person.actor]:'장면';
 ui.title.textContent=node.title;
 ui.indicators.replaceChildren();
 for(let i=0;i<beats.length;i++){
  const dot=elem('span',i===beat?'active':'');
  ui.indicators.append(dot);
 }
 const final=beat>=beats.length-1;
 const talking=!!talkOpen;
 ui.next.hidden=final||talking;
 ui.choiceZone.hidden=!final||node.ending||talking;
 ui.ending.hidden=!node.ending||!final||talking;
 if(node.ending&&final){
  ui.ending.replaceChildren();
  const info=elem('p','','당신은 '+state.decisions.length+'번 선택하고 '+state.evidence.length+'개의 단서를 남겼습니다.');
  const replay=elem('button','next-beat','다른 선택으로 다시 시작 ›');
  replay.type='button';replay.addEventListener('click',restart);
  ui.ending.append(info,replay);
 }
 ui.talkButton.hidden=(!person||node.ending||talking);
 if(person&&state.interactions?.[node.id])ui.talkButton.textContent='대화 기록 보기 ↗';
 else if(person)ui.talkButton.textContent=actors.names[person.actor]+'와 대화 ↗';
 const latest=state.decisions.at(-1);
 ui.consequence.hidden=!(latest&&beat===0);
 if(latest&&beat===0)ui.consequence.textContent='선택의 결과 · '+(latest.note||latest.label);
 if(person&&final&&!talking&&!state.interactions?.[node.id]){
  ui.consequence.hidden=false;
  ui.consequence.textContent=person.lead;
 }else if(person&&final&&!talking&&state.interactions?.[node.id]){
  ui.consequence.hidden=false;
  ui.consequence.textContent=state.interactions[node.id].line;
 }
 ui.actionFooter.hidden=node.ending&&final;
 ui.choiceCount.textContent=(node.options?.length||0)+'개의 선택';
}
function nextBeat(){
 if(drawerOpen||talkOpen)return;
 const beats=currentBeats(scene());
 if(beat>=beats.length-1)return;
 beat++;showBeat();
}
function showChoices(){
 const node=scene();
 ui.choices.replaceChildren();
 if(node.ending)return;
 node.options.forEach((item,i)=>{
  const btn=elem('button','choice');
  btn.type='button';
  btn.disabled=!model.canAccess(state,item);
  btn.append(elem('span','choice-no',String(i+1).padStart(2,'0')),
   elem('span','choice-title',item.label),elem('span','choice-arrow','›'));
  btn.addEventListener('click',()=>selectChoice(i));
  ui.choices.append(btn);
 });
}
function renderTrust(){
 const person=spec();
 ui.trust.hidden=!person;
 if(person)ui.trust.textContent=actors.names[person.actor]+'의 신뢰 '+state.stats[person.actor];
}
function setSceneImage(node){
 const current=++mediaEpoch;
 ui.photo.classList.remove('active');
 ui.photo.style.backgroundImage='';
 ui.still.textContent='장면 전용 실사 미제작 · 분위기 배경';
 const stillId=SCENE_STILLS[node.id];
 if(!stillId)return;
 const img=new Image();
 img.decoding='async';
 img.onload=()=>{
  if(mediaEpoch!==current||state.scene!==node.id||img.naturalWidth<100)return;
  ui.photo.style.backgroundImage='url("../media/scenes/'+stillId+'.webp")';
  ui.photo.classList.add('active');
  ui.still.textContent='장면 전용 실사 '+stillId.toUpperCase();
 };
 img.onerror=()=>{if(mediaEpoch===current)ui.still.textContent='실사 로딩 실패 · 분위기 배경';};
 img.src='../media/scenes/'+stillId+'.webp';
}
function catalog(){
 if(portraitCatalog)return Promise.resolve(portraitCatalog);
 if(portraitRequest)return portraitRequest;
 portraitRequest=fetch('../../g1/source/approved-reference-webp.json',{cache:'force-cache'})
  .then(response=>{if(!response.ok)throw Error('Portrait reference missing');return response.json();})
  .then(data=>{
   if(data.approvedReferenceCount!==4||!Array.isArray(data.assets))throw Error('Unexpected G1 source');
   portraitCatalog=new Map(data.assets.filter(a=>
    typeof a.id==='string'&&typeof a.base64==='string'&&
    a.base64.length>1000&&/^[a-f0-9]{64}$/.test(a.sha256||'')
   ).map(a=>[a.id,a]));
   return portraitCatalog;
  }).catch(()=>null);
 return portraitRequest;
}
async function showPortrait(node){
 const current=++portraitEpoch;
 ui.portraitSlot.classList.remove('active');
 ui.portrait.removeAttribute('src');
 const person=spec();
 if(!person)return;
 const id=actors.faceIDs[person.actor];
 if(!id)return; // The Nagyeong face is not yet verified in G1 sources; do not invent one.
 const list=await catalog();
 if(current!==portraitEpoch||state.scene!==node.id||!list?.has(id))return;
 const item=list.get(id);
 ui.portrait.onload=()=>{
  if(current!==portraitEpoch||state.scene!==node.id)return;
  ui.portraitSlot.classList.add('active');
 };
 ui.portrait.onerror=()=>ui.portraitSlot.classList.remove('active');
 ui.portrait.src='data:image/webp;base64,'+item.base64;
}
function renderStats(){
 ui.stats.replaceChildren();
 for(const [key,label] of [['proof','증거력'],['credibility','보도 신뢰'],['protection','인물 보호'],['risk','노출 위험']]){
  ui.stats.append(elem('span','',label+' '+state.stats[key]));
 }
}
function renderTrail(){
 ui.trail.replaceChildren();
 for(const [i,id] of state.history.slice(-9).entries()){
  const node=model.nodes[id];
  const tag=elem('span','trail-item'+(i===state.history.slice(-9).length-1?' current':''),
   node.title);
  ui.trail.append(tag);
 }
}
function renderDossier(){
 ui.counter.textContent=String(state.evidence.length);
 ui.evidence.replaceChildren();
 if(!state.evidence.length)ui.evidence.append(elem('li','','확보한 자료가 없습니다.'));
 else for(const evidence of state.evidence)ui.evidence.append(elem('li','',evidence));
 ui.relations.replaceChildren();
 for(const id of ['jiyu','seoa','soyeon','nagyeong']){
  const li=elem('li','');
  li.append(elem('strong','',actors.names[id]),elem('small','',actors.roles[id]+' · 신뢰 '+state.stats[id]));
  const line=elem('div','relation-bar');const bar=elem('i');bar.style.width=state.stats[id]+'%';
  line.append(bar);li.append(line);ui.relations.append(li);
 }
 ui.log.replaceChildren();
 if(!state.decisions.length)ui.log.append(elem('li','','아직 선택 기록이 없습니다.'));
 for(const turn of state.decisions.slice(-14).reverse()){
  const li=elem('li','');
  li.append(elem('strong','',model.nodes[turn.at].title),elem('small','',turn.label));
  ui.log.append(li);
 }
 renderStats();renderTrail();
}
function render(){
 const node=scene();
 document.title=node.title+' · 라스트 시그널';
 beat=0;
 ui.hero.dataset.setting=node.setting;
 ui.clock.textContent=node.clock.split(' · ').at(-1);
 ui.place.textContent=node.place;
 ui.step.textContent='EPISODE 00 · '+(node.ending?'결말':('제'+(node.part+1)+'구간'));
 ui.progress.setAttribute('aria-valuenow',String(node.part));
 ui.fill.style.width=(node.part/6*100)+'%';
 renderTrust();
 setSceneImage(node);
 showPortrait(node);
 showChoices();
 showBeat();
 renderDossier();
}
function selectChoice(i){
 if(changing||drawerOpen||talkOpen||ui.choiceZone.hidden)return;
 changing=true;
 ui.choices.querySelectorAll('button').forEach(b=>b.disabled=true);
 try{
  state=model.choose(state,i);
  save();
  render();
 }catch(error){window.alert('선택을 적용하지 못했습니다: '+error.message);}
 finally{changing=false;}
}
function openTalk(value){
 const person=spec();
 if(value&&!person)return;
 talkOpen=!!value;
 ui.talkPanel.hidden=!talkOpen;
 ui.talkChoices.replaceChildren();
 ui.talkReply.hidden=true;
 if(talkOpen){
  ui.talkLabel.textContent=actors.names[person.actor]+'에게 직접 이야기하기';
  const saved=state.interactions?.[state.scene];
  if(saved){
   ui.talkReply.textContent=actors.names[person.actor]+' · '+saved.line;
   ui.talkReply.hidden=false;
  }else{
   person.actions.forEach((choice,i)=>{
    const button=elem('button','',''+(i+1)+'. '+choice.label);
    button.type='button';
    button.addEventListener('click',()=>pickTalk(i));
    ui.talkChoices.append(button);
   });
  }
 }
 showBeat();
 if(talkOpen)ui.talkClose.focus({preventScroll:true});
}
function pickTalk(index){
 if(!talkOpen||state.interactions?.[state.scene])return;
 try{
  const result=actors.interact(state,state.scene,index);
  state=result.state;save();
  ui.talkChoices.replaceChildren();
  ui.talkReply.textContent=actors.names[result.actor]+' · '+result.reply;
  ui.talkReply.hidden=false;
  ui.talkLabel.textContent='선택에 대한 반응 · '+(result.kind==='probe'?'증거 검증':'신뢰 형성');
  renderTrust();renderDossier();
 }catch(error){window.alert(error.message);}
}
function showPanel(show){
 drawerOpen=!!show;
 ui.drawer.hidden=!drawerOpen;
 $('caseOpen').setAttribute('aria-expanded',String(drawerOpen));
 if(drawerOpen){renderDossier();$('caseClose').focus({preventScroll:true});}
 else $('caseOpen').focus({preventScroll:true});
}
function restart(){
 if(!window.confirm('이 에피소드의 선택 기록을 초기화하고 처음부터 플레이할까요?'))return;
 state=model.initial();
 save();openTalk(false);showPanel(false);render();
}
ui.next.addEventListener('click',nextBeat);
ui.talkButton.addEventListener('click',()=>openTalk(true));
ui.talkClose.addEventListener('click',()=>openTalk(false));
$('caseOpen').addEventListener('click',()=>showPanel(true));
$('caseClose').addEventListener('click',()=>showPanel(false));
ui.drawer.addEventListener('click',e=>{if(e.target===ui.drawer)showPanel(false);});
$('restart').addEventListener('click',restart);
$('exportSave').addEventListener('click',()=>{
 const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
 const address=URL.createObjectURL(blob),link=elem('a');
 link.href=address;link.download='lastsignal-episode0-immersive-save.json';
 link.click();setTimeout(()=>URL.revokeObjectURL(address),1000);
});
$('importSave').addEventListener('click',()=>$('importFile').click());
$('importFile').addEventListener('change',async e=>{
 const file=e.target.files?.[0];
 if(!file)return;
 try{
  if(file.size>120000)throw Error('저장 파일 크기 초과');
  const parsed=JSON.parse(await file.text());
  if(!model.valid(parsed))throw Error('호환되지 않는 에피소드 저장 파일');
  if(!window.confirm('현재 진행상황을 저장 파일로 바꿀까요?'))return;
  state=parsed;save();showPanel(false);openTalk(false);render();
 }catch(error){window.alert('불러오기 실패: '+error.message);}
 finally{e.target.value='';}
});
document.addEventListener('keydown',event=>{
 if(event.key==='Escape'){
  if(drawerOpen){event.preventDefault();showPanel(false);}
  else if(talkOpen){event.preventDefault();openTalk(false);}
  return;
 }
 if(drawerOpen)return;
 if(event.target.closest('button,a,input,textarea,select'))return;
 if(talkOpen){
  if(/^[12]$/.test(event.key)){event.preventDefault();pickTalk(Number(event.key)-1);}
  return;
 }
 if(/^[123]$/.test(event.key)&&!ui.choiceZone.hidden){
  event.preventDefault();selectChoice(Number(event.key)-1);
 }else if((event.key==='Enter'||event.key===' ')&&!ui.next.hidden){
  event.preventDefault();nextBeat();
 }
});
ui.fullscreen.addEventListener('click',async()=>{
 if(!document.fullscreenEnabled){
  ui.fullscreen.title='이 브라우저에서는 전체 화면을 지원하지 않습니다';
  return;
 }
 try{
  if(document.fullscreenElement)await document.exitFullscreen();
  else await document.documentElement.requestFullscreen();
 }catch(_){ui.fullscreen.title='전체 화면 전환을 사용할 수 없습니다';}
});
document.addEventListener('fullscreenchange',()=>{
 const enabled=!!document.fullscreenElement;
 ui.fullscreen.setAttribute('aria-label',enabled?'전체 화면 종료':'전체 화면으로 보기');
 ui.fullscreen.title=enabled?'전체 화면 종료':'전체 화면';
});
save();render();
window.LastSignalPilotUI=Object.freeze({
 getState:cloneState,
 getVisibleBeat:()=>beat,
 getVisibleScene:()=>state.scene,
 render
});
})();