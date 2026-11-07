import {assignMatch} from '../components/MatchingQuestion';
import {discoveryLessons,unitCheckLesson,checkId} from '../discovery/content';
import {tokyoLesson} from '../tokyo/lesson';
import raw from '../essential-content.json' with { type: 'json' };
export type Choice={id:string;label:string};
type Base={id:string;canonicalId?:string;review?:boolean;number:number;prompt:string;feedback:string;visible_context?:string};
export type EssentialQuestion=Base & (
 {type:'multiple_choice';options:Choice[];correct_option_id:string}|
 {type:'word_bank';tiles:Choice[];blanks:{id:string;correct_tile_id:string}[];blank_order:'fixed'|'interchangeable'}|
 {type:'match_assignment';leftItems:Choice[];rightItems:Choice[];correctPairs:Record<string,string>}|
 {type:'match_pairs';pairs:{id:string;left:{text:string;asset_id?:string};right:{text:string}}[];rounds:string[][]}|
 {type:'ordering';items:Choice[];correct_order:string[];ordering_basis:string;placement?:boolean});
export type EssentialLesson={id:string;source_id:string;title:string;goal:string;introductions:{id:string;before_question:number;text:string}[];questions:EssentialQuestion[];recap:string;sources:{title:string;url:string}[];suggested_intro_assets:string[];question_count:number;steps:{kind:'introduction'|'question'|'recap';ref:string}[]};
export type EssentialUnit={id:string;number:number;title:string;feedback_mode:'standard'|'restrained';lessons:EssentialLesson[]};
export const essential=structuredClone(raw) as {course_id:string;title:string;units:EssentialUnit[]};
essential.units[0].lessons[0]=tokyoLesson;
for(const lesson of discoveryLessons){const i=essential.units[0].lessons.findIndex(l=>l.id===lesson.id);essential.units[0].lessons[i]=lesson}
export const essentialLessons=essential.units.flatMap(u=>u.lessons);
export type EssentialDraft={optionOrder?:string[];leftOrder?:string[];rightOrder?:string[];itemOrder?:string[];assignments?:Record<string,string>;choice?:string;slots?:(string|null)[];activeSlot?:number;order?:string[];round?:number;matched?:string[];left?:string[][];right?:string[][];pending?:{side:'left'|'right';id:string}};
export type EssentialAttempt={id:string;lesson:string;step:number;done:boolean;contentVersion?:string;selectionSeed?:string;questionOrder?:string[];drafts:Record<string,EssentialDraft>;evaluations:Record<string,boolean>};
export type EssentialProgress={checkHistory?:EssentialAttempt[];completed:string[];attempts:Record<string,EssentialAttempt>;active:string|null};
export const emptyEssential=():EssentialProgress=>({completed:[],attempts:{},active:null});
export function shuffle(ids:string[]){const a=[...ids];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
export function newDraft(q:EssentialQuestion):EssentialDraft{
 if(q.canonicalId){
 if(q.type==='multiple_choice')return {optionOrder:shuffle(q.options.map(o=>o.id))};
 if(q.type==='word_bank')return {slots:q.blanks.map(()=>null),activeSlot:0,optionOrder:shuffle(q.tiles.map(o=>o.id))};
 if(q.type==='ordering'){let items=shuffle(q.items.map(o=>o.id));if(items.every((id,i)=>id===q.correct_order[i]))items=[...items.slice(1),items[0]];return {order:[],itemOrder:items}}
 if(q.type==='match_assignment')return {assignments:{},leftOrder:q.leftItems.map(o=>o.id),rightOrder:shuffle(q.rightItems.map(o=>o.id))};
 }
 if(q.type==='word_bank')return {slots:q.blanks.map(()=>null),activeSlot:0};
 if(q.type==='ordering'&&q.placement)return {order:[]};
 if(q.type==='ordering'){let order=shuffle(q.items.map(x=>x.id));if(order.every((x,i)=>x===q.correct_order[i]))order=[...order.slice(1),order[0]];return {order}}
 if(q.type==='match_pairs')return {round:0,matched:[],left:q.rounds.map(shuffle),right:q.rounds.map(shuffle)};
 return {};
}
export function ready(q:EssentialQuestion,d:EssentialDraft){switch(q.type){case 'match_assignment':return q.leftItems.every(o=>!!d.assignments?.[o.id]);case 'multiple_choice':return q.options.some(o=>o.id===d.choice);case 'word_bank':return d.slots?.length===q.blanks.length&&d.slots.every(Boolean);case 'ordering':return d.order?.length===q.items.length;case 'match_pairs':return q.rounds[d.round||0].every(id=>!!matchingAssignments(d)[id])}}
export function grade(q:EssentialQuestion,d:EssentialDraft):boolean{
 if(!ready(q,d))return false;
 switch(q.type){case 'match_assignment':return q.leftItems.every(o=>d.assignments?.[o.id]===q.correctPairs[o.id]);case 'multiple_choice':return d.choice===q.correct_option_id;case 'word_bank':return q.blank_order==='interchangeable'?q.blanks.every(b=>d.slots!.includes(b.correct_tile_id)):q.blanks.every((b,i)=>d.slots![i]===b.correct_tile_id);case 'ordering':return q.correct_order.every((id,i)=>id===d.order![i]);case 'match_pairs':return q.pairs.every(p=>matchingAssignments(d)[p.id]===p.id)}
}
export function placeTile(q:Extract<EssentialQuestion,{type:'word_bank'}>,d:EssentialDraft,id:string,index?:number){if(!q.tiles.some(t=>t.id===id))return;const slots=d.slots!;const target=index??(d.activeSlot!==undefined?d.activeSlot:slots.indexOf(null));if(target<0||target>=slots.length)return;const from=slots.indexOf(id);if(from>=0)slots[from]=null;slots[target]=id;const next=slots.indexOf(null);d.activeSlot=next<0?undefined:next}
export function moveItem(d:EssentialDraft,id:string,index:number){const order=d.order!;const from=order.indexOf(id);if(from<0||index<0||index>=order.length)return;order.splice(from,1);order.splice(index,0,id)}
export function matchingAssignments(d:EssentialDraft):Record<string,string>{return d.assignments||Object.fromEntries((d.matched||[]).map(id=>[id,id]))}
export function matchPair(q:Extract<EssentialQuestion,{type:'match_pairs'}>,d:EssentialDraft,side:'left'|'right',id:string):'pending'{
 const ids=q.rounds[d.round||0];if(!ids.includes(id))return 'pending';
 if(side==='left'){d.choice=id;return 'pending'}
 if(d.choice&&ids.includes(d.choice)){d.assignments={...matchingAssignments(d)};assignMatch(d.assignments,d.choice,id);delete d.choice;delete d.pending}return 'pending';
}
function validDraft(q:EssentialQuestion,d:EssentialDraft){
 if(!d||typeof d!=='object')return false;
 const list=(v:unknown,ids:string[],partial=false):v is string[]=>Array.isArray(v)&&v.every(x=>typeof x==='string'&&ids.includes(x))&&new Set(v).size===v.length&&(partial||v.length===ids.length);
 if(q.canonicalId){
 if(q.type==='multiple_choice'&&!list(d.optionOrder,q.options.map(o=>o.id)))return false;
 if(q.type==='word_bank'&&!list(d.optionOrder,q.tiles.map(o=>o.id)))return false;
 if(q.type==='ordering'&&!list(d.itemOrder,q.items.map(o=>o.id)))return false;
 }
 switch(q.type){
 case 'match_assignment':return !!d.assignments&&typeof d.assignments==='object'&&!Array.isArray(d.assignments)&&Object.entries(d.assignments).every(([left,right])=>q.leftItems.some(o=>o.id===left)&&q.rightItems.some(o=>o.id===right))&&new Set(Object.values(d.assignments)).size===Object.values(d.assignments).length&&(!d.choice||q.leftItems.some(o=>o.id===d.choice))&&list(d.leftOrder,q.leftItems.map(o=>o.id))&&list(d.rightOrder,q.rightItems.map(o=>o.id));
 case 'multiple_choice':return d.choice===undefined||q.options.some(o=>o.id===d.choice);
 case 'word_bank':return Array.isArray(d.slots)&&d.slots.length===q.blanks.length&&d.slots.every(x=>x===null||q.tiles.some(t=>t.id===x))&&new Set(d.slots.filter(Boolean)).size===d.slots.filter(Boolean).length&&(d.activeSlot===undefined||Number.isInteger(d.activeSlot)&&d.activeSlot>=0&&d.activeSlot<q.blanks.length);
 case 'ordering':return list(d.order,q.items.map(x=>x.id),q.placement);
 case 'match_pairs':return (d.assignments===undefined||!!d.assignments&&typeof d.assignments==='object'&&!Array.isArray(d.assignments)&&Object.entries(d.assignments).every(([left,right])=>q.rounds.some(r=>r.includes(left)&&r.includes(right)))&&new Set(Object.values(d.assignments)).size===Object.values(d.assignments).length)&&(!d.choice||q.rounds[d.round||0].includes(d.choice))&&Number.isInteger(d.round)&&d.round!>=0&&d.round!<q.rounds.length&&list(d.matched,q.pairs.map(p=>p.id),true)&&Array.isArray(d.left)&&Array.isArray(d.right)&&d.left.length===q.rounds.length&&d.right.length===q.rounds.length&&q.rounds.every((r,i)=>list(d.left![i],r)&&list(d.right![i],r))&&(!d.pending||['left','right'].includes(d.pending.side)&&q.rounds[d.round!].includes(d.pending.id));
 }
}
export function resolveEssentialLesson(id:string,a?:EssentialAttempt){return id===checkId?unitCheckLesson(a):essentialLessons.find(l=>l.id===id)}
export function validEssential(x:EssentialProgress):boolean{
 if(!x||typeof x!=='object'||!Array.isArray(x.completed)||!x.completed.every((id,i)=>id===essentialLessons[i]?.id)||!x.attempts||typeof x.attempts!=='object'||Array.isArray(x.attempts))return false;
 if(x.checkHistory!==undefined&&(!Array.isArray(x.checkHistory)||!x.checkHistory.every(a=>a?.lesson===checkId&&validEssential({...x,checkHistory:undefined,attempts:{[checkId]:a},active:null}))))return false;
 if(x.active!==null&&(!resolveEssentialLesson(x.active,x.attempts[x.active])||!x.attempts[x.active]))return false;
 return Object.entries(x.attempts).every(([id,a])=>{const l=resolveEssentialLesson(id,a);return !!l&&!!a&&a.lesson===id&&typeof a.id==='string'&&Number.isInteger(a.step)&&a.step>=0&&a.step<l.steps.length&&typeof a.done==='boolean'&&!!a.drafts&&typeof a.drafts==='object'&&!Array.isArray(a.drafts)&&Object.entries(a.drafts).every(([id,d])=>{const q=l.questions.find(q=>q.id===id);return !!q&&validDraft(q,d)})&&!!a.evaluations&&typeof a.evaluations==='object'&&!Array.isArray(a.evaluations)&&Object.entries(a.evaluations).every(([id,v])=>{const q=l.questions.find(q=>q.id===id);return !!q&&typeof v==='boolean'&&!!a.drafts[id]&&ready(q,a.drafts[id])&&grade(q,a.drafts[id])===v})});
}
