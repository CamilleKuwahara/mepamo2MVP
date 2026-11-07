import {transcriptMarkup} from './transcript';
import {tokyo} from './lesson';
import {escapeHtml as esc,renderQuestion,renderWordBank,paragraphs} from '../essential/questions';
import type {EssentialQuestion,EssentialDraft} from '../essential/model';
import {statusIcon} from '../components/AnswerFeedback';
const image=(src:string,alt='')=>'<img src="'+esc(src)+'" alt="'+esc(alt)+'">';
export function storyView(id:string){const m=tokyo.modules.find(m=>m.id===id)!;const text=transcriptMarkup(m.body);
 return '<div class="intro tokyo-story" data-clip="'+m.audioClipId+'"><span class="eyebrow">UNIT 1 &middot; TOKYO</span><h1>'+esc(m.title)+'</h1><div class="tokyo-story-grid"><div class="tokyo-scene">'+image(m.image,m.imageAlt)+(m.containsBakedMascot?'':image('/lesson-1/assets/brand/mepamo-kun-original.png','Mepamo-kun'))+'</div><div class="tokyo-transcript">'+text+'</div></div><p class="sr-only" role="status" data-audio-status></p></div>';
}
export function storyControls(back:boolean,backAction='tokyo-back'){return '<button class="secondary" data-action="'+backAction+'" '+(!back?'disabled':'')+'>Back</button><div class="tokyo-playback"><button class="secondary" data-action="tokyo-replay">Replay</button><button class="secondary" data-action="tokyo-play" aria-label="Play narration">Play</button><label class="sr-only" for="tokyo-seek">Narration position</label><input id="tokyo-seek" type="range" min="0" max="100" value="0" step="0.1"><span data-audio-time>0:00</span></div><button class="primary" data-action="essential-read">Next &rarr;</button>'}
export function tokyoQuestion(q:EssentialQuestion,d:EssentialDraft,evaluation:boolean|undefined){
 const source=tokyo.quizzes.find(x=>x.id===q.id)!;const locked=evaluation!==undefined;
 let activity=q.type==='word_bank'?renderWordBank(q,d,locked,''):renderQuestion(q,d,evaluation);
 if(source.type==='order'&&q.type==='ordering'){
 const shown=locked&&!evaluation?q.correct_order:d.order!;
 const card=(id:string,action:string)=>{const item=source.items!.find(x=>x.id===id)!;return '<button class="essential-card tokyo-picture" data-action="'+action+'" data-id="'+id+'" '+(locked?'disabled':'')+'>'+image(item.image)+'<span>'+esc(item.text)+'</span></button>'};
 activity='<div class="tokyo-timeline" role="group" aria-label="Timeline from earliest to latest">'+[0,1,2].map(i=>'<div class="tokyo-slot">'+(shown[i]?card(shown[i],'tokyo-return'):'<span>'+['Earliest','Then','Latest'][i]+'</span>')+'</div>').join('')+'</div><div class="tokyo-bank" role="group" aria-label="Events to place">'+source.items!.map(item=>shown.includes(item.id)?'<div class="bank-placeholder" aria-hidden="true"></div>':card(item.id,'tokyo-place')).join('')+'</div><p role="status" class="assignment-count">'+d.order!.length+' of 3 events placed</p>';
 }else if(source.type==='pictureChoice'&&q.type==='multiple_choice'){
 activity='<div class="options tokyo-pictures" role="group" aria-label="Answer choices">'+source.options!.map(o=>{const selected=d.choice===o.id;const result=locked?(o.id===q.correct_option_id?'correct':selected?'incorrect':''):'';return '<button class="option mepamo-answer tokyo-picture '+(selected?'selected ':'')+result+'" data-action="essential-choice" data-id="'+o.id+'" aria-pressed="'+selected+'" '+(locked?'disabled':'')+'>'+image('image' in o?o.image:'')+'<span>'+esc(o.text)+'</span>'+(result?statusIcon(result==='correct'):'')+'</button>'}).join('')+'</div>';
 }else if(q.type==='word_bank'&&locked&&!evaluation){activity=renderQuestion(q,{...d,slots:[q.blanks[0].correct_tile_id]},evaluation)}
 const feedback=locked?(evaluation?source.correctFeedback:source.incorrectFeedback):null;
 return '<div class="tokyo-practice"><span class="eyebrow">UNIT 1 &middot; TOKYO</span><h1>'+esc(source.title)+'</h1><p class="question-help">'+esc(source.instruction)+'</p><div class="'+(source.image?'tokyo-choice-grid':'')+'">'+(source.image?'<div class="tokyo-question-art">'+image(source.image,source.imageAlt)+'</div>':'')+activity+'</div><div class="feedback-area"><div class="mepamo-feedback-slot" aria-hidden="true"></div><div data-result-announcement class="sr-only" role="status"></div>'+(feedback?'<section class="tokyo-feedback multipart-result" role="status">'+statusIcon(evaluation!)+'<div><strong>'+esc(feedback.title)+'</strong>'+paragraphs(feedback.body)+'</div></section>':'')+'</div></div>';
}
