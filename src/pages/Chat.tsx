import { FormEvent,useEffect,useMemo,useRef,useState } from 'react';
import { useLocation,useNavigate } from 'react-router-dom';
import { BookOpen,Image,MessageCircle,Mic,MicOff,Music2,Send,Sparkles,Volume2 } from 'lucide-react';
import AppShell from '../components/AppShell';
import CompanionAvatar from '../components/CompanionAvatar';
import { api } from '../lib/api';
import type { Capabilities,Child,Emotion,Message,SessionData } from '../lib/types';

const speechLocales:Record<string,string>={
  English:'en-ZA',
  Afrikaans:'af-ZA',
  Zulu:'zu-ZA'
};

export default function Chat(){
  const n=useNavigate();
  const loc=useLocation();
  const requestedConversationId=new URLSearchParams(loc.search).get('conversation')||undefined;
  const recognitionRef=useRef<any>(null);

  const[session,setSession]=useState<SessionData|null>(null);
  const[caps,setCaps]=useState<Capabilities|null>(null);
  const[childId,setChildId]=useState('');
  const[conversationId,setConversationId]=useState<string|undefined>(requestedConversationId);
  const[messages,setMessages]=useState<Message[]>([]);
  const[input,setInput]=useState('');
  const[mode,setMode]=useState<'chat'|'story'>('chat');
  const[emotion,setEmotion]=useState<Emotion>('idle');
  const[busy,setBusy]=useState(false);
  const[error,setError]=useState('');
  const[createType,setCreateType]=useState<'image'|'audio'|null>(null);
  const[listening,setListening]=useState(false);
  const[speaking,setSpeaking]=useState(false);

  useEffect(()=>{
    void api.lockParent().catch(()=>{});
    Promise.all([api.me(),api.status()])
      .then(([me,s])=>{
        setSession(me);
        setCaps(s.capabilities);
        if(!requestedConversationId&&me.children[0])setChildId(me.children[0].id);
      })
      .catch(()=>n('/login'));

    return()=>{
      try{recognitionRef.current?.stop?.()}catch{}
      if('speechSynthesis' in window)window.speechSynthesis.cancel();
    };
  },[]);

  useEffect(()=>{
    if(!conversationId)return;
    api.conversation(conversationId)
      .then(r=>{
        setMessages(r.messages);
        setChildId(r.conversation.child_id);
        setMode(r.conversation.mode);
        const last=[...r.messages].reverse().find(m=>m.role==='assistant'&&m.emotion);
        if(last?.emotion)setEmotion(last.emotion);
      })
      .catch(e=>setError(e.message));
  },[conversationId]);

  const child:Child|undefined=useMemo(
    ()=>session?.children.find(c=>c.id===childId),
    [session,childId]
  );

  const voiceEnabled=Boolean(caps?.voice)&&session?.childSettings?.voice_enabled!==false;
  const mediaEnabled=session?.childSettings?.media_enabled!==false;
  const voiceAutoplay=voiceEnabled&&session?.childSettings?.voice_autoplay===true;
  const speechLocale=speechLocales[child?.language||'English']||'en-ZA';

  const speak=(text:string)=>{
    if(!voiceEnabled||!('speechSynthesis' in window))return;
    window.speechSynthesis.cancel();
    const utterance=new SpeechSynthesisUtterance(text);
    utterance.lang=speechLocale;
    utterance.rate=.98;
    utterance.pitch=1.08;
    const voices=window.speechSynthesis.getVoices();
    const preferred=voices.find(v=>v.lang.toLowerCase()===speechLocale.toLowerCase())||
      voices.find(v=>v.lang.toLowerCase().startsWith(speechLocale.slice(0,2).toLowerCase()));
    if(preferred)utterance.voice=preferred;
    utterance.onstart=()=>setSpeaking(true);
    utterance.onend=()=>setSpeaking(false);
    utterance.onerror=()=>setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const toggleListening=()=>{
    if(!voiceEnabled)return;
    if(listening){
      recognitionRef.current?.stop?.();
      return;
    }
    const Recognition=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;
    if(!Recognition){
      setError('Voice input is not supported by this browser. You can still type and use read-aloud.');
      return;
    }

    const recognition=new Recognition();
    recognition.lang=speechLocale;
    recognition.continuous=false;
    recognition.interimResults=true;
    recognition.maxAlternatives=1;
    recognition.onstart=()=>{setListening(true);setError('')};
    recognition.onresult=(event:any)=>{
      let transcript='';
      for(let i=event.resultIndex;i<event.results.length;i++){
        transcript+=event.results[i][0]?.transcript||'';
      }
      if(transcript.trim())setInput(transcript.trim());
    };
    recognition.onerror=(event:any)=>{
      if(event?.error!=='aborted')setError('I could not hear that clearly. Try the microphone again or type your message.');
    };
    recognition.onend=()=>{setListening(false);recognitionRef.current=null};
    recognitionRef.current=recognition;
    recognition.start();
  };

  const send=async(e:FormEvent)=>{
    e.preventDefault();
    if(!input.trim()||!childId||busy)return;
    const value=input.trim();
    const optimistic:Message={role:'user',content:value};
    setInput('');
    setError('');
    setMessages(m=>[...m,optimistic]);
    setBusy(true);
    setEmotion('thinking');

    try{
      const r=await api.chat({childId,conversationId,message:value,mode});
      setConversationId(r.conversationId);
      setMessages(m=>[...m,{role:'assistant',content:r.reply,emotion:r.emotion}]);
      setEmotion(r.emotion);
      if(session)setSession({...session,user:{...session.user,credits:r.credits}});
      if(voiceAutoplay)speak(r.reply);
    }catch(err:any){
      setMessages(m=>{
        const copy=[...m];
        const index=copy.lastIndexOf(optimistic);
        if(index>=0)copy.splice(index,1);
        return copy;
      });
      setError(err.message);
      setEmotion('worried');
    }finally{
      setBusy(false);
    }
  };

  const create=async(type:'image'|'audio')=>{
    if(!childId||!input.trim()||busy||!mediaEnabled)return;
    const value=input.trim();
    setError('');
    setCreateType(type);
    setBusy(true);
    try{
      const r=await api.generateMedia({childId,prompt:value,type});
      setInput('');
      if(r.media.status==='ready')n('/library');
      else{
        setMessages(m=>[...m,{
          role:'assistant',
          content:`I started your ${type==='image'?'picture':'music'}! It will appear in the Library when it is ready.`,
          emotion:'excited'
        }]);
        setEmotion('excited');
      }
    }catch(err:any){
      setError(err.message);
      setEmotion('worried');
    }finally{
      setBusy(false);
      setCreateType(null);
    }
  };

  if(!session)return <AppShell><div className="loading">Loading Kiddo…</div></AppShell>;
  if(!session.children.length)return <AppShell><div className="empty-state"><CompanionAvatar emotion="curious"/><h2>Add a child profile first</h2><button className="btn primary" onClick={()=>n('/parent')}>Open Parent Controls</button></div></AppShell>;

  const avatarEmotion:Emotion=listening?'curious':emotion;

  return <AppShell><div className="chat-page">
    <header className="chat-head">
      <div><span className="eyebrow">Creative companion</span><h1>{child?.name}'s Kiddo</h1></div>
      <div className="chat-controls">
        <select value={childId} onChange={e=>{setChildId(e.target.value);setConversationId(undefined);setMessages([])}}>
          {session.children.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="mode-tabs">
          <button className={mode==='chat'?'active':''} onClick={()=>setMode('chat')}><MessageCircle/>Chat</button>
          <button className={mode==='story'?'active':''} onClick={()=>setMode('story')}><BookOpen/>Story</button>
        </div>
        <div className="credit-pill small"><Sparkles size={15}/>{session.user.credits}</div>
      </div>
    </header>

    <div className="chat-layout">
      <aside className="avatar-panel">
        <CompanionAvatar emotion={avatarEmotion} name="Kiddo" speaking={busy||speaking||listening} variant={child?.avatar_choice}/>
        <p>{listening?'I’m listening…':speaking?'Reading it aloud…':busy?'Thinking with you…':emotion==='idle'?'Ready when you are.':`Feeling ${emotion}.`}</p>
        <div className="voice-badge">{voiceEnabled?'🎙️ Voice ready':'🔇 Voice off by parent'}</div>
        <div className="quick-prompts">
          <button onClick={()=>setInput('Tell me a funny science fact')}>🧪 Science surprise</button>
          <button onClick={()=>setInput('Let’s invent a magical animal together')}>🦄 Invent something</button>
          <button onClick={()=>{setMode('story');setInput('Tell me an adventure about a brave little explorer')}}>📚 Story idea</button>
        </div>
      </aside>

      <section className="messages">
        <div className="message-scroll">
          {!messages.length&&<div className="welcome-bubble"><h2>What should we do today?</h2><p>Type or talk to Kiddo, invent a story, make a picture, or create music.</p></div>}
          {messages.map((m,i)=><div key={m.id||i} className={`bubble ${m.role}`}>
            <span>{m.content}</span>
            {m.role==='assistant'&&voiceEnabled&&<button className="speak-message" onClick={()=>speak(m.content)} title="Read this reply aloud"><Volume2 size={15}/></button>}
          </div>)}
          {busy&&<div className="bubble assistant typing"><i/><i/><i/></div>}
        </div>

        {error&&<div className="notice error">{error}</div>}

        <form className="composer" onSubmit={send}>
          <textarea value={input} onChange={e=>setInput(e.target.value)} placeholder={listening?'Listening…':mode==='story'?'What should the story be about?':'Say or type something to Kiddo…'} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();e.currentTarget.form?.requestSubmit()}}}/>
          <div className="composer-actions">
            <div>
              <button type="button" className={listening?'voice-control listening':'voice-control'} disabled={!voiceEnabled||busy} onClick={toggleListening} title={voiceEnabled?'Push to talk':'Voice disabled in Parent Controls'}>{listening?<MicOff/>:<Mic/>}{listening?'Stop':'Talk'}</button>
              <button type="button" disabled={!caps?.image||!mediaEnabled||busy} onClick={()=>create('image')} title={mediaEnabled?'Create a picture':'Pictures and music disabled in Parent Controls'}><Image/>{createType==='image'?'Creating…':'Picture'}</button>
              <button type="button" disabled={!caps?.music||!mediaEnabled||busy} onClick={()=>create('audio')} title={mediaEnabled?'Create music':'Pictures and music disabled in Parent Controls'}><Music2/>{createType==='audio'?'Creating…':'Music'}</button>
            </div>
            <button className="send-btn" disabled={!input.trim()||busy} type="submit"><Send/></button>
          </div>
        </form>
      </section>
    </div>
  </div></AppShell>;
}
