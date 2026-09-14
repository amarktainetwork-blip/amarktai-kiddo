import { FormEvent,useCallback,useEffect,useMemo,useRef,useState } from 'react';
import { useLocation,useNavigate } from 'react-router-dom';
import { Image, Keyboard, Mic2, Music2, PhoneOff, Sparkles, Volume2, Wand2 } from 'lucide-react';
import AppShell from '../components/AppShell';
import CompanionAvatar from '../components/CompanionAvatar';
import { api } from '../lib/api';
import type { Child,Emotion,Message,SessionData } from '../lib/types';

const speechLocales:Record<string,string>={English:'en-ZA',Afrikaans:'af-ZA',Zulu:'zu-ZA'};
type Experience='talk'|'story'|'image'|'music';

export default function Chat(){
  const n=useNavigate(),loc=useLocation();
  const params=new URLSearchParams(loc.search);
  const requestedConversation=params.get('conversation')||undefined;
  const initialMode=(params.get('mode') as Experience)||'talk';
  const requestedChild=params.get('child')||'';
  const recognitionRef=useRef<any>(null);
  const voiceSessionRef=useRef(false);
  const busyRef=useRef(false);
  const utteranceHandlerRef=useRef<(value:string)=>void>(()=>{});
  const[data,setData]=useState<SessionData|null>(null);
  const[childId,setChildId]=useState(requestedChild);
  const[conversationId,setConversationId]=useState<string|undefined>(requestedConversation);
  const[messages,setMessages]=useState<Message[]>([]);
  const[experience,setExperience]=useState<Experience>(initialMode);
  const[emotion,setEmotion]=useState<Emotion>('idle');
  const[listening,setListening]=useState(false);
  const[speaking,setSpeaking]=useState(false);
  const[busy,setBusy]=useState(false);
  const[voiceActive,setVoiceActive]=useState(false);
  const[liveTranscript,setLiveTranscript]=useState('');
  const[liveReply,setLiveReply]=useState('');
  const[error,setError]=useState('');
  const[showKeyboard,setShowKeyboard]=useState(false);
  const[typed,setTyped]=useState('');

  useEffect(()=>{busyRef.current=busy},[busy]);
  useEffect(()=>{
    void api.lockParent().catch(()=>{});
    api.me().then(me=>{setData(me);if(!childId&&me.children[0])setChildId(me.children[0].id)}).catch(()=>n('/login'));
    return()=>{voiceSessionRef.current=false;try{recognitionRef.current?.stop?.()}catch{};window.speechSynthesis?.cancel?.()};
  },[]);
  useEffect(()=>{if(!conversationId)return;api.conversation(conversationId).then(r=>{setMessages(r.messages);setChildId(r.conversation.child_id);setExperience(r.conversation.mode==='story'?'story':'talk');const last=[...r.messages].reverse().find(m=>m.role==='assistant'&&m.emotion);if(last?.emotion)setEmotion(last.emotion)}).catch(e=>setError(e.message))},[conversationId]);

  const child:Child|undefined=useMemo(()=>data?.children.find(c=>c.id===childId),[data,childId]);
  const locale=speechLocales[child?.language||'English']||'en-ZA';
  const voiceAllowed=data?.childSettings?.voice_enabled!==false;
  const mediaAllowed=data?.childSettings?.media_enabled!==false;

  const startListening=useCallback(()=>{
    if(!voiceSessionRef.current||busyRef.current||speaking||!voiceAllowed)return;
    const Recognition=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;
    if(!Recognition){setError('This browser does not support voice recognition. Please use Chrome or Edge.');setVoiceActive(false);voiceSessionRef.current=false;return}
    try{recognitionRef.current?.stop?.()}catch{}
    const recognition=new Recognition();
    recognition.lang=locale;recognition.continuous=false;recognition.interimResults=true;recognition.maxAlternatives=1;
    let finalText='';
    recognition.onstart=()=>{setListening(true);setLiveTranscript('');setEmotion('curious');setError('')};
    recognition.onresult=(event:any)=>{let interim='';for(let i=event.resultIndex;i<event.results.length;i++){const text=event.results[i][0]?.transcript||'';if(event.results[i].isFinal)finalText+=text;else interim+=text}setLiveTranscript((finalText+' '+interim).trim())};
    recognition.onerror=(event:any)=>{if(!['aborted','no-speech'].includes(event?.error))setError('I could not hear that clearly. Try again.')};
    recognition.onend=()=>{setListening(false);recognitionRef.current=null;const value=finalText.trim();if(value){setLiveTranscript(value);utteranceHandlerRef.current(value)}else if(voiceSessionRef.current&&!busyRef.current)setTimeout(startListening,450)};
    recognitionRef.current=recognition;recognition.start();
  },[locale,speaking,voiceAllowed]);

  const reveal=(text:string)=>{setLiveReply('');const words=text.split(/\s+/);let i=0;const timer=window.setInterval(()=>{i++;setLiveReply(words.slice(0,i).join(' '));if(i>=words.length)window.clearInterval(timer)},35)};
  const speak=useCallback((text:string)=>{
    reveal(text);
    if(!voiceAllowed||!('speechSynthesis' in window)){if(voiceSessionRef.current)setTimeout(startListening,500);return}
    window.speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(text);u.lang=locale;u.rate=.96;u.pitch=1.08;
    const voices=window.speechSynthesis.getVoices();u.voice=voices.find(v=>v.lang.toLowerCase()===locale.toLowerCase())||voices.find(v=>v.lang.toLowerCase().startsWith(locale.slice(0,2).toLowerCase()))||null;
    u.onstart=()=>{setSpeaking(true);setListening(false)};
    u.onend=()=>{setSpeaking(false);if(voiceSessionRef.current)setTimeout(startListening,450)};
    u.onerror=()=>{setSpeaking(false);if(voiceSessionRef.current)setTimeout(startListening,450)};
    window.speechSynthesis.speak(u);
  },[locale,startListening,voiceAllowed]);

  const createMedia=async(type:'image'|'audio',prompt:string)=>{
    if(!childId||!mediaAllowed)return;
    setBusy(true);setEmotion('thinking');setError('');
    try{const r=await api.generateMedia({childId,prompt,type});const reply=type==='image'?'I’m making your picture now. I’ll save it in Creations when it is ready!':'I’m making your music now. I’ll save it in Creations when it is ready!';setMessages(m=>[...m,{role:'user',content:prompt},{role:'assistant',content:reply,emotion:'excited'}]);setEmotion('excited');speak(reply);if(r.credits!==undefined&&data)setData({...data,user:{...data.user,credits:r.credits}})}
    catch(e:any){setError(e.message);setEmotion('worried');speak('I could not create that just now. Let’s try another idea.')}finally{setBusy(false)}
  };

  const handleUtterance=useCallback(async(value:string)=>{
    if(!value.trim()||!childId||busyRef.current)return;
    setBusy(true);setError('');setEmotion('thinking');setLiveReply('');
    if(experience==='image'){await createMedia('image',value);return}
    if(experience==='music'){await createMedia('audio',value);return}
    setMessages(m=>[...m,{role:'user',content:value}]);
    try{const r=await api.chat({childId,conversationId,message:value,mode:experience==='story'?'story':'chat'});setConversationId(r.conversationId);setMessages(m=>[...m,{role:'assistant',content:r.reply,emotion:r.emotion}]);setEmotion(r.emotion);if(data)setData({...data,user:{...data.user,credits:r.credits}});setBusy(false);speak(r.reply)}
    catch(e:any){setBusy(false);setError(e.message);setEmotion('worried');if(voiceSessionRef.current)speak('I had trouble answering that. Please try again.')}
  },[childId,conversationId,data,experience,speak]);
  useEffect(()=>{utteranceHandlerRef.current=handleUtterance},[handleUtterance]);

  const startVoice=()=>{if(!voiceAllowed){setError('Voice has been disabled in Parent Controls.');return}voiceSessionRef.current=true;setVoiceActive(true);setError('');startListening()};
  const stopVoice=()=>{voiceSessionRef.current=false;setVoiceActive(false);setListening(false);setSpeaking(false);try{recognitionRef.current?.stop?.()}catch{};window.speechSynthesis?.cancel?.();setEmotion('idle')};
  const submitTyped=(e:FormEvent)=>{e.preventDefault();const value=typed.trim();if(!value)return;setTyped('');void handleUtterance(value)};

  if(!data)return <AppShell><div className="loading">Loading Kiddo…</div></AppShell>;
  if(!data.children.length)return <AppShell><div className="empty-state"><CompanionAvatar emotion="curious"/><h2>Add a child profile first</h2><button className="btn primary" onClick={()=>n('/parent')}>Open Parent Controls</button></div></AppShell>;
  const title=experience==='story'?'Story time':experience==='image'?'Create a picture':experience==='music'?'Create music':'Talk with Kiddo';
  const hint=experience==='story'?'Tell me what kind of story you want.':experience==='image'?'Describe the picture you want me to create.':experience==='music'?'Tell me what kind of music you want to make.':'Tap once, then just talk. I’ll listen again after every reply.';

  return <AppShell><div className="voice-page">
    <header className="voice-head"><div><span className="eyebrow">Voice companion</span><h1>{title}</h1><p>{hint}</p></div><div className="voice-head-actions"><select value={childId} onChange={e=>{stopVoice();setChildId(e.target.value);setConversationId(undefined);setMessages([])}}>{data.children.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select><span className="credit-pill"><Sparkles size={15}/>{data.user.credits}</span></div></header>
    <section className="voice-stage">
      <div className="voice-companion"><CompanionAvatar emotion={listening?'curious':busy?'thinking':emotion} name={child?.name?child.name+"'s Kiddo":'Kiddo'} variant={child?.avatar_choice} listening={listening} speaking={speaking}/></div>
      <div className="voice-state"><b>{listening?'Listening…':speaking?'Speaking…':busy?'Thinking…':voiceActive?'Ready for you…':'Ready when you are'}</b><span>{liveTranscript||(!voiceActive?'Start a hands-free conversation.':'')}</span></div>
      {liveReply&&<div className="spoken-reply"><Volume2/>{liveReply}</div>}
      {error&&<div className="notice error">{error}</div>}
      <div className="voice-main-control">{voiceActive?<button className="end-voice" onClick={stopVoice}><PhoneOff/>End conversation</button>:<button className="start-voice" onClick={startVoice}><Mic2/>Start talking</button>}</div>
      <div className="experience-switch"><button className={experience==='talk'?'active':''} onClick={()=>{stopVoice();setExperience('talk')}}><Mic2/>Talk</button><button className={experience==='story'?'active':''} onClick={()=>{stopVoice();setExperience('story')}}><Wand2/>Story</button><button className={experience==='image'?'active':''} disabled={!mediaAllowed} onClick={()=>{stopVoice();setExperience('image')}}><Image/>Picture</button><button className={experience==='music'?'active':''} disabled={!mediaAllowed} onClick={()=>{stopVoice();setExperience('music')}}><Music2/>Music</button></div>
    </section>
    <section className="conversation-drawer"><button className="keyboard-toggle" onClick={()=>setShowKeyboard(v=>!v)}><Keyboard/> {showKeyboard?'Hide keyboard':'Type instead'}</button>{showKeyboard&&<form className="fallback-composer" onSubmit={submitTyped}><input value={typed} onChange={e=>setTyped(e.target.value)} placeholder="Typing is optional…"/><button disabled={!typed.trim()||busy}>Send</button></form>}<div className="conversation-transcript">{messages.slice(-8).map((m,i)=><div key={m.id||i} className={m.role}><b>{m.role==='assistant'?'Kiddo':'You'}</b><span>{m.content}</span></div>)}</div></section>
  </div></AppShell>;
}
