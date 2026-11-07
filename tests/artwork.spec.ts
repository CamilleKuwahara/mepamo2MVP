import {test,expect} from '@playwright/test';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {emptyState,key} from '../src/model';
const suppliedMascot=fs.readFileSync('src/assets/mepamo_mascot_waving.svg','utf8');
const suppliedFujiHash='fa3b16bf7eed45e1ca8fc524d043d22eda3799ee94f3d05708d239baf6230038';

test('supplied artwork geometry, mouth, shadow, timing, and responsive wrapper sizes are preserved',async({page})=>{
 await page.goto('/');const mascot=page.locator('svg.mepamo-mascot');await expect(mascot).toBeVisible();await expect(mascot.locator('script')).toHaveCount(0);
 const geometry=await page.evaluate(source=>{
  const original=new DOMParser().parseFromString(source,'image/svg+xml').documentElement;
  const actual=document.querySelector('svg.mepamo-mascot')!;
  const paths=(root:Element)=>Array.from(root.querySelectorAll('path')).map(n=>n.getAttribute('d'));
  return {original:paths(original),actual:paths(actual),shadow:actual.querySelector('ellipse')!.getAttribute('fill'),opacity:actual.querySelector('ellipse')!.getAttribute('opacity')};
 },suppliedMascot);expect(geometry.actual.map((d,i)=>d!==geometry.original[i]?i:-1).filter(i=>i>=0)).toEqual([]);expect(geometry.shadow).toBe('#AFAFAF');expect(geometry.opacity).toBe('.3');
 await expect(mascot.locator('.wave')).toHaveCSS('animation-duration','2.4s');await expect(mascot.locator('.wave')).toHaveCSS('transform-origin','230px 209px');await expect(mascot.locator('.pupil').first()).toHaveCSS('transition-duration','0.09s');
 await expect(page.locator('.mascot')).toHaveCSS('width','180px');const slot=await page.locator('.mascot').boundingBox();expect(slot!.height).toBeCloseTo(180*56/55,1);await expect(page.locator('.fuji-sticker')).toHaveCSS('width','160px');
 const box=await mascot.boundingBox();expect(box!.width/box!.height).toBeCloseTo(400/328,2);const fuji=page.locator('img.mepamo-fuji');await fuji.evaluate((img:HTMLImageElement)=>img.decode());const fbox=await fuji.boundingBox();expect(fbox!.width/fbox!.height).toBeCloseTo(295/228,2);
 expect(createHash('sha256').update(fs.readFileSync('public/assets/mepamo/artwork/mepamo_fuji_animated.svg','utf8').replace(/\r\n/g,'\n')).digest('hex')).toBe(suppliedFujiHash);
 expect(createHash('sha256').update(suppliedMascot.replace(/\r\n/g,'\n')).digest('hex')).toBe('2e0270165500684ee59439cbb62489d1918a314985dba74ac2b0f747c4a61050');
 await page.screenshot({path:'test-results/supplied-artwork-home.png',fullPage:true});
 const s=emptyState();s.completed=[0];s.attempt={id:'completed-art',lesson:0,card:2,question:4,drafts:{},submitted:true,done:false};await page.evaluate(({key,s})=>localStorage.setItem(key,JSON.stringify(s)),{key,s});await page.reload();await page.locator('.node.complete').click();await page.locator('[data-action="start"]').click();await page.locator('[data-action="continue"]').click();await expect(page.locator('.mascot.small')).toHaveCSS('width','120px');await expect(page.locator('.mascot.small svg.mepamo-mascot')).toBeVisible();await page.screenshot({path:'test-results/supplied-artwork-completion.png',fullPage:true});
});

test('both pupils track page-wide coordinates using the supplied formula at multiple scales',async({page})=>{
 await page.goto('/');
 for(const width of [180,120,260]){
  await page.locator('.mascot').evaluate((host:HTMLElement,w)=>{host.style.width=`${w}px`;host.style.transform='scale(.8)'},width);
  for(const pointer of [{x:5,y:5},{x:1430,y:950}]){
   await page.mouse.move(pointer.x,pointer.y);
   await expect.poll(()=>page.evaluate(({x,y})=>{
    const svg=document.querySelector<SVGSVGElement>('.mepamo-mascot')!;const pt=svg.createSVGPoint();pt.x=x;pt.y=y;const local=pt.matrixTransform(svg.getScreenCTM()!.inverse());
    return Array.from(svg.querySelectorAll<SVGElement>('.pupil')).map(eye=>{const dx=local.x-Number(eye.getAttribute('cx')),dy=local.y-Number(eye.getAttribute('cy')),distance=Math.hypot(dx,dy,100);const values=eye.style.transform.match(/-?[\d.]+/g)?.map(Number)||[999,999];return Math.max(Math.abs(values[0]-9*dx/distance),Math.abs(values[1]-7*dy/distance))});
   },pointer).then(errors=>Math.max(...errors))).toBeLessThan(0.0001);
   const offsets=await page.locator('.pupil').evaluateAll(eyes=>eyes.map(e=>(e as SVGElement).style.transform.match(/-?[\d.]+/g)!.map(Number)));for(const [x,y] of offsets){expect(Math.abs(x)).toBeLessThanOrEqual(9);expect(Math.abs(y)).toBeLessThanOrEqual(7)}
  }
 }
});

