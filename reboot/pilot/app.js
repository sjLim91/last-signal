/* LAST SIGNAL PILOT: lightweight client UI. Deterministic choices from episode.js.
 * The 79-scene reboot state is never read or modified.
 */
(()=>{
'use strict';
const model=window.LastSignalPilot;
if(!model)throw Error('Pilot story not available');
const KEY='last_signal_pilot_ep0_v2';
const $=id=>document.getElementById(id);
const ui={title:$('sceneTitle'),clock:$('clock'),place:$('place'),copy:$('sceneCopy'),choices:$('choices'),consequence:$('consequence'),hero:$('hero'),photo:$('heroPhoto'),
 still:$('stillLabel'),stamp:$('stepLabel'),counter:$('evidenceCounter'),trail:$('trail'),stats:$('stats'),progress:$('progress'),
 progressFill:$('progressFill'),decisionLabel:$('decisionLabel'),choiceZone:$('choiceZone'),choiceCount:$('choiceCount'),
 drawer:$('casePanel'),evidence:$('evidenceList'),relations:$('relations'),log:$('decisionLog'),ending:$('endingNote')};
function elem(tag,className,textContent){
 const el=document.createElement(tag);
 if(className)el.className=className;
 if(textContent!==undefined)el.textContent=textContent;
 return el;
}
function restore(){
 try{
  const parsed=JSON.parse(localStorage.getItem(KEY));
  if(model.valid(parsed))return parsed;
 }catch(_){/* No storage or first-time user */}
 return model.initial();
}
let state=restore();
let changing=false,open=false,mediaEpoch=0;
function save(){
 state.updated=Date.now();
 try{localStorage.setItem(KEY,JSON.stringify(state));}catch(_){/* Client can still play with disabled localStorage */}
}
function imageForScene(node){
 mediaEpoch++;
 const epoch=mediaEpoch;
 ui.photo.classList.remove('active');
 ui.photo.style.backgroundImage='';
 ui.still.textContent='장면 분위기 연출 · 전용 실사 대기';
 if(node.id!=='ring')return;
 const image=new Image();
 image.decoding='async';
 image.onload=()=>{
  if(mediaEpoch!==epoch || state.scene!=='ring'||image.naturalWidth<100)return;
  ui.photo.style.backgroundImage='url("../media/scenes/p0.webp")';
  ui.photo.classList.add('active');
  ui.still.textContent='P0 · 독립 실사 원본';
 };
 image.onerror=()=>{
  if(mediaEpoch===epoch)ui.still.textContent='장면 분위기 연출 · 실사 로딩 실패';
 };
 image.src='../media/scenes/p0.webp';
}
function renderStory(node){
 ui.title.textContent=node.title;
 ui.place.textContent=node.place;
 ui.clock.textContent=node.clock.split(' · ').at(-1);
 ui.hero.dataset.setting=node.setting;
 document.title=node.title+' · 라스트 시그널';
 ui.copy.replaceChildren();
 for(const paragraph of node.paragraphs)ui.copy.append(elem('p','',paragraph));
 for(const conditional of node.conditions||[]){
  if(state.flags[conditional.flag])ui.copy.append(elem('p','echo',conditional.text));
 }
 ui.consequence.hidden=!state.decisions.length;
 if(state.decisions.length){
  const latest=state.decisions.at(-1);
  ui.consequence.replaceChildren(elem('strong','','선택의 여파 · '),document.createTextNode(latest.note||latest.label));
 }
 imageForScene(node);
 const part=Math.max(0,Math.min(6,node.part));
 ui.progress.setAttribute('aria-valuenow',String(part));
 ui.progressFill.style.width=(part/6*100)+'%';
 ui.stamp.textContent=node.ending?'에피소드 종료':('제'+(node.part+1)+'구간 · '+ui.clock.textContent);
 ui.counter.textContent=String(state.evidence.length);
 ui.choices.replaceChildren();
 ui.choiceZone.hidden=!!node.ending;
 ui.ending.hidden=!node.ending;
 if(node.ending){
  ui.ending.replaceChildren();
  ui.ending.append(elem('strong','','에피소드 0 완료 — 당신이 남긴 결과'));
  ui.ending.append(elem('p','',state.decisions.length+'번의 선택으로 '+state.evidence.length+'개의 단서를 확보했습니다. 다른 선택에서는 인물의 행동, 확보하는 증거와 이 결말이 달라집니다.'));
  const replay=elem('button','outline','다른 선택으로 다시 시작하기');
  replay.addEventListener('click',restart);
  ui.ending.append(replay);
 }else{
  ui.decisionLabel.textContent='지금 무엇을 할까?';
  ui.choiceCount.textContent=node.options.length+'개의 가능한 행동';
  node.options.forEach((choice,i)=>{
   const btn=elem('button','choice');
   btn.type='button';
   btn.disabled=!model.canAccess(state,choice);
   btn.append(elem('span','choice-no',String(i+1).padStart(2,'0')),
     elem('span','choice-title',choice.label),elem('span','choice-arrow','→'));
   btn.addEventListener('click',()=>selectChoice(i));
   ui.choices.append(btn);
  });
 }
}
function renderStats(){
 ui.stats.replaceChildren();
 for(const [key,label] of [['proof','증거력'],['credibility','보도 신뢰'],['protection','인물 보호'],['risk','노출 위험']]){
  ui.stats.append(elem('span','',label+' · '+state.stats[key]));
 }
}
function renderTrail(){
 ui.trail.replaceChildren();
 const path=state.history.slice(-7);
 path.forEach((id,i)=>{
  const item=elem('span','trail-item'+(i===path.length-1?' current':''));
  item.append(elem('b','',model.nodes[id].title));
  ui.trail.append(item);
 });
 ui.trail.scrollLeft=ui.trail.scrollWidth; // Keep the reading viewport; scroll only the mini-route.
}
function renderDossier(){
 ui.evidence.replaceChildren();
 if(!state.evidence.length)ui.evidence.append(elem('li','','아직 확보한 증거가 없습니다.'));
 else state.evidence.forEach(x=>ui.evidence.append(elem('li','',x)));
 ui.relations.replaceChildren();
 const people=[['seoa','윤서아','현장 구조팀'],['soyeon','박소연','생존자·가족 지원'],['jiyu','한지유','탐사제작국'],['nagyeong','이나경','항해데이터 내부고발']];
 for(const [id,name,role] of people){
  const li=elem('li','');
  li.append(elem('strong','',name),elem('small','',role+' · 신뢰 '+state.stats[id]));
  const bar=elem('div','relation-bar'),fill=elem('i');
  bar.setAttribute('role','meter');bar.setAttribute('aria-label',name+' 신뢰');
  bar.setAttribute('aria-valuemin','0');bar.setAttribute('aria-valuemax','100');bar.setAttribute('aria-valuenow',state.stats[id]);
  fill.style.width=state.stats[id]+'%';bar.append(fill);li.append(bar);
  ui.relations.append(li);
 }
 ui.log.replaceChildren();
 if(!state.decisions.length)ui.log.append(elem('li','','아직 결정하지 않았습니다.'));
 state.decisions.slice(-12).reverse().forEach(d=>{
  const li=elem('li','');
  li.append(elem('strong','',model.nodes[d.at].title),elem('small','',d.label));
  ui.log.append(li);
 });
}
function render(){
 const node=model.nodes[state.scene];
 renderStory(node);renderStats();renderTrail();renderDossier();
}
function selectChoice(index){
 if(changing)return;
 changing=true;
 ui.choices.querySelectorAll('button').forEach(b=>b.disabled=true);
 try{
  state=model.choose(state,index);
  save();
  render();
  // Only scroll in direct response to a choice; never snap while images are loading.
  window.scrollTo({top:0,behavior:'instant'});
  ui.title.focus({preventScroll:true});
 }finally{changing=false;}
}
function showPanel(value){
 open=value;
 ui.drawer.hidden=!open;
 $('caseOpen').setAttribute('aria-expanded',String(open));
 document.body.style.overflow=open?'hidden':'';
 if(open){renderDossier();$('caseClose').focus();}
 else $('caseOpen').focus();
}
function restart(){
 if(!window.confirm('이번 에피소드의 선택과 증거 기록을 지우고 처음부터 다시 시작할까요?'))return;
 state=model.initial();save();showPanel(false);render();
 window.scrollTo({top:0,behavior:'instant'});
}
$('caseOpen').addEventListener('click',()=>showPanel(true));
$('caseClose').addEventListener('click',()=>showPanel(false));
ui.drawer.addEventListener('click',e=>{if(e.target===ui.drawer)showPanel(false);});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&open)showPanel(false);});
$('restart').addEventListener('click',restart);
$('exportSave').addEventListener('click',()=>{
 const json=JSON.stringify(state,null,2),blob=new Blob([json],{type:'application/json'});
 const url=URL.createObjectURL(blob),link=elem('a');
 link.href=url;link.download='last-signal-pilot-episode0.json';link.click();
 setTimeout(()=>URL.revokeObjectURL(url),500);
});
$('importSave').addEventListener('click',()=>$('importFile').click());
$('importFile').addEventListener('change',async e=>{
 const file=e.target.files?.[0];if(!file)return;
 try{
  if(file.size>120000)throw Error('저장 파일 크기 초과');
  const imported=JSON.parse(await file.text());
  if(!model.valid(imported))throw Error('에피소드 0의 저장 파일이 아닙니다');
  if(!window.confirm('현재 선택 기록을 불러온 저장 파일로 교체할까요?'))return;
  state=imported;save();showPanel(false);render();
  window.scrollTo({top:0,behavior:'instant'});
 }catch(error){window.alert('불러오기 실패: '+error.message);}
 finally{e.target.value='';}
});
save();render();
window.LastSignalPilotUI={getState:()=>JSON.parse(JSON.stringify(state)),render};
})();