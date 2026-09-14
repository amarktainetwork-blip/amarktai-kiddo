import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { config } from '../config.js';
import { pool, withTransaction } from '../db.js';
import { assertChildOwner, requireUser } from '../auth.js';
import {
  childStreamingPrompt, childSystemPrompt, detectEmotion, detectSafetyConcern,
  normalizeAiReply, postcheckChildReply, precheckChildMessage
} from '../safety.js';
import { generateText, generateTextStream } from '../providers.js';
import { sendParentSafetyAlert, smtpConfigured } from '../mailer.js';
import { queueMediaGeneration } from '../media-service.js';
import { resolveSavedRequest } from '../library.js';
import { deductCredits, ensureSettings, refundCredits, releaseDailyMessage, reserveDailyMessage } from '../services.js';

export const chatRouter=Router();
chatRouter.use(requireUser);

const schema=z.object({
  childId:z.string().uuid(),
  conversationId:z.string().uuid().optional(),
  message:z.string().trim().min(1).max(4000),
  mode:z.enum(['chat','story']).default('chat')
});

async function recordConcern(req,child,settings,message){
  const concern=detectSafetyConcern(message);
  if(!concern)return false;
  const alertId=randomUUID();
  await pool.query(
    `INSERT INTO safety_alerts (id,user_id,child_id,category,severity,message_excerpt)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [alertId,req.user.id,child.id,concern.category,concern.severity,concern.excerpt]
  );
  if(settings.safety_alerts_enabled&&smtpConfigured()){
    sendParentSafetyAlert({
      to:req.user.email,
      parentName:req.user.name,
      childName:child.name,
      category:concern.category,
      severity:concern.severity,
      excerpt:concern.excerpt
    }).then(async sent=>{
      if(sent)await pool.query('UPDATE safety_alerts SET emailed_at=NOW() WHERE id=$1',[alertId]);
    }).catch(error=>console.error('Safety alert email failed',error));
  }
  return true;
}

async function prepareConversation(userId,child,conversationId,settings){
  const id=conversationId||randomUUID();
  let existingConversation=null;
  if(conversationId){
    const owned=await pool.query(
      'SELECT id,child_id,mode FROM conversations WHERE id=$1 AND user_id=$2 AND child_id=$3',
      [conversationId,userId,child.id]
    );
    existingConversation=owned.rows[0]||null;
    if(!existingConversation){
      const error=new Error('Conversation not found.');
      error.status=404;
      throw error;
    }
  }

  let historyRows=[];
  if(settings.memory_enabled){
    const history=await pool.query(
      `SELECT m.role,m.content
       FROM messages m
       JOIN conversations c ON c.id=m.conversation_id
       WHERE c.user_id=$1 AND c.child_id=$2
       ORDER BY m.created_at DESC
       LIMIT 20`,
      [userId,child.id]
    );
    historyRows=history.rows.reverse();
  }
  return{id,existingConversation,historyRows};
}

async function storeExchange({client,userId,child,conversationId,existingConversation,title,mode,userText,assistantText,emotion}){
  if(!existingConversation){
    await client.query(
      'INSERT INTO conversations (id,user_id,child_id,title,mode) VALUES ($1,$2,$3,$4,$5)',
      [conversationId,userId,child.id,title.slice(0,72),mode]
    );
  }
  await client.query(
    'INSERT INTO messages (id,conversation_id,role,content) VALUES ($1,$2,$3,$4)',
    [randomUUID(),conversationId,'user',userText]
  );
  await client.query(
    'INSERT INTO messages (id,conversation_id,role,content,emotion) VALUES ($1,$2,$3,$4,$5)',
    [randomUUID(),conversationId,'assistant',assistantText,emotion]
  );
  await client.query('UPDATE conversations SET updated_at=NOW(),mode=$1 WHERE id=$2',[mode,conversationId]);
}

chatRouter.post('/stream',async(req,res,next)=>{
  let reserved=false;
  let creditsReserved=false;
  const cost=config.credits.chat;
  try{
    const i=schema.parse({...req.body,mode:'chat'});
    const child=await assertChildOwner(req.user.id,i.childId);
    if(!child)return res.status(404).json({error:'Child profile not found.'});
    const settings=await ensureSettings(req.user.id);
    const alertStored=await recordConcern(req,child,settings,i.message);
    const safe=precheckChildMessage(i.message);
    if(!safe.allowed)return res.status(400).json({error:safe.reason,safeBlocked:true,alertStored});

    const prepared=await prepareConversation(req.user.id,child,i.conversationId,settings);
    const saved=await resolveSavedRequest(req.user.id,child.id,i.message);

    res.status(200);
    res.set({
      'Content-Type':'text/event-stream; charset=utf-8',
      'Cache-Control':'no-store, no-transform',
      'Connection':'keep-alive',
      'X-Accel-Buffering':'no'
    });
    res.flushHeaders?.();
    const send=(payload)=>res.write(`data: ${JSON.stringify(payload)}\n\n`);

    if(saved){
      const credits=await withTransaction(async client=>{
        await reserveDailyMessage(client,req.user.id,settings.daily_message_limit);
        await storeExchange({
          client,userId:req.user.id,child,conversationId:prepared.id,
          existingConversation:prepared.existingConversation,title:i.message,mode:'chat',
          userText:i.message,assistantText:saved.reply,emotion:saved.emotion
        });
        const balance=await client.query('SELECT credits FROM users WHERE id=$1',[req.user.id]);
        return Number(balance.rows[0]?.credits||0);
      });
      send({type:'saved',conversationId:prepared.id,...saved,credits,provider:'library',freeReplay:true});
      send({type:'done',conversationId:prepared.id,credits,provider:'library',freeReplay:true});
      return res.end();
    }

    const credits=await withTransaction(async client=>{
      await reserveDailyMessage(client,req.user.id,settings.daily_message_limit);
      reserved=true;
      const balance=await deductCredits(client,req.user.id,cost,'Kiddo streaming chat');
      creditsReserved=true;
      return balance;
    });

    const aiMessages=[
      {role:'system',content:childStreamingPrompt(child)},
      ...prepared.historyRows.map(row=>({role:row.role,content:row.content})),
      {role:'user',content:i.message}
    ];

    let sentenceBuffer='';
    let fullReply='';
    let lastEmotion='idle';
    let blocked=false;

    const emitSentence=(text)=>{
      const candidate=String(text||'').trim();
      if(!candidate||blocked)return;
      const checked=postcheckChildReply({
        reply:candidate,emotion:detectEmotion(candidate),intent:'chat',action:'none',
        creationTitle:'',creationPrompt:'',segments:[{text:candidate,emotion:detectEmotion(candidate)}]
      },child);
      const output=checked.reply.trim();
      if(!output)return;
      if(checked.intent==='safety'&&output!==candidate)blocked=true;
      fullReply+=(fullReply?' ':'')+output;
      lastEmotion=checked.emotion;
      send({type:'sentence',text:output,emotion:checked.emotion});
    };

    try{
      const generated=await generateTextStream(aiMessages,async delta=>{
        if(blocked)return;
        sentenceBuffer+=delta;
        const pieces=sentenceBuffer.split(/(?<=[.!?])\s+/);
        sentenceBuffer=pieces.pop()||'';
        for(const piece of pieces)emitSentence(piece);
      });
      if(!blocked&&sentenceBuffer.trim())emitSentence(sentenceBuffer);
      if(!fullReply.trim())fullReply="I'm here with you. What would you like to talk about?";

      await withTransaction(client=>storeExchange({
        client,userId:req.user.id,child,conversationId:prepared.id,
        existingConversation:prepared.existingConversation,title:i.message,mode:'chat',
        userText:i.message,assistantText:fullReply,emotion:lastEmotion
      }));

      send({type:'done',conversationId:prepared.id,reply:fullReply,emotion:lastEmotion,credits,provider:generated.provider});
      res.end();
    }catch(error){
      await withTransaction(async client=>{
        if(creditsReserved)await refundCredits(client,req.user.id,cost,'Kiddo streaming chat refund');
        if(reserved)await releaseDailyMessage(client,req.user.id);
      }).catch(()=>{});
      send({type:'error',error:'Kiddo had trouble answering. Please try again.'});
      res.end();
    }
  }catch(e){
    if(res.headersSent){
      res.write(`data: ${JSON.stringify({type:'error',error:String(e?.message||'Unexpected error.')})}\n\n`);
      return res.end();
    }
    next(e);
  }
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

    const settings=await ensureSettings(req.user.id);
    const alertStored=await recordConcern(req,child,settings,i.message);
    const safe=precheckChildMessage(i.message);
    if(!safe.allowed)return res.status(400).json({error:safe.reason,safeBlocked:true,alertStored});

    const prepared=await prepareConversation(req.user.id,child,i.conversationId,settings);
    const saved=await resolveSavedRequest(req.user.id,child.id,i.message);

    if(saved){
      const credits=await withTransaction(async client=>{
        await reserveDailyMessage(client,req.user.id,settings.daily_message_limit);
        await storeExchange({
          client,userId:req.user.id,child,conversationId:prepared.id,
          existingConversation:prepared.existingConversation,title:i.message,mode:'chat',
          userText:i.message,assistantText:saved.reply,emotion:saved.emotion
        });
        const balance=await client.query('SELECT credits FROM users WHERE id=$1',[req.user.id]);
        return Number(balance.rows[0]?.credits||0);
      });
      return res.json({
        conversationId:prepared.id,
        reply:saved.reply,
        emotion:saved.emotion,
        intent:saved.intent,
        action:saved.action,
        savedAction:saved.savedAction,
        segments:saved.segments,
        creation:null,
        creationError:null,
        credits,
        provider:'library',
        freeReplay:true
      });
    }

    cost=i.mode==='story'?config.credits.story:config.credits.chat;
    reason=i.mode==='story'?'Story generation':'Kiddo chat';

    const aiMessages=[
      {role:'system',content:childSystemPrompt(child,i.mode)},
      ...prepared.historyRows.map(row=>({role:row.role,content:row.content})),
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

      await withTransaction(client=>storeExchange({
        client,userId:req.user.id,child,conversationId:prepared.id,
        existingConversation:prepared.existingConversation,title:i.message,mode:i.mode,
        userText:i.message,assistantText:reply.reply,emotion:reply.emotion
      }));

      let creation=null;
      let creationError=null;
      let finalCredits=credits;
      if(reply.action!=='none'&&reply.creationPrompt){
        if(!settings.media_enabled){
          creationError='Pictures and music are disabled in Parent Controls.';
        }else{
          const type=reply.action==='generate_music'?'audio':'image';
          try{
            creation=await queueMediaGeneration({
              userId:req.user.id,
              child,
              type,
              prompt:reply.creationPrompt,
              title:reply.creationTitle||undefined
            });
            finalCredits=creation.credits;
          }catch(error){
            creationError=String(error?.message||'Creative generation could not start.');
          }
        }
      }

      return res.json({
        conversationId:prepared.id,
        reply:reply.reply,
        emotion:reply.emotion,
        intent:reply.intent,
        action:reply.action,
        savedAction:null,
        segments:reply.segments,
        creation:creation?.media||null,
        creationError,
        credits:finalCredits,
        provider:generated.provider,
        freeReplay:false
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
