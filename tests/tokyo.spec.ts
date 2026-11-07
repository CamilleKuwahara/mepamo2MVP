import {test,expect,type Page} from '@playwright/test';
import {tokyo,tokyoVersion,migrateTokyoSave} from '../src/tokyo/lesson';
import timings from '../src/tokyo/timings.json' with {type:'json'};
import {emptyState,key,validState} from '../src/model';
import {essentialLessons,emptyEssential} from '../src/essential/model';
const lesson=essentialLessons[0];
async function launch(page:Page,ref='m1'){
 await page.goto('/?course=essential');const s=emptyState();s.essential=emptyEssential();s.essential.active=lesson.id;s.essential.attempts[lesson.id]={id:'tokyo-test',lesson:lesson.id,step:lesson.steps.findIndex(x=>x.ref===ref),done:false,drafts:{},evaluations:{},contentVersion:tokyoVersion};
 await page.evaluate(({s,key})=>localStorage.setItem(key,JSON.stringify(s)),{s,key});await page.reload();await resume(page);
}
async function resume(page:Page){await page.locator('[data-action=essential-node][data-id="essential-1-1"]').click();await page.locator('[data-action=essential-start]').click()}
async function saved(page:Page){return page.evaluate(key=>JSON.parse(localStorage.getItem(key)!),key)}
test('cue words match every transcript and old Tokyo progress is archived',()=>{
 for(const m of tokyo.modules){const t=timings[m.audioClipId as keyof typeof timings];expect(t.text).toBe(m.body);expect(m.body.match(/\p{L}[\p{L}\p{M}\p{N}]*(?:[\u2019'][\p{L}\p{M}\p{N}]+)*|\p{N}+(?:[.,]\p{N}+)*/gu)).toEqual(t.words);expect(t.words.length).toBe(t.cues.length)}
 const s=emptyState();s.completed=[0];s.essential=emptyEssential();s.essential.completed=[lesson.id];s.essential.active=lesson.id;s.essential.attempts[lesson.id]={id:'old',lesson:lesson.id,step:4,done:true,drafts:{},evaluations:{}};migrateTokyoSave(s);expect(s.essential.completed).toEqual([lesson.id]);expect(s.completed).toEqual([0]);expect((s.essential as any).legacyTokyoAttempts[0].id).toBe('old');expect(s.essential.attempts[lesson.id]).toBeUndefined();
 // Migration clears a dangling active pointer so the rest of the save remains valid.
 expect(validState(s)).toBe(true);
});
test('wrong answer is preserved, feedback persists, back and resume never regrade',async({page})=>{
 await launch(page,'q1-edo');await expect(page.locator('[data-action=check]')).toBeDisabled();await page.locator('[data-action=essential-tile][data-id=kyoto]').click();await expect(page.locator('.correct')).toHaveCount(0);await page.locator('[data-action=check]').dblclick({delay:60});await expect(page.locator('.tokyo-feedback')).toContainText('A little clarification.');await expect(page.locator('.blank-slot')).toHaveText('Edo');await page.waitForTimeout(1000);await expect(page.locator('[data-question-id]')).toHaveAttribute('data-question-id','q1-edo');await page.reload();await resume(page);await expect(page.locator('.tokyo-feedback')).toContainText('A little clarification.');await page.locator('[data-action=tokyo-back]').click();await page.locator('[data-action=essential-read]').click();await expect(page.locator('[data-action=continue]')).toBeVisible();const s=await saved(page);expect(s.essential.attempts[lesson.id].drafts['q1-edo'].slots).toEqual(['kyoto']);expect(s.essential.attempts[lesson.id].evaluations['q1-edo']).toBe(false);expect(s.events.filter((e:any)=>e.type==='activity_submission')).toHaveLength(1);expect(validState(s)).toBe(true);
});
test('timeline uses empty slots, keyboard placement, return and locked correction',async({page})=>{
 await launch(page,'q5-timeline');await expect(page.locator('[data-action=check]')).toBeDisabled();await page.locator('[data-action=tokyo-place][data-id=skytree-opens]').focus();await page.keyboard.press('Enter');await page.locator('[data-action=tokyo-place][data-id=edo-renamed]').click();await page.locator('[data-action=tokyo-return][data-id=skytree-opens]').click();await expect(page.locator('.tokyo-slot').first()).toContainText('Edo is renamed Tokyo');await page.locator('[data-action=tokyo-place][data-id=skytree-opens]').click();await page.locator('[data-action=tokyo-place][data-id=tower-completed]').click();await page.locator('[data-action=check]').click();await expect(page.locator('.tokyo-feedback')).toContainText('1868');expect((await saved(page)).essential.attempts[lesson.id].drafts['q5-timeline'].order).toEqual(['edo-renamed','skytree-opens','tower-completed']);await expect(page.locator('.tokyo-slot').nth(1)).toContainText('Tokyo Tower is completed');await expect(page.locator('[data-action=tokyo-return]:enabled')).toHaveCount(0);
});
test('real narration loads, highlights, pauses, replays, auto-advances and stops in practice',async({page})=>{
 await page.addInitScript(()=>{const Original=window.Audio;(window as any).__audios=[];window.Audio=function(src?:string){const a=new Original(src);(window as any).__audios.push(a);return a} as any});
 await launch(page);await page.getByRole('button',{name:'Play narration'}).click();await expect(page.getByRole('button',{name:'Pause narration'})).toBeVisible();await expect.poll(()=>page.locator('.spoken-word').count()).toBe(1);await page.getByRole('button',{name:'Pause narration'}).click();const t=await page.evaluate(()=>(window as any).__audios.at(-1).currentTime);await page.waitForTimeout(200);expect(await page.evaluate(()=>(window as any).__audios.at(-1).currentTime)).toBeCloseTo(t,1);await page.locator('[data-action=tokyo-replay]').click();await page.evaluate(()=>{const a=(window as any).__audios.at(-1);a.currentTime=a.duration-.15});await expect(page.locator('[data-question-id]')).toHaveAttribute('data-question-id','q1-edo',{timeout:5000});expect(await page.evaluate(()=>(window as any).__audios.every((a:HTMLAudioElement)=>a.paused))).toBe(true);await page.waitForTimeout(1000);await expect(page.locator('[data-question-id]')).toHaveAttribute('data-question-id','q1-edo');
});
test('narration cancellation and mute prevent stale transitions',async({page})=>{
 await page.addInitScript(()=>{const Original=window.Audio;(window as any).__audios=[];window.Audio=function(src?:string){const a=new Original(src);(window as any).__audios.push(a);return a} as any});await launch(page);await page.getByRole('button',{name:'Play narration'}).click();await page.evaluate(()=>{const a=(window as any).__audios.at(-1);a.pause();a.dispatchEvent(new Event('ended'))});await page.getByRole('button',{name:'Play narration'}).click();await page.waitForTimeout(900);await expect(page.locator('[data-clip]')).toHaveAttribute('data-clip','story-0');await page.locator('[data-action=sound]').click();await page.getByRole('button',{name:'Play narration'}).click();await expect(page.locator('[data-audio-status]')).toContainText('Turn sound on');await page.locator('[data-action=essential-read]').click();await page.waitForTimeout(900);await expect(page.locator('[data-question-id]')).toHaveAttribute('data-question-id','q1-edo');
});
for(const correct of [true,false])for(const [width,height] of [[320,568],[390,667],[1216,706],[844,390],[1440,1000]])test('all Tokyo screens fit and load artwork at '+width+' correct='+correct,async({page})=>{
 await page.setViewportSize({width,height});await launch(page);for(const step of lesson.steps){

 if(step.ref==='q1-edo')await expect(page.locator('.blank-slot')).toHaveText('');
 const images=page.locator('.tokyo-story img,.tokyo-practice img');for(const img of await images.all())await expect.poll(()=>img.evaluate((i:HTMLImageElement)=>i.complete&&i.naturalWidth>0)).toBe(true);
 await checkFit(page,step.ref);
 if(step.ref==='q1-edo'||step.ref==='m4'||step.ref==='q3-tokyo-tower'||step.ref==='q5-timeline')await page.screenshot({path:'screenshots/tokyo-'+step.ref+'-'+width+'.png',fullPage:true});
 if(step.kind==='introduction')await page.locator('[data-action=essential-read]').click();else if(step.kind==='question'){
 const q=lesson.questions.find(q=>q.id===step.ref)!;if(q.type==='word_bank')await page.locator('[data-action=essential-tile][data-id='+ (correct?'edo':'kyoto')+']').click();else if(q.type==='multiple_choice')await page.locator('[data-action=essential-choice][data-id="'+(correct?q.correct_option_id:q.options.find(o=>o.id!==q.correct_option_id)!.id)+'"]').click();else if(q.type==='ordering')for(const id of (correct?q.correct_order:[...q.correct_order].reverse()))await page.locator('[data-action=tokyo-place][data-id="'+id+'"]').click();await page.locator('[data-action=check]').click();await checkFit(page,step.ref+' feedback');await page.locator('[data-action=continue]').click();
 }}await expect(page.locator('h1')).toHaveText('Lesson complete');expect(validState(await saved(page))).toBe(true);
});

async function checkFit(page:Page,screen:string){
 await page.evaluate(()=>document.fonts.ready);
 const bounds=await page.evaluate(()=>{const body=document.querySelector<HTMLElement>('.lesson-body')!,footer=document.querySelector('.lesson-footer')!.getBoundingClientRect();return {pageWidth:document.documentElement.scrollWidth,pageHeight:document.documentElement.scrollHeight,width:innerWidth,height:innerHeight,bodyOverflow:getComputedStyle(body).overflowY,bodyBottom:body.getBoundingClientRect().bottom,footerTop:footer.top,footerBottom:footer.bottom}});
 if(bounds.pageHeight>bounds.height+1||bounds.bodyBottom>bounds.footerTop+1)await page.screenshot({path:'test-results/fit-'+bounds.width+'-'+screen.replaceAll(' ','-')+'.png'});
 expect(bounds.pageWidth,screen).toBeLessThanOrEqual(bounds.width);expect(bounds.pageHeight,screen).toBeLessThanOrEqual(bounds.height+1);expect(bounds.bodyOverflow,screen).toBe('visible');expect(bounds.bodyBottom,screen).toBeLessThanOrEqual(bounds.footerTop+1);expect(bounds.footerBottom,screen).toBeLessThanOrEqual(bounds.height);
}
