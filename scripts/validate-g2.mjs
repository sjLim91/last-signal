#!/usr/bin/env node
// G2 quality gate: engine preserved, p0..p3 scene contract and distinct local stills.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawnSync} from 'node:child_process';
import crypto from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..');
const read = p => fs.readFileSync(path.join(root,p),'utf8');
const manifest=JSON.parse(read('docs/v4-scene-manifest.json'));
const html=read('index.html'),client=read('g2/prologue-client.js'),css=read('g2/prologue.css');
const ids=['p0','p1','p2','p3'];
const spec=manifest.scenes.filter(s=>ids.includes(s.id));
const failures=[];
function check(cond,message){if(!cond) failures.push(message);}
check(spec.length===4,'exactly four prologue scenes');
for(const id of ids){
 const found=spec.filter(s=>s.id===id);
 check(found.length===1,'unique manifest ID '+id);
 check(client.includes(id+": {title:") && client.includes("'"+id+"'"),'client uses '+id);
 check(found[0]?.still===('assets/scenes/'+id+'.webp'),'path '+id);
}
check(new Set(spec.map(x=>x.still)).size===4,'scene images have distinct paths');
check(spec.find(x=>x.id==='p0')?.cast.length===0,'p0 has no cast');
check(spec.find(x=>x.id==='p1')?.cast.length===0,'p1 has no cast');
check(spec.find(x=>x.id==='p2')?.cast.join(',')==='seoa','p2 cast is only Seoa');
check(spec.find(x=>x.id==='p3')?.cast.join(',')==='seoa','p3 cast is only Seoa');
check(html.includes('./g2/prologue-client.js')&&html.includes('./g2/prologue.css'),'G2 loader mounted');
check(html.includes('function followLatestScene('),'V3 scrolling retained');
check(html.includes('lastManualScroll()<=started'),'manual reading scroll preserved');
check(html.includes('const SCENES={'),'V3 scenes retained');
check(html.includes("const PERSONS="),'V3 character contract retained');
check(html.includes('render({follow:state.history.length>0});'),'initial render retained');
check(!client.includes('charportrait.innerHTML'),'G2 must not fabricate face images');
check(css.includes('.g2-shot.g2-ready'),'visual override requires successful image load');
// Verify embedded core script still parses, without executing browser code.
const start=html.lastIndexOf('<script>'),end=html.lastIndexOf('</script>');
check(start>=0&&end>start,'V3 embedded script found');
if(start>=0&&end>start){
 const tmp=path.join(os.tmpdir(),'last-signal-g2-inline-'+process.pid+'.js');
 try{fs.writeFileSync(tmp,html.slice(start+8,end));
 const result=spawnSync(process.execPath,['--check',tmp],{encoding:'utf8'});
 check(result.status===0,'V3 inline JS syntax: '+(result.stderr||'').trim());
 } finally {fs.rmSync(tmp,{force:true});}
}
function webpSize(b) {
 if(b.toString('ascii',0,4)!=='RIFF'||b.toString('ascii',8,12)!=='WEBP')return null;
 let at=12;
 while(at+8<=b.length){
  const tag=b.toString('ascii',at,at+4),n=b.readUInt32LE(at+4),p=at+8;
  if(p+n>b.length)return null;
  if(tag==='VP8X')return [1+b.readUIntLE(p+4,3),1+b.readUIntLE(p+7,3)];
  if(tag==='VP8L'){const v=b.readUInt32LE(p+1);return [1+(v&0x3fff),1+((v>>>14)&0x3fff)];}
  if(tag==='VP8 '&&b[p+3]===0x9d&&b[p+4]===1&&b[p+5]===0x2a)return [b.readUInt16LE(p+6)&0x3fff,b.readUInt16LE(p+8)&0x3fff];
  at=p+n+(n&1);
 }
 return null;
}
const assets=[],hashes=new Set();
for(const s of spec){
 const p=path.join(root,s.still);
 if(!fs.existsSync(p)){assets.push({id:s.id,status:'missing'});continue;}
 const b=fs.readFileSync(p),dim=webpSize(b),hash=crypto.createHash('sha256').update(b).digest('hex');
 if(!dim||Math.abs(dim[0]/dim[1]-16/9)>0.06)failures.push('invalid 16:9 WebP: '+s.id);
 if(b.length<20_000)failures.push('undersized/placeholder: '+s.id);
 if(hashes.has(hash))failures.push('duplicate photo: '+s.id);hashes.add(hash);
 assets.push({id:s.id,status:'present',size:b.length,dimensions:dim,sha256:hash});
}
if(process.argv.includes('--strict') && assets.some(x=>x.status==='missing'))
 failures.push('G2 strict gate requires FOUR independent photo assets');
const result={phase:'G2',engineContract:failures.length?'FAIL':'PASS',complete:failures.length===0&&assets.every(x=>x.status==='present'),assets,failures};
console.log(JSON.stringify(result,null,2));
if(failures.length)process.exitCode=1;
