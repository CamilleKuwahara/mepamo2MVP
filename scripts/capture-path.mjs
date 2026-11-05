import fs from 'node:fs';
import {chromium} from '@playwright/test';
fs.mkdirSync('screenshots',{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 await page.goto('http://127.0.0.1:5173/');await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:'screenshots/unlimited-path.png',fullPage:true});
 await page.locator('.node.available').click();await page.screenshot({path:'screenshots/lesson-popup.png',fullPage:true});
 await page.getByRole('button',{name:'Close lesson details'}).click();await page.setViewportSize({width:390,height:844});await page.locator('.node.available').click();await page.screenshot({path:'screenshots/lesson-popup-mobile.png',fullPage:true});
}finally{await browser.close()}
let helper=fs.readFileSync('scripts/preview-assets.mjs','utf8');helper=helper.replace('await page.mouse.up();','await page.mouse.up();\n await page.getByRole(\'button\',{name:\'Close lesson details\'}).click();');fs.writeFileSync('scripts/preview-assets.mjs',helper);
console.log('Desktop and mobile popup screenshots saved.');
