import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { config } from '../config.js';
import { pool, withTransaction } from '../db.js';
import { assertChildOwner, requireUser } from '../auth.js';
import { precheckChildMessage } from '../safety.js';
import {
  downloadGenxJobFile,
  generateOpenRouterImage,
  generateOpenRouterMusic,
  getGenxJob,
  providerOrder,
  submitGenxMedia
} from '../providers.js';
import { deductCredits, ensureSettings, refundCredits } from '../services.js';

export const mediaRouter=Router();
mediaRouter.use(requireUser);

const schema=z.object({
  childId:z.string().uuid(),
  prompt:z.string().trim().min(3).max(2000),
  type:z.enum(['image','audio'])
});

function extensionForMime(mime,type){
  if(mime.includes('mpeg')||mime.includes('mp3'))return'.mp3';
  if(mime.includes('wav'))return'.wav';
  if(mime.includes('ogg'))return'.ogg';
  if(mime.includes('jpeg'))return'.jpg';
  if(mime.includes('webp'))return'.webp';
  if(mime.includes('svg'))return'.svg';
  return type==='audio'?'.wav':'.png';
}

async function saveBuffer(id,type,buffer,mimeType){
  const local=path.join(config.mediaDir,`${id}${extensionForMime(mimeType,type)}`);
  await fs.writeFile(local,buffer);
  await pool.query(
    'UPDATE media_items SET local_path=$1,mime_type=$2,status=$3,updated_at=NOW() WHERE id=$4',
    [local,mimeType,'ready',id]
  );
}

async function saveImage(id,source){
  let buffer,mime='image/png';
  if(source.startsWith('data:image/')){
    const[h,d]=source.split(',',2);
    mime=h.match(/^data:([^;]+)/)?.[1]||mime;
    buffer=Buffer.from(d,'base64');
  }else{
    const r=await fetch(source,{signal:AbortSignal.timeout(config.timeouts.media)});
    if(!r.ok)throw new Error(`Image download failed (${r.status}).`);
    mime=r.headers.get('content-type')||mime;
    buffer=Buffer.from(await r.arrayBuffer());
  }
  await saveBuffer(id,'image',buffer,mime);
}

async function failAndRefund(mediaId,userId,message){
  return withTransaction(async client=>{
    const {rows}=await client.query(
      `UPDATE media_items
       SET status='failed',error_message=$1,credit_refunded=TRUE,updated_at=NOW()
       WHERE id=$2 AND user_id=$3 AND credit_refunded=FALSE
       RETURNING credit_cost`,
      [String(message||'Generation failed.').slice(0,500),mediaId,userId]
    );
    const cost=Number(rows[0]?.credit_cost||0);
    if(cost>0)await refundCredits(client,userId,cost,'Failed media generation refund');
    return cost;
  });
}

mediaRouter.post('/generate',async(req,res,next)=>{
  let id=null;
  try{
    const i=schema.parse(req.body);
    const child=await assertChildOwner(req.user.id,i.childId);
    if(!child)return res.status(404).json({error:'Child profile not found.'});

    const settings=await ensureSettings(req.user.id);
    if(!settings.media_enabled)return res.status(403).json({error:'Media generation is disabled in Parent Controls.'});

    const safe=precheckChildMessage(i.prompt);
    if(!safe.allowed)return res.status(400).json({error:safe.reason,safeBlocked:true});

    const order=providerOrder();
    if(!order.length)return res.status(503).json({error:'No AI provider is configured.'});

    id=randomUUID();
    const cost=i.type==='audio'?config.credits.music:config.credits.image;
    const credits=await withTransaction(async client=>{
      await client.query(
        `INSERT INTO media_items
         (id,user_id,child_id,type,title,prompt,status,credit_cost)
         VALUES ($1,$2,$3,$4,$5,$6,'queued',$7)`,
        [id,req.user.id,child.id,i.type,i.type==='audio'?'Kiddo Music':'Kiddo Picture',i.prompt,cost]
      );
      return deductCredits(client,req.user.id,cost,i.type==='audio'?'Music generation':'Image generation');
    });

    const prompt=i.type==='audio'
      ? `Create a child-safe 30-second music clip for a ${child.age}-year-old. No explicit, frightening, violent or adult lyrics. If vocals are used, use ${child.language}. Creative request: ${i.prompt}`
      : `Create a cute, child-safe illustration for a ${child.age}-year-old. Friendly, non-scary, no text unless requested. Creative request: ${i.prompt}`;

    const errors=[];
    for(const provider of order){
      try{
        if(provider==='genx'){
          const job=await submitGenxMedia(
            i.type,
            prompt,
            {media_id:id,user_id:req.user.id,child_id:child.id}
          );
          await pool.query(
            'UPDATE media_items SET provider=$1,provider_job_id=$2,status=$3,updated_at=NOW() WHERE id=$4',
            [job.provider,job.jobId,'processing',id]
          );
          return res.status(202).json({media:{id,status:'processing',type:i.type},credits,provider:job.provider});
        }

        if(i.type==='image'){
          const generated=await generateOpenRouterImage(prompt);
          await pool.query('UPDATE media_items SET provider=$1 WHERE id=$2',[generated.provider,id]);
          await saveImage(id,generated.image);
          return res.status(201).json({media:{id,status:'ready',type:'image'},credits,provider:generated.provider});
        }

        const generated=await generateOpenRouterMusic(prompt);
        await pool.query('UPDATE media_items SET provider=$1 WHERE id=$2',[generated.provider,id]);
        await saveBuffer(id,'audio',generated.buffer,generated.mimeType);
        return res.status(201).json({media:{id,status:'ready',type:'audio'},credits,provider:generated.provider});
      }catch(error){
        errors.push(`${provider}: ${error.message}`);
      }
    }

    throw new Error(`No configured AI provider completed the media request. ${errors.join(' | ')}`);
  }catch(e){
    if(id)await failAndRefund(id,req.user.id,e.message).catch(()=>{});
    next(e);
  }
});

