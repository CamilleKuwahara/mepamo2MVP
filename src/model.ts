import {validEssential,type EssentialProgress} from './essential/model';
import data from './content.json' with { type: 'json' };
export const content = data;
export type Question = typeof data.lessons[number]['questions'][number];
export const adaptations: Record<string, {kind:'sorting'|'matching'; title:string; items:string[]; destinations:string[]; answers:number[]; explanations:string[]}> = {
 'JC-L01-Q2': {kind:'sorting',title:'Sort the heritage clues',items:['Pilgrimage traditions','Wooden craftsmanship','Plant diversity','Ecological processes'],destinations:['Cultural value','Natural value'],answers:[0,0,1,1],explanations:['Pilgrimage traditions express beliefs and practices.','Wooden craftsmanship expresses human skills and creativity.','Plant diversity concerns the variety of living things.','Ecological processes describe relationships in natural systems.']},
 'JC-L03-Q3': {kind:'matching',title:'Match each feature to its purpose',items:['Steep farmhouse roof','Large farmhouse attic','Castle defensive layout'],destinations:['Raising silkworms','Helping snow slide off','Protecting against attack'],answers:[1,0,2],explanations:['Steep roofs help snow slide off.','Large attic spaces supported raising silkworms.','Defensive layouts helped protect the castle against attack.']}
};
export const key = `mepamo:${data.course.id}:${data.contentVersion}:adaptations-v1`;
export type Draft = string | number[];
export type Attempt = {id:string; lesson:number; card:number; question:number; drafts:Record<string,Draft>; submitted:boolean; done:boolean};
export type Result = {id:string; answers:Record<string,Draft>; date:string};
export type State = {version:1; essential?:EssentialProgress; attempts?:Record<number,Attempt>; completed:number[]; dates:string[]; attempt:Attempt|null; final:Attempt|null; results:Result[]; events:{id:string;type:string;attempt:string;item:string;at:string;date:string}[]};
export const emptyState = ():State => ({version:1,completed:[],dates:[],attempt:null,final:null,results:[],events:[]});
export function localDate(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
export function streak(dates:string[],now=new Date()){const d=new Date(now.getFullYear(),now.getMonth(),now.getDate()); if(!dates.includes(localDate(d)))d.setDate(d.getDate()-1); let n=0; while(dates.includes(localDate(d))){n++;d.setDate(d.getDate()-1)}return n}
export function validState(s:unknown):s is State {
 if(!s || typeof s!=='object')return false;
 const x=s as State;
 const validDrafts=(d:unknown)=>!!d&&typeof d==='object'&&!Array.isArray(d)&&Object.entries(d).every(([id,v])=>{const a=adaptations[id];if(a)return Array.isArray(v)&&v.length===a.items.length&&v.every(n=>Number.isInteger(n)&&n>=-1&&n<a.destinations.length)&&(a.kind!=='matching'||new Set(v.filter(n=>n>=0)).size===v.filter(n=>n>=0).length);const q=[...data.lessons.flatMap(l=>l.questions),...data.finalCheck.questions].find(q=>q.id===id);return q&&typeof v==='string'&&q.options.some(o=>o.id===v)});
 const validAttempt=(a:Attempt|null,final=false)=>a===null|| (!!a&&typeof a.id==='string'&&Number.isInteger(a.lesson)&&a.lesson>=0&&a.lesson<5&&Number.isInteger(a.card)&&a.card>=0&&a.card<=2&&Number.isInteger(a.question)&&a.question>=0&&a.question<(final?10:5)&&typeof a.submitted==='boolean'&&typeof a.done==='boolean'&&validDrafts(a.drafts));
 return (!x.essential||validEssential(x.essential))&&x.version===1&&Array.isArray(x.completed)&&x.completed.every((n,i)=>n===i)&&x.completed.length<=5&&Array.isArray(x.dates)&&x.dates.every(d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d))&&validAttempt(x.attempt)&&(!x.attempts||(typeof x.attempts==='object'&&!Array.isArray(x.attempts)&&Object.entries(x.attempts).every(([k,a])=>validAttempt(a)&&a!==null&&Number(k)===a.lesson)))&&validAttempt(x.final,true)&&Array.isArray(x.events)&&x.events.every(e=>e&&typeof e.id==='string')&&Array.isArray(x.results)&&x.results.every(r=>r&&typeof r.id==='string'&&typeof r.date==='string'&&validDrafts(r.answers)&&data.finalCheck.questions.every(q=>typeof r.answers[q.id]==='string'));
}
export function score(result:Result){return data.finalCheck.questions.filter(q=>result.answers[q.id]===q.correctOptionId).length}


