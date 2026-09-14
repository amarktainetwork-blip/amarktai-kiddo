import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { config } from '../config.js';
import { pool, withTransaction } from '../db.js';
import { assertChildOwner, requireUser } from '../auth.js';
import { childSystemPrompt, normalizeAiReply, precheckChildMessage, postcheckChildReply } from '../safety.js';
import { generateText } from '../providers.js';
import { deductCredits, ensureSettings, refundCredits, releaseDailyMessage, reserveDailyMessage } from '../services.js';

export const chatRouter=Router();
chatRouter.use(requireUser);

const schema=z.object({
  childId:z.string().uuid(),
  conversationId:z.string().uuid().optional(),
  message:z.string().trim().min(1).max(4000),
  mode:z.enum(['chat','story']).default('chat')
});

chatRouter.post('/',async(req,res,next)=>{
  let reserved=false;
  let creditsReserved=false;
  let cost=0;
  let reason='Kiddo chat';

  try{
    const i=schema.parse(req.body);
    const child=await assertChildOwner(req.user.id,i.childId);
    if(!child)return res.status(404).json({error:'Child profile not found.'});

    const safe=precheckChildMessage(i.message);
    if(!safe.allowed)return res.status(400).json({error:safe.reason,safeBlocked:true});

    const settings=await ensureSettings(req.user.id);
    cost=i.mode==='story'?config.credits.story:config.credits.chat;
    reason=i.mode==='story'?'Story generation':'Kiddo chat';

    const conversationId=i.conversationId||randomUUID();
    let existingConversation=null;
    let historyRows=[];

    if(i.conversationId){
      const owned=await pool.query(
        'SELECT id,child_id,mode FROM conversations WHERE id=$1 AND user_id=$2 AND child_id=$3',
        [i.conversationId,req.user.id,child.id]
      );
      existingConversation=owned.rows[0]||null;
      if(!existingConversation)return res.status(404).json({error:'Conversation not found.'});
    }

    // Parent-controlled memory follows the child across sessions, not just one chat tab.
    // Only already-stored, safety-screened conversation text is reused.
    if(settings.memory_enabled){
      const history=await pool.query(
        `SELECT m.role,m.content
         FROM messages m
         JOIN conversations c ON c.id=m.conversation_id
         WHERE c.user_id=$1 AND c.child_id=$2
         ORDER BY m.created_at DESC
         LIMIT 20`,
        [req.user.id,child.id]
      );
      historyRows=history.rows.reverse();
    }

    const aiMessages=[
      {role:'system',content:childSystemPrompt(child,i.mode)},
      ...historyRows.map(row=>({role:row.role,content:row.content})),
      {role:'user',content:i.message}
    ];

    const credits=await withTransaction(async client=>{
      await reserveDailyMessage(client,req.user.id,settings.daily_message_limit);
      reserved=true;
      const balance=await deductCredits(client,req.user.id,cost,reason);
      creditsReserved=true;
      return balance;
    });

    try{
      const generated=await generateText(aiMessages);
      const normalized=normalizeAiReply(generated.output);
      const reply=postcheckChildReply(normalized,child);

      await withTransaction(async client=>{
        if(!existingConversation){
          await client.query(
            'INSERT INTO conversations (id,user_id,child_id,title,mode) VALUES ($1,$2,$3,$4,$5)',
            [conversationId,req.user.id,child.id,i.message.slice(0,72),i.mode]
          );
        }
        await client.query(
          'INSERT INTO messages (id,conversation_id,role,content) VALUES ($1,$2,$3,$4)',
          [randomUUID(),conversationId,'user',i.message]
        );
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
      await withTransaction(async client=>{
        if(creditsReserved)await refundCredits(client,req.user.id,cost,`${reason} refund`);
        if(reserved)await releaseDailyMessage(client,req.user.id);
      }).catch(()=>{});
      throw error;
    }
  }catch(e){
    next(e);
  }
});
