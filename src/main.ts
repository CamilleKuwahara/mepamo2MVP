import {assignMatch} from './components/MatchingQuestion';
import './components/matching.css';
import {discoveryNarration} from './discovery/narration';
import {isDiscovery,discoveryIds,discoveryVersion,migrateDiscoverySave,checkId,selectCheck} from './discovery/content';
import {discoveryModule,discoveryQuestion} from './discovery/view';
import {tokyoId,tokyoVersion,migrateTokyoSave} from './tokyo/lesson';
import {storyView,storyControls,tokyoQuestion} from './tokyo/view';
import {mountNarration,stopNarration} from './tokyo/audio';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/800.css';
import './style.css';
import './asset-components.css';
import './lesson-layout.css';
import './path-interactions.css';
import './feedback-assets.css';
import './feedback.css';
import './lesson-controls.css';
import './essential/essential.css';
import './tokyo/tokyo.css';
import './discovery/discovery.css';
import {essential,essentialLessons,resolveEssentialLesson,emptyEssential,newDraft,ready,grade,placeTile,moveItem,matchPair,type EssentialQuestion,type EssentialAttempt} from './essential/model';
import {renderQuestion,instruction,explanation,paragraphs,emphasis,asset,sources} from './essential/questions';
import {mountLessonControls} from './components/LessonControls';
import {lessonPopover} from './components/LessonPopover';
import {statusIcon,soundButton,toggleSound,playFeedback,cancelFeedback} from './components/AnswerFeedback';
let closePopover:()=>void=()=>{};
import {content as c,adaptations,key,emptyState,validState,localDate,streak,score,type State,type Attempt,type Question,type Result} from './model';
import {icon,fuji,mascot,nodeArt} from './art';
import {mountArtwork} from './components/mountArtwork';
let unmountArtwork: () => void = () => {};
const app=document.querySelector<HTMLDivElement>('#app')!;
const unmountLessonControls=mountLessonControls(app);
let state:State=emptyState(),warning='',corrupt=false,screen='home',chosen=0,selected=-1,resultIndex=0;
try {const raw=localStorage.getItem(key);if(raw){const parsed:unknown=JSON.parse(raw);migrateTokyoSave(parsed);migrateDiscoverySave(parsed);if(!validState(parsed))throw new Error('invalid');state=parsed;
 // Older saves may contain the retired balance; retain all learning progress.
 if('hearts' in state){delete (state as State & {hearts?:unknown}).hearts;try{localStorage.setItem(key,JSON.stringify(state))}catch{warning='Progress may not save in this browser. You can keep learning in this session.'}}
}}catch{warning='Saved progress could not be read. Your previous data is preserved. You can continue in memory or reset this app’s progress.';corrupt=true;}
let course=new URLSearchParams(location.search).get('course')==='essential'?'essential':'heritage';
chosen=Math.min(state.completed.length,5);
const esc=(s:unknown)=>String(s).replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]!));
const btn=(text:string,action:string,extra='',cls='primary')=>`<button class="${cls}" data-action="${action}" ${extra}>${text}</button>`;
function save(){if(state.attempt){state.attempts??={};state.attempts[state.attempt.lesson]=state.attempt;}if(corrupt)return;try{localStorage.setItem(key,JSON.stringify(state));}catch{warning='Progress may not save in this browser. You can keep learning in this session.';}}
function event(type:string,a:{id:string},item=''){const id=`${a.id}:${type}:${item}`;if(!state.events.some(e=>e.id===id))state.events.push({id,type,attempt:a.id,item,at:new Date().toISOString(),date:localDate()});save();}
function qualify(){const day=localDate();if(!state.dates.includes(day))state.dates.push(day);}
function attempt(lesson:number):Attempt{return {id:crypto.randomUUID(),lesson,card:0,question:0,drafts:{},submitted:false,done:false}}
function active(){return screen==='final'?state.final!:state.attempt!}
function question(){const a=active();return screen==='final'?c.finalCheck.questions[a.question]:c.lessons[a.lesson].questions[a.question]}
function completeDraft(q:Question,a:Attempt){const v=a.drafts[q.id],ad=adaptations[q.id];return ad?Array.isArray(v)&&v.length===ad.items.length&&v.every(n=>n>=0):typeof v==='string'}
function correct(q:Question,a:Attempt){const ad=adaptations[q.id],v=a.drafts[q.id];return ad?Array.isArray(v)&&ad.answers.every((n,i)=>n===v[i]):v===q.correctOptionId}
function sourceLinks(ids:string[]){return `<details class="sources"><summary>Sources & further reading</summary>${ids.map(id=>{const s=c.sources.find(s=>s.id===id);return s?`<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.publisher)} · ${esc(s.title)} ↗</a>`:''}).join('')}</details>`}
function startLesson(i:number){if(i>state.completed.length||i<0||i>4)return;save();const old=state.attempts?.[i];if(!old||old.done)state.attempt=attempt(i);else {state.attempt=old;event('resume',old);}screen='lesson';selected=-1;event('lesson_start',state.attempt!);event('teaching_card_view',state.attempt!,c.lessons[i].cards[state.attempt!.card]?.id||'');render();}
function startFinal(){if(state.completed.length<5)return;if(!state.final||state.final.done){state.final=attempt(0);event('final_start',state.final);}else event('resume',state.final);screen='final';render();}
function render(focus=true){
 const previousQuestion=app.querySelector<HTMLElement>('[data-question-id]')?.dataset.questionId;
 const explanationOpen=app.querySelector('[data-action="why"]')?.getAttribute('aria-expanded')==='true';
 const sourcesOpen=!!app.querySelector('#answer-explanation .sources[open]');
 closePopover();cancelFeedback();unmountArtwork();stopNarration();
 const top=warning?`<div class="warning" role="status">${esc(warning)} ${btn('Reset saved progress','reset','','text-button')}</div>`:'';
 app.innerHTML=top+(screen==='home'?home():screen==='results'?results():screen==='essential'?essentialLesson():lesson());
 if(previousQuestion&&app.querySelector<HTMLElement>('[data-question-id]')?.dataset.questionId===previousQuestion&&explanationOpen){const panel=app.querySelector<HTMLElement>('#answer-explanation');if(panel){panel.hidden=false;app.querySelector('[data-action="why"]')?.setAttribute('aria-expanded','true');if(sourcesOpen)panel.querySelector('details')?.setAttribute('open','')}}
 unmountArtwork=mountArtwork(app);
 mountLessonNarration();
 if(focus){const h=app.querySelector<HTMLElement>('h1');if(h){h.tabIndex=-1;h.focus({preventScroll:true});}window.scrollTo(0,0)}
}

