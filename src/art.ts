const base='/assets/mepamo';
export function icon(name:string){const file=({cup:'trophy',arrow:'arrow-right'} as Record<string,string>)[name]||name;return `<img class="ui-icon" src="${base}/icons/${file}.svg" alt="" aria-hidden="true" width="24" height="24">`;}
export function nodeArt(state:string){return `${state==='current'||state==='final-available'?'<span class="node-highlight" aria-hidden="true"></span>':''}<img class="node-default" src="${base}/nodes/node-${state}.svg" alt="" aria-hidden="true" width="96" height="104">${state==='current'?`<img class="node-hover" src="${base}/nodes/node-current-hover.svg" alt="" aria-hidden="true" width="96" height="104"><img class="node-pressed" src="${base}/nodes/node-current-pressed.svg" alt="" aria-hidden="true" width="96" height="104">`:''}`;}
export const fuji=`<span data-mepamo-fuji></span>`;
export const mascot=`<span data-mepamo-mascot></span>`;
