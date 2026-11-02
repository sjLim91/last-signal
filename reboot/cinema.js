/* LAST SIGNAL REBOOT G2 — single-scene media renderer.
 * Never display missing/unsanctioned assets or previous scene portraits.
 * Real video is opt-in when both independent still and motion binary exist.
 * All media remain local to /reboot; legacy V3/G1/G2 untouched.
 */
(()=>{
 'use strict';
 const manifest=window.LastSignalMediaManifest;
 const story=window.LastSignalStory;
 if(!manifest||!story)throw new Error('Reboot cinema needs story and scene manifest');
 const stage=document.getElementById('art');
 const layer=document.getElementById('cinemaLayer');
 const tableau=document.getElementById('cinemaTableau');
 const caption=document.getElementById('cinemaMediaStatus');
 const controls=document.getElementById('cinemaControls');
 const replayBtn=document.getElementById('cinemaReplay');
 const soundBtn=document.getElementById('cinemaSound');
 const skipBtn=document.getElementById('cinemaSkip');
 if(!stage||!layer||!tableau||!caption||!controls||!replayBtn||!soundBtn||!skipBtn)throw new Error('Reboot cinema markup missing');

 const photoPattern=/^\.\/media\/scenes\/[a-z0-9_-]+\.(?:webp|avif|jpe?g)$/;
 const videoPattern=/^\.\/media\/motion\/[a-z0-9_-]+\.(?:mp4|webm)$/;
 const cache=new Map();
 const maxCached=4;
 const reduce=window.matchMedia?.('(prefers-reduced-motion: reduce)');
 const dataSaver=()=>!!navigator.connection?.saveData;
 let generation=0;
 let video=null;
 let currentId=null;
 let currentEntry=null;
 let wantsSound=false;
 let visible=true;
 const make=(tag,className)=>{
  const el=document.createElement(tag);
  if(className)el.className=className;
  return el;
 };
 function validLocal(file,pattern){
  if(typeof file!=='string'||!pattern.test(file))return false;
  const url=new URL(file,document.baseURI);
  return url.origin===location.origin && url.pathname.startsWith(new URL('./media/',document.baseURI).pathname);
 }
 function certified(entry){
  return !!(entry&&entry.approved===true&&typeof entry.sha256==='string'&&/^[0-9a-f]{64}$/.test(entry.sha256)&&validLocal(entry.image,photoPattern));
 }
 function videoAllowed(entry){
  return certified(entry)&&entry.motion&&entry.motionApproved===true&&typeof entry.motionSha256==='string'&&/^[0-9a-f]{64}$/.test(entry.motionSha256)&&validLocal(entry.motion,videoPattern)&&!reduce?.matches&&!dataSaver();
 }
 function updateControls(){
  const available=!!(currentEntry&&videoAllowed(currentEntry)&&stage.dataset.cinema!=='fallback');
  controls.hidden=!available;
  soundBtn.hidden=!video;
  skipBtn.hidden=!video;
  soundBtn.setAttribute('aria-pressed',String(!!video&&!video.muted));
  soundBtn.textContent=video&&!video.muted?'소리 끄기':'소리 켜기';
 }
 function silence(){
  if(!video)return;
  video.pause();
  video.removeAttribute('src');
  video.load();
  video.remove();
  video=null;
 }
 function preload(id){
  const entry=manifest.catalog[id];
  if(!certified(entry))return Promise.resolve(null);
  if(cache.has(id))return cache.get(id);
  const task=new Promise(resolve=>{
   const img=new Image();
   img.className='cinema-image';
   img.alt=entry.title+' · 고유 장면 사진';
   img.decoding='async';
   img.loading='eager';
   img.onload=()=>{
    if(img.naturalWidth>0 && img.naturalHeight>0)resolve(img);
    else resolve(null);
   };
   img.onerror=()=>resolve(null);
   img.src=new URL(entry.image,document.baseURI).href;
  });
  cache.set(id,task);
  if(cache.size>maxCached){
   const first=cache.keys().next().value;
   if(first!==id)cache.delete(first);
  }
  return task;
 }
 function fallback(scene){
  tableau.replaceChildren();
  tableau.className='cinema-tableau';
  tableau.hidden=false;
  const type=manifest.catalog[scene.id]?.fallback||scene.mood;
  tableau.dataset.setting=type;
  if(scene.id==='p0'){
   const room=make('div','cinema-set cinema-newsroom');
   room.append(make('div','newsroom-window'),make('div','newsroom-city'),make('div','newsroom-desk'),make('div','newsroom-monitor'),make('div','newsroom-led'));
   tableau.append(room);
  }else if(scene.id==='p1'){
   const desk=make('div','cinema-set cinema-evidence');
   desk.append(make('div','dossier-sheet sheet-a'),make('div','dossier-sheet sheet-b'),make('div','dossier-mug'),make('div','dossier-light'));
   tableau.append(desk);
  }else if(scene.id==='p2'){
   const roof=make('div','cinema-set cinema-rooftop');
   roof.append(make('div','roof-cloud'),make('div','roof-city'),make('div','roof-rail'),make('div','roof-beacon'),make('div','roof-rain'));
   tableau.append(roof);
  }else if(scene.id==='p3'){
   const plaza=make('div','cinema-set cinema-memorial');
   const chairs=make('div','memorial-chairs');
   for(let i=0;i<18;i++)chairs.append(make('div','chair'));
   plaza.append(make('div','memorial-sky'),make('div','memorial-sea'),make('div','memorial-ground'),chairs);
   tableau.append(plaza);
  }
  stage.dataset.cinema='fallback';
  caption.textContent='장면 연출 · 실사 제작 대기';
  updateControls();
 }
 function maybeVideo(entry,epoch,userActivated=false){
  if(!videoAllowed(entry)||epoch!==generation||!visible)return;
  const vid=document.createElement('video');
  vid.className='cinema-video';
  vid.preload='none';
  // Browser autoplay is ALWAYS silent; sound can only be enabled by a user gesture.
  vid.muted=userActivated?!wantsSound:true;
  vid.defaultMuted=true;
  vid.playsInline=true;
  vid.setAttribute('playsinline','');
  vid.loop=false;
  vid.controls=false;
  vid.addEventListener('playing',()=>{
   if(vid!==video)return;
   stage.dataset.cinema='approved-motion';
   caption.textContent='실사 영상 재생 중';
   updateControls();
  });
  vid.addEventListener('ended',()=>{
   if(vid!==video)return;
   silence();
   stage.dataset.cinema='approved-still';
   caption.textContent='실사 영상 · 재생 완료';
   updateControls();
  },{once:true});
  vid.addEventListener('error',()=>{
   if(vid!==video)return;
   silence();
   stage.dataset.cinema='approved-still';
   caption.textContent='영상 재생 불가 · 실사 사진 표시';
   updateControls();
  },{once:true});
  vid.src=new URL(entry.motion,document.baseURI).href;
  layer.append(vid);
  video=vid;
  updateControls();
  const result=vid.play();
  if(result&&typeof result.catch==='function')result.catch(()=>{
   if(vid!==video)return;
   silence();
   stage.dataset.cinema='approved-still';
   caption.textContent='자동 재생 차단 · 다시 보기 가능';
   updateControls();
  });
 }
 function prefetchNext(scene){
  if(dataSaver()||reduce?.matches)return;
  const next=scene.choices||[];
  let queued=0;
  for(const choice of next){
   if(queued>=1)break;
   if(certified(manifest.catalog[choice.to])){preload(choice.to);queued++;}
  }
 }
 async function show(scene){
  if(!scene||!manifest.catalog[scene.id])return;
  const epoch=++generation;
  currentId=scene.id;
  currentEntry=manifest.catalog[scene.id];
  wantsSound=false;
  silence();
  layer.replaceChildren();
  stage.classList.remove('cinema-real');
  fallback(scene);
  const entry=manifest.catalog[scene.id];
  if(!certified(entry))return;
  try{
   const img=await preload(scene.id);
   if(epoch!==generation||currentId!==scene.id||!img)return;
   // The exact image that finished loading is mounted: no second broken network request.
   layer.replaceChildren(img);
   stage.classList.add('cinema-real');
   stage.dataset.cinema='approved-still';
   tableau.hidden=true;
   caption.textContent='고유 실사 장면';
   updateControls();
   maybeVideo(entry,epoch);
   prefetchNext(scene);
  }catch(_){
   if(epoch===generation)fallback(scene);
  }
 }
 replayBtn.addEventListener('click',()=>{
  if(!currentEntry||!videoAllowed(currentEntry)||stage.dataset.cinema==='fallback'||!visible)return;
  if(!video){maybeVideo(currentEntry,generation,true);return;}
  try{video.currentTime=0;}catch(_){/* media may still be loading */ }
  const result=video.play();
  if(result&&typeof result.catch==='function')result.catch(()=>{caption.textContent='영상 재생 불가 · 실사 사진 표시';});
 });
 soundBtn.addEventListener('click',()=>{
  if(!video)return;
  video.muted=!video.muted;
  wantsSound=!video.muted;
  updateControls();
 });
 skipBtn.addEventListener('click',()=>{
  if(!video)return;
  silence();
  stage.dataset.cinema='approved-still';
  caption.textContent='영상 건너뜀 · 실사 사진 표시';
  updateControls();
 });
 function stopIfHidden(){
  if(document.hidden||!visible)video?.pause();
 }
 document.addEventListener('visibilitychange',stopIfHidden);
 if('IntersectionObserver' in window){
  new IntersectionObserver(entries=>{
   visible=!!entries[0]?.isIntersecting;
   if(!visible)stopIfHidden();
  },{threshold:0.01}).observe(stage);
 }
 window.LastSignalCinema=Object.freeze({
  show,preload,certified,
  status:()=>Object.freeze({
   scene:currentId,
   visual:stage.dataset.cinema,
   approvedStills:Object.values(manifest.catalog).filter(certified).length,
   videoPlaying:!!video&&!video.paused,
   videoAvailable:!!currentEntry&&videoAllowed(currentEntry),
   soundEnabled:!!video&&!video.muted
  })
 });
})();