function refreshHome(){if(screen==='home'&&!document.querySelector('#lesson-dialog'))render(false)}
function showLessonDialog(i:number){
 if(!Number.isInteger(i)||i<0||i>5||i>state.completed.length)return;
 const trigger=app.querySelector<HTMLButtonElement>('[data-action="node"][data-index="'+i+'"]')!;
 const toggle=trigger.getAttribute('aria-expanded')==='true';closePopover();if(toggle)return;chosen=i;
 const isFinal=i===5,completed=isFinal?state.results.length>0:state.completed.includes(i);
 const prior=isFinal?state.final:(state.attempt?.lesson===i?state.attempt:state.attempts?.[i]);const resume=!!prior&&!prior.done;
 const label=isFinal?(completed?'View results':resume?'Resume check':'Start check'):(resume?(completed?'Resume review':'Resume lesson'):completed?'Review lesson':'Start lesson');
 const count=prior?(prior.done?(isFinal?10:5):isFinal?Object.keys(prior.drafts).length:prior.question+(prior.submitted?1:0)):completed?5:0;
 closePopover=lessonPopover(trigger,'<h3 id="lesson-dialog-title">'+esc(isFinal?c.finalCheck.title:c.lessons[i].shortTitle)+'</h3><p>'+(isFinal?'Final check':'Lesson '+(i+1)+' of 5')+'</p><p>'+count+' of '+(isFinal?10:5)+' activities completed</p>'+btn(label+' &#8250;','start')+(isFinal&&completed?btn(resume?'Resume practice':'Practice check','start-check'):''),action=>{if(action==='start-check')startFinal();else if(isFinal){if(completed){screen='results';resultIndex=0;render()}else startFinal()}else startLesson(i)});
}

