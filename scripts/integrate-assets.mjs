import fs from 'node:fs';
const file='src/main.ts';let s=fs.readFileSync(file,'utf8');
function replace(a,b){if(!s.includes(a))throw new Error('Missing replacement: '+a);s=s.replaceAll(a,b)}
replace("import './style.css';","import './style.css';\nimport './asset-components.css';");
replace("import {icon,fuji,mascot} from './art';","import {icon,fuji,mascot,nodeArt} from './art';");
replace("${icon(done?'check':i===5?'cup':locked?'lock':'star')}","${nodeArt(i===5?(done?'final-complete':locked?'final-locked':'final-available'):done?'complete':locked?(i===3?'locked-book':'locked'):'current')}");
replace("(state.attempt?.lesson===i&&!state.attempt.done?'RESUME':'START')", "((i===5?state.final&&!state.final.done:state.attempts?.[i]&&!state.attempts[i].done)?'RESUME':'START')");
replace('<div class="intro-art">${fuji}</div>','');
replace('${submitted&&o.id===q.correctOptionId?\'correct\':\'\'}', '${submitted&&o.id===q.correctOptionId?\'correct\':submitted&&a.drafts[q.id]===o.id?\'incorrect\':\'\'}');
replace('<span class="option-letter">${String.fromCharCode(65+i)}</span>', '<span class="option-radio">${icon(a.drafts[q.id]===o.id?\'radio-selected\':\'radio-empty\')}</span>');
replace("${icon('check')}Correct</span>`:''}","${icon('check-circle')}Correct</span>`:submitted&&a.drafts[q.id]===o.id?`<span class=\"incorrect-label\">${icon('error-circle')}Incorrect</span>`:''}");
replace("<h2>${correct(q,a)?'That’s right.':'A useful discovery.'}</h2>","<h2>${icon(correct(q,a)?'check-circle':'info')}${correct(q,a)?'That’s right.':'A useful discovery.'}</h2>");
replace("<span>${state.dates.includes(localDate())?1:0} / 1</span></div></section>","<span>${state.dates.includes(localDate())?1:0} / 1</span></div>${state.dates.includes(localDate())?'<p class=\"goal-complete\">Daily goal complete</p>':''}</section>");
fs.writeFileSync(file,s);
fs.copyFileSync('public/assets/mepamo/code/mepamo-components.css','src/asset-components.css');
let gen=fs.readFileSync('scripts/create-assets.mjs','utf8');gen=gen.replace("fs.writeFileSync(path.join(root,'code/mepamo-components.css'),css);","fs.writeFileSync(path.join(root,'code/mepamo-components.css'),css);\nfs.writeFileSync('src/asset-components.css',css);");fs.writeFileSync('scripts/create-assets.mjs',gen);
let readme=fs.readFileSync('README.md','utf8');readme=readme.replace('The mascot and Fuji in src/art.ts are hand-coded SVG recreations, not the original PNG assets. PDF reference renders are in references/.','The new asset kit in public/assets/mepamo/ contains 49 SVG reconstructions, transparent 2x PNG exports, a preview board, an asset index, geometry data, and component CSS. It was authored from the later supplied asset board and instructions at the user’s request. These are new reconstructions, not the missing original files. The app uses these SVG nodes and icons, real CSS controls, and transparent artwork PNGs. Regenerate with node scripts/create-assets.mjs. PDF reference renders are in references/.');fs.writeFileSync('README.md',readme);
