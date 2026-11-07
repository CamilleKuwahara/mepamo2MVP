import manifest from './narration.json' with {type:'json'};
import {moduleSources} from './content';
import {transcriptWords} from '../tokyo/transcript';
import type {Clip} from '../tokyo/audio';
export type MediaRecord={status:'missing'|'error'|'ready';scriptHash:string;voice:string;reason?:string;src?:string;audioHash?:string;duration?:number;timingSource?:'aligned-audio'|'provider-word-times';words?:string[];cues?:number[][]};
export async function validateMedia(text:string,record:MediaRecord):Promise<Clip|undefined>{
 if(record.status!=='ready')return;
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));
 const hash=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
 const words=transcriptWords(text),cues=record.cues;
 if(record.voice!=='en_US-lessac-medium'||hash!==record.scriptHash||!record.src?.startsWith('/lessons-2-5/audio/')||!record.audioHash?.match(/^[a-f0-9]{64}$/)||!['aligned-audio','provider-word-times'].includes(record.timingSource||'')||!Number.isFinite(record.duration)||record.duration!<=0||JSON.stringify(words)!==JSON.stringify(record.words)||!cues||cues.length!==words.length)return;
 if(cues.some((cue,i)=>cue.length!==2||cue.some(t=>!Number.isFinite(t))||cue[0]<0||cue[1]<=cue[0]||cue[1]>record.duration!||(i>0&&cue[0]<cues[i-1][0])))return;
 return {src:record.src,words,cues,duration:record.duration!};
}
export async function discoveryNarration(id:string){
 const source=moduleSources[id],record=(manifest as Record<string,MediaRecord>)[id];
 return source&&record?validateMedia(source.narration,record):undefined;
}
