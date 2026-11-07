import {renderMatching} from '../components/MatchingQuestion';
import {transcriptMarkup} from '../tokyo/transcript';
import {sourceQuestions,moduleSources,assetPath,checkId,type Artwork,type Item} from './content';
import {renderMultipleChoice,renderWordBank,escapeHtml as esc,paragraphs} from '../essential/questions';
import {statusIcon} from '../components/AnswerFeedback';
import type {EssentialLesson,EssentialQuestion,EssentialDraft} from '../essential/model';
const img=(art?:Artwork)=>art?'<img src="'+esc(assetPath(art.path))+'" alt="'+esc(art.alt)+'">':'';
const control=(body:string,action:string,id:string,locked:boolean,cls='',pressed=false)=>'<button class="essential-card '+cls+'" data-action="'+action+'" data-id="'+esc(id)+'" aria-pressed="'+pressed+'" '+(locked?'disabled':'')+'>'+body+'</button>';
const ordered=(items:Item[],order?:string[])=>order?order.map(id=>items.find(i=>i.id===id)!):items;
export function discoveryModule(l:EssentialLesson,id:string){const m=moduleSources[id];
 const stations=id==='sh-m2'?'<ol class="discovery-stations" aria-label="Selected stations from Tokyo toward Osaka">'+['Tokyo','Nagoya','Kyoto','Shin-Osaka'].map(s=>'<li>'+s+'</li>').join('')+'</ol>':'';
 return '<div class="intro tokyo-story discovery-story" data-clip="'+esc(id)+'"><span class="eyebrow">UNIT 1 &middot; '+esc(l.title)+'</span><h1>'+esc(m.title)+'</h1><div class="tokyo-story-grid '+(!m.artworks.length?'discovery-text-only':'')+'">'+(m.artworks.length?'<div class="discovery-artworks" style="--art-count:'+m.artworks.length+'">'+m.artworks.map(img).join('')+'</div>':'')+'<div class="tokyo-transcript">'+transcriptMarkup(m.narration)+stations+'</div></div><p class="discovery-audio-status" role="status" data-audio-status></p></div>';
}
export function discoveryQuestion(l:EssentialLesson,q:EssentialQuestion,d:EssentialDraft,evaluation:boolean|undefined){
 const source=sourceQuestions[q.canonicalId!],locked=evaluation!==undefined;
 let activity='';
 if(q.type==='word_bank'){
 const view={...q,tiles:ordered(source.options!,d.optionOrder).map(o=>({id:o.id,label:o.text}))};
 activity=renderWordBank(view,locked&&!evaluation?{...d,slots:[q.blanks[0].correct_tile_id]}:d,locked,'');
 }else if(q.type==='multiple_choice'){
 const options=ordered(source.options!,d.optionOrder);
 if(source.type==='pictureChoice')activity='<div class="options tokyo-pictures" role="group" aria-label="Answer choices">'+options.map(o=>{
 const selected=d.choice===o.id,result=locked?(o.id===q.correct_option_id?'correct':selected?'incorrect':''):'';
 return '<button class="option mepamo-answer tokyo-picture '+(selected?'selected ':'')+result+'" data-action="essential-choice" data-id="'+esc(o.id)+'" data-result="'+result+'" aria-pressed="'+selected+'" '+(locked?'disabled':'')+'>'+img(o.artwork)+'<span>'+esc(o.text)+'</span>'+(result?statusIcon(result==='correct'):'')+'</button>';
 }).join('')+'</div>';
 else activity=renderMultipleChoice({...q,options:options.map(o=>({id:o.id,label:o.text}))},d,evaluation);
 }else if(q.type==='ordering'){
 const shown=locked&&!evaluation?q.correct_order:d.order!;
 const tile=(item:Item,action:string)=>control(img(item.artwork)+'<span>'+esc(item.text)+'</span>',action,item.id,locked,'tokyo-picture');
 activity='<div class="discovery-order" style="--slots:'+q.items.length+'"><div class="tokyo-timeline" role="group" aria-label="Ordered answer slots">'+q.items.map((_,i)=>'<div class="tokyo-slot">'+(shown[i]?tile(source.items!.find(o=>o.id===shown[i])!,'discovery-return'):'<span>'+['First','Next','Then','Last'][i]+'</span>')+'</div>').join('')+'</div><div class="tokyo-bank" role="group" aria-label="Items to place">'+ordered(source.items!,d.itemOrder).map(item=>shown.includes(item.id)?'<div class="bank-placeholder" aria-hidden="true"></div>':tile(item,'discovery-place')).join('')+'</div></div><p class="assignment-count" role="status">'+d.order!.length+' of '+q.items.length+' placed</p>';
 }else if(q.type==='match_assignment'){
 activity=renderMatching({left:source.leftItems!.map(o=>({id:o.id,text:o.text,media:img(o.artwork)})),right:source.rightItems!.map(o=>({id:o.id,text:o.text})),leftOrder:d.leftOrder!,rightOrder:d.rightOrder!,assignments:d.assignments||{},selected:d.choice,locked,variant:'discovery'});
 }
 if(q.type==='match_assignment'&&locked){
 activity='<div class="discovery-match-results" aria-label="Correct matches">'+ordered(source.leftItems!,d.leftOrder).map(o=>'<div class="essential-card discovery-match-result">'+img(o.artwork)+'<div><strong>'+esc(o.text)+'</strong><span>'+esc(source.rightItems!.find(r=>r.id===q.correctPairs[o.id])!.text)+'</span></div>'+statusIcon(d.assignments?.[o.id]===q.correctPairs[o.id])+'</div>').join('')+'</div>';
 }
 const feedback=locked?(evaluation?source.correctFeedback:source.incorrectFeedback):null;
 return '<div class="tokyo-practice discovery-practice" data-canonical-id="'+esc(source.id)+'" data-review="'+!!q.review+'"><span class="eyebrow">'+(l.id===checkId?'UNIT 1 CHECK':'UNIT 1 &middot; '+esc(l.title)+(q.review?' &middot; REVIEW':''))+'</span><h1>'+esc(source.title)+'</h1>'+(source.scenario?'<p class="discovery-scenario">'+esc(source.scenario)+'</p>':'')+'<p class="question-help">'+esc(source.instruction)+'</p><div class="discovery-activity '+(source.artwork?'discovery-with-art':'')+'">'+(source.artwork?'<div class="discovery-question-art">'+img(source.artwork)+'</div>':'')+activity+'</div><div class="feedback-area"><div class="mepamo-feedback-slot" aria-hidden="true"></div><div class="sr-only" data-result-announcement role="status"></div>'+(feedback?'<section class="tokyo-feedback multipart-result" role="status">'+statusIcon(evaluation!)+'<div><strong>'+esc(feedback.title)+'</strong>'+paragraphs(feedback.body)+'</div></section>':'')+'</div></div>';
}
