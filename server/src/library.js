import { pool } from './db.js';

const stop=new Set([
  'the','a','an','my','our','we','made','make','again','please','can','you','me','it','that','this','some',
  'show','play','read','listen','hear','picture','pictures','image','images','song','songs','music','story',
  'stories','book','books','saved','last','earlier','have','got','gallery','all','what','which','do'
]);

function terms(text){
  return String(text||'').toLowerCase().match(/[a-z0-9]+/g)?.filter(w=>w.length>2&&!stop.has(w)).slice(0,8)||[];
}
function score(row,words){
  if(!words.length)return 1;
  const hay=(row.title+' '+(row.prompt||'')+' '+(row.content||'')).toLowerCase();
  return words.reduce((sum,w)=>sum+(hay.includes(w)?1:0),0);
}
function bestMatch(rows,words){
  return rows.map(row=>({row,score:score(row,words)})).sort((a,b)=>b.score-a.score)[0]?.row;
}
function asksAudio(v){return /(play|hear|listen to|put on).*(song|music|track|tune)|(song|music|track|tune).*(again|we made|saved|earlier|last|called|named)/i.test(v)}
function asksImage(v){return /(show|see|look at|open).*(picture|image|drawing|photo|art)|(picture|image|drawing).*(again|we made|saved|earlier|last|called|named)/i.test(v)}
function asksStory(v){return /(read|tell|hear).*(story|book|bedtime story).*(again|saved|we made|earlier|last|called|named)|(read|tell).*(our|my|that|the last).*(story|book)/i.test(v)}
function asksImageGallery(v){return /(show|open|see|what).*(my|our|saved|all)?s*(pictures|images|drawings|gallery)|(pictures|images|gallery).*(have|saved|made|all)/i.test(v)&&!/(called|named|dragon|moon|cat|dog|picture of|image of)/i.test(v)}
function asksSongList(v){return /(what|which|list|tell me).*(songs|music|tracks).*(have|saved|made)|(my|our|saved)s+(songs|music)$/i.test(v)}
function asksStoryList(v){return /(what|which|list|tell me).*(stories|books).*(have|saved|made)|(my|our|saved)s+(stories|books)$/i.test(v)}

async function mediaRows(userId,childId,type){
  const {rows}=await pool.query(
    `SELECT id,title,prompt,created_at FROM media_items
     WHERE user_id=$1 AND child_id=$2 AND type=$3 AND status='ready'
     ORDER BY created_at DESC LIMIT 30`,
    [userId,childId,type]
  );
  return rows;
}

async function storyRows(userId,childId){
  const {rows}=await pool.query(
    `SELECT c.id,c.title,c.updated_at,
            COALESCE(string_agg(m.content,' ' ORDER BY m.created_at),'') AS content
     FROM conversations c
     JOIN messages m ON m.conversation_id=c.id AND m.role='assistant'
     WHERE c.user_id=$1 AND c.child_id=$2 AND c.mode='story'
     GROUP BY c.id,c.title,c.updated_at
     ORDER BY c.updated_at DESC LIMIT 20`,
    [userId,childId]
  );
  return rows;
}

export async function resolveSavedRequest(userId,childId,message){
  const words=terms(message);

  if(asksImageGallery(message)){
    const rows=await mediaRows(userId,childId,'image');
    if(rows.length){
      const items=rows.slice(0,12).map(row=>({id:row.id,title:row.title}));
      const reply=rows.length===1
        ? `You have one saved picture: “${rows[0].title}”. Here it is!`
        : `You have ${rows.length} saved pictures. Here are your newest ones.`;
      return{
        reply,emotion:'proud',intent:'library',action:'show_saved_gallery',
        savedAction:{kind:'show_gallery',items},
        segments:[{text:reply,emotion:'proud'}]
      };
    }
    return{
      reply:"We haven't saved any pictures yet. We can make one together whenever you want.",
      emotion:'curious',intent:'library',action:'none',savedAction:null,
      segments:[{text:"We haven't saved any pictures yet. We can make one together whenever you want.",emotion:'curious'}]
    };
  }

  if(asksSongList(message)){
    const rows=await mediaRows(userId,childId,'audio');
    const names=rows.slice(0,8).map(row=>row.title);
    const reply=names.length
      ? `Your saved songs are: ${names.join(', ')}. Just tell me which one you want to hear.`
      : "We haven't saved any songs yet. We can make one together whenever you want.";
    return{reply,emotion:names.length?'happy':'curious',intent:'library',action:'none',savedAction:null,segments:[{text:reply,emotion:names.length?'happy':'curious'}]};
  }

  if(asksStoryList(message)){
    const rows=await storyRows(userId,childId);
    const names=rows.slice(0,8).map(row=>row.title);
    const reply=names.length
      ? `Your saved stories are: ${names.join(', ')}. Tell me which one you want me to read.`
      : "We haven't saved any stories yet. We can make one together whenever you want.";
    return{reply,emotion:names.length?'happy':'curious',intent:'library',action:'none',savedAction:null,segments:[{text:reply,emotion:names.length?'happy':'curious'}]};
  }

  if(asksAudio(message)){
    const rows=await mediaRows(userId,childId,'audio');
    const best=bestMatch(rows,words);
    if(best)return{
      reply:`I found “${best.title}”. I’ll play it for you now!`,
      emotion:'excited',intent:'library',action:'play_saved_audio',
      savedAction:{kind:'play_audio',id:best.id,title:best.title},
      segments:[{text:`I found “${best.title}”. I’ll play it for you now!`,emotion:'excited'}]
    };
  }

  if(asksImage(message)){
    const rows=await mediaRows(userId,childId,'image');
    const best=bestMatch(rows,words);
    if(best)return{
      reply:`Here it is — “${best.title}”!`,
      emotion:'proud',intent:'library',action:'show_saved_image',
      savedAction:{kind:'show_image',id:best.id,title:best.title},
      segments:[{text:`Here it is — “${best.title}”!`,emotion:'proud'}]
    };
  }

  if(asksStory(message)){
    const rows=await storyRows(userId,childId);
    const best=bestMatch(rows,words);
    if(best&&best.content)return{
      reply:`I remember “${best.title}”. Let’s read it again.`,
      emotion:'happy',intent:'library',action:'read_saved_story',
      savedAction:{kind:'read_story',conversationId:best.id,title:best.title,text:best.content},
      segments:[{text:best.content,emotion:'calm'}]
    };
  }

  return null;
}
