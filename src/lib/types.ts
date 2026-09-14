export type Emotion = 'happy'|'excited'|'curious'|'thinking'|'proud'|'calm'|'sad'|'worried'|'surprised'|'playful'|'sleepy'|'idle';
export type Child = { id:string; name:string; age:number; avatar_choice:string; language:string; created_at?:string };
export type User = { id:string; email:string; name:string; credits:number; createdAt?:string };
export type Settings = {
  daily_message_limit:number;
  media_enabled:boolean;
  memory_enabled:boolean;
  voice_enabled:boolean;
  voice_autoplay:boolean;
};
export type ChildSettings = {
  media_enabled:boolean;
  voice_enabled:boolean;
  voice_autoplay:boolean;
};
export type SessionData = {
  user:User;
  children:Child[];
  settings?:Settings;
  childSettings?:ChildSettings;
  ledger?:Array<{amount:number;reason:string;created_at:string}>;
  parentGateUnlocked?:boolean;
};
export type Conversation = { id:string; child_id:string; child_name?:string; title:string; mode:'chat'|'story'; created_at:string; updated_at:string };
export type Message = { id?:string; role:'user'|'assistant'; content:string; emotion?:Emotion; created_at?:string };
export type MediaItem = { id:string; child_id:string; type:'image'|'audio'; title:string; prompt:string; status:'queued'|'processing'|'ready'|'failed'; error_message?:string; created_at:string; updated_at:string };
export type Capabilities = { configured:boolean; activeProvider:string|null; chat:boolean; story:boolean; image:boolean; music:boolean; voice:boolean };
