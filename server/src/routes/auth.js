import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { config } from '../config.js';
import { pool, withTransaction } from '../db.js';
import { clearSessionCookie, requireUser, setSessionCookie } from '../auth.js';
import { ensureSettings, publicUser } from '../services.js';

export const authRouter=Router();
const registerSchema=z.object({name:z.string().trim().min(2).max(80),email:z.string().trim().email().max(180),password:z.string().min(10).max(128),parentConsent:z.literal(true)});
const loginSchema=z.object({email:z.string().trim().email(),password:z.string().min(1).max(128)});

authRouter.post('/register',async(req,res,next)=>{try{const input=registerSchema.parse(req.body);const passwordHash=await bcrypt.hash(input.password,12);const id=randomUUID();const user=await withTransaction(async(client)=>{const{rows}=await client.query(`INSERT INTO users (id,email,password_hash,name,credits,parent_consent_at) VALUES ($1,lower($2),$3,$4,$5,NOW()) RETURNING id,email,name,credits,created_at`,[id,input.email,passwordHash,input.name,config.credits.starting]);await ensureSettings(id,client);await client.query('INSERT INTO credit_ledger (id,user_id,amount,reason) VALUES ($1,$2,$3,$4)',[randomUUID(),id,config.credits.starting,'Welcome credits']);return rows[0]});setSessionCookie(res,id);res.status(201).json({user:publicUser(user)})}catch(error){if(error?.code==='23505')return res.status(409).json({error:'An account with that email already exists.'});next(error)}});
authRouter.post('/login',async(req,res,next)=>{try{const input=loginSchema.parse(req.body);const{rows}=await pool.query('SELECT * FROM users WHERE email=lower($1)',[input.email]);const user=rows[0];if(!user||!(await bcrypt.compare(input.password,user.password_hash)))return res.status(401).json({error:'Invalid email or password.'});setSessionCookie(res,user.id);res.json({user:publicUser(user)})}catch(error){next(error)}});
authRouter.post('/logout',(_req,res)=>{clearSessionCookie(res);res.status(204).end()});
authRouter.get('/me',requireUser,async(req,res)=>{const[children,settings,ledger]=await Promise.all([pool.query('SELECT id,name,age,avatar_choice,language,created_at FROM children WHERE user_id=$1 ORDER BY created_at',[req.user.id]),ensureSettings(req.user.id),pool.query('SELECT amount,reason,created_at FROM credit_ledger WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20',[req.user.id])]);res.json({user:publicUser(req.user),children:children.rows,settings,ledger:ledger.rows})});
