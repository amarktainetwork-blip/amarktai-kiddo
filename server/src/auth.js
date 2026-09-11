import jwt from 'jsonwebtoken';
import { config } from './config.js';
import { pool } from './db.js';

const COOKIE = 'kiddo_session';
const PARENT_COOKIE = 'kiddo_parent_gate';
const cookieOptions = () => ({ httpOnly:true, secure:config.nodeEnv==='production', sameSite:'lax', path:'/' });

export function signSession(userId) {
  return jwt.sign({ sub:userId, typ:'session' }, config.jwtSecret, { expiresIn:'7d', issuer:'amarktai-kiddo' });
}
export function setSessionCookie(res,userId) {
  res.cookie(COOKIE,signSession(userId),{...cookieOptions(),maxAge:7*24*60*60*1000});
}
export function clearSessionCookie(res) { res.clearCookie(COOKIE,cookieOptions()); }

export function setParentGateCookie(res,userId) {
  const token=jwt.sign({sub:userId,typ:'parent-gate'},config.jwtSecret,{expiresIn:'20m',issuer:'amarktai-kiddo'});
  res.cookie(PARENT_COOKIE,token,{...cookieOptions(),maxAge:20*60*1000});
}
export function clearParentGateCookie(res) { res.clearCookie(PARENT_COOKIE,cookieOptions()); }

export async function requireUser(req,res,next) {
  const token=req.cookies?.[COOKIE];
  if(!token)return res.status(401).json({error:'Please sign in.'});
  try {
    const payload=jwt.verify(token,config.jwtSecret,{issuer:'amarktai-kiddo'});
    if(payload.typ!=='session')return res.status(401).json({error:'Session is invalid.'});
    const {rows}=await pool.query('SELECT id,email,name,credits,parent_consent_at,created_at FROM users WHERE id=$1',[payload.sub]);
    if(!rows[0])return res.status(401).json({error:'Session is no longer valid.'});
    req.user=rows[0];
    next();
  } catch {
    return res.status(401).json({error:'Session is invalid or expired.'});
  }
}

export function isParentGateUnlocked(req,userId) {
  const token=req.cookies?.[PARENT_COOKIE];
  if(!token)return false;
  try {
    const payload=jwt.verify(token,config.jwtSecret,{issuer:'amarktai-kiddo'});
    return payload.typ==='parent-gate' && payload.sub===userId;
  } catch { return false; }
}

export function requireParentGate(req,res,next) {
  if(!req.user)return res.status(401).json({error:'Please sign in.'});
  if(!isParentGateUnlocked(req,req.user.id))return res.status(403).json({error:'Parent verification is required.',parentGateRequired:true});
  next();
}

export async function assertChildOwner(userId,childId,client=pool) {
  const {rows}=await client.query('SELECT * FROM children WHERE id=$1 AND user_id=$2',[childId,userId]);
  return rows[0]||null;
}
