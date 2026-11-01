#!/usr/bin/env node
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync(new URL('../g2/prologue-client.js',import.meta.url),'utf8');
const listeners=new Map();
const add=(name,fn)=>{const old=listeners.get(name)||[];old.push(fn);listeners.set(name,old);};
const classList=()=>{const s=new Set();return {add:(...xs)=>xs.forEach(x=>s.add(x)),remove:(...xs)=>xs.forEach(x=>s.delete(x)),contains:x=>s.has(x)};};
const sent=[];
let available=new Set(['p0','p2','p3']);
const visibleUnavailable = new Set(['p2']); // Preflight success can still fail in the displayed element.
class FakeImage{
  onload=null;onerror=null;decoding='';_src='';
  set src(x){this._src=x;sent.push(x);queueMicrotask(()=>{(available.has(x.match(/(p[0-3])\.webp/)?.[1])?this.onload:this.onerror)?.()});}
  get src(){return this._src;}
}
function makeArticle(id,title){
 const frame={classList:classList()};
 const original='data:image/jpeg;base64,LEGACY_'+id;
 const image={alt:'',loading:'lazy',_src:original,attrs:{},listeners:{},
  complete:false,naturalWidth:0,
  getAttribute(k){return k==='src'?this._src:this.attrs[k]},
  setAttribute(k,v){this.attrs[k]=v},
  set src(x){
   this._src=x;
   const target=x.match(/(p[0-3])\.webp/)?.[1];
   if(target) queueMicrotask(()=>{
    if(visibleUnavailable.has(target)) this.listeners.error?.();
    else {this.complete=true;this.naturalWidth=1600;this.listeners.load?.();}
   });
  },
  get src(){return this._src},
  addEventListener(k,fn){this.listeners[k]=fn},
  removeEventListener(k,fn){if(this.listeners[k]===fn)delete this.listeners[k]},
  closest(k){return k==='.charframe'?frame:null}
 };
 const heading={textContent:title+' · 위치'};
 const article={isConnected:true,dataset:{},classList:classList(),
  querySelector(k){return k==='.sceneheading'?heading:k==='img.sceneimage'?image:null}};
 return {article,image,original,frame};
}
const p0=makeArticle('p0','전국 긴급 속보');
const p1=makeArticle('p1','침묵한 도시');
const p2=makeArticle('p2','뒤틀린 계단');
const p3=makeArticle('p3','윤서아');
const root={querySelectorAll:()=>[p0.article,p1.article,p2.article,p3.article]};
const document={readyState:'complete',baseURI:'https://example.org/last-signal/',
  addEventListener:add,getElementById:()=>root};
const window={};
const calls={};
class MockMutationObserver{constructor(cb){calls.observer=cb;}observe(){calls.observed=true;}disconnect(){}}
const now=()=>456;
const context={document,window,Image:FakeImage,URL,MutationObserver:MockMutationObserver,
  performance:{now},queueMicrotask,console,Set,Map,Object};
vm.createContext(context);vm.runInContext(source,context,{filename:'g2/prologue-client.js'});
// Let all preflight image loads and Promise callbacks finish.
for(let i=0;i<5;i++)await new Promise(resolve=>setImmediate(resolve));
assert.ok(calls.observed,'G2 DOM observer is installed');
assert.deepEqual(Array.from(window.LAST_SIGNAL_G2.ids),['p0','p1','p2','p3']);
assert.equal(p0.article.dataset.g2Scene,'p0');
assert.match(p0.image.src,/p0\.webp$/);
assert.equal(p0.article.classList.contains('g2-ready'),true);
assert.equal(p1.article.dataset.g2Missing,'p1');
assert.equal(p1.image.src,p1.original,'missing scene retains the original embedded image');
assert.equal(p2.article.dataset.g2Missing,'p2','visible image load failed after preflight succeeded');
assert.equal(p2.image.src,p2.original,'display error falls back to legacy image');
assert.equal(p2.article.classList.contains('g2-ready'),false,'failed displayed image never hides portrait');
assert.equal(p3.article.dataset.g2Scene,'p3');
assert.equal(p3.article.classList.contains('g2-ready'),true);
assert.equal(p0.frame.classList.contains('g2-ready'),true);
const count=sent.length;
window.LAST_SIGNAL_G2.refresh();
for(let i=0;i<3;i++)await new Promise(resolve=>setImmediate(resolve));
assert.equal(sent.length,count,'available and missing sources are fetched at most once');
assert.ok(!window.LAST_SIGNAL_G2.ready().includes('p1'));
const prior=window.LAST_SIGNAL_G2.lastManualScroll();
listeners.get('wheel')[0]({target:{closest:s=>s==='#storyScroll'?{}:null}});
assert.equal(window.LAST_SIGNAL_G2.lastManualScroll(),456);
assert.notEqual(prior,456);
console.log(JSON.stringify({status:'PASS',loaded:window.LAST_SIGNAL_G2.ready(),missing:['p1','p2'],preservedLegacyOnMissing:true,displayFailureFallback:true,notDuplicated:true,manualScrollObserved:true}));
