#!/usr/bin/env node
/* No browser package required: production G2 scene contract + synthetic DOM lifecycle. */
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const read=(rel)=>fs.readFileSync(new URL('../'+rel,import.meta.url),'utf8');
const files={
 story:read('reboot/story.js'),
 manifest:read('reboot/media/manifest.js'),
 cinema:read('reboot/cinema.js'),
 html:read('reboot/index.html'),
 css:read('reboot/cinema.css'),
 engine:read('reboot/engine.js')
};
for(const [key,code] of Object.entries({story:files.story,manifest:files.manifest,cinema:files.cinema})){
 new vm.Script(code,{filename:key+'.js'});
}
const storyContext=vm.createContext({window:{}});
vm.runInContext(files.story,storyContext);
vm.runInContext(files.manifest,storyContext);
const book=storyContext.window.LastSignalStory;
const media=storyContext.window.LastSignalMediaManifest;
const ids=Object.keys(book.scenes);
assert.equal(ids.length,79);
assert.equal(Object.keys(media.catalog).length,79,'every story node has a media contract');
assert.equal(media.sceneCount,79);
assert.equal(media.approvedStillCount,0,'no fake completed photographs');
assert.equal(media.approvedMotionCount,0,'no fake completed action videos');
for(const id of ids){
 const shot=media.catalog[id];
 assert.equal(shot.id,id);
 assert.equal(shot.approved,false,'pending images must not be presented as approved');
 assert.equal(shot.image,null,'missing still must not claim a URL');
 assert.equal(shot.motion,null,'missing motion must not claim a file');
}
assert.equal(new Set(['p0','p1','p2','p3'].map(id=>media.catalog[id].fallback)).size,4,'independent prologue compositions');
for(const id of ['p0','p1','p2','p3']){
 assert.ok(media.catalog[id].brief.length>=25);
 assert.ok(media.catalog[id].framing.length>=20);
}
assert.ok(files.html.indexOf('src="./story.js"')<files.html.indexOf('src="./media/manifest.js"'));
assert.ok(files.html.indexOf('src="./media/manifest.js"')<files.html.indexOf('src="./cinema.js"'));
assert.ok(files.html.indexOf('src="./cinema.js"')<files.html.indexOf('src="./engine.js"'));
assert.ok(files.html.includes('id="cinemaLayer"')&&files.html.includes('id="cinemaTableau"'));
assert.ok(files.engine.includes('LastSignalCinema?.show(scene)'));
assert.ok(files.css.includes('cinema-memorial')&&files.css.includes('cinema-rooftop'));

function createNode(tag='div'){
 const listeners={};
 const classSet=new Set();
 return {
  tag,hidden:false,dataset:{},children:[],textContent:'',naturalWidth:0,naturalHeight:0,paused:true,
  classList:{
   add(...items){items.forEach(x=>classSet.add(x));},
   remove(...items){items.forEach(x=>classSet.delete(x));},
   contains(x){return classSet.has(x);}
  },
  append(...nodes){this.children.push(...nodes);},
  replaceChildren(...nodes){this.children=[...nodes];},
  addEventListener(type,callback){(listeners[type]??=[]).push(callback);},
  setAttribute(name,value){this[name]=value;},
  removeAttribute(name){delete this[name];},
  remove(){this.removed=true;},
  pause(){this.paused=true;this.pauseCalls=(this.pauseCalls||0)+1;},
  load(){},
  play(){this.paused=false;return Promise.resolve();},
  dispatch(type){(listeners[type]||[]).forEach(fn=>fn());}
 };
}
function environment({approved=[],autoLoad=true,motion=false,reduced=false,saveData=false}={}){
 const stage=createNode('figure');
 const layer=createNode('div');
 const tableau=createNode('div');
 const caption=createNode('span');
 const nodes={art:stage,cinemaLayer:layer,cinemaTableau:tableau,cinemaMediaStatus:caption};
 const images=[],requested=[];
 const events={};
 class FakeImage {
  constructor(){Object.assign(this,createNode('img'));this.naturalWidth=0;this.naturalHeight=0;images.push(this);}
  set src(value){
   this._src=value;requested.push(value);
   if(autoLoad)queueMicrotask(()=>this.completeLoad());
  }
  get src(){return this._src;}
  completeLoad(){this.naturalWidth=1536;this.naturalHeight=864;this.onload?.();}
 }
 const newCatalog={...media.catalog};
 for(const id of approved){
  newCatalog[id]={...newCatalog[id],approved:true,image:'./media/scenes/'+id+'.webp',sha256:'a'.repeat(64),
   ...(motion?{motion:'./media/motion/'+id+'.webm',motionApproved:true,motionSha256:'b'.repeat(64)}:{})};
 }
 const ctx={
  window:{
   LastSignalStory:book,
   LastSignalMediaManifest:{...media,catalog:newCatalog},
   matchMedia:()=>({matches:reduced})
  },
  document:{
   baseURI:'https://sjlim91.github.io/last-signal/reboot/index.html',
   hidden:false,
   getElementById:(id)=>nodes[id],
   createElement:createNode,
   addEventListener:(type,fn)=>{(events[type]??=[]).push(fn);}
  },
  navigator:{connection:{saveData}},
  location:{origin:'https://sjlim91.github.io'},
  URL,Image:FakeImage,queueMicrotask
 };
 vm.createContext(ctx);
 vm.runInContext(files.cinema,ctx);
 return {api:ctx.window.LastSignalCinema,book,stage,layer,tableau,caption,images,requested,ctx,events};
}
const fallback=environment();
for(const id of ['p0','p1','p2','p3']){
 await fallback.api.show(book.scenes[id]);
 assert.equal(fallback.stage.dataset.cinema,'fallback','no false success: '+id);
 assert.equal(fallback.caption.textContent,'장면 연출 · 실사 제작 대기');
 assert.equal(fallback.tableau.children.length,1,'one individual staging, no collage: '+id);
}
assert.equal(fallback.requested.length,0,'do not request missing photos (no 404 storm)');
assert.equal(fallback.api.status().approvedStills,0);

