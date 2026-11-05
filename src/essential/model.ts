import raw from '../essential-content.json' with { type: 'json' };
export type Choice={id:string;label:string};
type Base={id:string;number:number;prompt:string;feedback:string;visible_context?:string};
export type EssentialQuestion=Base & (
 {type:'multiple_choice';options:Choice[];correct_option_id:string}|
 {type:'word_bank';tiles:Choice[];blanks:{id:string;correct_tile_id:string}[];blank_order:'fixed'|'interchangeable'}|
 {type:'match_pairs';pairs:{id:string;left:{text:string;asset_id?:string};right:{text:string}}[];rounds:string[][]}|
 {type:'ordering';items:Choice[];correct_order:string[];ordering_basis:string});
export type EssentialLesson={id:string;source_id:string;title:string;goal:string;introductions:{id:string;before_question:number;text:string}[];questions:EssentialQuestion[];recap:string;sources:{title:string;url:string}[];suggested_intro_assets:string[];question_count:number;steps:{kind:'introduction'|'question'|'recap';ref:string}[]};
export type EssentialUnit={id:string;number:number;title:string;feedback_mode:'standard'|'restrained';lessons:EssentialLesson[]};
export const essential=raw as {course_id:string;title:string;units:EssentialUnit[]};
export const essentialLessons=essential.units.flatMap(u=>u.lessons);
export type EssentialDraft={choice?:string;slots?:(string|null)[];activeSlot?:number;order?:string[];round?:number;matched?:string[];left?:string[][];right?:string[][];pending?:{side:'left'|'right';id:string}};
export type EssentialAttempt={id:string;lesson:string;step:number;done:boolean;drafts:Record<string,EssentialDraft>;evaluations:Record<string,boolean>};
export type EssentialProgress={completed:string[];attempts:Record<string,EssentialAttempt>;active:string|null};
export const emptyEssential=():EssentialProgress=>({completed:[],attempts:{},active:null});
export function shuffle(ids:string[]){const a=[...ids];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
export function newDraft(q:EssentialQuestion):EssentialDraft{
 if(q.type==='word_bank')return {slots:q.blanks.map(()=>null),activeSlot:0};
 if(q.type==='ordering'){let order=shuffle(q.items.map(x=>x.id));if(order.every((x,i)=>x===q.correct_order[i]))order=[...order.slice(1),order[0]];return {order}}
 if(q.type==='match_pairs')return {round:0,matched:[],left:q.rounds.map(shuffle),right:q.rounds.map(shuffle)};
 return {};
}
export function ready(q:EssentialQuestion,d:EssentialDraft){switch(q.type){case 'multiple_choice':return q.options.some(o=>o.id===d.choice);case 'word_bank':return d.slots?.length===q.blanks.length&&d.slots.every(Boolean);case 'ordering':return d.order?.length===q.items.length;case 'match_pairs':return q.rounds[d.round||0].every(id=>d.matched?.includes(id))}}
export function grade(q:EssentialQuestion,d:EssentialDraft):boolean{
 if(!ready(q,d))return false;
 switch(q.type){case 'multiple_choice':return d.choice===q.correct_option_id;case 'word_bank':return q.blank_order==='interchangeable'?q.blanks.every(b=>d.slots!.includes(b.correct_tile_id)):q.blanks.every((b,i)=>d.slots![i]===b.correct_tile_id);case 'ordering':return q.correct_order.every((id,i)=>id===d.order![i]);case 'match_pairs':return q.pairs.every(p=>d.matched?.includes(p.id))}
}
export function placeTile(q:Extract<EssentialQuestion,{type:'word_bank'}>,d:EssentialDraft,id:string,index?:number){if(!q.tiles.some(t=>t.id===id))return;const slots=d.slots!;const target=index??(d.activeSlot!==undefined?d.activeSlot:slots.indexOf(null));if(target<0||target>=slots.length)return;const from=slots.indexOf(id);if(from>=0)slots[from]=null;slots[target]=id;const next=slots.indexOf(null);d.activeSlot=next<0?undefined:next}
export function moveItem(d:EssentialDraft,id:string,index:number){const order=d.order!;const from=order.indexOf(id);if(from<0||index<0||index>=order.length)return;order.splice(from,1);order.splice(index,0,id)}
export function matchPair(q:Extract<EssentialQuestion,{type:'match_pairs'}>,d:EssentialDraft,side:'left'|'right',id:string):'pending'|'correct'|'incorrect'{
 if(!q.rounds[d.round||0].includes(id)||d.matched!.includes(id))return 'pending';
 if(!d.pending||d.pending.side===side){d.pending={side,id};return 'pending'}
 const ok=d.pending.id===id;delete d.pending;if(ok)d.matched!.push(id);return ok?'correct':'incorrect';
}
function validDraft(q:EssentialQuestion,d:EssentialDraft){
 if(!d||typeof d!=='object')return false;
 const list=(v:unknown,ids:string[],partial=false):v is string[]=>Array.isArray(v)&&v.every(x=>typeof x==='string'&&ids.includes(x))&&new Set(v).size===v.length&&(partial||v.length===ids.length);
 switch(q.type){
 case 'multiple_choice':return d.choice===undefined||q.options.some(o=>o.id===d.choice);
 case 'word_bank':return Array.isArray(d.slots)&&d.slots.length===q.blanks.length&&d.slots.every(x=>x===null||q.tiles.some(t=>t.id===x))&&new Set(d.slots.filter(Boolean)).size===d.slots.filter(Boolean).length&&(d.activeSlot===undefined||Number.isInteger(d.activeSlot)&&d.activeSlot>=0&&d.activeSlot<q.blanks.length);
 case 'ordering':return list(d.order,q.items.map(x=>x.id));
 case 'match_pairs':return Number.isInteger(d.round)&&d.round!>=0&&d.round!<q.rounds.length&&list(d.matched,q.pairs.map(p=>p.id),true)&&Array.isArray(d.left)&&Array.isArray(d.right)&&d.left.length===q.rounds.length&&d.right.length===q.rounds.length&&q.rounds.every((r,i)=>list(d.left![i],r)&&list(d.right![i],r))&&(!d.pending||['left','right'].includes(d.pending.side)&&q.rounds[d.round!].includes(d.pending.id));
 }
}
export function validEssential(x:EssentialProgress):boolean{
 if(!x||typeof x!=='object'||!Array.isArray(x.completed)||!x.completed.every((id,i)=>id===essentialLessons[i]?.id)||!x.attempts||typeof x.attempts!=='object'||Array.isArray(x.attempts))return false;
 if(x.active!==null&&(!essentialLessons.some(l=>l.id===x.active)||!x.attempts[x.active]))return false;
 return Object.entries(x.attempts).every(([id,a])=>{const l=essentialLessons.find(l=>l.id===id);return !!l&&!!a&&a.lesson===id&&typeof a.id==='string'&&Number.isInteger(a.step)&&a.step>=0&&a.step<l.steps.length&&typeof a.done==='boolean'&&!!a.drafts&&typeof a.drafts==='object'&&!Array.isArray(a.drafts)&&Object.entries(a.drafts).every(([id,d])=>{const q=l.questions.find(q=>q.id===id);return !!q&&validDraft(q,d)})&&!!a.evaluations&&typeof a.evaluations==='object'&&!Array.isArray(a.evaluations)&&Object.entries(a.evaluations).every(([id,v])=>{const q=l.questions.find(q=>q.id===id);return !!q&&typeof v==='boolean'&&!!a.drafts[id]&&ready(q,a.drafts[id])&&grade(q,a.drafts[id])===v})});
}
