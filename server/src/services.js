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

export async function reserveDailyMessage(client,userId,limit) {
  const {rows}=await client.query(
    `INSERT INTO daily_usage (user_id,usage_date,message_count)
     VALUES ($1,CURRENT_DATE,1)
     ON CONFLICT (user_id,usage_date) DO UPDATE
       SET message_count=daily_usage.message_count+1
       WHERE daily_usage.message_count < $2
     RETURNING message_count`,
    [userId,limit]
  );
  if(!rows[0]){
    const error=new Error('Today’s parent-set chat limit has been reached.');
    error.status=429;
    throw error;
  }
  return rows[0].message_count;
}

export async function releaseDailyMessage(client,userId) {
  await client.query(
    `UPDATE daily_usage
     SET message_count=GREATEST(message_count-1,0)
     WHERE user_id=$1 AND usage_date=CURRENT_DATE`,
    [userId]
  );
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

export function publicUser(row) {
  return {id:row.id,email:row.email,name:row.name,credits:row.credits,createdAt:row.created_at};
}
