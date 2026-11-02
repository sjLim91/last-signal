/* LAST SIGNAL REBOOT — offline, deterministic browser engine. */
(function(){
 'use strict';
 const BOOK=window.LastSignalStory;
 if(!BOOK) throw new Error('Story data missing');
 const KEY='last_signal_reboot_v1';
 const statsLabels={evidence:'증거 검증',credibility:'보도의 신뢰',safety:'취재원 안전',heat:'권력의 압박',seoa:'윤서아',jiyu:'한지유',soyeon:'박소연',nagyeong:'이나경'};
 const $=(id)=>document.getElementById(id);
 const ui={
  title:$('sceneTitle'),text:$('sceneText'),location:$('sceneLocation'),time:$('sceneTime'),scene:$('scene'),
  art:$('art'),artName:$('artName'),choices:$('choices'),feedback:$('feedback'),chip:$('chapterChip'),
  act:$('actChip'),progress:$('progressText'),meter:$('progressBar'),topStats:$('topStats'),
  graph:$('decisionGraph'),panel:$('dossier'),evidence:$('evidenceList'),contacts:$('contactsList'),
  timeline:$('timeline'),ending:$('endingSummary'),chapterList:$('chapterList'),status:$('saveStatus')
 };
 const clamp=(v)=>Math.max(0,Math.min(100,Math.round(v)));
 function blank(){return {version:BOOK.version,scene:BOOK.start,stats:Object.assign({},BOOK.stats),visited:[BOOK.start],choices:[],route:{},evidence:[],startedAt:Date.now(),updatedAt:Date.now()};}
 function valid(data){
  if(!data||data.version!==BOOK.version||!BOOK.scenes[data.scene])return false;
  if(!data.stats||!Array.isArray(data.visited)||!Array.isArray(data.choices)||!Array.isArray(data.evidence))return false;
  if(data.visited.length>200||data.choices.length>200)return false;
  if(!data.visited.every(id=>!!BOOK.scenes[id]))return false;
  return true;
 }
 function restore(){try{const data=JSON.parse(localStorage.getItem(KEY));if(valid(data))return data;}catch(_){/* storage may be blocked */}return blank();}
 let state=restore();
 let activePanel=false;
 const save=()=>{
  state.updatedAt=Date.now();
  try{localStorage.setItem(KEY,JSON.stringify(state));ui.status.textContent='이 기기에 자동 저장됨';}
  catch(_){ui.status.textContent='저장 불가 · 이 탭에서만 진행';}
 };
 function element(name,klass,txt){
  const x=document.createElement(name);
  if(klass)x.className=klass;
  if(txt!==undefined)x.textContent=String(txt);
  return x;
 }
 function moodName(mood){
  return ({harbor:'추모광장',radio:'단절된 교신',newsroom:'편집국',warehouse:'항만 창고',sea:'차가운 바다',hospital:'병원 복도',deck:'수색 갑판',parking:'지하 계단',archive:'기록 보관소',city:'권력의 방',server:'데이터 센터',hotel:'증인 대기실',evidence:'사건 재구성',tower:'송출 전야'})[mood]||'현장 기록';
 }
 function numberOfChapter(scene){
  if(scene.chapter<0)return 0;
  if(scene.chapter>=BOOK.chapters.length)return BOOK.chapters.length;
  return scene.chapter+1;
 }
 function sceneLabel(scene){
  if(scene.ending)return scene.title;
  if(scene.chapter<0)return '프롤로그 · '+scene.title;
  return String(scene.chapter+1).padStart(2,'0')+'장 · '+scene.title;
 }
 function updateTop(scene){
  const ch=numberOfChapter(scene);
  const act=BOOK.acts[scene.act]||BOOK.acts[5];
  ui.act.textContent='제'+(scene.act+1)+'막 · '+act;
  ui.chip.textContent=scene.chapter<0?'프롤로그':scene.ending?'결말':String(ch).padStart(2,'0')+' / 14';
  ui.progress.textContent=scene.ending?'여정 종료':ch+' / 14 챕터';
  ui.meter.style.width= (scene.ending?100:Math.max(2,Math.round(ch/14*100)))+'%';
  ui.topStats.replaceChildren();
  [['evidence','증거'],['credibility','신뢰'],['safety','보호'],['heat','압박']].forEach(([key,label])=>{
   const pill=element('span','stat-pill',label+' '+state.stats[key]);pill.dataset.stat=key;
   ui.topStats.append(pill);
  });
 }
 function echoes(scene){
  const notes=[];
  if(scene.chapter>0&&scene.chapter<BOOK.chapters.length){
   const previous=String(scene.chapter).padStart(2,'0');
   const route=state.route[previous];
   if(route==='A')notes.push('앞선 조사에서 정면으로 증거에 접근한 선택 때문에, 이번 현장에서도 누군가는 이미 당신의 움직임을 알고 있다.');
   if(route==='B')notes.push('앞선 조사에서 사람과 절차를 보호한 덕분에, 이번에는 침묵하던 누군가가 이야기를 이어 갈 여지가 생겼다.');
  }
  if(scene.id==='c08-i'&&state.stats.nagyeong>=55)notes.push('나경은 당신에게 먼저 약속 장소를 보낸다. 그동안의 태도를 보고 믿을 수 있을지도 모른다고 판단한 것이다.');
  if(scene.id==='c08-i'&&state.stats.nagyeong<55)notes.push('나경은 만남 직전 장소를 두 번 바꾼다. 당신이 제보자를 지킬지 아직 확신하지 못한다.');
  if(scene.id==='c10-i'&&state.stats.jiyu>=60)notes.push('지유는 후원금 흐름을 설명하기 전에 자신의 과거 관계부터 고백한다.');
  if(scene.id==='c12-i'&&state.stats.safety<40)notes.push('지난 보도 이후 일부 취재원이 연락을 끊었다. 청문회 증인석에 남을 사람을 다시 세어야 한다.');
  if(scene.id==='c13-i'&&state.stats.evidence<60)notes.push('확실한 원본이 부족하다. 당신은 단정적인 문장을 모두 지우고 검증되지 않은 구간을 빈칸으로 남겨 둔다.');
  if(scene.id==='c14-i'&&state.stats.heat>=75)notes.push('편집국 밖에는 정체 모를 차량이 멈춰 있다. 누구의 차인지 확신할 수 없지만, 경호 인력은 문을 잠근다.');
  return notes;
 }
 function render(){
  const scene=BOOK.scenes[state.scene];
  document.title='라스트 시그널 · '+scene.title;
  updateTop(scene);
  ui.title.textContent=scene.title;
  ui.location.textContent=scene.location;
  ui.time.textContent=scene.time;
  ui.art.className='visual mood-'+scene.mood;
  ui.artName.textContent=moodName(scene.mood);
  ui.art.setAttribute('aria-label',scene.location+' · 영화적 분위기 배경');
  ui.text.replaceChildren();
  scene.text.split(/\n\s*\n/).forEach((paragraph,i)=>{
   ui.text.append(element('p',i===0?'lead':'',paragraph));
  });
  const dynamic=echoes(scene);
  if(dynamic.length){
   const aside=element('aside','echo');
   aside.append(element('strong','', '이전 선택의 여파'));
   dynamic.forEach(t=>aside.append(element('p','',t)));
   ui.text.append(aside);
  }
  ui.choices.replaceChildren();
  if(scene.ending){
   ui.choices.append(element('div','end-label','이 결말은 당신의 선택으로 확정되었습니다.'));
   $('restartEnding').hidden=false;
   renderEnding(scene);
  }else{
   $('restartEnding').hidden=true;
   ui.ending.hidden=true;
   const legend=element('div','choice-heading','다음 행동을 선택하세요');
   ui.choices.append(legend);
   scene.choices.forEach((choice,idx)=>{
    const btn=element('button','choice');
    btn.type='button';
    btn.setAttribute('aria-label','선택 '+(idx+1)+': '+choice.label);
    btn.append(element('span','choice-num',String(idx+1).padStart(2,'0')));
    btn.append(element('span','choice-label',choice.label));
    btn.append(element('span','choice-arrow','→'));
    btn.addEventListener('click',()=>choose(choice,btn));
    ui.choices.append(btn);
   });
  }
  ui.scene.dataset.scene=scene.id;
  ui.feedback.textContent=state.choices.length?state.choices[state.choices.length-1].note:'처음으로 돌아온 기록에서 출발합니다.';
  renderGraph();
  renderDossier();
 }
 let choosing=false;
 function choose(choice,button){
  if(choosing||!BOOK.scenes[choice.to])return;
  const source=BOOK.scenes[state.scene];
  if(source.ending)return;
  choosing=true;
  ui.choices.querySelectorAll('button').forEach(el=>el.disabled=true);
  const effect=choice.effects||{};
  Object.keys(effect).forEach(key=>{
   if(Object.prototype.hasOwnProperty.call(state.stats,key))state.stats[key]=clamp(state.stats[key]+effect[key]);
  });
  if(source.id.match(/^c\d\d-i$/)&&choice.tag){
   state.route[String(source.chapter+1).padStart(2,'0')]=choice.tag;
  }
  state.choices.push({from:source.id,to:choice.to,label:choice.label,note:choice.note||'선택을 기록했다.',at:Date.now()});
  state.scene=choice.to;
  state.visited.push(choice.to);
  const arriving=BOOK.scenes[choice.to];
  if(arriving.award&&!state.evidence.includes(arriving.award))state.evidence.push(arriving.award);
  save();
  render();
  // Only one scene is displayed, so choices never get buried under a growing chat log.
  // The user's scroll is preserved while a decision is made; provide a visible start to each new scene.
  $('gameMain').scrollIntoView({behavior:'instant',block:'start'});
  choosing=false;
 }
 function renderEnding(scene){
  ui.ending.hidden=false;
  ui.ending.replaceChildren();
  ui.ending.append(element('h3','', '이번 취재의 기록'));
  const n=state.choices.length;
  const routeA=Object.values(state.route).filter(x=>x==='A').length;
  const routeB=Object.values(state.route).filter(x=>x==='B').length;
  const summary=element('p','',n+'번의 결정, '+state.evidence.length+'건의 증거 항목, 직접 검증 '+routeA+'개 경로 / 보호 중심 '+routeB+'개 경로.');
  ui.ending.append(summary);
  let reflection;
  if(state.stats.credibility>=70&&state.stats.safety>=70)reflection='당신은 검증과 사람을 지키는 일 모두에 시간을 썼다. 증언의 무게가 기사의 분량을 바꿨다.';
  else if(state.stats.heat>=80)reflection='당신의 취재는 큰 압박을 불렀다. 공개 이후에도 증거의 보존과 취재원 보호가 필요하다.';
  else if(state.stats.safety<40)reflection='몇몇 사람은 당신의 취재로 더 위험해졌다. 결과가 어떻든 이 책임은 남는다.';
  else reflection='취재로 확인한 사실과 끝내 확인하지 못한 부분은 구분돼 남는다. 어느 결말도 모든 사람을 구하지는 못한다.';
  ui.ending.append(element('p','',reflection));
 }
 function renderGraph(){
  const svg=ui.graph, ns='http://www.w3.org/2000/svg';
  while(svg.firstChild)svg.removeChild(svg.firstChild);
  const trail=state.visited.slice(-7);
  const w=720,h=96;
  svg.setAttribute('viewBox','0 0 '+w+' '+h);
  svg.setAttribute('role','img');svg.setAttribute('aria-label','최근 진행한 결정 경로 '+trail.map(id=>BOOK.scenes[id].title).join(' → '));
  const pos=trail.map((id,i)=>({id,x:50+i*(620/Math.max(1,trail.length-1)),y:41+(i%2?10:-5)}));
  for(let i=1;i<pos.length;i++){
   const l=document.createElementNS(ns,'line');
   l.setAttribute('x1',pos[i-1].x);l.setAttribute('y1',pos[i-1].y);l.setAttribute('x2',pos[i].x);l.setAttribute('y2',pos[i].y);l.setAttribute('stroke','#668596');l.setAttribute('stroke-width','2');
   svg.append(l);
  }
  pos.forEach((p,i)=>{
   const rect=document.createElementNS(ns,'rect');
   rect.setAttribute('x',p.x-28);rect.setAttribute('y',p.y-12);rect.setAttribute('width','56');rect.setAttribute('height','25');rect.setAttribute('rx','7');rect.setAttribute('stroke',i===pos.length-1?'#e4bc81':'#698193');rect.setAttribute('fill',i===pos.length-1?'#9c6847':'#1a3242');svg.append(rect);
   const text=document.createElementNS(ns,'text');text.setAttribute('x',p.x);text.setAttribute('y',p.y+4);text.setAttribute('text-anchor','middle');text.setAttribute('fill','#f4eada');text.setAttribute('font-size','11');
   text.textContent=p.id.replace('c','').replace('-','·');svg.append(text);
  });
 }
 function renderDossier(){
  ui.evidence.replaceChildren();
  if(!state.evidence.length)ui.evidence.append(element('li','quiet','아직 검증 기록이 없습니다.'));
  state.evidence.forEach(x=>ui.evidence.append(element('li','',x)));
  ui.contacts.replaceChildren();
  BOOK.people.forEach(person=>{
   const li=element('li','contact');
   li.append(element('strong','',person.name),element('small','',person.role),element('span','',person.position));
   const meter=element('div','contact-meter');meter.setAttribute('role','meter');meter.setAttribute('aria-label',person.name+' 신뢰');
   meter.setAttribute('aria-valuemin','0');meter.setAttribute('aria-valuemax','100');meter.setAttribute('aria-valuenow',state.stats[person.id]);
   const fill=element('i');fill.style.width=state.stats[person.id]+'%';meter.append(fill);li.append(meter);
   ui.contacts.append(li);
  });
  ui.timeline.replaceChildren();
  state.choices.slice(-15).reverse().forEach(item=>{
   const node=BOOK.scenes[item.from];
   const li=element('li','');
   li.append(element('strong','',node.title),element('span','',item.label));
   ui.timeline.append(li);
  });
  if(!state.choices.length)ui.timeline.append(element('li','quiet','선택 기록이 없습니다.'));
  ui.chapterList.replaceChildren();
  BOOK.chapters.forEach((ch,i)=>{
   const reached=state.visited.some(id=>BOOK.scenes[id].chapter===i);
   const el=element('li',reached?'reached':'locked',(i+1)+'. '+ch.title);
   el.title=reached?'취재한 장':'아직 방문하지 않은 장';
   ui.chapterList.append(el);
  });
 }
 function showDossier(open){
  activePanel=!!open;
  ui.panel.hidden=!activePanel;
  $('boardBtn').setAttribute('aria-expanded',String(activePanel));
  if(activePanel){renderDossier();ui.panel.querySelector('button').focus();}
  else $('boardBtn').focus();
 }
 $('boardBtn').addEventListener('click',()=>showDossier(!activePanel));
 $('closeBoard').addEventListener('click',()=>showDossier(false));
 ui.panel.addEventListener('click',(e)=>{if(e.target===ui.panel)showDossier(false);});
 document.addEventListener('keydown',(e)=>{if(e.key==='Escape'&&activePanel)showDossier(false);});
 function restart(){
  if(!window.confirm('현재 리부트의 취재 기록과 결말을 지우고 처음부터 시작할까요?'))return;
  state=blank();save();showDossier(false);render();$('gameMain').scrollIntoView({behavior:'instant'});
 }
 $('restartBtn').addEventListener('click',restart);
 $('restartEnding').addEventListener('click',restart);
 $('exportBtn').addEventListener('click',()=>{
  const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='last-signal-reboot-save.json';a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
 });
 $('importBtn').addEventListener('click',()=>$('importFile').click());
 $('importFile').addEventListener('change',async(e)=>{
  const file=e.target.files&&e.target.files[0];if(!file)return;
  try{
   if(file.size>100000)throw new Error('저장 파일 크기가 너무 큽니다.');
   const parsed=JSON.parse(await file.text());
   if(!valid(parsed))throw new Error('호환되지 않는 저장 파일입니다.');
   if(!window.confirm('현재 기록을 불러온 기록으로 교체할까요?'))return;
   state=parsed;save();showDossier(false);render();$('gameMain').scrollIntoView({behavior:'instant'});
  }catch(err){window.alert('불러오기 실패: '+err.message);}
  finally{e.target.value='';}
 });
 save();render();
})();