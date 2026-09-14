import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import { z } from 'zod';
import { config } from '../config.js';
import { pool, withTransaction } from '../db.js';
import {
  clearParentGateCookie, clearSessionCookie, isParentGateUnlocked, requireParentGate, requireUser,
  setParentGateCookie, setSessionCookie
} from '../auth.js';
import { ensureSettings, publicUser } from '../services.js';

export const authRouter=Router();
const registerSchema=z.object({name:z.string().trim().min(2).max(80),email:z.string().trim().email().max(180),password:z.string().min(10).max(128),parentConsent:z.literal(true)});
const loginSchema=z.object({email:z.string().trim().email(),password:z.string().min(1).max(128)});
const passwordSchema=z.object({password:z.string().min(1).max(128)});
const changePasswordSchema=z.object({currentPassword:z.string().min(1).max(128),newPassword:z.string().min(10).max(128)});

authRouter.post('/register',async(req,res,next)=>{
  try{
    const input=registerSchema.parse(req.body);
    const passwordHash=await bcrypt.hash(input.password,12);
    const id=randomUUID();
    const user=await withTransaction(async(client)=>{
      const{rows}=await client.query(
        `INSERT INTO users (id,email,password_hash,name,credits,parent_consent_at)
         VALUES ($1,lower($2),$3,$4,$5,NOW()) RETURNING id,email,name,credits,created_at`,
        [id,input.email,passwordHash,input.name,config.credits.starting]
      );
      await ensureSettings(id,client);
      await client.query('INSERT INTO credit_ledger (id,user_id,amount,reason) VALUES ($1,$2,$3,$4)',[randomUUID(),id,config.credits.starting,'Welcome credits']);
      return rows[0];
    });
    setSessionCookie(res,id);
    setParentGateCookie(res,id);
    res.status(201).json({user:publicUser(user)});
  }catch(error){
    if(error?.code==='23505')return res.status(409).json({error:'An account with that email already exists.'});
    next(error);
  }
});

authRouter.post('/login',async(req,res,next)=>{
  try{
    const input=loginSchema.parse(req.body);
    const{rows}=await pool.query('SELECT * FROM users WHERE email=lower($1)',[input.email]);
    const user=rows[0];
    if(!user||!(await bcrypt.compare(input.password,user.password_hash)))return res.status(401).json({error:'Invalid email or password.'});
    setSessionCookie(res,user.id);
    setParentGateCookie(res,user.id);
    res.json({user:publicUser(user)});
  }catch(error){next(error)}
});

authRouter.post('/logout',(_req,res)=>{
  clearParentGateCookie(res);
  clearSessionCookie(res);
  res.status(204).end();
});

authRouter.get('/parent-gate',requireUser,(req,res)=>{
  res.json({unlocked:isParentGateUnlocked(req,req.user.id)});
});
authRouter.post('/parent-gate',requireUser,async(req,res,next)=>{
  try{
    const {password}=passwordSchema.parse(req.body);
    const{rows}=await pool.query('SELECT password_hash FROM users WHERE id=$1',[req.user.id]);
    if(!rows[0]||!(await bcrypt.compare(password,rows[0].password_hash)))return res.status(401).json({error:'Parent password is incorrect.'});
    setParentGateCookie(res,req.user.id);
    res.json({unlocked:true});
  }catch(error){next(error)}
});
authRouter.post('/parent-gate/lock',requireUser,(req,res)=>{
  clearParentGateCookie(res);
  res.json({unlocked:false});
});


authRouter.post('/change-password',requireUser,requireParentGate,async(req,res,next)=>{
  try{
    const input=changePasswordSchema.parse(req.body);
    const{rows}=await pool.query('SELECT password_hash FROM users WHERE id=$1',[req.user.id]);
    if(!rows[0]||!(await bcrypt.compare(input.currentPassword,rows[0].password_hash))){
      return res.status(401).json({error:'Current parent password is incorrect.'});
    }
    const hash=await bcrypt.hash(input.newPassword,12);
    await pool.query('UPDATE users SET password_hash=$1,updated_at=NOW() WHERE id=$2',[hash,req.user.id]);
    setParentGateCookie(res,req.user.id);
    res.json({changed:true});
  }catch(error){next(error)}
});

authRouter.get('/export',requireUser,requireParentGate,async(req,res,next)=>{
  try{
    const [children,settings,conversations,messages,media,ledger]=await Promise.all([
      pool.query('SELECT id,name,age,avatar_choice,language,created_at,updated_at FROM children WHERE user_id=$1 ORDER BY created_at',[req.user.id]),
      ensureSettings(req.user.id),
      pool.query('SELECT id,child_id,title,mode,created_at,updated_at FROM conversations WHERE user_id=$1 ORDER BY created_at',[req.user.id]),
      pool.query(`SELECT m.id,m.conversation_id,m.role,m.content,m.emotion,m.created_at
                  FROM messages m JOIN conversations c ON c.id=m.conversation_id
                  WHERE c.user_id=$1 ORDER BY m.created_at`,[req.user.id]),
      pool.query('SELECT id,child_id,conversation_id,type,title,prompt,status,mime_type,created_at,updated_at FROM media_items WHERE user_id=$1 ORDER BY created_at',[req.user.id]),
      pool.query('SELECT amount,reason,created_at FROM credit_ledger WHERE user_id=$1 ORDER BY created_at',[req.user.id])
    ]);
    res.json({
      exportedAt:new Date().toISOString(),
      user:publicUser(req.user),
      parentConsentAt:req.user.parent_consent_at,
      settings,
      children:children.rows,
      conversations:conversations.rows,
      messages:messages.rows,
      media:media.rows,
      creditLedger:ledger.rows
    });
  }catch(error){next(error)}
});

authRouter.delete('/account',requireUser,requireParentGate,async(req,res,next)=>{
  try{
    const {password}=passwordSchema.parse(req.body);
    const{rows}=await pool.query('SELECT password_hash FROM users WHERE id=$1',[req.user.id]);
    if(!rows[0]||!(await bcrypt.compare(password,rows[0].password_hash))){
      return res.status(401).json({error:'Parent password is incorrect.'});
    }
    const media=await pool.query('SELECT local_path FROM media_items WHERE user_id=$1 AND local_path IS NOT NULL',[req.user.id]);
    await pool.query('DELETE FROM users WHERE id=$1',[req.user.id]);
    await Promise.all(media.rows.map(row=>fs.unlink(row.local_path).catch(()=>{})));
    clearParentGateCookie(res);
    clearSessionCookie(res);
    res.status(204).end();
  }catch(error){next(error)}
});

authRouter.get('/me',requireUser,async(req,res)=>{
  const unlocked=isParentGateUnlocked(req,req.user.id);
  const [children,settings]=await Promise.all([
    pool.query('SELECT id,name,age,avatar_choice,language,created_at FROM children WHERE user_id=$1 ORDER BY created_at',[req.user.id]),
    ensureSettings(req.user.id)
  ]);
  const response={
    user:publicUser(req.user),
    children:children.rows,
    parentGateUnlocked:unlocked,
    childSettings:{
      media_enabled:settings.media_enabled,
      voice_enabled:settings.voice_enabled,
      voice_autoplay:settings.voice_autoplay
    }
  };
  if(unlocked){
    response.settings=settings;
    const ledger=await pool.query('SELECT amount,reason,created_at FROM credit_ledger WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20',[req.user.id]);
    response.ledger=ledger.rows;
  }
  res.json(response);
});
