import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';
import path from 'node:path';

const TEST_DATABASE_URL=process.env.TEST_DATABASE_URL||'postgres://postgres:postgres@127.0.0.1:5432/kiddo_test';
const serverDir=fileURLToPath(new URL('../',import.meta.url));
const tinyPng='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z5p8AAAAASUVORK5CYII=';
const tinyWav=Buffer.from('UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=','base64');

function cookiesFrom(response,jar){
  const values=typeof response.headers.getSetCookie==='function'
    ? response.headers.getSetCookie()
    : [response.headers.get('set-cookie')].filter(Boolean);
  for(const raw of values){
    const pair=raw.split(';',1)[0];
    const eq=pair.indexOf('=');
    if(eq<1)continue;
    const key=pair.slice(0,eq),value=pair.slice(eq+1);
    if(value)jar.set(key,value); else jar.delete(key);
  }
}
function cookieHeader(jar){return [...jar.entries()].map(([k,v])=>`${k}=${v}`).join('; ')}

async function api(base,pathName,{method='GET',body,jar}={}){
  const headers={};
  if(body!==undefined)headers['content-type']='application/json';
  if(jar?.size)headers.cookie=cookieHeader(jar);
  const response=await fetch(base+pathName,{
    method,headers,
    body:body===undefined?undefined:JSON.stringify(body)
  });
  if(jar)cookiesFrom(response,jar);
  const payload=response.status===204?null:await response.json().catch(()=>null);
  return{status:response.status,payload,response};
}
async function raw(base,pathName,jar){
  const response=await fetch(base+pathName,{headers:jar?.size?{cookie:cookieHeader(jar)}:{}});
  return{status:response.status,contentType:response.headers.get('content-type')||'',bytes:Buffer.from(await response.arrayBuffer())};
}
async function waitReady(base,child){
  for(let i=0;i<100;i++){
    if(child.exitCode!==null)throw new Error(`Kiddo exited early with code ${child.exitCode}`);
    try{const r=await fetch(base+'/ready');if(r.ok)return}catch{}
    await new Promise(r=>setTimeout(r,100));
  }
  throw new Error('Kiddo did not become ready');
}
async function stop(child){
  if(child.exitCode!==null)return;
  child.kill('SIGTERM');
  await Promise.race([
    new Promise(resolve=>child.once('exit',resolve)),
    new Promise(resolve=>setTimeout(resolve,1500))
  ]);
  if(child.exitCode===null)child.kill('SIGKILL');
}

function startMockProvider(port,state){
  return new Promise(resolve=>{
    const srv=createServer(async(req,res)=>{
      const chunks=[];for await(const chunk of req)chunks.push(chunk);
      const bodyText=Buffer.concat(chunks).toString('utf8');
      let body={};try{body=bodyText?JSON.parse(bodyText):{}}catch{}
      const url=new URL(req.url,`http://127.0.0.1:${port}`);

      if(req.method==='GET'&&(url.pathname==='/api/v1/key'||url.pathname==='/api/v1/account/credits')){
        res.writeHead(200,{'content-type':'application/json'});return res.end(JSON.stringify({ok:true,data:{label:'test'}}));
      }

      if(req.method==='POST'&&(url.pathname==='/api/v1/chat/completions'||url.pathname==='/v1/chat/completions')){
        if(body?.messages?.some?.(m=>String(m.content).includes('FAIL_PROVIDER'))){
          res.writeHead(503,{'content-type':'application/json'});return res.end(JSON.stringify({error:{message:'forced provider failure'}}));
        }
        const isMusic=String(body?.model||'').includes('lyria');
        if(isMusic){
          res.writeHead(200,{'content-type':'text/event-stream'});
          res.write(`data: ${JSON.stringify({choices:[{delta:{audio:{data:tinyWav.toString('base64')}}}]})}\n\n`);
          res.write('data: [DONE]\n\n');return res.end();
        }
        const system=body?.messages?.find?.(m=>m.role==='system')?.content||'';
        state.lastSystem=system;
        const reply=system.includes('Afrikaans')?'Hallo! Ek is bly om saam met jou te leer.':'Hi! I am happy to learn with you.';
        res.writeHead(200,{'content-type':'application/json'});
        return res.end(JSON.stringify({choices:[{message:{content:JSON.stringify({reply,emotion:'happy'})}}]}));
      }

      if(req.method==='POST'&&url.pathname==='/api/v1/images'){
        res.writeHead(200,{'content-type':'application/json'});
        return res.end(JSON.stringify({data:[{b64_json:tinyPng,media_type:'image/png'}]}));
      }

      if(req.method==='GET'&&url.pathname==='/api/v1/models'){
        const cat=url.searchParams.get('category');
        res.writeHead(200,{'content-type':'application/json'});
        return res.end(JSON.stringify({models:cat==='audio'
          ?[{id:'lyria-test',name:'Lyria Test'}]
          :[{id:'image-test',name:'Image Test'}]}));
      }

      if(req.method==='POST'&&url.pathname==='/api/v1/generate'){
        const id=String(body?.model||'').includes('lyria')?'job-audio':'job-image';
        state.jobs[id]=id==='job-audio'?'audio':'image';
        res.writeHead(200,{'content-type':'application/json'});return res.end(JSON.stringify({job_id:id}));
      }
      const statusMatch=url.pathname.match(/^\/api\/v1\/jobs\/(job-(?:audio|image))$/);
      if(req.method==='GET'&&statusMatch){
        res.writeHead(200,{'content-type':'application/json'});return res.end(JSON.stringify({status:'completed'}));
      }
      const fileMatch=url.pathname.match(/^\/api\/v1\/jobs\/(job-(?:audio|image))\/file$/);
      if(req.method==='GET'&&fileMatch){
        const type=state.jobs[fileMatch[1]]||'image';
        res.writeHead(200,{'content-type':type==='audio'?'audio/wav':'image/png'});
        return res.end(type==='audio'?tinyWav:Buffer.from(tinyPng,'base64'));
      }

      res.writeHead(404,{'content-type':'application/json'});res.end(JSON.stringify({error:'mock route not found',path:url.pathname}));
    });
    srv.listen(port,'127.0.0.1',()=>resolve(srv));
  });
}

