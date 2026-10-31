#!/usr/bin/env node
// LAST SIGNAL G1: materialize approved WebP images without altering identities.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const file=path.join(root,'g1/source/approved-reference-webp.json');
const {project,phase,encoding,assets}=JSON.parse(fs.readFileSync(file,'utf8'));
const expected=new Map([['seoa-face',[768,1024]],['jiyu-face',[768,1024]],['jiyu-full',[1024,1536]],['soyeon-face',[768,1024]]]);
if(project!=='LAST SIGNAL'||phase!=='G1'||encoding!=='webp-base64'||!Array.isArray(assets)||assets.length!==4)throw Error('Invalid G1 archive');
const dryRun=process.argv.includes('--dry-run'),verify=process.argv.includes('--verify');
function webpSize(b){
 if(b.length<30||b.toString('ascii',0,4)!=='RIFF'||b.toString('ascii',8,12)!=='WEBP')return null;
 for(let o=12;o+8<=b.length;){
  const type=b.toString('ascii',o,o+4),n=b.readUInt32LE(o+4),p=o+8;
  if(p+n>b.length)return null;
  if(type==='VP8X'&&n>=10)return [1+b.readUIntLE(p+4,3),1+b.readUIntLE(p+7,3)];
  if(type==='VP8L'&&n>=5&&b[p]===0x2f){const v=b.readUInt32LE(p+1);return [1+(v&0x3fff),1+((v>>>14)&0x3fff)];}
  if(type==='VP8 '&&n>=10&&b[p+3]===0x9d&&b[p+4]===0x01&&b[p+5]===0x2a)return [b.readUInt16LE(p+6)&0x3fff,b.readUInt16LE(p+8)&0x3fff];
  o=p+n+(n&1);
 }return null;
}
const result=[],seen=new Set();
for(const a of assets){
 const dim=expected.get(a.id);
 if(!dim||seen.has(a.id)||!(/^[A-Za-z0-9+/]+={0,2}$/.test(a.base64)))throw Error('Invalid or duplicated reference '+a.id);
 seen.add(a.id);
 const b=Buffer.from(a.base64,'base64'),hash=crypto.createHash('sha256').update(b).digest('hex'),size=webpSize(b);
 if(hash!==a.sha256||b.length!==a.byteLength||!size||size[0]!==dim[0]||size[1]!==dim[1]||a.width!==dim[0]||a.height!==dim[1])throw Error('G1 integrity failure: '+a.id);
 // The legacy seoa-face is superseded. Keep it as history; NEVER install it at the active game-asset path.
 const dest=a.id==='seoa-face' ? path.join(root,'g1/history/seoa-face-20261031.webp') : path.join(root,'assets/characters',a.id+'.webp');
 if(fs.existsSync(dest)){
  const current=crypto.createHash('sha256').update(fs.readFileSync(dest)).digest('hex');
  if(current!==hash)throw Error('Refusing to overwrite changed file '+dest);
 }else if(verify)throw Error('Missing: '+dest);
 else if(!dryRun){fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,b,{flag:'wx'});}
 result.push({id:a.id,sha256:hash,bytes:b.length,width:size[0],height:size[1]});
}
if(seen.size!==expected.size)throw Error('Four reference identities required');
console.log(JSON.stringify({status:verify?'verified':dryRun?'dry-run':'materialized',approved:result.length,pendingUnapproved:['soyeon-full'],pendingArchive:['seoa-face','seoa-full','nagyeong-face','nagyeong-full'],legacySeoaFaceRestoredToHistoryOnly:true,assets:result},null,2));
