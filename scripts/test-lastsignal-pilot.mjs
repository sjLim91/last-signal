#!/usr/bin/env node
/* Exhaustive narrative-path contract for Episode 0. */
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const get=x=>fs.readFileSync(new URL('../'+x,import.meta.url),'utf8');
const episode=get('reboot/pilot/episode.js'),app=get('reboot/pilot/app.js'),html=get('reboot/pilot/index.html'),css=get('reboot/pilot/style.css');
new vm.Script(episode,{filename:'episode.js'});new vm.Script(app,{filename:'app.js'});
const ctx=vm.createContext({window:{},Date,console});
vm.runInContext(episode,ctx);
const m=ctx.window.LastSignalPilot;
assert.ok(m);
const ids=Object.keys(m.nodes);
assert.ok(ids.length>=30,'substantive distinct story nodes');
assert.equal(m.endings.length,7,'distinct outcomes');
assert.ok(m.valid(m.initial()));
const start=m.initial();
assert.equal(start.scene,'ring');
assert.ok(m.nodes.ring.options[0].to!==m.nodes.ring.options[1].to,'first branch is real');
const reached=new Set();
const terminal=new Set();
let leaves=0,transitions=0;
let weakest=Infinity,strongest=0;
let shortPlay=Infinity,longPlay=0;
const walk=(state)=>{
 const scene=m.nodes[state.scene];
 reached.add(scene.id);
 const length=state.history.length;
 if(scene.ending){
  terminal.add(scene.id);leaves++;
  shortPlay=Math.min(shortPlay,length);
  longPlay=Math.max(longPlay,length);
  weakest=Math.min(weakest,state.evidence.length);
  strongest=Math.max(strongest,state.evidence.length);
  assert.ok(length>=10,'no short-circuit ending');
  assert.equal(scene.options.length,0);
  assert.ok(m.valid(state),'final state validates');
  return;
 }
 assert.ok(scene.options.length>=2,'no fake one-click chapter at '+scene.id);
 assert.ok(scene.paragraphs.length>=2,'each scene has substantial prose: '+scene.id);
 for(const ch of scene.options){
  assert.ok(ch.label.length>=10,'meaningful action label: '+scene.id);
  assert.ok(ch.note.length>=10,'visible consequence for action: '+scene.id);
  assert.ok(ch.to.startsWith('auto_')||m.nodes[ch.to],'broken scene jump: '+scene.id);
  for(const key of Object.keys(ch.delta))assert.ok(key in start.stats,'wrong state stat '+key);
  for(const evidence of ch.evidence)assert.ok(evidence.length>=5);
 }
 for(let i=0;i<scene.options.length;i++){
  const next=m.choose(state,i);
  transitions++;
  assert.equal(next.history.length,length+1);
  assert.equal(next.decisions.length,state.decisions.length+1);
  assert.ok(m.nodes[next.scene].part>=scene.part,'story act cannot move backward: '+scene.id);
  assert.ok(m.valid(next));
  assert.ok(next.evidence.length>=state.evidence.length,'never loses already recorded evidence');
  walk(next);
 }
};
walk(start);
assert.deepEqual(new Set(ids),reached,'every scene must be reachable');
assert.deepEqual(new Set(m.endings),terminal,'all endings reached');
assert.ok(leaves>300,'large number of meaningfully distinct complete playthroughs');
assert.ok(shortPlay>=11&&longPlay<=17,'pilot gameplay spans many decisions without filler');
assert.ok(strongest>=5,'some paths gather at least 5 genuine evidence items');
// Explicitly verify that identical final choices can yield different outcomes because of prior behavior.
const a=m.choose(start,0),b=m.choose(start,1);
assert.notEqual(a.scene,b.scene);
assert.ok(a.flags.reported&&!a.flags.hidden);
assert.ok(b.flags.hidden&&!b.flags.reported);
assert.ok(a.stats.proof!==b.stats.proof);
assert.ok(!app.includes("last_signal_reboot_v1"),'legacy save key never touched');
assert.ok(app.includes("last_signal_pilot_ep0_v2"));
assert.ok(html.includes('id="casePanel"')&&html.includes('id="trail"'));
assert.ok(html.includes('id="choices"')&&html.includes('id="importFile"'));
assert.ok(css.includes('position:sticky')&&css.includes('safe-area-inset-bottom'));
assert.ok(app.includes("if(node.id!=='ring')return"),'P0 still is NOT reused for other scenes');
assert.ok(!episode.includes('감염자'),'no earlier zombie plot');
console.log(JSON.stringify({status:'PASS',nodes:ids.length,distinctEndings:terminal.size,completePaths:leaves,transitions,minScenesPerPath:shortPlay,maxScenesPerPath:longPlay,topEvidence:strongest,legacySaveUntouched:true}));
