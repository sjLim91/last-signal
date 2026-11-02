#!/usr/bin/env node
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const story=fs.readFileSync(new URL('../reboot/story.js',import.meta.url),'utf8');
const engine=fs.readFileSync(new URL('../reboot/engine.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../reboot/index.html',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../reboot/style.css',import.meta.url),'utf8');
new vm.Script(story,{filename:'reboot/story.js'});
new vm.Script(engine,{filename:'reboot/engine.js'});
const ctx={window:{}};
vm.createContext(ctx);
vm.runInContext(story,ctx);
const book=ctx.window.LastSignalStory;
assert.ok(book,'book exported');
assert.equal(book.sceneCount,79,'4 intro + 14*5 chapter scenes + 5 endings');
assert.equal(book.chapters.length,14,'fourteen chapters');
assert.equal(book.acts.length,6,'six acts');
assert.equal(book.endings.length,5,'five real endings');
assert.equal(book.incident.passengers,book.incident.fatalitiesAndMissing+book.incident.rescued);
assert.equal(book.incident.blackoutSeconds,47);
const scenes=book.scenes;
const ids=Object.keys(scenes);
assert.equal(ids.length,new Set(ids).size,'unique IDs');
const queue=[book.start], visited=new Set();
let decisions=0, branches=0;
while(queue.length){
 const id=queue.shift();
 if(visited.has(id))continue;
 visited.add(id);
 const node=scenes[id];
 assert.ok(node,'reachable target '+id);
 assert.ok(typeof node.text==='string'&&node.text.length>=90,'scene prose is substantive: '+id);
 assert.ok(node.text.includes('\n\n')||node.chapter>=0,'paragraph pacing: '+id);
 assert.ok(node.location&&node.mood&&node.time&&node.title,'scene metadata: '+id);
 if(!node.ending){
  assert.ok(Array.isArray(node.choices)&&node.choices.length>=2,'no fake or dead choice: '+id);
  decisions++;
  const targets=new Set();
  node.choices.forEach(choice=>{
   assert.ok(choice.label&&choice.to&&scenes[choice.to],'choice reaches real scene: '+id);
   assert.ok(choice.note,'visible consequence note: '+id);
   for(const key of Object.keys(choice.effects||{}))assert.ok(key in book.stats,'unknown stat '+key);
   targets.add(choice.to);
   queue.push(choice.to);
  });
  if(targets.size>1)branches++;
 }else assert.equal(node.choices.length,0);
}
assert.equal(visited.size,ids.length,'all 79 scenes reachable');
assert.ok(decisions>=55,'at least 55 interactive decision scenes');
assert.ok(branches>=14,'fourteen genuine location forks');
assert.equal(ids.filter(id=>scenes[id].award).length,14,'14 verified evidence items');
assert.equal(ids.filter(id=>scenes[id].ending).length,5);
for(const ending of book.endings)assert.ok(visited.has(ending));
assert.ok(html.includes('id="decisionGraph"')&&html.includes('id="choices"'));
assert.ok(html.includes('id="dossier"')&&html.includes('id="importFile"'));
assert.ok(engine.includes('last_signal_reboot_v1')&&engine.includes('localStorage'));
assert.ok(engine.includes('state.route')&&engine.includes('state.evidence'));
assert.ok(css.includes('@media(max-width:600px)'));
assert.ok(!story.includes('감염자'),'no leftover outbreak plot');
console.log(JSON.stringify({status:'PASS',acts:book.acts.length,chapters:book.chapters.length,scenes:ids.length,decisionNodes:decisions,trueForks:branches,endings:book.endings.length,reachable:visited.size}));