function home(){
 if(course==='essential')return essentialHome();
 const next=state.completed.length; if(chosen>next)chosen=next;
 return `<div class="home-shell"><aside class="rail"><a class="wordmark" href="#" data-action="home">mepamo</a></aside><main class="path-main"><header class="home-header"><div class="topline"><span class="eyebrow">YOUR LEARNING PATH</span><div class="stats"><span class="streak" title="Consecutive learning days">${icon('flame')}${streak(state.dates)}</span></div></div><h1>Japanese World Heritage</h1><p>Discover the places. Understand their stories.</p>${coursePicker()}</header><section class="unit-banner"><div><span class="eyebrow">UNIT 1</span><h2>See places differently</h2></div>${icon('book')}</section><div class="path" aria-label="Five lessons and a final check">${[0,1,2,3,4,5].map((i)=>{const done=i<5?state.completed.includes(i):state.results.length>0;const locked=i>next;return `<div class="node-wrap node-${i}">${i===next&&next<6&&!done?'<span class="start-tag">'+((i===5?state.final&&!state.final.done:state.attempts?.[i]&&!state.attempts[i].done)?'RESUME':'START')+'</span>':''}<button class="node ${done?'complete':locked?'locked':'available'} ${chosen===i?'current':''}" data-action="node" data-index="${i}" ${locked?'disabled':''} aria-haspopup="dialog" aria-expanded="false" aria-label="${i===5?'Final check':`Lesson ${i+1}: ${esc(c.lessons[i].shortTitle)}`} · ${done?'completed':locked?'locked':'available'}">${nodeArt(i===5?(done?'final-complete':locked?'final-locked':'final-available'):done?'complete':locked?(i===3?'locked-book':'locked'):'current')}</button></div>`}).join('')}<div class="fuji-sticker">${fuji}</div></div>${state.results.length?`<div class="unit-complete"><strong>Unit complete. Keep your curiosity.</strong><p>You’ve reached the end of this unit. Revisit any lesson whenever you like.</p></div>`:''}<footer class="home-footer"><span>One lesson meets your goal. Keep exploring as much as you like.</span>${btn('About & progress','about','','text-button')}</footer></main><aside class="right-rail"><section class="daily"><h2>Your daily goal</h2><p>Complete 1 lesson or final check</p><div class="goal-row"><div class="meter"><span style="width:${state.dates.includes(localDate())?100:0}%"></span></div><span>${state.dates.includes(localDate())?1:0} / 1</span></div>${state.dates.includes(localDate())?'<p class="goal-complete">Daily goal complete</p>':''}</section><div class="mascot">${mascot}</div><p class="companion-copy">A little curiosity<br>goes a long way.</p></aside></div>`;
}
function shell(body:string,footer:string,progress:number){return `<div class="lesson-shell ${screen==='essential'&&el().id===tokyoId?'tokyo-lesson':screen==='essential'&&isDiscovery(el().id)?'tokyo-lesson discovery-lesson':''} ${(screen==='essential'?essentialStep()?.kind==='question':['lesson','final'].includes(screen)&&active().card>=2&&!active().done)?'question-screen':''}"><header class="lesson-header"><a class="wordmark" href="#" data-action="home">mepamo</a>${btn(icon('close'),'home','aria-label="Save and leave"','exit')}${soundButton()}<div class="meter" role="progressbar" aria-label="Activities acknowledged" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}"><span style="width:${progress}%"></span></div></header><main class="lesson-body ${screen==='essential'&&essentialStep()?.kind==='question'?'essential-activity':''}" ${screen==='essential'&&essentialStep()?.kind==='question'?'data-question-id="'+eq().id+'" data-format="'+eq().type+'"':''}>${body}</main><footer class="lesson-footer">${footer}</footer></div>`}
function lesson(){const a=active(),isFinal=screen==='final',l=c.lessons[a.lesson];
 if(a.done&&!isFinal)return shell(`<div class="completion"><span class="eyebrow">LESSON ${a.lesson+1} COMPLETE</span><h1>A new way to see the world</h1><div class="mascot small">${mascot}</div><p>${esc(l.takeaway)}</p><div class="completion-facts"><span>${icon('check')}5 activities explored</span><span>${icon('check')}Daily goal complete · 1 / 1</span></div></div>`,`<span class="muted">${a.lesson<4?`Next: ${esc(c.lessons[a.lesson+1].shortTitle)}`:'Next: Connect the clues'}</span>${btn('Back to path '+icon('arrow'),'home')}`,100);
 if(a.card<2){const card=l.cards[a.card];return shell(isFinal?`<div class="intro"><span class="eyebrow">${state.results.length?'PRACTICE ATTEMPT':'FINAL CHECK'}</span><h1>${esc(c.finalCheck.title)}</h1><p>${esc(c.finalCheck.learnerInstructions)}</p><p class="muted">Your answers save as you go. You can change them before submitting.</p></div>`:`<div class="intro"><span class="eyebrow">LESSON ${a.lesson+1} · ${a.card===0?'INTRODUCTION':'A CLOSER LOOK'} · ${a.card+1} / 2</span><h1>${esc(card.title)}</h1>${a.card===0?`<p class="hook">${esc(l.hook)}</p>`:''}<p class="teaching-copy">${esc(card.body)}</p>${sourceLinks(card.sourceIds)}</div>`,`<span class="muted">${isFinal?'10 questions · Take your time':a.card===0?'Start with a little discovery.':'Look for why a place matters.'}</span>${btn(isFinal?'Begin check '+icon('arrow'):'Continue '+icon('arrow'),'read')}`,0)}
 const q=question(),ad=isFinal?undefined:adaptations[q.id],submitted=!isFinal&&a.submitted;
 let body=`<span class="eyebrow">${isFinal?`${state.results.length?'PRACTICE ATTEMPT':'FINAL CHECK'} · QUESTION ${a.question+1} OF 10`:`LESSON ${a.lesson+1} · QUESTION ${a.question+1} OF 5`}</span><h1>${esc(ad?ad.title:q.prompt)}</h1><p class="question-help">${ad?`Select a ${ad.kind==='sorting'?'clue, then choose a category':'feature, then its matching purpose'}. Select an assigned item to change it.`:'Choose the best description.'}</p>`;
 if(ad){const values=Array.isArray(a.drafts[q.id])?a.drafts[q.id] as number[]:ad.items.map(()=>-1);const item=(s:string,i:number)=>btn(`${ad.kind==='matching'?`<span class="pair-number">${i+1}</span>`:''}${esc(s)}`,'item',`data-index="${i}" ${submitted?'disabled':''} aria-pressed="${selected===i}"`,'tile '+(selected===i?'selected':'') );body+=ad.kind==='sorting'?`<div class="clue-bank">${ad.items.map((s,i)=>values[i]===-1?item(s,i):'').join('')||'<span class="muted">All clues placed. You can still change them.</span>'}</div><div class="buckets">${ad.destinations.map((s,n)=>`<section class="bucket">${btn(esc(s),'destination',`data-index="${n}" ${submitted||selected<0?'disabled':''}`,'bucket-title')}${ad.items.map((s,i)=>values[i]===n?item(s,i):'').join('')}${btn('Place selected clue here','destination',`data-index="${n}" ${submitted||selected<0?'disabled':''}`,'drop-zone')}</section>`).join('')}</div>`:`<div class="matching"><div><p class="muted">Feature</p>${ad.items.map(item).join('')}</div><div><p class="muted">Purpose</p>${ad.destinations.map((s,n)=>btn(`${values.includes(n)?`<span class="pair-number">${values.indexOf(n)+1}</span>`:''}${esc(s)}`,'destination',`data-index="${n}" ${submitted||selected<0?'disabled':''}`,'tile '+(values.includes(n)?'paired':''))).join('')}</div></div>`;body+=`<p class="assignment-count">${values.filter(v=>v>=0).length} of ${values.length} ${ad.kind==='sorting'?'clues placed':'pairs connected'}</p>`;
 }else body+=`<div class="options" role="group" aria-label="Answer choices">${q.options.map(o=>{const picked=a.drafts[q.id]===o.id;const result=submitted?(o.id===q.correctOptionId?'correct':picked?'incorrect':''):'';return `<button data-action="answer" data-value="${o.id}" data-result="${result}" class="option mepamo-answer ${picked?'selected':''} ${result}" aria-pressed="${picked}" ${submitted?'disabled':''}><span class="option-radio">${result?statusIcon(result==='correct'):icon(picked?'radio-selected':'radio-empty')}</span><span>${esc(o.text)}</span>${submitted&&!correct(q,a)&&result?`<span class="answer-label">${result==='correct'?'Correct answer':'Your answer'}</span>`:''}</button>`}).join('')}</div>`;
 if(!isFinal){body+=`<div class="feedback-area"><div class="mepamo-feedback-slot" aria-hidden="true"></div><div class="result-announcement sr-only" data-result-announcement role="status" aria-live="polite"></div>`;
 if(submitted){if(ad)body+=`<div class="multipart-result mepamo-answer">${statusIcon(correct(q,a))}${correct(q,a)?'Correct answer':'Review your matches in Why?'}</div>`;
 const explanation=ad?`<ul>${ad.items.map((s,i)=>`<li><strong>${esc(s)} &rarr; ${esc(ad.destinations[ad.answers[i]])}</strong><br>${esc(ad.explanations[i])}</li>`).join('')}</ul>`:esc(q.feedback.explanation);
 if(explanation)body+=`<button class="mepamo-why" data-action="why" aria-expanded="false" aria-controls="answer-explanation">Why?</button><section id="answer-explanation" class="feedback-explanation" hidden>${explanation}${sourceLinks(q.sourceIds)}</section>`;
 }body+='</div>'}

 if(isFinal)body+=`<nav class="question-nav" aria-label="Jump to question">${c.finalCheck.questions.map((item,i)=>btn(String(i+1),'jump',`data-index="${i}" aria-label="Question ${i+1}${a.drafts[item.id]?', answered':''}" ${i===a.question?'aria-current="step"':''}`,'question-dot '+(a.drafts[item.id]?'answered':'')+(i===a.question?' current':''))).join('')}</nav>`;
 const foot=isFinal?`${btn('Back','back',a.question===0?'disabled':'','secondary')}<span class="muted">${Object.keys(a.drafts).length} / 10 answered</span>${a.question<9?btn('Next '+icon('arrow'),'next'):btn('Submit check','submit',c.finalCheck.questions.every(q=>completeDraft(q,a))?'':'disabled')}`:`<span class="muted">${submitted?'':'Take your time. You can change your answer.'}</span>${btn(submitted?'Continue '+icon('arrow'):'Check',submitted?'continue':'check',!submitted&&!completeDraft(q,a)?'disabled':'')}`;
 return shell(body,foot,(isFinal?Object.keys(a.drafts).length/10:a.question/5)*100);
}
function results(){const r=state.results[resultIndex]||state.results[0];if(!r){screen='home';return home()}const objective=c.learningObjectives.map((o,i)=>({o,i,n:c.finalCheck.questions.filter(q=>q.objectiveId===o.id&&r.answers[q.id]===q.correctOptionId).length}));const met=score(r)>=8&&objective.every(o=>o.n>=1);return `<div class="results-shell"><header><a class="wordmark" href="#" data-action="home">mepamo</a>${btn('Back to path','home','','secondary')}</header><main><span class="eyebrow">UNIT COMPLETE · ${resultIndex===0?'FIRST COMPLETED CHECK':'PRACTICE ATTEMPT'}</span><h1>You connected the clues.</h1><p>There’s always another detail to discover.</p><div class="result-summary"><div class="score">${score(r)}<span> / 10</span></div><div><h2>${met?'Review target reached':'Review recommended'}</h2><p>The provisional target is 8/10, with at least 1/2 in each area.<br>This is a learning check, not a certification exam.</p></div></div><h2>Your discoveries</h2><div class="objectives">${objective.sort((a,b)=>(a.n===0?0:1)-(b.n===0?0:1)).map(({o,i,n})=>`<div><span>${esc(o.label)}</span><strong>${n} / 2</strong>${btn('Review lesson '+(i+1),'review',`data-index="${i}"`,'text-button')}</div>`).join('')}</div><div class="result-actions">${btn('Practice this check','practice')}${state.results.length>1?`<label>Saved result <select id="result-picker">${state.results.map((r,i)=>`<option value="${i}" ${resultIndex===i?'selected':''}>${i===0?'First check':'Practice '+i} · ${esc(r.date)} · ${score(r)}/10</option>`).join('')}</select></label>`:''}</div><h2>Look back at your answers</h2><div class="answer-review">${c.finalCheck.questions.map((q,i)=>`<details><summary><span class="review-mark">${r.answers[q.id]===q.correctOptionId?'✓':'↗'}</span>${i+1}. ${esc(q.prompt)}</summary><p>Your answer: ${esc(q.options.find(o=>o.id===r.answers[q.id])?.text)}</p><p><strong>Correct answer:</strong> ${esc(q.options.find(o=>o.id===q.correctOptionId)!.text)}</p><p>${esc(q.feedback.explanation)}</p>${btn('Review this lesson','review',`data-index="${c.lessons.findIndex(l=>l.objectiveId===q.objectiveId)}"`,'text-button')}${sourceLinks(q.sourceIds)}</details>`).join('')}</div><p class="end-note">That’s the end of this unit. Your first result is preserved, and every repeat is practice.</p></main></div>`;}
app.addEventListener('click',e=>{const b=(e.target as Element).closest<HTMLElement>('[data-action]');if(!b||b.hasAttribute('disabled'))return;e.preventDefault();const action=b.dataset.action,i=Number(b.dataset.index);
 if(action==='sound'){toggleSound(b);return}
 if(action==='why'){const panel=document.getElementById('answer-explanation')!;panel.hidden=!panel.hidden;b.setAttribute('aria-expanded',String(!panel.hidden));return}
 if(action==='course'){course=b.dataset.course==='essential'?'essential':'heritage';const url=new URL(location.href);url.searchParams.set('course',course);history.replaceState(null,'',url);screen='home';save();render();return}
 if(action==='discovery-check'){startUnitCheck(false);return}
 if(action==='discovery-check-again'){startUnitCheck(true);return}
 if(action==='essential-node'){showEssentialPopover(b.dataset.id!);return}
 if(action==='home'){screen='home';chosen=Math.min(state.completed.length,5);save();render();return}
 if(action==='node'){showLessonDialog(i);return}
 if(action==='lesson-close'){document.querySelector<HTMLDialogElement>('#lesson-dialog')?.close();return}
 if(action==='start-check'){startFinal();return}
 if(action==='start'){if(chosen===5){if(state.results.length){screen='results';resultIndex=0;render()}else startFinal()}else startLesson(chosen);return}
 if(action==='review'){startLesson(i);return}
 if(action==='practice'){state.final=null;startFinal();return}
 if(action==='reset'){if(confirm('Reset all Mepamo progress in this browser, including both courses? This cannot be undone.')){try{localStorage.removeItem(key);corrupt=false;warning='';}catch{warning='Browser storage is unavailable. Progress will stay in memory.';}state=emptyState();screen='home';chosen=0;render()}return}
 if(action==='about'){const dialog=document.createElement('dialog');dialog.innerHTML=`<h2>A little about mepamo</h2><p>${course==='essential'?'Seven units. Thirty-three lessons. Discover Japan.':'One unit. Five lessons. A new perspective on Japan&#8217;s heritage.'}</p><p>Your progress stays in this browser. Clearing browser data clears your progress. Learn as much as you like. Completing one lesson or a final check meets your daily goal. A missed day resets your streak, while your lesson progress stays saved.</p><p>Streaks use your device’s local calendar. No account, tracking, or certification.</p><p>Artwork uses the supplied mepamo mascot and Mount Fuji illustrations.</p>${btn('Reset course progress','reset','','secondary')}<form method="dialog"><button class="primary">Keep exploring</button></form>`;app.append(dialog);dialog.showModal();return}
 if(screen==='essential'){handleEssentialControl(action||'',b,e);return}
 const a=active();
 if(action==='read'){a.card=screen==='final'?2:a.card+1;if(a.card<2)event('teaching_card_view',a,c.lessons[a.lesson].cards[a.card].id)}
 else if(action==='answer'&&!a.submitted){a.drafts[question().id]=b.dataset.value!;save();render(false);app.querySelector<HTMLElement>(`[data-value="${b.dataset.value}"]`)?.focus();return}
 else if(action==='item'&&!a.submitted){selected=i;render(false);app.querySelector<HTMLElement>(`[data-action="item"][data-index="${i}"]`)?.focus();return}
 else if(action==='destination'&&!a.submitted&&selected>=0){const q=question(),ad=adaptations[q.id];const v=Array.isArray(a.drafts[q.id])?[...a.drafts[q.id] as number[]]:ad.items.map(()=>-1);if(ad.kind==='matching'){const existing=v.indexOf(i);if(existing>=0)v[existing]=-1}v[selected]=i;a.drafts[q.id]=v;selected=-1;save();render(false);app.querySelector<HTMLElement>('[data-action="item"]')?.focus();return}
 else if(action==='check'&&!a.submitted&&completeDraft(question(),a)){a.submitted=true;event('activity_submission',a,question().id);save();render();playFeedback(app,a.id+':'+question().id,correct(question(),a));app.querySelector<HTMLElement>('[data-action=continue]')?.focus({preventScroll:true});return}
 else if(action==='continue'&&a.submitted){event('feedback_acknowledged',a,question().id);if(a.question===4){a.done=true;if(!state.completed.includes(a.lesson))state.completed.push(a.lesson);qualify();event('lesson_complete',a)}else{a.question++;a.submitted=false;selected=-1}}
 else if(action==='back'){a.question=Math.max(0,a.question-1)}
 else if(action==='next'){a.question=Math.min(9,a.question+1)}
 else if(action==='jump'){a.question=i}
 else if(action==='submit'&&!a.done&&c.finalCheck.questions.every(q=>completeDraft(q,a))){a.done=true;state.results.push({id:a.id,answers:structuredClone(a.drafts),date:localDate()});qualify();event('final_submission',a);resultIndex=state.results.length-1;screen='results'}
 save();render();
});
app.addEventListener('change',e=>{const el=e.target as HTMLSelectElement;if(el.id==='result-picker'){resultIndex=Number(el.value);render()}});
window.addEventListener('focus',refreshHome);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshHome()});
let lastDay=localDate();setInterval(()=>{if(localDate()!==lastDay){lastDay=localDate();refreshHome()}},30000);
render(false);



