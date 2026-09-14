import { Router } from 'express';
import { pool } from '../db.js';
import { requireUser } from '../auth.js';
export const conversationsRouter=Router();conversationsRouter.use(requireUser);
conversationsRouter.get('/',async(req,res)=>{const{rows}=await pool.query(`SELECT c.id,c.child_id,c.title,c.mode,c.created_at,c.updated_at,ch.name AS child_name FROM conversations c JOIN children ch ON ch.id=c.child_id WHERE c.user_id=$1 ORDER BY c.updated_at DESC LIMIT 50`,[req.user.id]);res.json({conversations:rows})});
conversationsRouter.get('/:id',async(req,res)=>{const c=await pool.query('SELECT * FROM conversations WHERE id=$1 AND user_id=$2',[req.params.id,req.user.id]);if(!c.rows[0])return res.status(404).json({error:'Conversation not found.'});const m=await pool.query('SELECT id,role,content,emotion,created_at FROM messages WHERE conversation_id=$1 ORDER BY created_at',[req.params.id]);res.json({conversation:c.rows[0],messages:m.rows})});
