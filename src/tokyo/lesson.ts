import content from './content.json' with {type:'json'};
import type {EssentialLesson, EssentialQuestion} from '../essential/model';
export const tokyoId='essential-1-1';
export const tokyoVersion=content.version;
export {content as tokyo};
export const tokyoLesson:EssentialLesson={
 id:tokyoId,source_id:'1.1',title:'Tokyo',goal:content.title,
 introductions:content.modules.map(m=>({id:m.id,before_question:1,text:m.title+'\n\n'+m.body})),
 questions:content.quizzes.map((q,i):EssentialQuestion=>{
 const base={id:q.id,number:i+1,prompt:q.title,feedback:q.correctFeedback.body};
 if(q.type==='wordBank')return {...base,type:'word_bank',prompt:q.sentenceBefore+' ___'+q.sentenceAfter,tiles:q.options!.map(o=>({id:o.id,label:o.text})),blanks:[{id:'city',correct_tile_id:q.correctAnswer!}],blank_order:'fixed'};
 if(q.type==='order')return {...base,type:'ordering',items:q.items!.map(o=>({id:o.id,label:o.text})),correct_order:q.correctOrder!,ordering_basis:q.instruction,placement:true};
 return {...base,type:'multiple_choice',options:q.options!.map(o=>({id:o.id,label:o.text})),correct_option_id:q.correctAnswer!};
 }),
 recap:content.complete.title+'\n\n'+content.complete.body,sources:[],suggested_intro_assets:[],question_count:5,
 steps:content.sequence.map(ref=>({kind:ref==='complete'?'recap':content.modules.some(m=>m.id===ref)?'introduction':'question',ref}))
};
/** Archive the previous edition's attempt without changing completed lessons or rewards. */
export function migrateTokyoSave(value:unknown){
 if(!value||typeof value!=='object')return;
 const p=(value as {essential?:{attempts?:Record<string,any>;active?:string|null;legacyTokyoAttempts?:unknown[]}}).essential;
 const a=p?.attempts?.[tokyoId];
 if(!a||a.contentVersion===tokyoVersion)return;
 if(typeof a.id!=='string'||a.lesson!==tokyoId||!Number.isInteger(a.step)||a.step<0||a.step>4||typeof a.done!=='boolean'||!a.drafts||!a.evaluations)return;
 if(!Object.keys(a.drafts).every(id=>id.startsWith('essential-1-1-q')))return;
 (p!.legacyTokyoAttempts??=[]).push(a);
 delete p!.attempts![tokyoId];
 if(p!.active===tokyoId)p!.active=null;
}
