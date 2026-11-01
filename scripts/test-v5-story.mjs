#!/usr/bin/env node
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const core=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const story=fs.readFileSync(new URL('../story/v5-narrative.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../story/v5.css',import.meta.url),'utf8');
const ids=[...core.matchAll(/^ ([a-z][a-z0-9_]+):\{ch:/gm)].map(m=>m[1]);
assert.equal(ids.length,33,'V3 scene count preserved');
assert.ok(core.includes('last_signal_v3'),'original save key preserved');
assert.ok(core.includes('./story/v5-narrative.js'),'new narrative mounted');
assert.ok(core.includes('./story/v5.css'),'reading style mounted');
assert.ok(css.includes('.v5-consequence'),'consequence panel has styling');
new vm.Script(story,{filename:'story/v5-narrative.js'});
const SCENES=Object.fromEntries(ids.map(id=>[id,{title:id,place:'test',text:'OLD',choices:[]}]));
SCENES.p0.choices=[{text:'방송을 녹음하고 필수품을 챙긴다',effect:{flags:['recorded']}}];
const state={scene:'p1',day:2,minute:880,history:[{scene:'p0',choice:'방송을 녹음하고 필수품을 챙긴다'}],flags:['recorded']};
const CHAPTERS=['P','1','2','3','4','5','E'].map(id=>({id,title:id,desc:id,subtitle:id}));
let didRender=0;
const window={};
const ctx={SCENES,CHAPTERS,state,window,sceneHTML:(id)=>'<article>'+id+'</article>',
 act:(s)=>({...s,scene:'c1a'}),render:()=>{didRender++},H:s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;')};
vm.createContext(ctx);
vm.runInContext(story,ctx);
assert.equal(window.LAST_SIGNAL_STORY.sceneCount,33);
assert.deepEqual(new Set(window.LAST_SIGNAL_STORY.updatedSceneIds),new Set(ids),'rewrite exactly the existing 33 scenes');
assert.equal(didRender,1,'initial V3 screen gets refreshed once');
for(const id of ids){
 assert.ok(SCENES[id].text.length>=130,'substantial narrative: '+id);
 assert.ok(SCENES[id].text.includes('\n\n'),'paragraph pacing: '+id);
}
assert.ok(SCENES.p0.text.includes('47초'));
assert.ok(SCENES.p3.text.includes('윤서아'));
assert.ok(SCENES.c4a.text.includes('박소연'));
const branch=ctx.sceneHTML('p1',1);
assert.ok(branch.includes('선택의 여파'));
assert.ok(branch.includes('무음 영상'));
assert.ok(!ctx.sceneHTML('p2',1).includes('선택의 여파'));
const next=ctx.act(state,0,'선택');
assert.equal(next.day,2);
assert.equal(next.minute,960,'V5 scene clock uses curated schedule without changing survival deltas');
let last=-1;
for(const id of ids.filter(x=>!x.startsWith('e_'))){
 const [day,minute]=window.LAST_SIGNAL_STORY.timeline[id];
 assert.ok(day*1440+minute>last,'monotonic story clock at '+id);
 last=day*1440+minute;
}
assert.ok(Object.keys(window.LAST_SIGNAL_STORY.timeline).length===33);
console.log(JSON.stringify({status:'PASS',scenes:ids.length,branchBeat:true,clock:true,legacySaveKey:true,render:true}));
