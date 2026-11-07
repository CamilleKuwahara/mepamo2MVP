import {test,expect} from '@playwright/test';
import content from '../src/content.json' with { type: 'json' };
import {createHash} from 'node:crypto';
const validation={"lessonQuestionOrders":{"JC-L01":["JC-L01-Q1","JC-L01-Q2","JC-L01-Q3","JC-L01-Q5","JC-L01-Q4"],"JC-L02":["JC-L02-Q1","JC-L02-Q2","JC-L02-Q3","JC-L02-Q4","JC-L02-Q5"],"JC-L03":["JC-L03-Q1","JC-L03-Q2","JC-L03-Q3","JC-L03-Q4","JC-L03-Q5"],"JC-L04":["JC-L04-Q1","JC-L04-Q2","JC-L04-Q5","JC-L04-Q3","JC-L04-Q4"],"JC-L05":["JC-L05-Q1","JC-L05-Q2","JC-L05-Q3","JC-L05-Q4","JC-L05-Q5"]},"finalQuestionOrder":["JC-F01","JC-F03","JC-F05","JC-F02","JC-F07","JC-F06","JC-F04","JC-F08","JC-F09","JC-F10"]};
import {adaptations,key,streak,localDate,validState,emptyState} from '../src/model';

test('content preserves original data, order, sources and two bounded adaptations',()=>{
 expect(createHash('sha256').update(JSON.stringify(content)).digest('hex')).toBe('7d5c005e6398ed9ead6877b343e2c2b83338b8fa89c50acf86676530818e14ed');expect(content.lessons).toHaveLength(5);expect(Object.keys(adaptations)).toEqual(['JC-L01-Q2','JC-L03-Q3']);
 const ids=new Set<string>();const sources=new Set(content.sources.map(s=>s.id));
 for(const l of content.lessons){expect(l.cards).toHaveLength(2);expect(l.questions).toHaveLength(5);expect(l.questions.map(q=>q.id)).toEqual(validation.lessonQuestionOrders[l.id]);for(const q of l.questions){expect(ids.has(q.id)).toBe(false);ids.add(q.id);expect(q.options).toHaveLength(4);expect(q.options.some(o=>o.id===q.correctOptionId)).toBe(true);for(const s of q.sourceIds)expect(sources.has(s)).toBe(true)}}
 expect(content.finalCheck.questions.map(q=>q.id)).toEqual(validation.finalQuestionOrder);
 for(const o of content.learningObjectives)expect(content.finalCheck.questions.filter(q=>q.objectiveId===o.id)).toHaveLength(2);
});
test('streak handles local dates, yesterday, skipped days and month transitions',()=>{
 expect(streak(['2026-10-31','2026-11-01'],new Date(2026,10,2,0,1))).toBe(2);
 expect(streak(['2026-10-31','2026-11-01'],new Date(2026,10,3))).toBe(0);
 expect(streak(['2026-11-01','2026-11-02','2026-11-02'],new Date(2026,10,2))).toBe(2);
 expect(localDate(new Date(2026,0,2,23,59))).toBe('2026-01-02');expect(validState(emptyState())).toBe(true);
 expect(validState({...emptyState(),completed:[2]})).toBe(false);
});
test('complete learning journey, editable multipart, reload, final feedback and practice preservation',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
 await expect(page.locator('.node')).toHaveCount(6);await expect(page.locator('.node:disabled')).toHaveCount(5);await expect(page.locator('.streak')).toHaveText('0');
 await page.screenshot({path:'test-results/home-1440.png',fullPage:true});
 for(let l=0;l<5;l++){
  await page.locator(`[data-action="node"][data-index="${l}"]`).click();await startFromPopup(page);
  await expect(page.locator('h1')).toHaveText(content.lessons[l].cards[0].title);
  await page.locator('[data-action="read"]').click();await expect(page.locator('h1')).toHaveText(content.lessons[l].cards[1].title);await page.locator('[data-action="read"]').click();
  for(let n=0;n<5;n++){
   const q=content.lessons[l].questions[n],ad=adaptations[q.id];
   await expect(page.locator('[data-action="check"]')).toBeDisabled();
   if(ad){
    for(let i=0;i<ad.items.length;i++){await page.locator(`[data-action="item"][data-index="${i}"]`).click();await page.locator(`[data-action="destination"][data-index="${ad.answers[i]}"]`).first().click()}
    // Move an assigned item, then correct it. Matching evicts the prior pair.
    await page.locator('[data-action="item"][data-index="0"]').click();await page.locator('[data-action="destination"][data-index="0"]').first().click();
    if(ad.kind==='matching'){await expect(page.locator('[data-action="check"]')).toBeDisabled();await page.locator('[data-action="item"][data-index="1"]').click();await page.locator('[data-action="destination"][data-index="0"]').click()}
    await page.locator('[data-action="item"][data-index="0"]').click();await page.locator(`[data-action="destination"][data-index="${ad.answers[0]}"]`).first().click();
    await page.screenshot({path:`test-results/${ad.kind}.png`,fullPage:true});
   }else await page.locator(`[data-action="answer"][data-value="${l===0&&n===0?'a':q.correctOptionId}"]`).click();
   await page.locator('[data-action="check"]').click();await expect(page.locator('.mepamo-why')).toBeVisible();
   if(l===0&&n===0){await expect(page.locator('.mepamo-why')).toHaveAttribute('aria-expanded','false');await page.reload();await startFromPopup(page);await expect(page.locator('.mepamo-why')).toBeVisible();await expect(page.locator('[data-action="answer"]:enabled')).toHaveCount(0);await page.screenshot({path:'test-results/feedback.png',fullPage:true})}
   await page.locator('[data-action="continue"]').click();
  }
  await expect(page.locator('.completion')).toBeVisible();await page.getByRole('button',{name:'Back to path'}).click();
 }
 await expect(page.locator('.node.complete')).toHaveCount(5);await expect(page.locator('.streak')).toHaveText('1');await expect(page.locator('.goal-row')).toContainText('1 / 1');
 await startFromPopup(page);await page.locator('[data-action="read"]').click();
 for(let n=0;n<10;n++){const q=content.finalCheck.questions[n];const ans=q.objectiveId==='O1'?q.options.find(o=>o.id!==q.correctOptionId)!.id:q.correctOptionId;await page.locator(`[data-action="answer"][data-value="${ans}"]`).click();await expect(page.locator('.mepamo-why')).toHaveCount(0);
  if(n===3){await page.reload();await page.locator('[data-action="node"][data-index="5"]').click();await startFromPopup(page);await expect(page.locator(`[data-value="${ans}"]`)).toHaveAttribute('aria-pressed','true')}
  if(n<9)await page.locator('[data-action="next"]').click();
 }
 await page.locator('[data-action="submit"]').click();await expect(page.locator('.score')).toHaveText('8 / 10');await expect(page.locator('.result-summary')).toContainText('Review recommended');
 await page.screenshot({path:'test-results/results.png',fullPage:true});
 const first=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)!).results[0],key);
 await page.getByRole('button',{name:'Practice this check'}).click();await page.locator('[data-action="read"]').click();
 for(let n=0;n<10;n++){await page.locator(`[data-action="answer"][data-value="${content.finalCheck.questions[n].correctOptionId}"]`).click();if(n<9)await page.locator('[data-action="next"]').click()}
 await page.locator('[data-action="submit"]').click();await expect(page.locator('.score')).toHaveText('10 / 10');
 const saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)!),key);expect(saved.results[0]).toEqual(first);expect(saved.results).toHaveLength(2);expect(saved.dates).toHaveLength(1);expect(new Set(saved.events.map(e=>e.id)).size).toBe(saved.events.length);expect(errors).toEqual([]);
});
test('responsive layout, keyboard selection and draft persistence',async({page})=>{
 for(const width of [768,390]){await page.setViewportSize({width,height:900});await page.goto('/');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:`test-results/home-${width}.png`,fullPage:true})}
 await startFromPopup(page);await page.locator('[data-action="read"]').click();await page.locator('[data-action="read"]').click();const answer=page.locator('[data-action="answer"]').first();await answer.focus();await page.keyboard.press('Enter');await expect(page.locator('[data-action="check"]')).toBeEnabled();await page.reload();await startFromPopup(page);await expect(page.locator('[data-action="answer"]').first()).toHaveAttribute('aria-pressed','true');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:'test-results/lesson-390.png',fullPage:true});
});
test('storage failure and corrupt state remain visible and do not crash',async({page})=>{
 await page.addInitScript(()=>{Storage.prototype.setItem=()=>{throw new Error('quota')}});await page.goto('/');await startFromPopup(page);await expect(page.locator('.warning')).toContainText('may not save');await expect(page.locator('h1')).toHaveText(content.lessons[0].cards[0].title);
});
test('corrupt data is preserved until explicit reset',async({page})=>{
 await page.goto('/');await page.evaluate(k=>localStorage.setItem(k,'broken'),key);await page.reload();await expect(page.locator('.warning')).toContainText('previous data is preserved');await startFromPopup(page);expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBe('broken');page.on('dialog',d=>d.dismiss());await page.locator('[data-action="reset"]').click();expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBe('broken');
});


