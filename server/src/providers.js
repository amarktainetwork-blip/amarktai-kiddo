import { config } from './config.js';

function timeoutSignal(ms){return AbortSignal.timeout(Math.max(1000,ms))}

async function errorMessage(response,label){
  const payload=await response.json().catch(()=>null);
  return payload?.error?.message||payload?.error||payload?.message||`${label} failed (${response.status}).`;
}

export function providerOrder(){
  if(config.aiProvider==='genx')return config.genx.key?['genx']:[];
  if(config.aiProvider==='openrouter')return config.openrouter.key?['openrouter']:[];
  const order=[];
  if(config.genx.key)order.push('genx');
  if(config.openrouter.key)order.push('openrouter');
  return order;
}

async function openAiCompatible({baseUrl,apiKey,model,messages,headers={}}){
  const response=await fetch(`${baseUrl}/chat/completions`,{
    method:'POST',
    signal:timeoutSignal(config.timeouts.text),
    headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json',...headers},
    body:JSON.stringify({model,messages,temperature:.65,max_tokens:1200})
  });
  if(!response.ok)throw new Error(await errorMessage(response,'AI request'));
  const payload=await response.json().catch(()=>({}));
  return String(payload?.choices?.[0]?.message?.content||'');
}

export async function generateText(messages){
  const errors=[];
  for(const provider of providerOrder()){
    try{
      if(provider==='genx'){
        const output=await openAiCompatible({
          baseUrl:`${config.genx.baseUrl}/v1`,
          apiKey:config.genx.key,
          model:config.genx.chatModel,
          messages
        });
        return{provider,model:config.genx.chatModel,output};
      }
      const output=await openAiCompatible({
        baseUrl:config.openrouter.baseUrl,
        apiKey:config.openrouter.key,
        model:config.openrouter.chatModel,
        messages,
        headers:{
          ...(config.publicOrigin?{'HTTP-Referer':config.publicOrigin}:{}),
          'X-Title':'Amarktai Kiddo'
        }
      });
      return{provider,model:config.openrouter.chatModel,output};
    }catch(error){
      errors.push(`${provider}: ${error.message}`);
    }
  }
  throw new Error(errors.length
    ? `No AI provider completed the request. ${errors.join(' | ')}`
    : 'No AI provider is configured. Add GENX_API_KEY or OPENROUTER_API_KEY.');
}

async function genxModels(category){
  if(!config.genx.key)return[];
  const response=await fetch(
    `${config.genx.baseUrl}/api/v1/models?category=${encodeURIComponent(category)}`,
    {headers:{Authorization:`Bearer ${config.genx.key}`},signal:timeoutSignal(config.timeouts.health)}
  );
  if(!response.ok)return[];
  const payload=await response.json().catch(()=>({}));
  const list=Array.isArray(payload)?payload:(payload.models||payload.data||[]);
  return list
    .map((m)=>({id:m.id||m.model_id||m.slug||m.name,name:m.name||m.id||''}))
    .filter((m)=>m.id);
}

async function chooseGenxModel(category,configured){
  if(configured)return configured;
  const models=await genxModels(category);
  const hay=(m)=>`${m.id} ${m.name}`;
  if(category==='audio'){
    return (models.find((m)=>/lyria.*clip/i.test(hay(m)))||
      models.find((m)=>/lyria.*pro|music/i.test(hay(m)))||
      models[0])?.id||'';
  }
  return (models.find((m)=>/gpt.*image|grok.*imagine|nano.*banana|recraft/i.test(hay(m)))||
    models[0])?.id||'';
}

export async function submitGenxMedia(type,prompt,metadata={}){
  if(!config.genx.key)throw new Error('GENX_API_KEY is not configured.');
  const category=type==='audio'?'audio':'image';
  const model=await chooseGenxModel(
    category,
    type==='audio'?config.genx.musicModel:config.genx.imageModel
  );
  if(!model)throw new Error(`No GenX ${category} model is currently available.`);
  const params=type==='audio'?{prompt,duration:30}:{prompt};
  const response=await fetch(`${config.genx.baseUrl}/api/v1/generate`,{
    method:'POST',
    signal:timeoutSignal(config.timeouts.media),
    headers:{Authorization:`Bearer ${config.genx.key}`,'Content-Type':'application/json'},
    body:JSON.stringify({model,params,metadata})
  });
  if(!response.ok)throw new Error(await errorMessage(response,'GenX media request'));
  const payload=await response.json().catch(()=>({}));
  const jobId=payload.job_id||payload.id;
  if(!jobId)throw new Error('GenX did not return a job ID.');
  return{provider:'genx',model,jobId:String(jobId)};
}

export async function getGenxJob(jobId){
  const response=await fetch(
    `${config.genx.baseUrl}/api/v1/jobs/${encodeURIComponent(jobId)}`,
    {headers:{Authorization:`Bearer ${config.genx.key}`},signal:timeoutSignal(config.timeouts.health)}
  );
  if(!response.ok)throw new Error(await errorMessage(response,'GenX job check'));
  return response.json().catch(()=>({}));
}

