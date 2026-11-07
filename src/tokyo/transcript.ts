const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
// Same visible token convention as Lesson One, including contractions and numerals.
export const wordPattern=/\p{L}[\p{L}\p{M}\p{N}]*(?:[\u2019'][\p{L}\p{M}\p{N}]+)*|\p{N}+(?:[.,]\p{N}+)*/gu;
export const transcriptWords=(text:string)=>text.match(wordPattern)||[];
export function transcriptMarkup(text:string){let index=0,last=0,out='';for(const match of text.matchAll(wordPattern)){out+=esc(text.slice(last,match.index))+'<span data-word="'+index+++'">'+esc(match[0])+'</span>';last=match.index+match[0].length}return out+esc(text.slice(last))}
