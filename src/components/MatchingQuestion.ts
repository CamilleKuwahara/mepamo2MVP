const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export type MatchCard={id:string;text:string;media?:string};
export const pairColors=['sky','violet','orange','coral'] as const;
export function pairColor(ids:string[],id:string){return pairColors[[...ids].sort().indexOf(id)%pairColors.length]}
/** Pair identity depends only on stable left IDs, never display order or the key. */
export function assignMatch(assignments:Record<string,string>,left:string,right:string){for(const [id,value] of Object.entries(assignments))if(value===right)delete assignments[id];assignments[left]=right}
export function renderMatching(options:{left:MatchCard[];right:MatchCard[];leftOrder:string[];rightOrder:string[];assignments:Record<string,string>;selected?:string;locked:boolean;variant:'discovery'|'essential';result?:(left:string)=>string}){
 const {left,right,assignments,selected,locked,variant}=options;const discovery=variant==='discovery';
 const card=(item:MatchCard,side:'left'|'right')=>{const owner=side==='left'?(assignments[item.id]?item.id:undefined):Object.keys(assignments).find(id=>assignments[id]===item.id);const color=owner?pairColor(left.map(i=>i.id),owner):undefined;const active=side==='left'&&selected===item.id;const match=side==='left'?right.find(r=>r.id===assignments[item.id]):left.find(l=>l.id===owner);
 return '<button class="essential-card shared-match-card '+(discovery?'discovery-match-card':'pair-card')+(active?' is-pair-selected':'')+'" data-action="'+(discovery?'discovery-match-'+side:'essential-pair')+'" data-side="'+side+'" data-id="'+esc(item.id)+'"'+(color?' data-pair-color="'+color+'"':'')+' aria-pressed="'+active+'" '+(locked?'disabled':'')+'>'+ (item.media||'')+'<span>'+esc(item.text)+(match?'<small class="sr-only">Your match: '+esc(match.text)+'</small>':'')+'</span>'+(locked&&side==='left'&&options.result?options.result(item.id):'')+'</button>';
 };
 return '<div class="shared-matching '+(discovery?'discovery-matching':'essential-pairs')+'" role="group" aria-label="Match pairs">'+(['left','right'] as const).map(side=>'<div class="'+(discovery?'discovery-match-column':'pair-column')+'" style="--pairs:'+left.length+'">'+options[side+'Order' as 'leftOrder'|'rightOrder'].map(id=>card((side==='left'?left:right).find(i=>i.id===id)!,side)).join('')+'</div>').join('')+'</div><p class="assignment-count" role="status">'+left.filter(l=>assignments[l.id]).length+' of '+left.length+' paired</p>';
}
