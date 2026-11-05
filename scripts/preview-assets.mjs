import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {chromium} from '@playwright/test';
import {createCanvas,loadImage} from '@napi-rs/canvas';
const server=await createServer({server:{host:'127.0.0.1',port:5174,strictPort:true}});await server.listen();
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1600,height:1000}});
 await page.goto('http://127.0.0.1:5174/assets/mepamo/index.html');await page.evaluate(()=>document.fonts.ready);await page.locator('img').evaluateAll(async imgs=>Promise.all(imgs.map(i=>i.decode())));
 assert.equal(await page.locator('img').evaluateAll(imgs=>imgs.filter(i=>!i.naturalWidth).length),0);
 await page.screenshot({path:'public/assets/mepamo/ASSET_REFERENCE.png',fullPage:true});
 await page.goto('http://127.0.0.1:5174/');const node=page.locator('.node.available').first();const initial=await node.boundingBox();assert.equal(initial.width,96);assert.equal(initial.height,104);
 await node.hover();assert.deepEqual(await node.boundingBox(),initial);assert.equal(await node.locator('.node-hover').evaluate(e=>getComputedStyle(e).opacity),'1');
 await page.mouse.down();assert.equal(await node.locator('.node-pressed').evaluate(e=>getComputedStyle(e).opacity),'1');assert.deepEqual(await node.boundingBox(),initial);await page.mouse.up();
 await page.getByRole('button',{name:'Close lesson details'}).click();
 await page.keyboard.press('Tab');await node.focus();assert.equal(await node.evaluate(e=>getComputedStyle(e).outlineStyle),'solid');await page.screenshot({path:'test-results/node-focus.png',fullPage:true});
 for(const f of ['mepamo-mascot','fuji-sticker']){const img=await loadImage(`public/assets/mepamo/artwork/${f}.png`);const canvas=createCanvas(img.width,img.height);const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);assert.equal(ctx.getImageData(0,0,1,1).data[3],0);}
 console.log('Asset board rendered. All 49 images loaded. Node hover/pressed hitbox, keyboard focus, and artwork transparency verified.');
}finally{await browser.close();await server.close();}
