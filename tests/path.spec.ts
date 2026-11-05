import {test,expect} from '@playwright/test';
import {emptyState,key,content,adaptations} from '../src/model';

test('legacy zero-heart saves allow repeated mistakes and multiple lessons on one day',async({page})=>{
 await page.goto('/');const s={...emptyState(),hearts:{count:0,nextAt:Date.now()+3600000}};
 await page.evaluate(({key,s})=>localStorage.setItem(key,JSON.stringify(s)),{key,s});await page.reload();
 expect(await page.evaluate(k=>'hearts' in JSON.parse(localStorage.getItem(k)!),key)).toBe(false);
 await expect(page.locator('.heart,[data-heart-count],#heart-dialog,[data-heart-timer]')).toHaveCount(0);
 for(let l=0;l<2;l++){
  await page.locator(`[data-action="node"][data-index="${l}"]`).click();await page.getByRole('button',{name:'Start lesson'}).click();await page.locator('[data-action="read"]').click();await page.locator('[data-action="read"]').click();
  for(const q of content.lessons[l].questions){
   const ad=adaptations[q.id];if(ad){for(let i=0;i<ad.items.length;i++){await page.locator(`[data-action="item"][data-index="${i}"]`).click();await page.locator('[data-action="destination"][data-index="0"]').first().click()}}
   else await page.locator(`[data-action="answer"][data-value="${q.options.find(o=>o.id!==q.correctOptionId)!.id}"]`).click();
   await page.locator('[data-action="check"]').click();await expect(page.locator('.mepamo-why')).toHaveAttribute('aria-expanded','false');await expect(page.locator('dialog')).toHaveCount(0);await page.locator('[data-action="continue"]').click();
  }
  await page.getByRole('button',{name:'Back to path'}).click();
 }
 await expect(page.locator('.goal-row')).toContainText('1 / 1');await expect(page.locator('.streak')).toHaveText('1');const saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)!),key);expect(saved.completed).toEqual([0,1]);expect(saved.dates).toHaveLength(1);expect(saved).not.toHaveProperty('hearts');await expect(page.locator('[data-action="node"][data-index="2"]')).toBeEnabled();
});

test('node popup supports current, resume, review, keyboard close and reduced motion',async({page})=>{
 await page.goto('/');await expect(page.locator('.lesson-preview,[data-action="start"]')).toHaveCount(0);
 const current=page.locator('.node.available');const ring=current.locator('.node-highlight');await expect(ring).toHaveCSS('animation-name','node-highlight-orbit');
 const first=await ring.evaluate(e=>getComputedStyle(e).transform);await expect.poll(()=>ring.evaluate(e=>getComputedStyle(e).transform)).not.toBe(first);
 await current.focus();await page.keyboard.press('Enter');await expect(page.getByRole('dialog')).toBeVisible();await expect(page.getByRole('button',{name:'Start lesson'})).toBeFocused();await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);await expect(current).toBeFocused();
 await page.emulateMedia({reducedMotion:'reduce'});await expect(ring).toHaveCSS('animation-name','none');
 await current.click();await page.screenshot({path:'test-results/lesson-popup-desktop.png'});await page.getByRole('button',{name:'Start lesson'}).click();await page.locator('[data-action="read"]').click();await page.locator('[data-action="home"]').first().click();await current.click();await expect(page.getByRole('button',{name:'Resume lesson'})).toBeVisible();await page.getByRole('button',{name:'Resume lesson'}).click();await expect(page.locator('h1')).toHaveText(content.lessons[0].cards[1].title);
 const s=emptyState();s.completed=[0];await page.evaluate(({key,s})=>localStorage.setItem(key,JSON.stringify(s)),{key,s});await page.reload();await page.locator('.node.complete').click();await expect(page.getByRole('button',{name:'Review lesson'})).toBeVisible();await page.getByRole('button',{name:'Review lesson'}).click();await expect(page.locator('h1')).toHaveText(content.lessons[0].cards[0].title);
 await page.setViewportSize({width:390,height:700});await page.locator('[data-action="home"]').first().click();await page.locator('.node.available').click();await expect(page.getByRole('button',{name:'Start lesson'})).toBeInViewport();await page.screenshot({path:'test-results/lesson-popup-phone.png'});await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('final check alone qualifies the day; a skipped day clears only the streak',async({page})=>{
 await page.clock.install({time:new Date(2026,10,4,12)});await page.goto('/');const s=emptyState();s.completed=[0,1,2,3,4];s.dates=['2026-11-03'];s.final={id:'daily-final',lesson:0,card:2,question:9,drafts:Object.fromEntries(content.finalCheck.questions.map(q=>[q.id,q.correctOptionId])),submitted:false,done:false};
 await page.evaluate(({key,s})=>localStorage.setItem(key,JSON.stringify(s)),{key,s});await page.reload();await expect(page.locator('.goal-row')).toContainText('0 / 1');await page.locator('[data-action="node"][data-index="5"]').click();await page.getByRole('button',{name:'Resume check'}).click();await page.locator('[data-action="submit"]').click();await page.getByRole('button',{name:'Back to path'}).click();await expect(page.locator('.goal-row')).toContainText('1 / 1');await expect(page.locator('.streak')).toHaveText('2');
 await page.clock.setSystemTime(new Date(2026,10,6,12));await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await expect(page.locator('.streak')).toHaveText('0');await expect(page.locator('.goal-row')).toContainText('0 / 1');await expect(page.locator('.node.complete')).toHaveCount(6);
 await page.locator('[data-action="node"][data-index="5"]').click();await expect(page.getByRole('button',{name:'View results'})).toBeVisible();await page.getByRole('button',{name:'View results'}).click();await expect(page.locator('.score')).toHaveText('10 / 10');const saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)!),key);expect(saved.completed).toEqual([0,1,2,3,4]);expect(saved.results).toHaveLength(1);
});
