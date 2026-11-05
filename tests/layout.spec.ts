import {test,expect} from '@playwright/test';
import {emptyState,key,content} from '../src/model';
test('all single-choice prompts, choices and Check fit common laptop and phone viewports',async({page})=>{
 test.setTimeout(120000);
 for(const size of [{width:1280,height:540},{width:1440,height:800},{width:390,height:844}]){
  await page.setViewportSize(size);await page.goto('/');
  for(let l=0;l<5;l++)for(let q=0;q<5;q++){
   if(['JC-L01-Q2','JC-L03-Q3'].includes(content.lessons[l].questions[q].id))continue;
   const s=emptyState();s.completed=Array.from({length:l},(_,i)=>i);s.attempt={id:'layout',lesson:l,card:2,question:q,drafts:{},submitted:false,done:false};await page.evaluate(({key,s})=>localStorage.setItem(key,JSON.stringify(s)),{key,s});await page.reload();await startFromPopup(page);
   const layout=await page.evaluate(()=>{const body=document.querySelector('.lesson-body')!;const check=document.querySelector('[data-action="check"]')!.getBoundingClientRect();return {answerBottom:document.querySelector('.option:last-child')!.getBoundingClientRect().bottom,bodyBottom:body.getBoundingClientRect().bottom,checkBottom:check.bottom,height:innerHeight,pageOverflow:document.documentElement.scrollHeight-innerHeight}});
   expect(layout.answerBottom,`${size.width}x${size.height} ${content.lessons[l].questions[q].id}`).toBeLessThanOrEqual(layout.bodyBottom);expect(layout.checkBottom).toBeLessThanOrEqual(layout.height);expect(layout.pageOverflow).toBeLessThanOrEqual(1);
   if(l===0&&q===2)await page.screenshot({path:`test-results/question-fit-${size.width}.png`});
  }
 }
});

async function startFromPopup(page:import('@playwright/test').Page){if(!await page.locator('#lesson-dialog').isVisible())await page.locator('.node.available').first().click();await page.locator('[data-action="start"]').click();}
