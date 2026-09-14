/// <reference lib="webworker" />
import * as piper from '@jtsage/piper-tts-web';
import { ModelManager, WhisperWasmService } from '@timur00kh/whisper.wasm';

type Req =
  | {id:string;type:'init';voice?:string}
  | {id:string;type:'tts';text:string;voice:string}
  | {id:string;type:'stt';samples:ArrayBuffer;language?:string};

let whisper:any=null;
let whisperPromise:Promise<any>|null=null;
const downloadedVoices=new Set<string>();

const progress=(engine:string,value:any)=>self.postMessage({type:'progress',engine,value});

function whisperLanguage(language?:string){
  const value=String(language||'').toLowerCase();
  if(value.startsWith('af'))return'af';
  if(value.startsWith('zu'))return'zu';
  return'en';
}

async function ensureWhisper(){
  if(whisper)return whisper;
  if(whisperPromise)return whisperPromise;
  whisperPromise=(async()=>{
    const service=new WhisperWasmService({logLevel:0});
    if(!(await service.checkWasmSupport()))throw new Error('This browser does not support local Whisper speech recognition.');
    const manager=new ModelManager({logLevel:0});
    const model=await manager.loadModel('tiny',true,(value:number)=>progress('stt-model',value));
    await service.initModel(model);
    whisper=service;
    self.postMessage({type:'ready',engine:'stt',device:'wasm'});
    return service;
  })();
  return whisperPromise;
}

async function ensureVoice(voice:string){
  if(downloadedVoices.has(voice))return;
  // predict() performs the first model download and stores it in browser
  // origin-private storage. A tiny warm-up phrase avoids an extra cold start
  // on the child's first real spoken reply.
  await piper.predict(
    {text:'Hi',voiceId:voice},
    (value:any)=>progress('tts-model',value)
  );
  downloadedVoices.add(voice);
  self.postMessage({type:'ready',engine:'tts',device:'wasm',voice});
}

self.onmessage=async(event:MessageEvent<Req>)=>{
  const msg=event.data;
  try{
    if(msg.type==='init'){
      await Promise.allSettled([
        ensureWhisper(),
        ensureVoice(msg.voice||'en_US-hfc_female-medium')
      ]);
      self.postMessage({id:msg.id,type:'init-complete'});
      return;
    }

    if(msg.type==='tts'){
      await ensureVoice(msg.voice);
      const wav=await piper.predict({text:msg.text,voiceId:msg.voice},(value:any)=>progress('tts',value));
      self.postMessage({id:msg.id,type:'tts-result',blob:wav});
      return;
    }

    if(msg.type==='stt'){
      const service=await ensureWhisper();
      const result=await service.transcribe(
        new Float32Array(msg.samples),
        undefined,
        {
          language:whisperLanguage(msg.language),
          translate:false,
          threads:Math.max(1,Math.min(4,(self.navigator as any).hardwareConcurrency||2))
        }
      );
      const text=Array.isArray(result?.segments)
        ? result.segments.map((segment:any)=>String(segment?.text||'')).join(' ').trim()
        : '';
      self.postMessage({id:msg.id,type:'stt-result',text});
    }
  }catch(error:any){
    self.postMessage({id:msg.id,type:'error',error:String(error?.message||error)});
  }
};