test('wrong sorting proceeds, review never relocks, and incomplete final cannot submit',async({page})=>{
 await page.goto('/');const s=emptyState();s.completed=[0,1,2,3,4];s.attempt={id:'review-test',lesson:0,card:2,question:1,drafts:{},submitted:false,done:false};await page.evaluate(({key,s})=>localStorage.setItem(key,JSON.stringify(s)),{key,s});await page.reload();await page.locator('[data-action="node"][data-index="0"]').click();await startFromPopup(page);
 for(let i=0;i<4;i++){await page.locator(`[data-action="item"][data-index="${i}"]`).focus();await page.keyboard.press('Enter');await page.locator('[data-action="destination"][data-index="0"]').first().focus();await page.keyboard.press('Enter')}
 await page.locator('[data-action="check"]').click();await expect(page.locator('.mepamo-why')).toHaveAttribute('aria-expanded','false');await page.locator('.mepamo-why').click();await expect(page.locator('#answer-explanation')).toContainText('Plant diversity → Natural value');await page.locator('[data-action="continue"]').click();await expect(page.locator('h1')).toHaveText(content.lessons[0].questions[2].prompt);await page.locator('[data-action="home"]').first().click();await expect(page.locator('.node.complete')).toHaveCount(5);
 await page.locator('[data-action="node"][data-index="5"]').click();await startFromPopup(page);await page.locator('[data-action="read"]').click();await page.locator('[data-action="jump"][data-index="9"]').click();await expect(page.locator('[data-action="submit"]')).toBeDisabled();await expect(page.locator('.mepamo-why')).toHaveCount(0);
});
test('daily state recomputes across midnight and focus',async({page})=>{
 await page.clock.install({time:new Date(2026,10,3,23,59,50)});await page.goto('/');const s=emptyState();s.dates=['2026-11-03'];await page.evaluate(({key,s})=>localStorage.setItem(key,JSON.stringify(s)),{key,s});await page.reload();await expect(page.locator('.goal-row')).toContainText('1 / 1');await page.clock.fastForward(31000);await expect(page.locator('.goal-row')).toContainText('0 / 1');await expect(page.locator('.streak')).toHaveText('1');await page.clock.setSystemTime(new Date(2026,10,5,12));await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await expect(page.locator('.streak')).toHaveText('0');
});

test('switching to review preserves the unfinished next lesson draft',async({page})=>{
 await page.goto('/');const s=emptyState();s.completed=[0];s.attempt={id:'lesson2',lesson:1,card:2,question:0,drafts:{[content.lessons[1].questions[0].id]:'a'},submitted:false,done:false};await page.evaluate(({key,s})=>localStorage.setItem(key,JSON.stringify(s)),{key,s});await page.reload();await page.locator('[data-action="node"][data-index="0"]').click();await startFromPopup(page);await page.locator('[data-action="home"]').first().click();await page.locator('[data-action="node"][data-index="1"]').click();await startFromPopup(page);await expect(page.locator('h1')).toHaveText(content.lessons[1].questions[0].prompt);await expect(page.locator('[data-action="answer"][data-value="a"]')).toHaveAttribute('aria-pressed','true');
});

async function startFromPopup(page:import('@playwright/test').Page){if(!await page.locator('#lesson-dialog').isVisible())await page.locator('.node.available').first().click();await page.locator('[data-action="start"]').click();}