const loaded=environment({approved:['p0']});
await loaded.api.show(book.scenes.p0);
assert.equal(loaded.stage.dataset.cinema,'approved-still');
assert.equal(loaded.layer.children.length,1,'only one independent film still');
assert.equal(loaded.tableau.hidden,true);
assert.equal(loaded.requested.length,1,'preload only the current approved original');
assert.ok(loaded.layer.children[0].src.endsWith('/p0.webp'));
await loaded.api.show(book.scenes.p1);
assert.equal(loaded.stage.dataset.cinema,'fallback','old photo never shown in next scene');
assert.equal(loaded.layer.children.length,0,'old photo removed at scene boundary');
assert.equal(loaded.requested.length,1,'no missing scene download');

const stale=environment({approved:['p0'],autoLoad:false});
const first=stale.api.show(book.scenes.p0);
await stale.api.show(book.scenes.p1);
stale.images[0].completeLoad();
await first;
assert.equal(stale.stage.dataset.cinema,'fallback','stale asynchronous image must not swap');
assert.equal(stale.layer.children.length,0,'stale image stays off screen');

const guard=environment({approved:['p0']});
assert.equal(guard.api.certified({...guard.ctx.window.LastSignalMediaManifest.catalog.p0,image:'https://random.example/other.webp'}),false,'no external image');
assert.equal(guard.api.certified({...guard.ctx.window.LastSignalMediaManifest.catalog.p0,sha256:null}),false,'required checksum');
assert.equal(guard.api.certified({...guard.ctx.window.LastSignalMediaManifest.catalog.p0,approved:false}),false,'required explicit approval');

const video=environment({approved:['p0'],motion:true});
await video.api.show(book.scenes.p0);
assert.equal(video.layer.children.length,2,'approved still + one valid video');
assert.equal(video.api.status().videoPlaying,true,'one-shot clip started');
video.ctx.document.hidden=true;
(video.events.visibilitychange||[]).forEach(fn=>fn());
assert.equal(video.api.status().videoPlaying,false,'video pauses when page hidden');
await video.api.show(book.scenes.p1);
assert.equal(video.layer.children.length,0,'video is torn down on navigation');

const reduced=environment({approved:['p0'],motion:true,reduced:true});
await reduced.api.show(book.scenes.p0);
assert.equal(reduced.layer.children.length,1,'reduced motion uses still only');
const dataSaved=environment({approved:['p0'],motion:true,saveData:true});
await dataSaved.api.show(book.scenes.p0);
assert.equal(dataSaved.layer.children.length,1,'save-data uses still only');

console.log(JSON.stringify({
 status:'PASS',contractScenes:ids.length,prologueUniqueStagings:4,
 missingNetworkRequests:fallback.requested.length,
 realStillPositiveMock:true,staleLoadGuard:true,videoOneShot:true,
 pageVisibilityPause:true,saveDataFallback:true,reducedMotionFallback:true
}));
