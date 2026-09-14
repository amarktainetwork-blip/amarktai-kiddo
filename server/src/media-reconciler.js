import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from './config.js';
import { pool, withTransaction } from './db.js';
import { downloadGenxJobFile, getGenxJob } from './providers.js';
import { refundCredits } from './services.js';

function extensionForMime(mime,type){
  if(mime.includes('mpeg')||mime.includes('mp3'))return'.mp3';
  if(mime.includes('wav'))return'.wav';
  if(mime.includes('ogg'))return'.ogg';
  if(mime.includes('jpeg'))return'.jpg';
  if(mime.includes('webp'))return'.webp';
  if(mime.includes('svg'))return'.svg';
  return type==='audio'?'.wav':'.png';
}

async function completeItem(item){
  const file=await downloadGenxJobFile(item.provider_job_id);
  const local=path.join(config.mediaDir,`${item.id}${extensionForMime(file.mimeType,item.type)}`);
  await fs.writeFile(local,file.buffer);
  await pool.query(
    `UPDATE media_items
     SET status='ready',local_path=$1,mime_type=$2,error_message=NULL,updated_at=NOW()
     WHERE id=$3 AND status='processing'`,
    [local,file.mimeType,item.id]
  );
}

async function failItem(item,message){
  await withTransaction(async client=>{
    const {rows}=await client.query(
      `UPDATE media_items
       SET status='failed',error_message=$1,credit_refunded=TRUE,updated_at=NOW()
       WHERE id=$2 AND user_id=$3 AND status='processing' AND credit_refunded=FALSE
       RETURNING credit_cost`,
      [String(message||'Generation failed.').slice(0,500),item.id,item.user_id]
    );
    const cost=Number(rows[0]?.credit_cost||0);
    if(cost>0)await refundCredits(client,item.user_id,cost,'Failed media generation refund');
  });
}

export async function reconcileMediaJobs(){
  const {rows}=await pool.query(
    `SELECT id,user_id,type,provider_job_id,credit_cost,credit_refunded
     FROM media_items
     WHERE provider='genx' AND status='processing' AND provider_job_id IS NOT NULL
     ORDER BY updated_at ASC
     LIMIT 20`
  );

  for(const item of rows){
    try{
      const job=await getGenxJob(item.provider_job_id);
      const status=String(job.status||'').toLowerCase();
      if(['completed','succeeded','success','ready'].includes(status)){
        await completeItem(item);
      }else if(['failed','error','cancelled','canceled'].includes(status)){
        await failItem(item,job.error||job.message||'Generation failed.');
      }
    }catch(error){
      console.warn(`Media reconciliation deferred for ${item.id}: ${error.message}`);
    }
  }
}

export function startMediaReconciler(){
  const interval=Math.max(1000,config.mediaReconcileIntervalMs);
  const tick=()=>reconcileMediaJobs().catch(error=>console.error('Media reconciliation error',error));
  const timer=setInterval(tick,interval);
  timer.unref?.();
  setTimeout(tick,Math.min(interval,2000)).unref?.();
  return timer;
}
