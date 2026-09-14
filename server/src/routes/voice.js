import express,{ Router } from 'express';
import { randomBytes } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config.js';
import { requireUser } from '../auth.js';
import { generateGenxSpeech, transcribeGenxAudioUrl } from '../providers.js';

export const voiceRouter=Router();
const pendingInputs=new Map();
const inputDir=path.join(config.mediaDir,'voice-input');

function languageCode(value){
  const v=String(value||'').toLowerCase();
  if(v.startsWith('af'))return'af';
  if(v.startsWith('zu'))return'zu';
  return'en';
}

function cleanupExpired(){
  const now=Date.now();
  for(const [token,item] of pendingInputs){
    if(item.expiresAt<now){
      pendingInputs.delete(token);
      fs.unlink(item.file).catch(()=>{});
    }
  }
}

voiceRouter.get('/input/:token',async(req,res)=>{
  cleanupExpired();
  const item=pendingInputs.get(req.params.token);
  if(!item||item.expiresAt<Date.now())return res.status(404).end();
  res.set('Cache-Control','no-store');
  res.type(item.mimeType||'application/octet-stream');
  res.sendFile(path.resolve(item.file));
});

voiceRouter.use(requireUser);

voiceRouter.post('/transcribe',
  express.raw({type:['audio/webm','audio/mp4','audio/mpeg','audio/wav','application/octet-stream'],limit:'8mb'}),
  async(req,res,next)=>{
    let file='';
    let token='';
    try{
      if(!config.genx.key)return res.status(503).json({error:'GenX voice is not configured.'});
      if(!Buffer.isBuffer(req.body)||req.body.length<256)return res.status(400).json({error:'No usable voice recording was received.'});
      await fs.mkdir(inputDir,{recursive:true});
      token=randomBytes(24).toString('hex');
      const mimeType=String(req.get('content-type')||'audio/webm').split(';')[0];
      const ext=mimeType.includes('mp4')?'.m4a':mimeType.includes('mpeg')?'.mp3':mimeType.includes('wav')?'.wav':'.webm';
      file=path.join(inputDir,token+ext);
      await fs.writeFile(file,req.body,{mode:0o600});
      pendingInputs.set(token,{file,mimeType,expiresAt:Date.now()+2*60*1000});
      const audioUrl=`${config.publicOrigin}/api/voice/input/${token}`;
      const transcript=await transcribeGenxAudioUrl(audioUrl);
      res.json({transcript});
    }catch(error){next(error)}
    finally{
      if(token)pendingInputs.delete(token);
      if(file)await fs.unlink(file).catch(()=>{});
    }
  }
);

voiceRouter.post('/speak',async(req,res,next)=>{
  try{
    if(!config.genx.key)return res.status(503).json({error:'GenX voice is not configured.'});
    const text=String(req.body?.text||'').trim();
    if(!text||text.length>7000)return res.status(400).json({error:'Speech text must be between 1 and 7000 characters.'});
    const allowedVoices=new Set(['ara','eve','leo','rex','sal','altair','atlas','aurora','carina','castor','celeste','cosmo']);
    const requested=String(req.body?.voiceId||'').toLowerCase();
    const voiceId=allowedVoices.has(requested)?requested:config.genx.defaultVoice;
    const speech=await generateGenxSpeech(text,{voiceId,language:languageCode(req.body?.language)});
    res.set('Cache-Control','no-store');
    res.set('X-Kiddo-Voice',voiceId);
    res.type(speech.mimeType||'audio/mpeg');
    res.send(speech.buffer);
  }catch(error){next(error)}
});
