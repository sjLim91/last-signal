#!/usr/bin/env node
/* LAST SIGNAL REBOOT: release gate for ORIGINAL independently produced cinema stills.
 * Default mode validates honesty of the current manifest and any already approved
 * media. --strict-prologue requires actual p0/p1/p2/p3 originals and fails if absent.
 * File hashing cannot prove visual originality or face consistency: manual QA is mandatory.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const sceneSource=fs.readFileSync(path.join(root,'reboot/story.js'),'utf8');
const manifestSource=fs.readFileSync(path.join(root,'reboot/media/manifest.js'),'utf8');
const context=vm.createContext({window:{}});
vm.runInContext(sceneSource,context,{filename:'reboot/story.js'});
vm.runInContext(manifestSource,context,{filename:'reboot/media/manifest.js'});
const story=context.window.LastSignalStory;
const catalog=context.window.LastSignalMediaManifest.catalog;
const ids=Object.keys(story.scenes);
assert.equal(ids.length,79);
assert.deepEqual(Object.keys(catalog).sort(),ids.slice().sort(),'Every scene has exactly one media entry');

const SHA=/^[a-f0-9]{64}$/;
const approved=[];
const missing=['p0','p1','p2','p3'];
const hashes=new Map();
const sceneFiles=new Set();
function read24(b,i){return b[i]|(b[i+1]<<8)|(b[i+2]<<16);}
function dimensions(b){
 assert.ok(b.length>32,'WebP contains enough bytes');
 assert.equal(b.toString('ascii',0,4),'RIFF','RIFF header');
 assert.equal(b.toString('ascii',8,12),'WEBP','WEBP format');
 assert.ok(b.readUInt32LE(4)<=b.length-8,'RIFF length not truncated');
 const fourcc=b.toString('ascii',12,16);
 const p=20;
 if(fourcc==='VP8X'){
  assert.ok(b.length>=30,'VP8X header');
  return [read24(b,p+4)+1,read24(b,p+7)+1];
 }
 if(fourcc==='VP8 '){
  assert.equal(b.toString('hex',p+3,p+6),'9d012a','VP8 keyframe dimension signature');
  return [b.readUInt16LE(p+6)&0x3fff,b.readUInt16LE(p+8)&0x3fff];
 }
 if(fourcc==='VP8L'){
  assert.equal(b[p],0x2f,'VP8L signature');
  const a=b[p+1],c=b[p+2],d=b[p+3],e=b[p+4];
  return [1+(a|((c&63)<<8)),1+((c>>6)|((d&63)<<2)|((e&15)<<10))];
 }
 throw Error('Unsupported WebP encoding chunk: '+fourcc);
}

for(const id of ids){
 const entry=catalog[id];
 assert.equal(entry.id,id,'correct scene ID');
 if(!entry.approved){
  assert.equal(entry.image,null,'Unapproved entry cannot publish a path: '+id);
  assert.equal(entry.sha256,null,'Unapproved entry cannot publish a checksum: '+id);
  assert.equal(entry.motion,null,'Unapproved entry cannot publish motion: '+id);
  continue;
 }
 assert.match(entry.sha256||'',SHA,'Exact SHA-256 required: '+id);
 const expected='./media/scenes/'+id+'.webp';
 assert.equal(entry.image,expected,'No reused, remote, misnamed, or aliased still: '+id);
 const target=path.join(root,'reboot/media/scenes',id+'.webp');
 assert.ok(fs.existsSync(target),'Approved original must really be committed: '+target);
 const bytes=fs.readFileSync(target);
 assert.ok(bytes.length>=15000,'Real media expected, reject tiny placeholder: '+id);
 const hash=crypto.createHash('sha256').update(bytes).digest('hex');
 assert.equal(hash,entry.sha256,'Commit bytes must equal approved hash: '+id);
 assert.ok(!hashes.has(hash),'Duplicate image content: '+hashes.get(hash)+' and '+id);
 hashes.set(hash,id);
 const [width,height]=dimensions(bytes);
 assert.ok(width>=1280&&height>=720,'Original should have >=1280x720 delivery resolution: '+id);
 assert.ok(Math.abs(width/height-16/9)<0.04,'Original must be approximately 16:9: '+id);
 sceneFiles.add(path.basename(target));
 approved.push({id,sha256:hash,width,height,bytes:bytes.length});
 const index=missing.indexOf(id);
 if(index>=0)missing.splice(index,1);
 if(entry.motion||entry.motionApproved){
  assert.equal(entry.motionApproved,true,'Explicit video approval required');
  assert.match(entry.motionSha256||'',SHA,'Verified video SHA required');
  assert.equal(entry.motion,'./media/motion/'+id+'.webm','Local one-shot WebM required');
  const vidPath=path.join(root,'reboot/media/motion',id+'.webm');
  assert.ok(fs.existsSync(vidPath),'Approved video binary must exist');
  const vidHash=crypto.createHash('sha256').update(fs.readFileSync(vidPath)).digest('hex');
  assert.equal(vidHash,entry.motionSha256,'Motion hash mismatch');
 }
}
const folder=path.join(root,'reboot/media/scenes');
if(fs.existsSync(folder)){
 const actual=fs.readdirSync(folder).filter(x=>x.toLowerCase().endsWith('.webp'));
 for(const name of actual)assert.ok(sceneFiles.has(name),'Unapproved/misnamed scene photo in package: '+name);
}
const strict=process.argv.includes('--strict-prologue');
const status= strict&&missing.length>0?'FAIL':'PASS';
console.log(JSON.stringify({
 status,mode:strict?'strict-prologue':'honest-inventory',scenes:ids.length,
 approvedStills:approved.length,approvedPrologue:4-missing.length,
 missingPrologue:missing,approved
},null,2));
if(strict&&missing.length)process.exitCode=1;
