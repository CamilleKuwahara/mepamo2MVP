import {test,expect,type Page} from '@playwright/test';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {validateMedia,type MediaRecord} from '../src/discovery/narration';
import manifest from '../src/discovery/narration.json' with {type:'json'};
import {moduleSources,discoveryLessons,discoveryVersion} from '../src/discovery/content';
import {transcriptWords} from '../src/tokyo/transcript';
import {essentialLessons,emptyEssential} from '../src/essential/model';
import {emptyState,key} from '../src/model';
const hash=(text:string|Buffer)=>createHash('sha256').update(text).digest('hex');
test('all 16 media records bind exact scripts; ready assets require verified bytes and cues',async()=>{
 expect(Object.keys(manifest).sort()).toEqual(Object.keys(moduleSources).sort());
 for(const [id,record] of Object.entries(manifest) as [string,MediaRecord][]){expect(record.scriptHash,id).toBe(hash(moduleSources[id].narration));if(record.status==='ready'){expect(await validateMedia(moduleSources[id].narration,record),id).toBeTruthy();expect(hash(fs.readFileSync('public'+record.src)),id).toBe(record.audioHash)}else{expect(record.status).toBe('missing');expect(record.src).toBeUndefined();expect(record.cues).toBeUndefined()}}
});
test('alignment validation rejects stale scripts, invalid times, missing tokens and different voices',async()=>{
 const text='Kyoto, 3,776 metres.';const record:MediaRecord={status:'ready',scriptHash:hash(text),voice:'en_US-lessac-medium',src:'/lessons-2-5/audio/test.wav',audioHash:'a'.repeat(64),duration:3,timingSource:'aligned-audio',words:transcriptWords(text),cues:[[0,.5],[.6,2],[2.1,3]]};
 expect(await validateMedia(text,record)).toBeTruthy();
 for(const patch of [{scriptHash:'wrong'},{voice:'other'},{words:['Kyoto']},{cues:[[0,.5]]},{cues:[[0,.5],[.6,NaN],[2.1,3]]},{cues:[[0,.5],[-1,2],[2.1,3]]},{cues:[[0,.5],[.6,.6],[2.1,3]]},{cues:[[1,1.2],[.6,2],[2.1,3]]},{cues:[[0,.5],[.6,2],[2.1,4]]}])expect(await validateMedia(text,{...record,...patch})).toBeUndefined();
});
test('missing narration leaves every module readable and manual navigation usable',async({page})=>{
 await page.setViewportSize({width:320,height:568});
 for(const lesson of discoveryLessons)for(const intro of lesson.introductions){
 await page.goto('/?course=essential');const s=emptyState();s.essential=emptyEssential();s.essential.completed=essentialLessons.slice(0,essentialLessons.findIndex(l=>l.id===lesson.id)).map(l=>l.id);s.essential.active=lesson.id;s.essential.attempts[lesson.id]={id:'audio-test',lesson:lesson.id,step:lesson.steps.findIndex(s=>s.ref===intro.id),done:false,contentVersion:discoveryVersion,drafts:{},evaluations:{}};
 await page.evaluate(({s,key})=>localStorage.setItem(key,JSON.stringify(s)),{s,key});await page.reload();await page.locator('[data-action=essential-node][data-id="'+lesson.id+'"]').click();await page.locator('[data-action=essential-start]').click();
 await expect(page.locator('[data-audio-status]')).toHaveText('Narration unavailable. Read and choose Next.');await expect(page.getByRole('button',{name:'Play narration'})).toBeDisabled();await expect(page.locator('[data-word]')).toHaveCount(transcriptWords(moduleSources[intro.id].narration).length);await expect(page.locator('.spoken-word')).toHaveCount(0);await expect(page.locator('[data-action=essential-read]')).toBeEnabled();await page.locator('[data-action=essential-read]').click();await expect(page.locator('[data-clip="'+intro.id+'"]')).toHaveCount(0);
 }
});
// Use the existing real Tokyo recording only to exercise the shared player adapter.
// This is not a substitute recording for a discovery lesson.
async function harness(page:Page, reject=false){await page.goto('/');await page.evaluate(async(reject)=>{
 const {stopNarration,mountNarration}=await import('/src/tokyo/audio.ts');const {storyControls,storyView}=await import('/src/tokyo/view.ts');const timings=(await import('/src/tokyo/timings.json')).default;
 stopNarration();const root=document.createElement('div');document.body.replaceChildren(root);root.innerHTML=storyView('m1')+storyControls(true);(window as any).advanceCount=0;
 const Original=window.Audio;window.Audio=function(src?:string){const a=new Original(src);(window as any).testAudio=a;if(reject)a.play=()=>Promise.reject(new DOMException('Blocked','NotAllowedError'));return a} as any;
 mountNarration(root,()=>{(window as any).advanceCount++},async()=>timings['story-0']);(window as any).stopTest=stopNarration;
 },reject)}
test('shared adapter handles rejected playback and recoverable media errors',async({page})=>{
 await harness(page,true);await page.getByRole('button',{name:'Play narration'}).click();await expect(page.locator('[data-audio-status]')).toContainText('Press Play to try again');expect(await page.evaluate(()=>(window as any).advanceCount)).toBe(0);
 await page.evaluate(()=>{const a=(window as any).testAudio;delete a.play;a.dispatchEvent(new Event('error'))});await expect(page.locator('[data-audio-status]')).toContainText('Press Play to retry');await page.getByRole('button',{name:'Play narration'}).click();await expect(page.getByRole('button',{name:'Pause narration'})).toBeVisible();await page.evaluate(()=>(window as any).stopTest());
});
test('adapter highlights from real playback position; cleanup cancels an ended transition',async({page})=>{
 await harness(page);await page.getByRole('button',{name:'Play narration'}).click();await expect(page.getByRole('button',{name:'Pause narration'})).toBeVisible();await page.getByRole('button',{name:'Pause narration'}).click();await page.locator('#tokyo-seek').evaluate((el:HTMLInputElement)=>{el.value='3';el.dispatchEvent(new Event('input',{bubbles:true}))});const word=await page.locator('.spoken-word').getAttribute('data-word');await page.waitForTimeout(250);expect(await page.locator('.spoken-word').getAttribute('data-word')).toBe(word);
 await page.locator('[data-action=tokyo-replay]').click();await page.evaluate(()=>{const a=(window as any).testAudio;a.currentTime=a.duration-.1});await expect.poll(()=>page.evaluate(()=>(window as any).testAudio.ended)).toBe(true);await page.evaluate(()=>(window as any).stopTest());await page.waitForTimeout(850);expect(await page.evaluate(()=>(window as any).advanceCount)).toBe(0);
});