function suspendArtwork(){stopNarration();closePopover();cancelFeedback();unmountArtwork()}
function resumeArtwork(event:PageTransitionEvent){if(event.persisted){unmountArtwork=mountArtwork(app);mountLessonNarration()}}
window.addEventListener('pagehide',suspendArtwork);
window.addEventListener('pageshow',resumeArtwork);
if(import.meta.hot)import.meta.hot.dispose(()=>{stopNarration();unmountLessonControls();closePopover();cancelFeedback();unmountArtwork();window.removeEventListener('pagehide',suspendArtwork);window.removeEventListener('pageshow',resumeArtwork)});

function coursePicker(){return '<nav class="course-picker" aria-label="Choose a course">'+['heritage','essential'].map(id=>btn(id==='essential'?'Essential: Know Japan':'Japanese World Heritage','course','data-course="'+id+'" aria-pressed="'+(course===id)+'"','course-choice')).join('')+'</nav>'}
function ep(){return state.essential??=(emptyEssential())}
function ea(){return ep().attempts[ep().active!]}
function el(){return resolveEssentialLesson(ep().active!,ea())!}
function essentialStep(){return ea()?el().steps[ea().step]:undefined}
function eq(){return el().questions.find(q=>q.id===essentialStep()?.ref)!}
function ed(){const a=ea(),q=eq();if(!a.drafts[q.id]){a.drafts[q.id]=newDraft(q);save()}return a.drafts[q.id]}
function essentialUnit(){if(ep().active===checkId)return essential.units[0];return essential.units.find(u=>u.lessons.some(l=>l.id===ep().active))!}
function essentialHome(){const p=ep();return '<div class="home-shell essential-path"><aside class="rail"><a class="wordmark" href="#" data-action="home">mepamo</a></aside><main class="path-main"><header class="home-header"><div class="topline"><span class="eyebrow">YOUR LEARNING PATH</span><div class="stats"><span class="streak" title="Consecutive learning days">'+icon('flame')+streak(state.dates)+'</span></div></div><h1>'+esc(essential.title)+'</h1><p>Discover the places. Understand their stories.</p>'+coursePicker()+'</header>'+essential.units.map(u=>'<section class="essential-unit" data-count="'+u.lessons.length+'" aria-label="Unit '+u.number+': '+esc(u.title)+'"><div class="unit-banner"><div><span class="eyebrow">UNIT '+u.number+'</span><h2>'+esc(u.title)+'</h2></div>'+icon('book')+'</div><div class="path">'+u.lessons.map((l,i)=>{const index=essentialLessons.indexOf(l),done=p.completed.includes(l.id),locked=index>p.completed.length;return '<div class="node-wrap node-'+i+'"><button class="node '+(done?'complete':locked?'locked':'available')+'" data-action="essential-node" data-id="'+l.id+'" aria-label="'+esc(l.title)+' &middot; '+(done?'completed':locked?'locked':'available')+'" aria-haspopup="dialog" aria-expanded="false" '+(locked?'disabled':'')+'>'+nodeArt(done?'complete':locked?'locked':'current')+'</button><span class="essential-lesson-label">'+esc(l.title)+'</span></div>'}).join('')+'</div>'+(u.number===1?unitCheckCard():'')+'</section>').join('')+'<footer class="home-footer"><span>One lesson meets your goal. Keep exploring as much as you like.</span>'+btn('About & progress','about','','text-button')+'</footer></main><aside class="right-rail"><section class="daily"><h2>Your daily goal</h2><p>Complete 1 lesson or final check</p><div class="goal-row"><div class="meter"><span style="width:'+(state.dates.includes(localDate())?100:0)+'%"></span></div><span>'+(state.dates.includes(localDate())?1:0)+' / 1</span></div>'+(state.dates.includes(localDate())?'<p class="goal-complete">Daily goal complete</p>':'')+'</section><div class="mascot">'+mascot+'</div><p class="companion-copy">A little curiosity<br>goes a long way.</p></aside></div>'}
function showEssentialPopover(id:string){const l=essentialLessons.find(l=>l.id===id);if(!l||essentialLessons.indexOf(l)>ep().completed.length)return;const trigger=app.querySelector<HTMLButtonElement>('[data-action="essential-node"][data-id="'+id+'"]')!;const toggle=trigger.getAttribute('aria-expanded')==='true';closePopover();if(toggle)return;const a=ep().attempts[id],done=ep().completed.includes(id),resume=a&&!a.done;const u=essential.units.find(u=>u.lessons.includes(l))!;closePopover=lessonPopover(trigger,'<h3 id="lesson-dialog-title">'+esc(l.title)+'</h3><p>Unit '+u.number+' &middot; Lesson '+(u.lessons.indexOf(l)+1)+' of '+u.lessons.length+'</p><p>'+(a?Object.keys(a.evaluations).length:0)+' of '+l.questions.length+' activities completed</p>'+btn((resume?(done?'Resume review':'Resume lesson'):done?'Review lesson':'Start lesson')+' &#8250;','essential-start'),()=>startEssential(id))}
function startEssential(id:string){const l=essentialLessons.find(l=>l.id===id);if(!l||essentialLessons.indexOf(l)>ep().completed.length)return;ep().active=id;const previous=ep().attempts[id];if(!previous||previous.done)ep().attempts[id]={id:crypto.randomUUID(),lesson:id,step:0,done:false,drafts:{},evaluations:{},...(id===tokyoId?{contentVersion:tokyoVersion}:discoveryIds.includes(id)?{contentVersion:discoveryVersion}:{})};screen='essential';event(previous&&!previous.done?'resume':'lesson_start',ea());if(essentialStep()?.kind==='introduction')event('teaching_card_view',ea(),essentialStep()!.ref);render()}
function unitCheckCard(){const unlocked=essentialLessons.slice(0,5).every(l=>ep().completed.includes(l.id)),a=ep().attempts[checkId];return '<div class="discovery-unit-check"><h3>Unit 1 check</h3><p>Connect the stories from all five lessons.</p>'+btn(a?(a.done?'View results':'Resume check'):'Start check','discovery-check',unlocked?'':'disabled')+'</div>'}
function startUnitCheck(again:boolean){if(!essentialLessons.slice(0,5).every(l=>ep().completed.includes(l.id)))return;const previous=ep().attempts[checkId];if(!previous||again){if(previous)(ep().checkHistory??=[]).push(structuredClone(previous));const seed=crypto.randomUUID();ep().attempts[checkId]={id:crypto.randomUUID(),lesson:checkId,step:0,done:false,drafts:{},evaluations:{},contentVersion:discoveryVersion,selectionSeed:seed,questionOrder:selectCheck(seed)};const attempt=ep().attempts[checkId];for(const q of resolveEssentialLesson(checkId,attempt)!.questions)attempt.drafts[q.id]=newDraft(q)}else if(previous.done){previous.step=7}ep().active=checkId;screen='essential';event(previous&&!again?'resume':'unit_check_start',ea());render()}
function essentialLesson(){const a=ea(),l=el(),step=essentialStep()!,unit=essentialUnit();const progress=l.steps.slice(0,a.step).filter(s=>s.kind==='question'&&s.ref in a.evaluations).length/l.questions.length*100;const label='<span class="eyebrow">UNIT '+unit.number+' &middot; '+esc(l.title)+'</span>';
 if(isDiscovery(l.id)){
 const back=btn('Back','discovery-back',a.step===0?'disabled':'','secondary');
 if(step.kind==='introduction')return shell(discoveryModule(l,step.ref),storyControls(a.step>0,'discovery-back'),progress);
 if(step.kind==='question'){const q=eq(),d=ed(),evaluation=a.evaluations[q.id];return shell(discoveryQuestion(l,q,d,evaluation),back+btn(evaluation!==undefined?'Continue '+icon('arrow'):'Check',evaluation!==undefined?'continue':'check',evaluation===undefined&&!ready(q,d)?'disabled':''),progress)}
 if(l.id===checkId)return shell('<div class="completion">'+label+'<h1>You connected the stories.</h1><p>'+Object.values(a.evaluations).filter(Boolean).length+' of 7 correct</p><p>You can revisit the questions or practice this check again.</p></div>',back+btn('Practice again','discovery-check-again','','secondary')+btn('Back to path','home'),100);
 }
 if(l.id===tokyoId&&step.kind==='introduction')return shell(storyView(step.ref),storyControls(a.step>0),progress);
 if(l.id===tokyoId&&step.kind==='question'){const q=eq(),d=ed(),evaluation=a.evaluations[q.id];return shell(tokyoQuestion(q,d,evaluation),btn('Back','tokyo-back','','secondary')+btn(evaluation!==undefined?'Continue '+icon('arrow'):'Check',evaluation!==undefined?'continue':'check',evaluation===undefined&&!ready(q,d)?'disabled':''),progress)}
 if(step.kind==='introduction'){const intro=l.introductions.find(i=>i.id===step.ref)!;const parts=intro.text.split(/\n\n+/);const heading=parts[0].length<80&&!/[.!?]$/.test(parts[0])?parts.shift()!:l.title;return shell('<div class="intro">'+label+'<h1>'+emphasis(heading)+'</h1><div class="teaching-copy">'+paragraphs(parts.join('\n\n'))+'</div><div class="essential-intro-media">'+l.suggested_intro_assets.map(asset).join('')+'</div>'+sources(l)+'</div>','<span class="muted">A little discovery.</span>'+btn('Continue '+icon('arrow'),'essential-read'),progress)}
 if(step.kind==='recap')return shell('<div class="completion">'+label+'<h1>Lesson complete</h1>'+paragraphs(l.recap)+'<div class="completion-facts"><span>'+icon('check')+l.questions.length+' activities explored</span><span>'+icon('check')+'Daily goal complete</span></div>'+sources(l)+'</div>','<span class="muted">'+esc(l.title)+'</span>'+btn('Back to path '+icon('arrow'),'home'),100);
 const q=eq(),d=ed(),evaluation=a.evaluations[q.id],submitted=evaluation!==undefined;let body='<span class="eyebrow">UNIT '+unit.number+' &middot; LESSON '+(unit.lessons.indexOf(l)+1)+' &middot; QUESTION '+q.number+' OF '+l.questions.length+'</span><h1>'+(q.type==='word_bank'?'Complete the sentence.':esc(q.prompt))+'</h1><p class="question-help">'+instruction(q)+'</p>'+(q.id==='essential-1-2-q3'?'<div class="essential-intro-media">'+asset('kyoto-machiya')+'</div>':'')+renderQuestion(q,d,evaluation)+'<div class="feedback-area"><div class="mepamo-feedback-slot" aria-hidden="true"></div><div class="result-announcement sr-only" data-result-announcement role="status" aria-live="polite"></div>';
 if(submitted&&q.type!=='multiple_choice')body+='<div class="multipart-result essential-result mepamo-answer">'+statusIcon(evaluation)+(evaluation?'Correct answer':'Review the correct answer in Why?')+'</div>';
 if(submitted)body+=explanation(q,l,!evaluation);body+='</div>';
 return shell(body,'<span class="muted">'+(submitted?'':q.type==='match_pairs'?'Match all pairs to continue.':q.type==='word_bank'?'Tap a placed word to return it.':q.type==='ordering'?'Arrange the complete sequence.':'You can change your answer.')+'</span>'+btn(submitted?'Continue '+icon('arrow'):'Check',submitted?'continue':'check',!submitted&&!ready(q,d)?'disabled':''),progress);
}
function advanceEssential(){const a=ea();a.step++;const step=essentialStep()!;if(step.kind==='recap'){const previouslyDone=a.done;a.done=true;if(a.lesson!==checkId&&!ep().completed.includes(a.lesson))ep().completed.push(a.lesson);if(!isDiscovery(a.lesson)||!previouslyDone){qualify();event(a.lesson===checkId?'unit_check_complete':'lesson_complete',a)}}else if(step.kind==='introduction')event('teaching_card_view',a,step.ref);save();render()}
function handleEssentialControl(action:string,b:HTMLElement,e:MouseEvent){const a=ea(),step=essentialStep();if(!a||!step)return;if(action==='discovery-back'&&isDiscovery(el().id)&&a.step>0){a.step--;save();render();return}if(action==='tokyo-back'&&el().id===tokyoId&&a.step>0){a.step--;save();render();return}if(action==='essential-read'&&step.kind==='introduction'){if(e.detail>1)return;advanceEssential();return}if(step.kind!=='question')return;const q=eq(),d=ed(),submitted=q.id in a.evaluations;
 if(action==='continue'&&submitted){event('feedback_acknowledged',a,q.id);advanceEssential();return}
 if(submitted)return;
 if(action==='check'&&ready(q,d)){if(q.type==='match_pairs'&&(d.round||0)<q.rounds.length-1){d.round!++;delete d.pending;delete d.choice;save();render();return}const ok=grade(q,d);a.evaluations[q.id]=ok;event('activity_submission',a,q.id);save();render();playFeedback(app,a.id+':'+q.id,ok,essentialUnit().feedback_mode==='restrained');app.querySelector<HTMLElement>('[data-action="continue"]')?.focus({preventScroll:true});return}
 let focus='';
 if(action==='essential-choice'&&q.type==='multiple_choice'){if(!q.options.some(o=>o.id===b.dataset.id))return;d.choice=b.dataset.id;focus='[data-action="essential-choice"][data-id="'+b.dataset.id+'"]'}
 else if(action==='essential-tile'&&q.type==='word_bank'){placeTile(q,d,b.dataset.id!);focus='[data-action="essential-slot"]'}
 else if(action==='essential-slot'&&q.type==='word_bank'){const i=Number(b.dataset.index);d.slots![i]=null;d.activeSlot=i;focus='[data-action="essential-slot"][data-index="'+i+'"]'}
 else if((action==='tokyo-place'||action==='discovery-place')&&q.type==='ordering'&&q.placement){const id=b.dataset.id!;if(!q.items.some(x=>x.id===id)||d.order!.includes(id))return;d.order!.push(id);focus='[data-action='+ (isDiscovery(el().id)?'discovery-return':'tokyo-return') +'][data-id="'+id+'"]'}
 else if((action==='tokyo-return'||action==='discovery-return')&&q.type==='ordering'&&q.placement){d.order=d.order!.filter(id=>id!==b.dataset.id);focus='[data-action='+ (isDiscovery(el().id)?'discovery-place':'tokyo-place') +'][data-id="'+b.dataset.id+'"]'}
 else if(action==='discovery-match-left'&&q.type==='match_assignment'){if(!q.leftItems.some(o=>o.id===b.dataset.id))return;d.choice=b.dataset.id;focus='[data-action=discovery-match-right]'}
 else if(action==='discovery-match-right'&&q.type==='match_assignment'){if(!d.choice||!q.rightItems.some(o=>o.id===b.dataset.id))return;assignMatch(d.assignments!,d.choice,b.dataset.id!);delete d.choice;focus='[data-action=discovery-match-left]'}
 else if(action==='essential-move'&&q.type==='ordering'){moveItem(d,b.dataset.id!,Number(b.dataset.index));focus='[data-action="essential-move"][data-id="'+b.dataset.id+'"]:not(:disabled)'}
 else if(action==='essential-pair'&&q.type==='match_pairs'){matchPair(q,d,b.dataset.side as 'left'|'right',b.dataset.id!);focus='[data-action="essential-pair"][data-id="'+b.dataset.id+'"][data-side="'+b.dataset.side+'"]'}
 else return;
 save();render(false);const target=app.querySelector<HTMLElement>(focus);if(target&&!target.hasAttribute('disabled'))target.focus({preventScroll:true});else app.querySelector<HTMLElement>('[data-action="essential-pair"]:not(:disabled),[data-action="check"]:not(:disabled)')?.focus({preventScroll:true});
}
// Drag is an enhancement; all draft mutations also have tap and keyboard controls.
app.addEventListener('dragstart',e=>{if(screen!=='essential'||essentialStep()?.kind!=='question'||eq().id in ea().evaluations){e.preventDefault();return}const item=(e.target as Element).closest<HTMLElement>('[data-drag-id]');if(!item)return;e.dataTransfer?.setData('application/x-mepamo',JSON.stringify({question:eq().id,id:item.dataset.dragId}));if(e.dataTransfer)e.dataTransfer.effectAllowed='move'});
app.addEventListener('dragover',e=>{if(screen==='essential'&&(e.target as Element).closest('[data-drop-slot],[data-drop-order],[data-word-bank]')){e.preventDefault();(e.target as Element).closest('[data-drop-slot],[data-drop-order],[data-word-bank]')?.classList.add('drop-target')}});
app.addEventListener('dragleave',e=>(e.target as Element).closest('[data-drop-slot],[data-drop-order],[data-word-bank]')?.classList.remove('drop-target'));
app.addEventListener('dragend',()=>app.querySelectorAll('.drop-target').forEach(e=>e.classList.remove('drop-target')));
app.addEventListener('drop',e=>{const target=(e.target as Element).closest<HTMLElement>('[data-drop-slot],[data-drop-order],[data-word-bank]');if(screen!=='essential'||!target||essentialStep()?.kind!=='question')return;e.preventDefault();target.classList.remove('drop-target');const q=eq();if(q.id in ea().evaluations)return;let payload:{question:string;id:string};try{payload=JSON.parse(e.dataTransfer?.getData('application/x-mepamo')||'')}catch{return}if(payload.question!==q.id)return;const d=ed();if(q.type==='word_bank'){if(target.hasAttribute('data-word-bank')){const index=d.slots!.indexOf(payload.id);if(index>=0){d.slots![index]=null;d.activeSlot=index}}else if(target.dataset.dropSlot!==undefined)placeTile(q,d,payload.id,Number(target.dataset.dropSlot))}else if(q.type==='ordering'&&target.dataset.dropOrder!==undefined)moveItem(d,payload.id,Number(target.dataset.dropOrder));else return;save();render(false)});

function mountLessonNarration(){
 const step=screen==='essential'?essentialStep():undefined;
 if(step?.kind!=='introduction')return;
 const lessonId=el().id,ref=step.ref;
 mountNarration(app,()=>{if(screen==='essential'&&el().id===lessonId&&essentialStep()?.kind==='introduction'&&essentialStep()?.ref===ref)advanceEssential()},isDiscovery(lessonId)?discoveryNarration:undefined);
}
