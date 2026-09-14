/// <reference lib="webworker" />
import { pipeline } from '@huggingface/transformers';
import { KokoroTTS } from 'kokoro-js';

type Req =
  | {id:string;type:'init'}
  | {id:string;type:'tts';text:string;voice:string;speed:number}
  | {id:string;type:'stt';samples:ArrayBuffer;language?:string};

let tts:any=null;
let asr:any=null;
let ttsPromise:Promise<any>|null=null;
let asrPromise:Promise<any>|null=null;

const hasWebGpu=()=>Boolean((self.navigator as any)?.gpu);
const progress=(engine:string,value:any)=>self.postMessage({type:'progress',engine,value});

async function loadTts(){
  if(tts)return tts;
  if(ttsPromise)return ttsPromise;
  ttsPromise=(async()=>{
    const webgpu=hasWebGpu();
    tts=await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX',{
      device:webgpu?'webgpu':'wasm',
      dtype:webgpu?'fp32':'q8',
      progress_callback:(value:any)=>progress('tts',value)
    });
    self.postMessage({type:'ready',engine:'tts',device:webgpu?'webgpu':'wasm'});
    return tts;
  })();
  return ttsPromise;
}

async function loadAsr(){
  if(asr)return asr;
  if(asrPromise)return asrPromise;
  asrPromise=(async()=>{
    const webgpu=hasWebGpu();
    asr=await pipeline('automatic-speech-recognition','onnx-community/whisper-tiny',{
      device:webgpu?'webgpu':'wasm',
      dtype:'q8',
      progress_callback:(value:any)=>progress('stt',value)
    } as any);
    self.postMessage({type:'ready',engine:'stt',device:webgpu?'webgpu':'wasm'});
    return asr;
  })();
  return asrPromise;
}

self.onmessage=async(event:MessageEvent<Req>)=>{
  const msg=event.data;
  try{
    if(msg.type==='init'){
      await Promise.allSettled([loadTts(),loadAsr()]);
      self.postMessage({id:msg.id,type:'init-complete'});
      return;
    }
    if(msg.type==='tts'){
      const engine=await loadTts();
      const audio=await engine.generate(msg.text,{voice:msg.voice,speed:msg.speed});
      const samples=audio.data as Float32Array;
      self.postMessage(
        {id:msg.id,type:'tts-result',samples:samples.buffer,sampleRate:audio.sample_rate||24000},
        [samples.buffer]
      );
      return;
    }
    if(msg.type==='stt'){
      const engine=await loadAsr();
      const samples=new Float32Array(msg.samples);
      const options:any={chunk_length_s:20,stride_length_s:3,return_timestamps:false};
      if(msg.language==='English')options.language='english';
      const result:any=await engine(samples,options);
      self.postMessage({id:msg.id,type:'stt-result',text:String(result?.text||'').trim()});
    }
  }catch(error:any){
    self.postMessage({id:msg.id,type:'error',error:String(error?.message||error)});
  }
};
