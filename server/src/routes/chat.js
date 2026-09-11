import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { config } from '../config.js';
import { pool, withTransaction } from '../db.js';
import { assertChildOwner, requireUser } from '../auth.js';
import { childSystemPrompt, normalizeAiReply, precheckChildMessage, postcheckChildReply } from '../safety.js';
import { generateText } from '../providers.js';
import { deductCredits, ensureSettings, refundCredits, todaysMessageCount } from '../services.js';

export const chatRouter=Router();
chatRouter.use(requireUser);
const schema=z.object({
  childId:z.string().uuid(),
  conversationId:z.string().uuid().optional(),
  message:z.string().trim().min(1).max(4000),
  mode:z.enum(['chat','story']).default('chat')
});

chatRouter.post('/',async(req,res,next)=>{
  try{
    const i=schema.parse(req.body);
    const child=await assertChildOwner(req.user.id,i.childId);
    if(!child)return res.status(404).json({error:'Child profile not found.'});

    const safe=precheckChildMessage(i.message);
    if(!safe.allowed)return res.status(400).json({error:safe.reason,safeBlocked:true});

    const settings=await ensureSettings(req.user.id);
    const cost=i.mode==='story'?config.credits.story:config.credits.chat;
    if(await todaysMessageCount(req.user.id)>=settings.daily_message_limit){
      return res.status(429).json({error:'Today’s parent-set chat limit has been reached.'});
    }

    let conversationId=i.conversationId;
    if(conversationId){
      const owned=await pool.query(
        'SELECT id FROM conversations WHERE id=$1 AND user_id=$2 AND child_id=$3',
        [conversationId,req.user.id,child.id]
      );
      if(!owned.rows[0])return res.status(404).json({error:'Conversation not found.'});
    }else{
      conversationId=randomUUID();
      await pool.query(
        'INSERT INTO conversations (id,user_id,child_id,title,mode) VALUES ($1,$2,$3,$4,$5)',
        [conversationId,req.user.id,child.id,i.message.slice(0,72),i.mode]
      );
    }

    await pool.query(
      'INSERT INTO messages (id,conversation_id,role,content) VALUES ($1,$2,$3,$4)',
      [randomUUID(),conversationId,'user',i.message]
    );

    const history=settings.memory_enabled
      ? await pool.query(
          'SELECT role,content FROM messages WHERE conversation_id=$1 ORDER BY created_at DESC LIMIT 14',
          [conversationId]
        )
      : {rows:[{role:'user',content:i.message}]};

    const messages=[
      {role:'system',content:childSystemPrompt(child,i.mode)},
      ...history.rows.reverse().map(r=>({role:r.role,content:r.content}))
    ];

    const reason=i.mode==='story'?'Story generation':'Kiddo chat';
    const credits=await withTransaction(client=>deductCredits(client,req.user.id,cost,reason));

    try{
      const generated=await generateText(messages);
      const normalized=normalizeAiReply(generated.output);
      const reply=postcheckChildReply(normalized,child);

      await withTransaction(async client=>{
        await client.query(
          'INSERT INTO messages (id,conversation_id,role,content,emotion) VALUES ($1,$2,$3,$4,$5)',
          [randomUUID(),conversationId,'assistant',reply.reply,reply.emotion]
        );
        await client.query(
          'UPDATE conversations SET updated_at=NOW(),mode=$1 WHERE id=$2',
          [i.mode,conversationId]
        );
      });

      return res.json({
        conversationId,
        reply:reply.reply,
        emotion:reply.emotion,
        credits,
        provider:generated.provider
      });
    }catch(error){
      await withTransaction(client=>refundCredits(client,req.user.id,cost,`${reason} refund`)).catch(()=>{});
      throw error;
    }
  }catch(e){next(e)}
});
