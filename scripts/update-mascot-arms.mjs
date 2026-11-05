import fs from 'node:fs';
const file='src/assets/mepamo_mascot_waving.svg';let svg=fs.readFileSync(file,'utf8');
const changes=[
['<path d="M176 206 Q155 216 139 230 L145 238 Q162 224 181 217 Z" fill="url(#mint)"/>','<path d="M178 211 Q157 222 135 237" fill="none" stroke="#683919" stroke-width="7"/>'],
['<path d="M224 205 Q252 210 282 191 L289 200 Q256 218 225 213 Z" fill="url(#mint)"/>','<path d="M225 209 Q258 216 295 197" fill="none" stroke="#683919" stroke-width="7"/>']
];
for(const [before,after] of changes){if(!svg.includes(before))throw Error('Expected arm path missing');svg=svg.replace(before,after)}fs.writeFileSync(file,svg);
const test='tests/artwork.spec.ts';fs.writeFileSync(test,fs.readFileSync(test,'utf8').replace('toEqual([7,8,9])','toEqual([3,4,7,8,9])'));
const docs='README.md';fs.writeFileSync(docs,fs.readFileSync(docs,'utf8').replace('all other paths, including the mouth, remain unchanged.','both arms were then changed to rounded brown strokes with mint hands. Other paths, including the mouth, remain unchanged.'));
