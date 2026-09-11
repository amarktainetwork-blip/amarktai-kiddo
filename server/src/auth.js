import jwt from 'jsonwebtoken';
import { config } from './config.js';
import { pool } from './db.js';

const COOKIE = 'kiddo_session';
export function signSession(userId) { return jwt.sign({ sub: userId, typ: 'parent' }, config.jwtSecret, { expiresIn: '7d', issuer: 'amarktai-kiddo' }); }
export function setSessionCookie(res, userId) { res.cookie(COOKIE, signSession(userId), { httpOnly:true, secure:config.nodeEnv==='production', sameSite:'lax', maxAge:7*24*60*60*1000, path:'/' }); }
export function clearSessionCookie(res) { res.clearCookie(COOKIE, { httpOnly:true, secure:config.nodeEnv==='production', sameSite:'lax', path:'/' }); }
export async function requireUser(req, res, next) {
  const token = req.cookies?.[COOKIE];
  if (!token) return res.status(401).json({ error:'Please sign in.' });
  try {
    const payload = jwt.verify(token, config.jwtSecret, { issuer:'amarktai-kiddo' });
    const { rows } = await pool.query('SELECT id,email,name,credits,parent_consent_at,created_at FROM users WHERE id=$1', [payload.sub]);
    if (!rows[0]) return res.status(401).json({ error:'Session is no longer valid.' });
    req.user = rows[0]; next();
  } catch { return res.status(401).json({ error:'Session is invalid or expired.' }); }
}
export async function assertChildOwner(userId, childId, client = pool) {
  const { rows } = await client.query('SELECT * FROM children WHERE id=$1 AND user_id=$2', [childId,userId]);
  return rows[0] || null;
}
