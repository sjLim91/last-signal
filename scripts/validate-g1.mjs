#!/usr/bin/env node
// LAST SIGNAL G1: isolated image-resource validation. No external packages needed.
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const spec = JSON.parse(fs.readFileSync(path.join(root, 'docs/g1-reference-jobs.json'), 'utf8'));
const strict = !process.argv.includes('--status');
const results = [];
const hashes = new Map();

function getWebpSize(b) {
  if (b.length < 30 || b.toString('ascii',0,4) !== 'RIFF' || b.toString('ascii',8,12) !== 'WEBP') return null;
  let offset = 12;
  while (offset + 8 <= b.length) {
    const type = b.toString('ascii',offset,offset+4);
    const len = b.readUInt32LE(offset+4);
    const p = offset+8;
    if (p+len > b.length) return null;
    if (type === 'VP8X' && len >= 10) {
      return [1+b.readUIntLE(p+4,3),1+b.readUIntLE(p+7,3)];
    }
    if (type === 'VP8L' && len >= 5 && b[p] === 0x2f) {
      const packed = b.readUInt32LE(p+1);
      return [1+(packed&0x3fff),1+((packed>>14)&0x3fff)];
    }
    if (type === 'VP8 ' && len >= 10 && b[p+3] === 0x9d && b[p+4] === 0x01 && b[p+5] === 0x2a) {
      return [b.readUInt16LE(p+6)&0x3fff,b.readUInt16LE(p+8)&0x3fff];
    }
    offset = p + len + (len%2);
  }
  return null;
}

for (const job of spec.jobs) {
  const file = path.join(root,job.path);
  const status = {id:job.id,path:job.path,ok:false,issues:[]};
  if (!fs.existsSync(file)) {
    status.issues.push('missing');
  } else {
    const data = fs.readFileSync(file);
    const dim = getWebpSize(data);
    status.bytes = data.length;
    if (!dim) status.issues.push('invalid-webp');
    else {
      const [w,h] = dim;
      status.width=w;status.height=h;
      const [aw,ah]=job.aspectRatio.split(':').map(Number);
      if (Math.abs(w/h-aw/ah)>0.045) status.issues.push('wrong-aspect-ratio');
      if (w < 640 || h < (job.type === 'face' ? 800 : 960)) status.issues.push('undersized');
    }
    if (data.length < 20000) status.issues.push('too-small');
    const sha=crypto.createHash('sha256').update(data).digest('hex');
    status.sha256=sha;
    if (hashes.has(sha)) status.issues.push('duplicate-of-'+hashes.get(sha));
    else hashes.set(sha,job.id);
  }
  status.ok=status.issues.length===0;
  results.push(status);
}
const summary={project:'LAST SIGNAL',phase:'G1',required:spec.jobs.length,passed:results.filter(x=>x.ok).length,missing:results.filter(x=>x.issues.includes('missing')).length,failed:results.filter(x=>x.issues.length && !x.issues.includes('missing')).length,results,manualVisualApprovalRequired:true};
console.log(JSON.stringify(summary,null,2));
if(strict && summary.passed!==summary.required) process.exitCode=1;