async function runProviderAcceptance(provider,appPort,mockPort,state){
  const base=`http://127.0.0.1:${appPort}`;
  const mediaDir=path.join('/tmp',`kiddo-${provider}-${process.pid}`);
  await fs.rm(mediaDir,{recursive:true,force:true});
  const env={
    ...process.env,
    NODE_ENV:'test',
    PORT:String(appPort),
    DATABASE_URL:TEST_DATABASE_URL,
    JWT_SECRET:'kiddo-test-secret-that-is-definitely-longer-than-thirty-two-characters',
    PUBLIC_ORIGIN:'',
    MEDIA_DIR:mediaDir,
    AI_PROVIDER:provider,
    GENX_API_KEY:provider==='genx'?'test-genx':'',
    GENX_BASE_URL:`http://127.0.0.1:${mockPort}`,
    GENX_CHAT_MODEL:'gpt-5.6-luna',
    OPENROUTER_API_KEY:provider==='openrouter'?'test-openrouter':'',
    OPENROUTER_BASE_URL:`http://127.0.0.1:${mockPort}/api/v1`,
    OPENROUTER_CHAT_MODEL:'openai/gpt-5.6-luna',
    OPENROUTER_IMAGE_MODEL:'openai/gpt-5-image',
    OPENROUTER_MUSIC_MODEL:'google/lyria-3-clip-preview',
    STARTING_CREDITS:'100',
    CHAT_CREDIT_COST:'1',
    STORY_CREDIT_COST:'3',
    IMAGE_CREDIT_COST:'10',
    MUSIC_CREDIT_COST:'15',
    DEFAULT_DAILY_MESSAGE_LIMIT:'80'
  };
  const child=spawn(process.execPath,['src/index.js'],{cwd:serverDir,env,stdio:['ignore','pipe','pipe']});
  let logs='';child.stdout.on('data',d=>{logs+=String(d)});child.stderr.on('data',d=>{logs+=String(d)});

  try{
    await waitReady(base,child).catch(e=>{throw new Error(`${e.message}\n${logs}`)});
    const health=await fetch(base+'/health');assert.equal(health.status,200);
    const ready=await fetch(base+'/ready');assert.equal(ready.status,200);

    const jar=new Map();
    let r=await api(base,'/api/auth/register',{method:'POST',jar,body:{
      name:'Test Parent',email:`${provider}-${Date.now()}@example.test`,password:'Correct-Horse-Battery-88',parentConsent:true
    }});
    assert.equal(r.status,201);

    r=await api(base,'/api/children',{method:'POST',jar,body:{name:'Lulu',age:8,avatarChoice:'bubbles',language:'Afrikaans'}});
    assert.equal(r.status,201);const childA=r.payload.child;
    r=await api(base,'/api/children',{method:'POST',jar,body:{name:'Neo',age:9,avatarChoice:'comet',language:'English'}});
    assert.equal(r.status,201);const childB=r.payload.child;

    r=await api(base,'/api/settings',{method:'PATCH',jar,body:{dailyMessageLimit:10,mediaEnabled:true,memoryEnabled:true,voiceEnabled:true,voiceAutoplay:true}});
    assert.equal(r.status,200);assert.equal(r.payload.settings.voice_enabled,true);

    r=await api(base,'/api/chat',{method:'POST',jar,body:{childId:childA.id,message:'Vertel my iets lekker',mode:'chat'}});
    assert.equal(r.status,200);assert.equal(r.payload.emotion,'happy');assert.match(r.payload.reply,/Hallo/);
    assert.match(state.lastSystem,/Use Afrikaans/);
    const convA=r.payload.conversationId;
    const creditsAfterChat=r.payload.credits;

    r=await api(base,'/api/chat',{method:'POST',jar,body:{childId:childA.id,conversationId:convA,message:'FAIL_PROVIDER',mode:'chat'}});
    assert.equal(r.status,500);
    let me=await api(base,'/api/auth/me',{jar});
    assert.equal(me.payload.user.credits,creditsAfterChat);
    const conv=await api(base,`/api/conversations/${convA}`,{jar});
    assert.equal(conv.payload.messages.length,2);

    r=await api(base,'/api/chat',{method:'POST',jar,body:{childId:childB.id,message:'Hello Kiddo',mode:'chat'}});
    assert.equal(r.status,200);const convB=r.payload.conversationId;
    r=await api(base,'/api/chat',{method:'POST',jar,body:{childId:childB.id,conversationId:convB,message:'Keep going',mode:'chat'}});
    assert.equal(r.status,200);

    r=await api(base,'/api/media/generate',{method:'POST',jar,body:{childId:childA.id,prompt:'a tiny friendly moon dragon',type:'image'}});
    assert.ok([201,202].includes(r.status));const imageId=r.payload.media.id;
    if(r.status===202){r=await api(base,`/api/media/${imageId}/status`,{jar});assert.equal(r.payload.media.status,'ready')}
    let file=await raw(base,`/api/media/${imageId}/file`,jar);assert.equal(file.status,200);assert.match(file.contentType,/image/);

    r=await api(base,'/api/media/generate',{method:'POST',jar,body:{childId:childA.id,prompt:'happy playful marimba music for a sunny adventure',type:'audio'}});
    assert.ok([201,202].includes(r.status));const audioId=r.payload.media.id;
    if(r.status===202){r=await api(base,`/api/media/${audioId}/status`,{jar});assert.equal(r.payload.media.status,'ready')}
    file=await raw(base,`/api/media/${audioId}/file`,jar);assert.equal(file.status,200);assert.match(file.contentType,/audio/);

    file=await raw(base,`/api/media/${imageId}/file`,new Map());assert.equal(file.status,401);
    const otherJar=new Map();
    await api(base,'/api/auth/register',{method:'POST',jar:otherJar,body:{
      name:'Other Parent',email:`other-${provider}-${Date.now()}@example.test`,password:'Correct-Horse-Battery-99',parentConsent:true
    }});
    file=await raw(base,`/api/media/${imageId}/file`,otherJar);assert.equal(file.status,404);

    await api(base,'/api/auth/parent-gate/lock',{method:'POST',jar});
    r=await api(base,'/api/settings',{method:'PATCH',jar,body:{dailyMessageLimit:5}});assert.equal(r.status,403);
    r=await api(base,'/api/auth/parent-gate',{method:'POST',jar,body:{password:'Correct-Horse-Battery-88'}});assert.equal(r.status,200);

    const limitJar=new Map();
    r=await api(base,'/api/auth/register',{method:'POST',jar:limitJar,body:{
      name:'Limit Parent',email:`limit-${provider}-${Date.now()}@example.test`,password:'Correct-Horse-Battery-77',parentConsent:true
    }});
    assert.equal(r.status,201);
    r=await api(base,'/api/settings',{method:'PATCH',jar:limitJar,body:{dailyMessageLimit:5}});
    assert.equal(r.status,200);
    const fresh=await api(base,'/api/children',{method:'POST',jar:limitJar,body:{name:'Limit',age:10,avatarChoice:'pixel',language:'English'}});
    const limitChild=fresh.payload.child.id;
    for(let i=0;i<4;i++){
      const x=await api(base,'/api/chat',{method:'POST',jar:limitJar,body:{childId:limitChild,message:`limit ${i}`,mode:'chat'}});
      assert.equal(x.status,200);
    }
    const [x1,x2]=await Promise.all([
      api(base,'/api/chat',{method:'POST',jar:limitJar,body:{childId:limitChild,message:'parallel one',mode:'chat'}}),
      api(base,'/api/chat',{method:'POST',jar:limitJar,body:{childId:limitChild,message:'parallel two',mode:'chat'}})
    ]);
    assert.deepEqual([x1.status,x2.status].sort(),[200,429]);
    r=await api(base,'/api/auth/account',{method:'DELETE',jar:limitJar,body:{password:'Correct-Horse-Battery-77'}});
    assert.equal(r.status,204);

    r=await api(base,'/api/auth/export',{jar});assert.equal(r.status,200);assert.ok(r.payload.children.length>=2);
    r=await api(base,'/api/auth/account',{method:'DELETE',jar,body:{password:'Correct-Horse-Battery-88'}});assert.equal(r.status,204);
    r=await api(base,'/api/auth/me',{jar});assert.equal(r.status,401);
  } finally {
    await stop(child);
    await fs.rm(mediaDir,{recursive:true,force:true});
  }
}

test('GenX and OpenRouter expose the same Kiddo core features',async()=>{
  const state={lastSystem:'',jobs:{}};
  const mock=await startMockProvider(3196,state);
  try{
    await runProviderAcceptance('openrouter',3197,3196,state);
    state.lastSystem='';state.jobs={};
    await runProviderAcceptance('genx',3198,3196,state);
  } finally {
    await new Promise(resolve=>mock.close(resolve));
  }
});
