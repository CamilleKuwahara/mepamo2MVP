import raw from './lessons-2-5.json' with {type:'json'};
import check from './unit-check.json' with {type:'json'};
import {tokyo,tokyoLesson} from '../tokyo/lesson';
import type {EssentialLesson,EssentialQuestion,EssentialAttempt} from '../essential/model';
export const discoveryVersion='discovery-2-5-v1';
export const checkId='unit-1-check';
export type Artwork={path:string;alt:string;containsBakedMascot?:boolean};
export type Item={id:string;text:string;artwork?:Artwork};
export type QuestionSource={id:string;type:string;title:string;instruction:string;scenario?:string;options?:Item[];items?:Item[];leftItems?:Item[];rightItems?:Item[];correctPairs?:Record<string,string>;correctAnswer?:string;correctOrder?:string[];sentenceBefore?:string;sentenceAfter?:string;artwork?:Artwork;sourceLesson:number;correctFeedback:{title:string;body:string};incorrectFeedback:{title:string;body:string}};
export type ModuleSource={id:string;title:string;narration:string;artworks:Artwork[]};
export const authored=raw.lessons;
export const aliases:Record<string,string>={...raw.questionAliases,T1:'q2-ieyasu',T2:'q1-edo',T5:'q3-tokyo-tower'};
export const sourceQuestions:Record<string,QuestionSource>=Object.fromEntries(raw.lessons.flatMap<QuestionSource>(l=>l.questions as QuestionSource[]).map(q=>[q.id,q as QuestionSource]));
for(const q of tokyo.quizzes){sourceQuestions[q.id]={...q,sourceLesson:1,artwork:q.image?{path:q.image,alt:q.imageAlt||''}:undefined,options:q.options?.map(o=>({...o,artwork:'image' in o?{path:o.image,alt:o.text}:undefined})),items:q.items?.map(o=>({...o,artwork:{path:o.image,alt:o.text}}))} as QuestionSource}
export const moduleSources:Record<string,ModuleSource>=Object.fromEntries(raw.lessons.flatMap(l=>l.modules).map(m=>[m.id,m]));
export const assetPath=(path:string)=>path.startsWith('/')?path:'/lessons-2-5/'+path;
export const discoveryIds=raw.lessons.map(l=>'essential-1-'+l.number);
export const isDiscovery=(id:string)=>discoveryIds.includes(id)||id===checkId;
export function adaptQuestion(canonicalId:string,instanceId:string,number:number,review=false):EssentialQuestion{
 const q=sourceQuestions[canonicalId];
 const base={id:instanceId,canonicalId,review,number,prompt:q.title,feedback:q.correctFeedback.body};
 const choices=(items:Item[])=>items.map(o=>({id:o.id,label:o.text}));
 if(q.sourceLesson===1){const original=tokyoLesson.questions.find(x=>x.id===canonicalId)!;return {...structuredClone(original),...base,prompt:original.prompt}}
 switch(q.type){
 case 'wordBank':return {...base,type:'word_bank',prompt:q.sentenceBefore+' ___'+q.sentenceAfter,tiles:choices(q.options!),blanks:[{id:'blank',correct_tile_id:q.correctAnswer!}],blank_order:'fixed'};
 case 'order':return {...base,type:'ordering',items:choices(q.items!),correct_order:q.correctOrder!,ordering_basis:q.instruction,placement:true};
 case 'match':return {...base,type:'match_assignment',leftItems:choices(q.leftItems!),rightItems:choices(q.rightItems!),correctPairs:q.correctPairs!};
 default:return {...base,type:'multiple_choice',options:choices(q.options!),correct_option_id:q.correctAnswer!};
 }
}
export const discoveryLessons:EssentialLesson[]=raw.lessons.map(l=>{
 const questions=l.steps.filter(s=>s.kind==='practice'||s.kind==='review').map((s,i)=>adaptQuestion(aliases[s.questionRef!],s.instanceId,i+1,s.kind==='review'));
 return {id:'essential-1-'+l.number,source_id:'1.'+l.number,title:['','','Kyoto','Osaka','Mount Fuji','Shinkansen'][l.number],goal:l.storyFocus,introductions:l.modules.map(m=>({id:m.id,before_question:1,text:m.title+'\n\n'+m.narration})),questions,recap:l.closing,sources:[],suggested_intro_assets:[],question_count:questions.length,steps:l.steps.map(s=>({kind:s.kind==='module'?'introduction':s.kind==='complete'?'recap':'question',ref:s.kind==='module'?s.moduleId!:s.instanceId}))};
});
/** Deterministic sampling: every lesson is covered, then two unique extra core items. */
export function selectCheck(seed:string){
 let state=2166136261;for(const c of seed){state^=c.charCodeAt(0);state=Math.imul(state,16777619)}
 const random=()=>{state+=0x6D2B79F5;let t=state;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296};
 const shuffle=<T>(items:T[])=>{const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
 const pool=check.corePool.map(p=>aliases[p.alias]);
 const chosen=check.sourceLessons.map(n=>shuffle(pool.filter(id=>sourceQuestions[id].sourceLesson===n))[0]);
 return shuffle([...chosen,...shuffle(pool.filter(id=>!chosen.includes(id))).slice(0,check.extraSlots)]);
}
export function unitCheckLesson(a?:EssentialAttempt):EssentialLesson|undefined{
 if(!a?.selectionSeed||!a.questionOrder||a.questionOrder.length!==7||a.questionOrder.some((id,i)=>id!==selectCheck(a.selectionSeed!)[i]))return;
 const questions=a.questionOrder.map((id,i)=>adaptQuestion(id,'unit-check-'+(i+1),i+1,true));
 return {id:checkId,source_id:'1.check',title:'Unit 1 check',goal:'Connect the places and their stories.',introductions:[],questions,recap:'You connected the places and their stories.',sources:[],suggested_intro_assets:[],question_count:7,steps:[...questions.map(q=>({kind:'question' as const,ref:q.id})),{kind:'recap',ref:'check-complete'}]};
}
/** Preserve the old edition for reference while keeping course completion and other attempts. */
export function migrateDiscoverySave(value:unknown){
 if(!value||typeof value!=='object')return;
 const p=(value as {essential?:{active?:string|null;attempts?:Record<string,EssentialAttempt>;legacyDiscoveryAttempts?:EssentialAttempt[]}}).essential;
 if(!p?.attempts)return;
 for(const id of discoveryIds){const a=p.attempts[id];if(!a||a.contentVersion===discoveryVersion)continue;
 if(a.lesson!==id||typeof a.id!=='string'||!a.drafts||!a.evaluations||!Object.keys(a.drafts).every(qid=>qid.startsWith(id+'-q')))continue;
 (p.legacyDiscoveryAttempts??=[]).push(a);delete p.attempts[id];if(p.active===id)p.active=null;
 }
}
