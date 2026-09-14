import { pool } from './db.js';

const stop=new Set(['the','a','an','my','our','we','made','make','again','please','can','you','me','it','that','this','some','show','play','read','listen','hear','picture','image','song','music','story','book','saved','last','earlier']);

function terms(text){
  return String(text||'').toLowerCase().match(/[a-z0-9]+/g)?.filter(w=>w.length>2&&!stop.has(w)).slice(0,8)||[];
}
function score(row,words){
  if(!words.length)return 1;
  const hay=(row.title+' '+(row.prompt||'')+' '+(row.content||'')).toLowerCase();
  return words.reduce((sum,w)=>sum+(hay.includes(w)?1:0),0);
}
function asksAudio(v){return /\b(play|hear|listen to|put on)\b.*\b(song|music|track|tune)\b|\b(song|music|track|tune)\b.*\b(again|we made|saved|earlier|last)\b/i.test(v)}
function asksImage(v){return /\b(show|see|look at|open)\b.*\b(picture|image|drawing|photo|art)\b|\b(picture|image|drawing)\b.*\b(again|we made|saved|earlier|last)\b/i.test(v)}
function asksStory(v){return /\b(read|tell|hear)\b.*\b(story|book|bedtime story)\b.*\b(again|saved|we made|earlier|last)\b|\b(read|tell)\b.*\b(our|my|that|the last)\b.*\b(story|book)\b/i.test(v)}

export async function resolveSavedRequest(userId,childId,message){
  const words=terms(message);

  if(asksAudio(message)){
    const {rows}=await pool.query(
      `SELECT id,title,prompt FROM media_items
       WHERE user_id=$1 AND child_id=$2 AND type='audio' AND status='ready'
       ORDER BY created_at DESC LIMIT 30`,
      [userId,childId]
    );
    const best=rows.map(row=>({row,score:score(row,words)})).sort((a,b)=>b.score-a.score)[0]?.row;
    if(best)return{
      reply:`I found “${best.title}”. I’ll play it for you now!`,
      emotion:'excited',
      intent:'library',
      action:'play_saved_audio',
      savedAction:{kind:'play_audio',id:best.id,title:best.title},
      segments:[{text:`I found “${best.title}”. I’ll play it for you now!`,emotion:'excited'}]
    };
  }

  if(asksImage(message)){
    const {rows}=await pool.query(
      `SELECT id,title,prompt FROM media_items
       WHERE user_id=$1 AND child_id=$2 AND type='image' AND status='ready'
       ORDER BY created_at DESC LIMIT 30`,
      [userId,childId]
    );
    const best=rows.map(row=>({row,score:score(row,words)})).sort((a,b)=>b.score-a.score)[0]?.row;
    if(best)return{
      reply:`Here it is — “${best.title}”!`,
      emotion:'proud',
      intent:'library',
      action:'show_saved_image',
      savedAction:{kind:'show_image',id:best.id,title:best.title},
      segments:[{text:`Here it is — “${best.title}”!`,emotion:'proud'}]
    };
  }

  if(asksStory(message)){
    const {rows}=await pool.query(
      `SELECT c.id,c.title,
              COALESCE(string_agg(m.content,' ' ORDER BY m.created_at),'') AS content
       FROM conversations c
       JOIN messages m ON m.conversation_id=c.id AND m.role='assistant'
       WHERE c.user_id=$1 AND c.child_id=$2 AND c.mode='story'
       GROUP BY c.id,c.title,c.updated_at
       ORDER BY c.updated_at DESC LIMIT 20`,
      [userId,childId]
    );
    const best=rows.map(row=>({row,score:score(row,words)})).sort((a,b)=>b.score-a.score)[0]?.row;
    if(best&&best.content)return{
      reply:`I remember “${best.title}”. Let’s read it again.`,
      emotion:'happy',
      intent:'library',
      action:'read_saved_story',
      savedAction:{kind:'read_story',conversationId:best.id,title:best.title,text:best.content},
      segments:[{text:best.content,emotion:'calm'}]
    };
  }

  return null;
}
