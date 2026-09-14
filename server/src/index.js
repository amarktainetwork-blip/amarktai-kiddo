import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { config } from './config.js';
import { initDb, pool } from './db.js';
import { capabilities, providerReadiness } from './providers.js';
import { authRouter } from './routes/auth.js';
import { childrenRouter } from './routes/children.js';
import { settingsRouter } from './routes/settings.js';
import { conversationsRouter } from './routes/conversations.js';
import { chatRouter } from './routes/chat.js';
import { mediaRouter } from './routes/media.js';
import { voiceRouter } from './routes/voice.js';
import { startMediaReconciler } from './media-reconciler.js';

const app=express();
const __dirname=path.dirname(fileURLToPath(import.meta.url));
const dist=path.resolve(__dirname,'../../dist');

await fs.mkdir(config.mediaDir,{recursive:true});
await initDb();
startMediaReconciler();

app.disable('x-powered-by');
app.set('trust proxy',1);
app.use(helmet({
  contentSecurityPolicy:{
    directives:{
      defaultSrc:["'self'"],
      scriptSrc:["'self'"],
      styleSrc:["'self'","'unsafe-inline'"],
      imgSrc:["'self'","data:","blob:"],
      mediaSrc:["'self'","blob:"],
      connectSrc:["'self'"],
      fontSrc:["'self'","data:"],
      workerSrc:["'self'","blob:"],
      objectSrc:["'none'"],
      baseUri:["'self'"],
      formAction:["'self'"],
      frameAncestors:["'none'"]
    }
  },
  crossOriginResourcePolicy:{policy:'same-site'}
}));
app.use(express.json({limit:'1mb'}));
app.use(cookieParser());

app.use((req,res,next)=>{
  if(['GET','HEAD','OPTIONS'].includes(req.method)||!config.publicOrigin)return next();
  const origin=req.get('origin');
  if(origin&&origin!==config.publicOrigin)return res.status(403).json({error:'Request origin is not allowed.'});
  next();
});

const authLimiter=rateLimit({windowMs:15*60*1000,limit:30,standardHeaders:'draft-8',legacyHeaders:false});
const aiLimiter=rateLimit({
  windowMs:60*1000,
  limit:30,
  standardHeaders:'draft-8',
  legacyHeaders:false,
  skip:req=>['GET','HEAD','OPTIONS'].includes(req.method)
});

app.get('/health',async(_req,res)=>{
  try{
    await pool.query('SELECT 1');
    res.json({status:'ok',database:'ok'});
  }catch{
    res.status(503).json({status:'degraded',database:'unavailable'});
  }
});

app.get('/ready',async(_req,res)=>{
  try{
    await pool.query('SELECT 1');
    await fs.access(config.mediaDir);
    const ai=await providerReadiness();
    if(!ai.ready)return res.status(503).json({status:'not-ready',database:'ok',storage:'ok',ai});
    res.json({status:'ready',database:'ok',storage:'ok',ai});
  }catch(error){
    res.status(503).json({status:'not-ready',error:String(error?.message||error)});
  }
});

app.get('/api/system/status',(_req,res)=>res.json({capabilities:capabilities()}));
app.use('/api/auth',authLimiter,authRouter);
app.use('/api/children',childrenRouter);
app.use('/api/settings',settingsRouter);
app.use('/api/conversations',conversationsRouter);
app.use('/api/chat',aiLimiter,chatRouter);
app.use('/api/media',aiLimiter,mediaRouter);
app.use('/api/voice',aiLimiter,voiceRouter);

app.use(express.static(dist,{index:false,maxAge:config.nodeEnv==='production'?'1h':0}));
app.get('*',(req,res,next)=>{
  if(req.path.startsWith('/api/')||req.path==='/health'||req.path==='/ready')return next();
  res.sendFile(path.join(dist,'index.html'));
});

app.use((req,res)=>res.status(404).json({error:'Not found.'}));
app.use((error,_req,res,_next)=>{
  console.error(error);
  if(error instanceof z.ZodError)return res.status(400).json({error:error.issues.map(i=>i.message).join(' ')});
  const status=Number(error?.status||500);
  res.status(status).json({
    error:status>=500&&config.nodeEnv==='production'
      ? 'Something went wrong. Please try again.'
      : String(error?.message||'Unexpected error.')
  });
});

app.listen(config.port,'0.0.0.0',()=>{
  console.log(`Amarktai Kiddo listening on :${config.port} ${JSON.stringify(capabilities())}`);
});
