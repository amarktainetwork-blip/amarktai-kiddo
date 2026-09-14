import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from './config.js';
import { pool, withTransaction } from './db.js';
import {
  generateOpenRouterImage,
  generateOpenRouterMusic,
  providerOrder,
  submitGenxMedia
} from './providers.js';
import { deductCredits, refundCredits } from './services.js';

function extensionForMime(mime,type){
  if(mime.includes('mpeg')||mime.includes('mp3'))return'.mp3';
  if(mime.includes('wav'))return'.wav';
  if(mime.includes('ogg'))return'.ogg';
  if(mime.includes('jpeg'))return'.jpg';
  if(mime.includes('webp'))return'.webp';
  if(mime.includes('svg'))return'.svg';
  return type==='audio'?'.mp3':'.png';
}

export async function saveGeneratedBuffer(id,type,buffer,mimeType){
  const local=path.join(config.mediaDir,`${id}${extensionForMime(mimeType,type)}`);
  await fs.writeFile(local,buffer);
  await pool.query(
    'UPDATE media_items SET local_path=$1,mime_type=$2,status=$3,error_message=NULL,updated_at=NOW() WHERE id=$4',
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
  await saveGeneratedBuffer(id,'image',buffer,mime);
}

export async function failGeneratedMedia(mediaId,userId,message){
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

export function buildKidMediaPrompt(child,type,prompt){
  if(type==='audio'){
    return `Create a complete child-safe song or music piece lasting about 60 to 120 seconds for a ${child.age}-year-old. Keep it warm, imaginative and suitable for family listening. Develop a clear beginning, middle and ending rather than a short preview. If vocals are requested, use ${child.language}; otherwise keep it instrumental. No explicit, frightening, violent or adult lyrics. Production brief: ${prompt}`;
  }
  return `Create a polished, child-safe cartoon/animated illustration for a ${child.age}-year-old. Friendly expressive characters, rounded shapes, bright welcoming colour, non-scary, no text unless requested. Creative brief: ${prompt}`;
}

export async function queueMediaGeneration({userId,child,type,prompt,title}){
  const order=providerOrder();
  if(!order.length)throw new Error('No AI provider is configured.');
  const id=randomUUID();
  const cost=type==='audio'?config.credits.music:config.credits.image;
  const credits=await withTransaction(async client=>{
    await client.query(
      `INSERT INTO media_items
       (id,user_id,child_id,type,title,prompt,status,credit_cost)
       VALUES ($1,$2,$3,$4,$5,$6,'queued',$7)`,
      [id,userId,child.id,type,title||(type==='audio'?'Kiddo Song':'Kiddo Picture'),prompt,cost]
    );
    return deductCredits(client,userId,cost,type==='audio'?'Music generation':'Image generation');
  });

  const productionPrompt=buildKidMediaPrompt(child,type,prompt);
  const errors=[];
  for(const provider of order){
    try{
      if(provider==='genx'){
        const job=await submitGenxMedia(type,productionPrompt,{media_id:id,user_id:userId,child_id:child.id});
        await pool.query(
          'UPDATE media_items SET provider=$1,provider_job_id=$2,status=$3,updated_at=NOW() WHERE id=$4',
          [job.provider,job.jobId,'processing',id]
        );
        return{media:{id,status:'processing',type},credits,provider:job.provider};
      }
      if(type==='image'){
        const generated=await generateOpenRouterImage(productionPrompt);
        await pool.query('UPDATE media_items SET provider=$1 WHERE id=$2',[generated.provider,id]);
        await saveImage(id,generated.image);
        return{media:{id,status:'ready',type},credits,provider:generated.provider};
      }
      const generated=await generateOpenRouterMusic(productionPrompt);
      await pool.query('UPDATE media_items SET provider=$1 WHERE id=$2',[generated.provider,id]);
      await saveGeneratedBuffer(id,'audio',generated.buffer,generated.mimeType);
      return{media:{id,status:'ready',type},credits,provider:generated.provider};
    }catch(error){errors.push(`${provider}: ${error.message}`)}
  }
  await failGeneratedMedia(id,userId,errors.join(' | ')).catch(()=>{});
  throw new Error(`No configured AI provider completed the media request. ${errors.join(' | ')}`);
}
