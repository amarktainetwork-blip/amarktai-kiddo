import type { Emotion } from './types';

type Pending={resolve:(value:any)=>void;reject:(reason:any)=>void};
type WorkerReply={
  id?:string;
  type:string;
  text?:string;
  samples?:ArrayBuffer;
  sampleRate?:number;
  error?:string;
  engine?:string;
  device?:string;
};

export const LOCAL_VOICES=[
  {id:'af_heart',label:'Heart',gender:'female',accent:'US'},
  {id:'af_bella',label:'Bella',gender:'female',accent:'US'},
  {id:'bf_emma',label:'Emma',gender:'female',accent:'UK'},
  {id:'af_sky',label:'Sky',gender:'female',accent:'US'},
  {id:'am_puck',label:'Puck',gender:'male',accent:'US'},
  {id:'am_michael',label:'Michael',gender:'male',accent:'US'},
  {id:'bm_fable',label:'Fable',gender:'male',accent:'UK'},
  {id:'bm_george',label:'George',gender:'male',accent:'UK'}
] as const;

const speedByEmotion:Record<Emotion,number>={
  happy:1.03,excited:1.09,curious:1,thinking:.96,proud:1.01,calm:.93,
  sad:.9,worried:.95,surprised:1.07,playful:1.08,sleepy:.86,idle:1
};

let worker:Worker|null=null;
let audioContext:AudioContext|null=null;
let seq=0;
const pending=new Map<string,Pending>();
const readiness={tts:false,stt:false};
const devices={tts:'',stt:''};

function ensureWorker(){
  if(worker)return worker;
  worker=new Worker(new URL('../workers/voice.worker.ts',import.meta.url),{type:'module'});
  worker.onmessage=(event:MessageEvent<WorkerReply>)=>{
    const msg=event.data;
    if(msg.type==='ready'&&msg.engine){
      (readiness as any)[msg.engine]=true;
      (devices as any)[msg.engine]=msg.device||'local';
      window.dispatchEvent(new CustomEvent('kiddo-local-voice-ready',{detail:{...readiness,...devices}}));
      return;
    }
    if(!msg.id)return;
    const p=pending.get(msg.id);
    if(!p)return;
    pending.delete(msg.id);
    if(msg.type==='error')p.reject(new Error(msg.error||'Local voice engine failed.'));
    else p.resolve(msg);
  };
  return worker;
}

function request(payload:Record<string,unknown>,transfer:Transferable[]=[]){
  const id='voice-'+(++seq);
  return new Promise<any>((resolve,reject)=>{
    pending.set(id,{resolve,reject});
    ensureWorker().postMessage({id,...payload},transfer);
  });
}

export async function prewarmLocalVoice(){
  try{await request({type:'init'})}catch{}
}

export function localVoiceStatus(){
  return{...readiness,devices:{...devices}};
}

function getAudioContext(){
  if(!audioContext)audioContext=new AudioContext();
  return audioContext;
}

export async function playLocalSpeech(text:string,voice:string,emotion:Emotion='idle'){
  const msg=await request({type:'tts',text,voice,speed:speedByEmotion[emotion]||1});
  const samples=new Float32Array(msg.samples);
  const ctx=getAudioContext();
  if(ctx.state==='suspended')await ctx.resume();
  const buffer=ctx.createBuffer(1,samples.length,msg.sampleRate||24000);
  buffer.copyToChannel(samples,0);
  const source=ctx.createBufferSource();
  source.buffer=buffer;
  source.connect(ctx.destination);
  await new Promise<void>((resolve,reject)=>{
    source.onended=()=>resolve();
    try{source.start()}catch(error){reject(error)}
  });
}

function resample(input:Float32Array,sourceRate:number,targetRate=16000){
  if(sourceRate===targetRate)return input;
  const ratio=sourceRate/targetRate;
  const length=Math.max(1,Math.round(input.length/ratio));
  const output=new Float32Array(length);
  for(let i=0;i<length;i++){
    const pos=i*ratio;
    const left=Math.floor(pos);
    const right=Math.min(input.length-1,left+1);
    const frac=pos-left;
    output[i]=input[left]*(1-frac)+input[right]*frac;
  }
  return output;
}

export async function transcribeLocalAudio(blob:Blob,language?:string){
  const ctx=getAudioContext();
  const decoded=await ctx.decodeAudioData(await blob.arrayBuffer());
  let mono:Float32Array;
  if(decoded.numberOfChannels===1){
    mono=new Float32Array(decoded.getChannelData(0));
  }else{
    mono=new Float32Array(decoded.length);
    for(let c=0;c<decoded.numberOfChannels;c++){
      const channel=decoded.getChannelData(c);
      for(let i=0;i<mono.length;i++)mono[i]+=channel[i]/decoded.numberOfChannels;
    }
  }
  const samples=resample(mono,decoded.sampleRate,16000);
  const buffer=samples.buffer.slice(samples.byteOffset,samples.byteOffset+samples.byteLength);
  const msg=await request({type:'stt',samples:buffer,language},[buffer]);
  return String(msg.text||'').trim();
}

export function voiceForGender(gender:string|undefined,current?:string){
  if(current&&LOCAL_VOICES.some(v=>v.id===current))return current;
  return gender==='male'?'am_puck':'af_heart';
}

export function supportsLocalTts(language:string|undefined){
  return !language||language==='English';
}