test('pupils reset on exit, blur and hidden state; touch movement is ignored',async({page})=>{
 await page.goto('/');
 for(const reason of ['leave','blur','hidden']){
  await page.mouse.move(0,0);await expect.poll(()=>page.locator('.pupil').first().getAttribute('style')).toContain('translate(');
  await page.evaluate(reason=>{if(reason==='leave')document.documentElement.dispatchEvent(new PointerEvent('pointerleave'));if(reason==='blur')window.dispatchEvent(new Event('blur'));if(reason==='hidden'){Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'));delete (document as any).hidden}},reason);
  await expect.poll(()=>page.locator('.pupil').evaluateAll(eyes=>eyes.map(e=>(e as SVGElement).style.transform))).toEqual(['translate(0px, 0px)','translate(0px, 0px)']);
 }
 await page.evaluate(()=>document.dispatchEvent(new PointerEvent('pointermove',{pointerType:'touch',clientX:1000,clientY:500})));
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 expect(await page.locator('.pupil').evaluateAll(eyes=>eyes.map(e=>(e as SVGElement).style.transform))).toEqual(['translate(0px, 0px)','translate(0px, 0px)']);
});

test('multiple mascot instances have isolated IDs and cleanup cancels pending work and listeners',async({page})=>{
 await page.goto('/');
 const result=await page.evaluate(async()=>{
  const {MepamoMascot}=await import('/src/components/MepamoMascot.ts');
  const a=new MepamoMascot({label:'First mascot'}),b=new MepamoMascot({decorative:true});document.body.append(a.element,b.element);
  const ids=Array.from(document.querySelectorAll('.mepamo-mascot [id]')).map(n=>n.id);
  const gradients=[a,b].every(c=>Array.from(c.element.querySelectorAll('[fill^="url"]')).every(n=>c.element.contains(document.getElementById(n.getAttribute('fill')!.slice(5,-1)))));
  const decorative=b.element.getAttribute('aria-hidden');
  document.dispatchEvent(new PointerEvent('pointermove',{pointerType:'mouse',clientX:1000,clientY:10}));
  a.destroy();b.destroy();a.destroy();
  await new Promise(resolve=>requestAnimationFrame(resolve));
  document.dispatchEvent(new PointerEvent('pointermove',{pointerType:'mouse',clientX:15,clientY:800}));await new Promise(resolve=>requestAnimationFrame(resolve));
  const positions=[a,b].flatMap(c=>Array.from(c.element.querySelectorAll('.pupil')).map((n:any)=>n.style.transform));
  const probe=document.createElement('div');probe.className='wave';document.body.append(probe);const leaked=getComputedStyle(probe).animationName;probe.remove();a.element.remove();b.element.remove();
  return {unique:ids.length===new Set(ids).size,gradients,decorative,positions,leaked};
 });
 expect(result).toEqual({unique:true,gradients:true,decorative:'true',positions:Array(4).fill('translate(0px, 0px)'),leaked:'none'});
});

test('wave pauses and reduced-motion stops mascot animation and pupil easing',async({page})=>{
 await page.goto('/');
 const wave=page.locator('.mepamo-mascot .wave');
 const transforms=await wave.evaluate(el=>{const animation=el.getAnimations()[0];animation.pause();animation.currentTime=0;const start=getComputedStyle(el).transform;animation.currentTime=288;const wave=getComputedStyle(el).transform;animation.currentTime=1800;const pause1=getComputedStyle(el).transform;animation.currentTime=2200;const pause2=getComputedStyle(el).transform;return {start,wave,pause1,pause2}});
 expect(transforms.wave).not.toBe(transforms.start);expect(transforms.pause1).toBe(transforms.pause2);
 await page.emulateMedia({reducedMotion:'reduce'});await expect(wave).toHaveCSS('animation-name','none');await expect(page.locator('.wave-marks')).toHaveCSS('animation-name','none');await expect(page.locator('.pupil').first()).toHaveCSS('transition-duration','0s');
});

test('Fuji sun moves up seven SVG units and returns while the mountain is stationary',async({page})=>{
 await page.goto('/assets/mepamo/artwork/mepamo_fuji_animated.svg');
 const positions=await page.evaluate(()=>{const sun=document.querySelector('.sun')!,mountain=document.querySelector('svg>use')!;const animation=sun.getAnimations()[0];const timing=getComputedStyle(sun).animationDuration;animation.pause();animation.currentTime=0;const start=getComputedStyle(sun).transform;const mountainStart=mountain.getBoundingClientRect().toJSON();animation.currentTime=1800;const peak=getComputedStyle(sun).transform;const mountainPeak=mountain.getBoundingClientRect().toJSON();animation.currentTime=3600;return {timing,start,peak,end:getComputedStyle(sun).transform,mountainStart,mountainPeak}});
 expect(positions.timing).toBe('3.6s');expect(new DOMMatrixStub(positions.peak).y).toBe(-7);expect(positions.start).toBe(positions.end);expect(positions.mountainStart).toEqual(positions.mountainPeak);
 await page.emulateMedia({reducedMotion:'reduce'});await expect(page.locator('.sun')).toHaveCSS('animation-name','none');
});
class DOMMatrixStub{y:number;constructor(value:string){this.y=Number(value.match(/matrix\((.*)\)/)![1].split(',')[5])}}
