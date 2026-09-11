import { randomUUID } from 'node:crypto';
import { config } from './config.js';
import { pool } from './db.js';

export async function ensureSettings(userId, client = pool) {
  await client.query(
    `INSERT INTO parent_settings (user_id,daily_message_limit) VALUES ($1,$2)
     ON CONFLICT (user_id) DO NOTHING`,
    [userId,config.defaultDailyMessageLimit]
  );
  const {rows}=await client.query('SELECT * FROM parent_settings WHERE user_id=$1',[userId]);
  return rows[0];
}

export async function deductCredits(client,userId,amount,reason) {
  if(!Number.isFinite(amount)||amount<=0)throw new Error('Credit deduction must be a positive number.');
  const result=await client.query(
    'UPDATE users SET credits=credits-$1,updated_at=NOW() WHERE id=$2 AND credits >= $1 RETURNING credits',
    [amount,userId]
  );
  if(!result.rows[0]){
    const error=new Error('Not enough credits for that action.');
    error.status=402;
    throw error;
  }
  await client.query(
    'INSERT INTO credit_ledger (id,user_id,amount,reason) VALUES ($1,$2,$3,$4)',
    [randomUUID(),userId,-amount,reason]
  );
  return result.rows[0].credits;
}

export async function refundCredits(client,userId,amount,reason) {
  if(!Number.isFinite(amount)||amount<=0)return null;
  const result=await client.query(
    'UPDATE users SET credits=credits+$1,updated_at=NOW() WHERE id=$2 RETURNING credits',
    [amount,userId]
  );
  if(!result.rows[0])return null;
  await client.query(
    'INSERT INTO credit_ledger (id,user_id,amount,reason) VALUES ($1,$2,$3,$4)',
    [randomUUID(),userId,amount,reason]
  );
  return result.rows[0].credits;
}

export async function todaysMessageCount(userId) {
  const{rows}=await pool.query(
    `SELECT COUNT(*)::int AS count
     FROM messages m JOIN conversations c ON c.id=m.conversation_id
     WHERE c.user_id=$1 AND m.role='user' AND m.created_at>=date_trunc('day',NOW())`,
    [userId]
  );
  return rows[0]?.count||0;
}

export function publicUser(row) {
  return{id:row.id,email:row.email,name:row.name,credits:row.credits,createdAt:row.created_at};
}
