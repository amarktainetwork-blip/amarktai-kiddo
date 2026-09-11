import { config } from './config.js';

function providerOrder(){if(config.aiProvider==='genx')return['genx'];if(config.aiProvider==='openrouter')return['openrouter'];const order=[];if(config.genx.key)order.push('genx');if(config.openrouter.key)order.push('openrouter');return order}

async function openAiCompatible({baseUrl,apiKey,model,messages,headers={}}){const response=await fetch(`${baseUrl}/chat/completions`,{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json',...headers},body:JSON.stringify({model,messages,temperature:.65,max_tokens:1200})});const payload=await response.json().catch(()=>({}));if(!response.ok)throw new Error(payload?.error?.message||payload?.error||`AI request failed (${response.status}).`);return String(payload?.choices?.[0]?.message?.content||'')}

export async function generateText(messages){const errors=[];for(const provider of providerOrder()){try{if(provider==='genx'){const output=await openAiCompatible({baseUrl:`${config.genx.baseUrl}/v1`,apiKey:config.genx.key,model:config.genx.chatModel,messages});return{provider,model:config.genx.chatModel,output}}const output=await openAiCompatible({baseUrl:config.openrouter.baseUrl,apiKey:config.openrouter.key,model:config.openrouter.chatModel,messages,headers:{...(config.publicOrigin?{'HTTP-Referer':config.publicOrigin}:{}),'X-Title':'Amarktai Kiddo'}});return{provider,model:config.openrouter.chatModel,output}}catch(error){errors.push(`${provider}: ${error.message}`)}}throw new Error(errors.length?`No AI provider completed the request. ${errors.join(' | ')}`:'No AI provider is configured. Add GENX_API_KEY or OPENROUTER_API_KEY.')}

async function genxModels(category){if(!config.genx.key)return[];const response=await fetch(`${config.genx.baseUrl}/api/v1/models?category=${encodeURIComponent(category)}`,{headers:{Authorization:`Bearer ${config.genx.key}`}});if(!response.ok)return[];const payload=await response.json().catch(()=>({}));const list=Array.isArray(payload)?payload:(payload.models||payload.data||[]);return list.map((m)=>({id:m.id||m.model_id||m.slug||m.name,name:m.name||m.id||''})).filter((m)=>m.id)}
async function chooseGenxModel(category,configured){if(configured)return configured;const models=await genxModels(category);const preferred=category==='audio'?models.find((m)=>/lyria.*pro|music/i.test(`${m.id} ${m.name}`))||models.find((m)=>/lyria|music/i.test(`${m.id} ${m.name}`)):models.find((m)=>/grok.*imagine|gpt.*image|nano.*banana/i.test(`${m.id} ${m.name}`));return preferred?.id||models[0]?.id||''}

export async function submitGenxMedia(type,prompt,metadata={}){if(!config.genx.key)throw new Error('GenX is required for this media type but GENX_API_KEY is not configured.');const category=type==='audio'?'audio':'image';const model=await chooseGenxModel(category,type==='audio'?config.genx.musicModel:config.genx.imageModel);if(!model)throw new Error(`No GenX ${category} model is currently available.`);const params=type==='audio'?{prompt,duration:30}:{prompt};const response=await fetch(`${config.genx.baseUrl}/api/v1/generate`,{method:'POST',headers:{Authorization:`Bearer ${config.genx.key}`,'Content-Type':'application/json'},body:JSON.stringify({model,params,metadata})});const payload=await response.json().catch(()=>({}));if(!response.ok)throw new Error(payload?.error?.message||payload?.error||`GenX media request failed (${response.status}).`);const jobId=payload.job_id||payload.id;if(!jobId)throw new Error('GenX did not return a job ID.');return{provider:'genx',model,jobId:String(jobId)}}
export async function getGenxJob(jobId){const response=await fetch(`${config.genx.baseUrl}/api/v1/jobs/${encodeURIComponent(jobId)}`,{headers:{Authorization:`Bearer ${config.genx.key}`}});const payload=await response.json().catch(()=>({}));if(!response.ok)throw new Error(payload?.error?.message||payload?.error||`GenX job check failed (${response.status}).`);return payload}
export async function downloadGenxJobFile(jobId){const response=await fetch(`${config.genx.baseUrl}/api/v1/jobs/${encodeURIComponent(jobId)}/file`,{headers:{Authorization:`Bearer ${config.genx.key}`}});if(!response.ok)throw new Error(`GenX result download failed (${response.status}).`);return{buffer:Buffer.from(await response.arrayBuffer()),mimeType:response.headers.get('content-type')||'application/octet-stream'}}

export async function generateOpenRouterImage(prompt){
  if(!config.openrouter.key)throw new Error('OPENROUTER_API_KEY is not configured.');
  const response=await fetch(`${config.openrouter.baseUrl}/images`,{
    method:'POST',
    headers:{
      Authorization:`Bearer ${config.openrouter.key}`,
      'Content-Type':'application/json',
      ...(config.publicOrigin?{'HTTP-Referer':config.publicOrigin}:{}),
      'X-Title':'Amarktai Kiddo'
    },
    body:JSON.stringify({model:config.openrouter.imageModel,prompt,n:1})
  });
  const payload=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(payload?.error?.message||payload?.error||`OpenRouter image request failed (${response.status}).`);
  const item=payload?.data?.[0];
  const mimeType=item?.media_type||'image/png';
  const image=item?.b64_json?`data:${mimeType};base64,${item.b64_json}`:item?.url;
  if(!image)throw new Error('OpenRouter completed the image request but returned no image data.');
  return{provider:'openrouter',model:config.openrouter.imageModel,image};
}
export function capabilities(){const text=providerOrder().length>0;return{configured:text,activeProvider:providerOrder()[0]||null,chat:text,story:text,image:Boolean(config.genx.key||config.openrouter.key),music:Boolean(config.genx.key)}}