mediaRouter.get('/',async(req,res)=>{
  const{rows}=await pool.query(
    'SELECT id,child_id,type,title,prompt,status,error_message,created_at,updated_at FROM media_items WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100',
    [req.user.id]
  );
  res.json({media:rows});
});

mediaRouter.get('/:id/status',async(req,res,next)=>{
  try{
    const{rows}=await pool.query('SELECT * FROM media_items WHERE id=$1 AND user_id=$2',[req.params.id,req.user.id]);
    const m=rows[0];
    if(!m)return res.status(404).json({error:'Media item not found.'});
    if(m.status==='ready'||m.status==='failed'||!m.provider_job_id){
      return res.json({media:{id:m.id,status:m.status,type:m.type,error:m.error_message}});
    }

    const job=await getGenxJob(m.provider_job_id);
    const status=String(job.status||'').toLowerCase();

    if(['completed','succeeded','success','ready'].includes(status)){
      const f=await downloadGenxJobFile(m.provider_job_id);
      await saveBuffer(m.id,m.type,f.buffer,f.mimeType);
      return res.json({media:{id:m.id,status:'ready',type:m.type}});
    }

    if(['failed','error','cancelled','canceled'].includes(status)){
      const msg=String(job.error||job.message||'Generation failed.').slice(0,500);
      await failAndRefund(m.id,req.user.id,msg);
      return res.json({media:{id:m.id,status:'failed',type:m.type,error:msg}});
    }

    res.json({media:{id:m.id,status:'processing',type:m.type}});
  }catch(e){next(e)}
});

mediaRouter.get('/:id/file',async(req,res,next)=>{
  try{
    const{rows}=await pool.query(
      'SELECT local_path,mime_type FROM media_items WHERE id=$1 AND user_id=$2 AND status=$3',
      [req.params.id,req.user.id,'ready']
    );
    const m=rows[0];
    if(!m?.local_path)return res.status(404).json({error:'Media file is not ready.'});
    res.type(m.mime_type||'application/octet-stream');
    res.set('Cache-Control','private, max-age=3600');
    res.sendFile(path.resolve(m.local_path));
  }catch(e){next(e)}
});

mediaRouter.delete('/:id',async(req,res,next)=>{
  try{
    const current=await pool.query(
      'SELECT status,local_path FROM media_items WHERE id=$1 AND user_id=$2',
      [req.params.id,req.user.id]
    );
    if(!current.rows[0])return res.status(404).json({error:'Media item not found.'});
    if(['queued','processing'].includes(current.rows[0].status)){
      return res.status(409).json({error:'This creation is still processing. Wait for it to finish before deleting it.'});
    }
    await pool.query('DELETE FROM media_items WHERE id=$1 AND user_id=$2',[req.params.id,req.user.id]);
    if(current.rows[0].local_path)await fs.unlink(current.rows[0].local_path).catch(()=>{});
    res.status(204).end();
  }catch(e){next(e)}
});
