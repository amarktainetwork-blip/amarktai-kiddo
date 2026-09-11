import type { Capabilities, Child, Conversation, MediaItem, Message, SessionData, Settings } from './types';

async function request<T>(path:string, options:RequestInit = {}):Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const response = await fetch(path, { credentials:'include', ...options, headers });
  if (response.status===204) return undefined as T;
  const body=await response.json().catch(()=>({}));
  if(!response.ok) throw new Error(body?.error||`Request failed (${response.status})`);
  return body as T;
}
export const api={
  register:(input:{name:string;email:string;password:string;parentConsent:true})=>request<{user:SessionData['user']}>('/api/auth/register',{method:'POST',body:JSON.stringify(input)}),
  login:(email:string,password:string)=>request<{user:SessionData['user']}>('/api/auth/login',{method:'POST',body:JSON.stringify({email,password})}),
  logout:()=>request<void>('/api/auth/logout',{method:'POST'}),me:()=>request<SessionData>('/api/auth/me'),status:()=>request<{capabilities:Capabilities}>('/api/system/status'),
  parentGateStatus:()=>request<{unlocked:boolean}>('/api/auth/parent-gate'),unlockParent:(password:string)=>request<{unlocked:boolean}>('/api/auth/parent-gate',{method:'POST',body:JSON.stringify({password})}),lockParent:()=>request<{unlocked:boolean}>('/api/auth/parent-gate/lock',{method:'POST'}),
  exportData:()=>request<Record<string,unknown>>('/api/auth/export'),changePassword:(currentPassword:string,newPassword:string)=>request<{changed:boolean}>('/api/auth/change-password',{method:'POST',body:JSON.stringify({currentPassword,newPassword})}),deleteAccount:(password:string)=>request<void>('/api/auth/account',{method:'DELETE',body:JSON.stringify({password})}),
  createChild:(input:{name:string;age:number;avatarChoice:string;language:string})=>request<{child:Child}>('/api/children',{method:'POST',body:JSON.stringify(input)}),
  updateChild:(id:string,input:Partial<{name:string;age:number;avatarChoice:string;language:string}>)=>request<{child:Child}>(`/api/children/${id}`,{method:'PATCH',body:JSON.stringify(input)}),deleteChild:(id:string)=>request<void>(`/api/children/${id}`,{method:'DELETE'}),
  settings:(input:Partial<{dailyMessageLimit:number;mediaEnabled:boolean;memoryEnabled:boolean}>)=>request<{settings:Settings}>('/api/settings',{method:'PATCH',body:JSON.stringify(input)}),
  conversations:()=>request<{conversations:Conversation[]}>('/api/conversations'),conversation:(id:string)=>request<{conversation:Conversation;messages:Message[]}>(`/api/conversations/${id}`),
  chat:(input:{childId:string;conversationId?:string;message:string;mode:'chat'|'story'})=>request<{conversationId:string;reply:string;emotion:any;credits:number;provider:string}>('/api/chat',{method:'POST',body:JSON.stringify(input)}),
  media:()=>request<{media:MediaItem[]}>('/api/media'),generateMedia:(input:{childId:string;prompt:string;type:'image'|'audio'})=>request<{media:{id:string;status:string;type:string};credits?:number;provider:string}>('/api/media/generate',{method:'POST',body:JSON.stringify(input)}),
  mediaStatus:(id:string)=>request<{media:{id:string;status:string;type:string;error?:string}}>(`/api/media/${id}/status`),deleteMedia:(id:string)=>request<void>(`/api/media/${id}`,{method:'DELETE'})
};
