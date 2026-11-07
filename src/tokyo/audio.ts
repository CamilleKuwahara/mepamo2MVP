import timings from './timings.json' with {type:'json'};
export type Clip={src:string;words:string[];cues:number[][];duration:number};
let enabled=false;
let dispose=()=>{};
export function stopNarration(){dispose();dispose=()=>{}}
export function mountNarration(root:HTMLElement,next:()=>void,resolve?:(id:string)=>Promise<Clip|undefined>){
 stopNarration();
 const story=root.querySelector<HTMLElement>('[data-clip]');if(!story)return;
 if(!resolve){const clip=(timings as unknown as Record<string,Clip>)[story.dataset.clip!];if(clip)attachNarration(root,next,clip);return}
 let alive=true;dispose=()=>{alive=false};
 const controls=Array.from(root.querySelectorAll<HTMLButtonElement|HTMLInputElement>('[data-action="tokyo-play"],[data-action="tokyo-replay"],#tokyo-seek'));
 controls.forEach(c=>c.disabled=true);
 const status=root.querySelector<HTMLElement>('[data-audio-status]')!;
 status.textContent='Loading narration...';
 const missing=()=>{if(alive)status.textContent='Narration unavailable. Read and choose Next.'};
 void resolve(story.dataset.clip!).then(clip=>{if(!alive)return;if(!clip){missing();return}controls.forEach(c=>c.disabled=false);status.textContent='Press Play to hear this section.';attachNarration(root,next,clip)},missing);
}
function attachNarration(root:HTMLElement,next:()=>void,clip:Clip){
 const story=root.querySelector<HTMLElement>('[data-clip]');if(!story)return;
 const audio=new Audio(clip.src);audio.preload='auto';audio.volume=.7;
 const play=root.querySelector<HTMLButtonElement>('[data-action="tokyo-play"]')!;
 const seek=root.querySelector<HTMLInputElement>('#tokyo-seek')!;
 const status=root.querySelector<HTMLElement>('[data-audio-status]')!;
 const words=Array.from(story.querySelectorAll<HTMLElement>('[data-word]'));
 const mascot=story.querySelector<HTMLElement>('.tokyo-scene img:nth-child(2)');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let timer:number|undefined,frame=0,alive=true,active=-1,request=0,pending=false,failed=false;
 const muted=()=>{try{return localStorage.getItem('mepamo:sound-muted')==='true'}catch{return false}};
 const cancel=()=>{clearTimeout(timer);timer=undefined};
 const format=(t:number)=>Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0');
 const update=()=>{let index=-1;if(!audio.ended)for(let i=0;i<clip.cues.length;i++){if(clip.cues[i][0]<=audio.currentTime)index=i;else break}
 if(active!==index){words[active]?.classList.remove('spoken-word');words[index]?.classList.add('spoken-word');active=index}
 const duration=Number.isFinite(audio.duration)?audio.duration:clip.duration||1;
 seek.max=String(duration);seek.value=String(audio.currentTime);
 root.querySelector('[data-audio-time]')!.textContent=format(audio.currentTime)+' / '+format(duration);
 if(mascot)mascot.style.transform=reduced.matches?'':'translate('+Math.sin(audio.currentTime*.5)*10+'px,'+(-Math.abs(Math.sin(audio.currentTime*.8))*7)+'px) rotate('+Math.sin(audio.currentTime*.4)*3+'deg)';
 };
 const label=()=>{play.textContent=audio.paused?'Play':'Pause';play.setAttribute('aria-label',audio.paused?'Play narration':'Pause narration')};
 const tick=()=>{if(!alive)return;update();if(!audio.paused)frame=requestAnimationFrame(tick)};
 const start=async()=>{cancel();const ticket=++request;pending=true;if(muted()){pending=false;status.textContent='Turn sound on to play narration.';return}enabled=true;try{if(failed){failed=false;audio.load()}await audio.play();if(!alive||ticket!==request)return;pending=false;status.textContent='Narrating. Content advances automatically when narration ends.';label();cancelAnimationFrame(frame);tick()}catch{if(alive&&ticket===request){pending=false;enabled=false;label();status.textContent='Narration could not start. Press Play to try again, or read and choose Next.'}}};
 const pause=()=>{++request;pending=false;enabled=false;cancel();audio.pause();cancelAnimationFrame(frame);label();status.textContent='Narration paused.'};
 const click=(e:MouseEvent)=>{const action=(e.target as Element).closest<HTMLElement>('[data-action]')?.dataset.action;
 if(action==='tokyo-play'){if(pending||!audio.paused||timer!==undefined)pause();else void start()}
 if(action==='tokyo-replay'){cancel();audio.currentTime=0;update();void start()}
 if(action==='sound'&&muted())pause();
 };
 const input=()=>{cancel();audio.currentTime=Number(seek.value);update()};
 const ended=()=>{cancel();update();label();if(enabled&&!muted())timer=window.setTimeout(()=>{timer=undefined;if(alive&&enabled&&!muted())next()},750)};
 const error=()=>{if(!alive)return;pause();failed=true;status.textContent='Narration could not load. Press Play to retry, or read and choose Next.'};
 const hide=()=>{if(document.hidden)pause()};
 root.addEventListener('click',click);seek.addEventListener('input',input);audio.addEventListener('error',error);audio.addEventListener('ended',ended);audio.addEventListener('loadedmetadata',update);audio.addEventListener('timeupdate',update);document.addEventListener('visibilitychange',hide);
 dispose=()=>{alive=false;cancel();cancelAnimationFrame(frame);audio.pause();audio.removeAttribute('src');audio.load();root.removeEventListener('click',click);seek.removeEventListener('input',input);document.removeEventListener('visibilitychange',hide);audio.removeEventListener('error',error);audio.removeEventListener('ended',ended);audio.removeEventListener('loadedmetadata',update);audio.removeEventListener('timeupdate',update)};
 update();if(enabled&&!muted())void start();
}
