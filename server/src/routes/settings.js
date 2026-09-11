import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db.js';
import { requireUser } from '../auth.js';
import { ensureSettings } from '../services.js';
export const settingsRouter=Router();settingsRouter.use(requireUser);
settingsRouter.get('/',async(req,res)=>res.json({settings:await ensureSettings(req.user.id)}));
settingsRouter.patch('/',async(req,res,next)=>{try{const i=z.object({dailyMessageLimit:z.coerce.number().int().min(5).max(500).optional(),mediaEnabled:z.boolean().optional(),memoryEnabled:z.boolean().optional()}).parse(req.body);const c=await ensureSettings(req.user.id);const{rows}=await pool.query(`UPDATE parent_settings SET daily_message_limit=$1,media_enabled=$2,memory_enabled=$3,updated_at=NOW() WHERE user_id=$4 RETURNING *`,[i.dailyMessageLimit??c.daily_message_limit,i.mediaEnabled??c.media_enabled,i.memoryEnabled??c.memory_enabled,req.user.id]);res.json({settings:rows[0]})}catch(e){next(e)}});
