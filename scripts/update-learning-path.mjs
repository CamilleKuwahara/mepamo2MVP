import fs from 'node:fs';
import path from 'node:path';
const read=f=>fs.readFileSync(f,'utf8').replaceAll('\r\n','\n');
let s=read('src/main.ts');
const replace=(a,b)=>{if(!s.includes(a))throw Error('Missing replacement: '+a);s=s.replaceAll(a,b)};
replace("import {refreshHearts,spendHearts,heartCountdown} from './hearts';","import './path-interactions.css';");
replace('refreshHearts(state);\n','');
replace('state=parsed;',`state=parsed;
 // Older saves may contain the retired balance; retain all learning progress.
 if('hearts' in state){delete (state as State & {hearts?:unknown}).hearts;try{localStorage.setItem(key,JSON.stringify(state))}catch{warning='Progress may not save in this browser. You can keep learning in this session.'}}
`);
replace('if((!old||old.done||!old.submitted)&&!requireHeart())return;','');
replace('if(!requireHeart())return;','');
replace(' if(refreshHearts(state))save();\n','');
const begin=s.indexOf('function heartStatus()');const end=s.indexOf('function home(){',begin);if(begin<0||end<0)throw Error('Heart helper range missing');s=s.slice(0,begin)+s.slice(end);
replace('${heartStatus()}','');
replace(' const completed=chosen<5&&state.completed.includes(chosen),resume=chosen<5&&!!state.attempts?.[chosen]&&!state.attempts[chosen].done;\n','');
const previewStart=s.indexOf('<section class="lesson-preview">');const previewEnd=s.indexOf('</section>',previewStart)+10;if(previewStart<0)throw Error('Preview missing');s=s.slice(0,previewStart)+s.slice(previewEnd);
replace('aria-pressed="${chosen===i}" aria-label=', 'aria-haspopup="dialog" aria-expanded="false" aria-label=');
replace('<p>Complete 1 lesson</p>','<p>Complete 1 lesson or final check</p>');
replace('<span>Small discoveries. A different perspective.</span>','<span>One lesson meets your goal. Keep exploring as much as you like.</span>');
replace(' const blocked=state.hearts!.count===0;\n','');
replace('!blocked&&c.finalCheck.questions.every','c.finalCheck.questions.every');
replace('!submitted&&(blocked||!completeDraft(q,a))','!submitted&&!completeDraft(q,a)');
replace('foot+(!submitted&&blocked?`<p class="heart-wait">Your next heart arrives in <span data-heart-timer>${heartCountdown(state)}</span></p>`:\'\')','foot');
s=s.split('\n').filter(line=>!line.includes("if(action==='hearts')")&&!line.includes("if(action==='heart-close')")&&!line.includes("if(action==='heart-home')")&&!line.includes("&&state.hearts!.count===0)showHeartDialog()")).join('\n');
replace("if(action==='node'){chosen=i;render(false);return}","if(action==='node'){showLessonDialog(i);return}\n if(action==='lesson-close'){document.querySelector<HTMLDialogElement>('#lesson-dialog')?.close();return}\n if(action==='start-check'){startFinal();return}");
replace('Each mistake costs one heart. One heart returns every hour, up to five. At zero, wait for the next heart to continue answering. Final-check mistakes are counted only after the full submission.','Learn as much as you like. Completing one lesson or a final check meets your daily goal. A missed day resets your streak, while your lesson progress stays saved.');
replace('if(!correct(question(),a))spendHearts(state);','');
replace('spendHearts(state,c.finalCheck.questions.filter(q=>a.drafts[q.id]!==q.correctOptionId).length);','');
replace("window.addEventListener('focus',()=>{updateHearts();if(screen==='home')render(false)});\ndocument.addEventListener('visibilitychange',()=>{if(!document.hidden)updateHearts()});\nsetInterval(updateHearts,1000);", "window.addEventListener('focus',refreshHome);\ndocument.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshHome()});");
replace("if(localDate()!==lastDay){lastDay=localDate();if(screen==='home')render(false)}", "if(localDate()!==lastDay){lastDay=localDate();refreshHome()}");
const dialog=`function refreshHome(){if(screen==='home'&&!document.querySelector('#lesson-dialog[open]'))render(false)}
function showLessonDialog(i:number){
 if(!Number.isInteger(i)||i<0||i>5||i>state.completed.length)return;
 chosen=i;
 document.querySelector<HTMLDialogElement>('#lesson-dialog')?.close();
 const trigger=app.querySelector<HTMLButtonElement>(\`[data-action="node"][data-index="\${i}"]\`);
 trigger?.setAttribute('aria-expanded','true');
 const isFinal=i===5,completed=isFinal?state.results.length>0:state.completed.includes(i);
 const prior=isFinal?state.final:(state.attempt?.lesson===i?state.attempt:state.attempts?.[i]);
 const resume=!!prior&&!prior.done;
 const title=isFinal?c.finalCheck.title:c.lessons[i].shortTitle;
 const label=isFinal?(completed?'View results':resume?'Resume check':'Start check'):(resume?(completed?'Resume review':'Resume lesson'):completed?'Review lesson':'Start lesson');
 const description=isFinal?'Bring your discoveries together in ten questions.':resume?'Pick up right where you left off.':completed?'Revisit the ideas and try the activities again.':'Two short reads. Five ways to explore.';
 const dialog=document.createElement('dialog');dialog.id='lesson-dialog';dialog.className='lesson-dialog';dialog.setAttribute('aria-labelledby','lesson-dialog-title');dialog.setAttribute('aria-describedby','lesson-dialog-description');
 dialog.innerHTML=\`\${btn(icon('close'),'lesson-close','aria-label="Close lesson details"','dialog-close')}<div class="dialog-node-art">\${nodeArt(isFinal?(completed?'final-complete':'final-available'):completed?'complete':'available')}</div><span class="eyebrow">\${isFinal?'FINAL CHECK':\`LESSON \${i+1} OF 5\`}\${completed?' · COMPLETED':''}</span><h2 id="lesson-dialog-title">\${esc(title)}</h2><p id="lesson-dialog-description">\${description}</p>\${resume?\`<p class="resume-detail">\${prior!.card<2?'Introduction in progress':isFinal?\`\${Object.keys(prior!.drafts).length} of 10 questions answered\`:\`\${prior!.question} of 5 activities completed\`}</p>\`:''}<div class="lesson-dialog-actions">\${btn(label+' '+icon('arrow'),'start')}\${isFinal&&completed?btn(resume?'Resume practice':'Practice check','start-check','','secondary'):''}</div>\`;
 app.append(dialog);dialog.showModal();
 dialog.querySelector<HTMLButtonElement>('[data-action="start"]')?.focus();
 dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()});
 dialog.addEventListener('close',()=>{dialog.remove();if(screen==='home'){render(false);app.querySelector<HTMLButtonElement>(\`[data-action="node"][data-index="\${i}"]\`)?.focus({preventScroll:true})}},{once:true});
}
`;
s=s.replace('function home(){',dialog+'\nfunction home(){');
fs.writeFileSync('src/main.ts',s);
let m=read('src/model.ts').replace("import type {Hearts} from './hearts';\n",'').replaceAll('\uFEFF','').replace('hearts?:Hearts; ','').replace('hearts:{count:5,nextAt:null},','');
const guardStart=m.indexOf('return (x.hearts===');const guardEnd=m.indexOf('x.version===1&&',guardStart);if(guardStart<0||guardEnd<0)throw Error('Missing old heart validation');m=m.slice(0,guardStart)+'return '+m.slice(guardEnd);fs.writeFileSync('src/model.ts',m);
let css=read('src/lesson-layout.css');const cssStart=css.indexOf('.heart-control{');const cssEnd=css.indexOf('@media(max-height',cssStart);css=css.slice(0,cssStart)+css.slice(cssEnd);css=css.replace('.question-screen .heart-control{margin:0}.heart-dialog-actions{flex-wrap:wrap}','');fs.writeFileSync('src/lesson-layout.css',css);
let art=read('src/art.ts');art=art.replace('return `<img class="node-default"','return `${state===\'current\'||state===\'final-available\'?\'<span class="node-highlight" aria-hidden="true"></span>\':\'\'}<img class="node-default"');fs.writeFileSync('src/art.ts',art);
// Adapt the existing flow tests to open a node before starting.
const helper=`\nasync function startFromPopup(page:import('@playwright/test').Page){if(!await page.locator('#lesson-dialog').isVisible())await page.locator('.node.available').first().click();await page.locator('[data-action="start"]').click();}\n`;
let tests=read('tests/app.spec.ts');tests=tests.replaceAll("await page.locator('[data-action=\"start\"]').click()",'await startFromPopup(page)')+helper;fs.writeFileSync('tests/app.spec.ts',tests);
const oldTests=read('tests/hearts-layout.spec.ts');const layout=oldTests.slice(oldTests.indexOf("test('all single-choice"));fs.writeFileSync('tests/layout.spec.ts',"import {test,expect} from '@playwright/test';\nimport {emptyState,key,content} from '../src/model';\n"+layout.replaceAll("await page.locator('[data-action=\"start\"]').click()",'await startFromPopup(page)')+helper);
let docs=read('README.md');docs=docs.split('\n').filter(line=>!line.startsWith('- Five hearts:')).join('\n');docs=docs.replace('- Same-browser progress,','- Unlimited lessons and practice. One completed lesson or final check meets the daily goal; a missed calendar day breaks the streak without changing saved learning progress.\n- Clicking current or completed path nodes opens an accessible Start, Resume, or Review dialog. The current node has a rotating highlight that respects reduced-motion preferences.\n- Same-browser progress,');docs=docs.replace('corrupt data preservation, heart depletion, countdown resumption, and hourly regeneration.','corrupt data preservation, unlimited learning, and path popups.');docs=docs.replace('streak dates and heart recovery.','streak dates.');fs.writeFileSync('README.md',docs);
// Retire only the named heart implementation and its obsolete setup/tests.
const cwd=path.resolve('.');for(const file of ['src/hearts.ts','tests/hearts-layout.spec.ts','scripts/add-hearts.mjs','scripts/fix-heart-ui.mjs','scripts/document-hearts.mjs']){const target=path.resolve(file);if(!target.startsWith(cwd+path.sep))throw Error('Outside project');fs.unlinkSync(target);}