export async function downloadGenxJobFile(jobId){
  const response=await fetch(
    `${config.genx.baseUrl}/api/v1/jobs/${encodeURIComponent(jobId)}/file`,
    {headers:{Authorization:`Bearer ${config.genx.key}`},signal:timeoutSignal(config.timeouts.media)}
  );
  if(!response.ok)throw new Error(await errorMessage(response,'GenX result download'));
  return{
    buffer:Buffer.from(await response.arrayBuffer()),
    mimeType:response.headers.get('content-type')||'application/octet-stream'
  };
}

function openRouterHeaders(){
  return{
    Authorization:`Bearer ${config.openrouter.key}`,
    'Content-Type':'application/json',
    ...(config.publicOrigin?{'HTTP-Referer':config.publicOrigin}:{}),
    'X-Title':'Amarktai Kiddo'
  };
}

export async function generateOpenRouterImage(prompt){
  if(!config.openrouter.key)throw new Error('OPENROUTER_API_KEY is not configured.');
  const response=await fetch(`${config.openrouter.baseUrl}/images`,{
    method:'POST',
    signal:timeoutSignal(config.timeouts.media),
    headers:openRouterHeaders(),
    body:JSON.stringify({
      model:config.openrouter.imageModel,
      prompt,
      n:1,
      aspect_ratio:'1:1',
      quality:'medium',
      output_format:'png'
    })
  });
  if(!response.ok)throw new Error(await errorMessage(response,'OpenRouter image request'));
  const payload=await response.json().catch(()=>({}));
  const item=payload?.data?.[0];
  const mimeType=item?.media_type||'image/png';
  const image=item?.b64_json?`data:${mimeType};base64,${item.b64_json}`:item?.url;
  if(!image)throw new Error('OpenRouter completed the image request but returned no image data.');
  return{provider:'openrouter',model:config.openrouter.imageModel,image};
}

function parseOpenRouterAudioSse(text){
  let audio='';
  for(const line of text.split(/\r?\n/)){
    if(!line.startsWith('data: '))continue;
    const raw=line.slice(6).trim();
    if(!raw||raw==='[DONE]')continue;
    try{
      const chunk=JSON.parse(raw);
      const data=chunk?.choices?.[0]?.delta?.audio?.data;
      if(typeof data==='string')audio+=data;
    }catch{}
  }
  return audio;
}

export async function generateOpenRouterMusic(prompt){
  if(!config.openrouter.key)throw new Error('OPENROUTER_API_KEY is not configured.');
  const response=await fetch(`${config.openrouter.baseUrl}/chat/completions`,{
    method:'POST',
    signal:timeoutSignal(config.timeouts.media),
    headers:openRouterHeaders(),
    body:JSON.stringify({
      model:config.openrouter.musicModel,
      messages:[{role:'user',content:prompt}],
      modalities:['text','audio'],
      audio:{format:'wav'},
      stream:true
    })
  });
  if(!response.ok)throw new Error(await errorMessage(response,'OpenRouter music request'));

  const contentType=response.headers.get('content-type')||'';
  let audioB64='';
  if(contentType.includes('application/json')){
    const payload=await response.json().catch(()=>({}));
    audioB64=payload?.choices?.[0]?.message?.audio?.data||'';
  }else{
    audioB64=parseOpenRouterAudioSse(await response.text());
  }
  if(!audioB64)throw new Error('OpenRouter completed the music request but returned no audio data.');
  return{
    provider:'openrouter',
    model:config.openrouter.musicModel,
    buffer:Buffer.from(audioB64,'base64'),
    mimeType:'audio/wav'
  };
}

async function checkGenx(){
  const response=await fetch(`${config.genx.baseUrl}/api/v1/account/credits`,{
    headers:{Authorization:`Bearer ${config.genx.key}`},
    signal:timeoutSignal(config.timeouts.health)
  });
  if(!response.ok)throw new Error(`GenX key check failed (${response.status}).`);
  return true;
}

async function checkOpenRouter(){
  const response=await fetch(`${config.openrouter.baseUrl}/key`,{
    headers:{Authorization:`Bearer ${config.openrouter.key}`},
    signal:timeoutSignal(config.timeouts.health)
  });
  if(!response.ok)throw new Error(`OpenRouter key check failed (${response.status}).`);
  return true;
}

export async function providerReadiness(){
  const errors=[];
  for(const provider of providerOrder()){
    try{
      if(provider==='genx')await checkGenx();
      else await checkOpenRouter();
      return{ready:true,provider};
    }catch(error){
      errors.push(`${provider}: ${error.message}`);
    }
  }
  return{ready:false,provider:null,error:errors.join(' | ')||'No AI provider configured.'};
}

export function capabilities(){
  const order=providerOrder();
  const configured=order.length>0;
  return{
    configured,
    activeProvider:order[0]||null,
    chat:configured,
    story:configured,
    image:configured,
    music:configured,
    voice:configured
  };
}
