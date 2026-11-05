import cross from '../assets/incorrect-cross-static.svg?raw';
const base='/assets/mepamo-feedback/';
export const statusIcon=(ok:boolean)=>ok?'<img class="mepamo-status" src="'+base+'correct-check-static.svg" alt="Correct answer">':'<span class="mepamo-status" role="img" aria-label="Incorrect answer">'+cross+'</span>';
let muted=false;try{muted=localStorage.getItem('mepamo:sound-muted')==='true'}catch{}
let sound:HTMLAudioElement|undefined;let cleanup=()=>{};const played=new Set<string>();
export function soundButton(){return '<button class="text-button sound-toggle" data-action="sound" aria-pressed="'+muted+'" aria-label="Mute feedback sounds">Sound '+(muted?'off':'on')+'</button>'}
export function toggleSound(button:HTMLElement){muted=!muted;try{localStorage.setItem('mepamo:sound-muted',String(muted))}catch{}if(muted)sound?.pause();button.setAttribute('aria-pressed',String(muted));button.textContent='Sound '+(muted?'off':'on')}
export function cancelFeedback(){cleanup();cleanup=()=>{};sound?.pause();sound=undefined}
export function playFeedback(root:HTMLElement,id:string,ok:boolean,restrained=false){
 cancelFeedback();if(played.has(id))return;played.add(id);
 if(!muted&&!restrained){sound=new Audio(base+(ok?'correct-chime.wav':'incorrect-tone.wav'));sound.volume=.35;void sound.play().catch(()=>{})}
 const live=root.querySelector('[data-result-announcement]');if(live)live.textContent=ok?'Correct answer.':'Incorrect answer. Review the correct answer or open Why for an explanation.';
 if(restrained||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const card=root.querySelector<HTMLElement>(ok?'.option.correct':'.option.incorrect')||root.querySelector<HTMLElement>('.multipart-result');const transient:Element[]=[];const timers:number[]=[];
 const add=(name:string,parent:Element,cls:string)=>{const img=document.createElement('img');img.src=base+name+'.svg';img.className=cls;img.alt='';img.setAttribute('aria-hidden','true');parent.append(img);transient.push(img);return img};
 const indicator=card?.querySelector('.mepamo-status');if(ok&&indicator){indicator.classList.add('is-result-pop');timers.push(window.setTimeout(()=>indicator.classList.remove('is-result-pop'),200))}if(!ok&&card?.matches('.option'))card.classList.add('is-nudging');const arrangement=root.querySelector('.word-sentence,.essential-order');if(!ok)arrangement?.classList.add('is-nudging');
 if(ok&&card){add('confetti-left',card,'mepamo-confetti mepamo-confetti--left');add('confetti-right',card,'mepamo-confetti mepamo-confetti--right');timers.push(window.setTimeout(()=>transient.forEach(e=>e.remove()),700))}
 if(!ok){root.querySelector('.option.correct')?.classList.add('is-revealing');const slot=root.querySelector('.mepamo-feedback-slot');if(slot)add('heart-break',slot,'mepamo-heart')}
 cleanup=()=>{timers.forEach(clearTimeout);transient.forEach(e=>e.remove());card?.classList.remove('is-celebrating','is-nudging');indicator?.classList.remove('is-result-pop');arrangement?.classList.remove('is-nudging');root.querySelector('.is-revealing')?.classList.remove('is-revealing')};timers.push(window.setTimeout(cleanup,750));
}
