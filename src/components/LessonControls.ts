/** Keep native button semantics, but allow both keyboard keys to show a held press. */
export function mountLessonControls(root:HTMLElement){
 const selector='.question-screen .option,.essential-activity button.essential-card,.lesson-footer .primary:is([data-action="check"],[data-action="continue"])';
 let pressed:HTMLButtonElement|null=null;
 function clear(){pressed?.classList.remove('is-key-pressed');pressed=null}
 function down(e:KeyboardEvent){if(e.key!=='Enter'&&e.key!==' ')return;const button=(e.target as Element).closest<HTMLButtonElement>(selector);if(!button||button.disabled)return;e.preventDefault();if(e.repeat)return;clear();pressed=button;button.classList.add('is-key-pressed')}
 function up(e:KeyboardEvent){if(e.key!=='Enter'&&e.key!==' ')return;const button=pressed;if(!button)return;e.preventDefault();clear();if(button.isConnected&&!button.disabled&&document.activeElement===button)button.click()}
 function click(e:MouseEvent){const button=(e.target as Element).closest<HTMLButtonElement>('.lesson-footer [data-action="check"],.lesson-footer [data-action="continue"]');if(button&&e.detail>1){e.preventDefault();e.stopImmediatePropagation()}}
 root.addEventListener('keydown',down);root.addEventListener('click',click,true);window.addEventListener('keyup',up);window.addEventListener('blur',clear);root.addEventListener('focusout',clear);
 return ()=>{clear();root.removeEventListener('keydown',down);root.removeEventListener('click',click,true);window.removeEventListener('keyup',up);window.removeEventListener('blur',clear);root.removeEventListener('focusout',clear)};
}
