import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import { z } from 'zod';
import { pool } from '../db.js';
import { assertChildOwner, requireParentGate, requireUser } from '../auth.js';

export const childrenRouter=Router();
childrenRouter.use(requireUser);
const schema=z.object({
  name:z.string().trim().min(1).max(60),
  age:z.coerce.number().int().min(3).max(12),
  avatarChoice:z.string().trim().min(1).max(40).default('nova'),
  language:z.string().trim().min(2).max(40).default('English'),
  voiceGender:z.enum(['female','male']).default('female'),
  voiceId:z.string().trim().min(2).max(60).default('en_US-hfc_female-medium')
});

childrenRouter.post('/',requireParentGate,async(req,res,next)=>{
  try{
    const i=schema.parse(req.body);
    const{rows}=await pool.query(
      `INSERT INTO children (id,user_id,name,age,avatar_choice,language,voice_gender,voice_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id,name,age,avatar_choice,language,voice_gender,voice_id,created_at`,
      [randomUUID(),req.user.id,i.name,i.age,i.avatarChoice,i.language,i.voiceGender,i.voiceId]
    );
    res.status(201).json({child:rows[0]});
  }catch(e){next(e)}
});

childrenRouter.patch('/:id',requireParentGate,async(req,res,next)=>{
  try{
    const i=schema.partial().parse(req.body);
    const c=await assertChildOwner(req.user.id,req.params.id);
    if(!c)return res.status(404).json({error:'Child profile not found.'});
    const{rows}=await pool.query(
      `UPDATE children
       SET name=$1,age=$2,avatar_choice=$3,language=$4,voice_gender=$5,voice_id=$6,updated_at=NOW()
       WHERE id=$7 AND user_id=$8
       RETURNING id,name,age,avatar_choice,language,voice_gender,voice_id,created_at`,
      [
        i.name??c.name,
        i.age??c.age,
        i.avatarChoice??c.avatar_choice,
        i.language??c.language,
        i.voiceGender??c.voice_gender,
        i.voiceId??c.voice_id,
        req.params.id,
        req.user.id
      ]
    );
    res.json({child:rows[0]});
  }catch(e){next(e)}
});

childrenRouter.delete('/:id',requireParentGate,async(req,res,next)=>{
  try{
    const media=await pool.query('SELECT local_path FROM media_items WHERE child_id=$1 AND user_id=$2 AND local_path IS NOT NULL',[req.params.id,req.user.id]);
    const r=await pool.query('DELETE FROM children WHERE id=$1 AND user_id=$2 RETURNING id',[req.params.id,req.user.id]);
    if(!r.rows[0])return res.status(404).json({error:'Child profile not found.'});
    await Promise.all(media.rows.map(row=>fs.unlink(row.local_path).catch(()=>{})));
    res.status(204).end();
  }catch(e){next(e)}
});
