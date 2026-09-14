import { useCallback,useEffect,useMemo,useRef,useState } from 'react';
import { useLocation,useNavigate } from 'react-router-dom';
import { Mic2,PhoneOff,Sparkles,Volume2 } from 'lucide-react';
import AppShell from '../components/AppShell';
import CompanionAvatar from '../components/CompanionAvatar';
import { api } from '../lib/api';
import {
  playLocalSpeech, prewarmLocalVoice, supportsLocalTts, transcribeLocalAudio, voiceForGender
} from '../lib/localVoice';
import type { Child,Emotion,Message,SavedAction,SessionData } from '../lib/types';

const providerVoiceByGender=(gender?:string)=>gender==='male'?'atlas':'aurora';
const creativeRequest=(text:string)=>/\b(story|bedtime|draw|drawing|picture|image|art|song|music|track|tune|sing|make .*song|play .*song|show .*picture|read .*story)\b/i.test(text);

function storyChunks(text:string){
  return String(text||'')
    .split(/(?<=[.!?])\s+/)
    .map(v=>v.trim()).filter(Boolean)
    .reduce<string[]>((out,sentence)=>{
      const last=out[out.length-1]||'';
      if(last&&last.length+sentence.length<360)out[out.length-1]=last+' '+sentence;
      else out.push(sentence);
      return out;
    },[]);
}

export default function Chat(){
  const n=useNavigate(),loc=useLocation();
  const params=new URLSearchParams(loc.search);
  const requestedConversation=params.get('conversation')||undefined;
  const requestedChild=params.get('child')||'';

  const streamRef=useRef<MediaStream|null>(null);
  const recorderRef=useRef<MediaRecorder|null>(null);
  const audioContextRef=useRef<AudioContext|null>(null);
  const analyserRef=useRef<AnalyserNode|null>(null);
  const rafRef=useRef<number|undefined>();
  const chunksRef=useRef<BlobPart[]>([]);
  const voiceSessionRef=useRef(false);
  const busyRef=useRef(false);
  const speakingRef=useRef(false);
  const speechQueueRef=useRef<Promise<void>>(Promise.resolve());

  const[data,setData]=useState<SessionData|null>(null);
  const[childId,setChildId]=useState(requestedChild);
  const[conversationId,setConversationId]=useState<string|undefined>(requestedConversation);
  const[messages,setMessages]=useState<Message[]>([]);
  const[emotion,setEmotion]=useState<Emotion>('idle');
  const[listening,setListening]=useState(false);
  const[thinking,setThinking]=useState(false);
  const[speaking,setSpeaking]=useState(false);
  const[voiceActive,setVoiceActive]=useState(false);
  const[liveTranscript,setLiveTranscript]=useState('');
  const[liveReply,setLiveReply]=useState('');
  const[status,setStatus]=useState('Ready when you are');
  const[error,setError]=useState('');
  const[creation,setCreation]=useState<{id:string;type:'image'|'audio';status:string}|null>(null);
  const[displayImage,setDisplayImage]=useState<string>('');
  const[galleryImages,setGalleryImages]=useState<Array<{id:string;title:string}>>([]);
  const[playingMusic,setPlayingMusic]=useState(false);

  useEffect(()=>{busyRef.current=thinking},[thinking]);
  useEffect(()=>{speakingRef.current=speaking},[speaking]);

  useEffect(()=>{
    void api.lockParent().catch(()=>{});
    void prewarmLocalVoice();
    api.me().then(me=>{setData(me);if(!childId&&me.children[0])setChildId(me.children[0].id)}).catch(()=>n('/login'));
    return()=>stopEverything();
  },[]);

  useEffect(()=>{
    if(!conversationId)return;
    api.conversation(conversationId).then(r=>{
      setMessages(r.messages);setChildId(r.conversation.child_id);
      const last=[...r.messages].reverse().find(m=>m.role==='assistant'&&m.emotion);
      if(last?.emotion)setEmotion(last.emotion);
    }).catch(e=>setError(e.message));
  },[conversationId]);

  const child:Child|undefined=useMemo(()=>data?.children.find(c=>c.id===childId),[data,childId]);
  const voiceAllowed=data?.childSettings?.voice_enabled!==false;
  useEffect(()=>{
    if(child?.language==='English')void prewarmLocalVoice(child.voice_id||voiceForGender(child.voice_gender));
  },[child?.id,child?.language,child?.voice_id,child?.voice_gender]);

  function stopEverything(){
    voiceSessionRef.current=false;
    setVoiceActive(false);setListening(false);setSpeaking(false);setThinking(false);
    if(rafRef.current)cancelAnimationFrame(rafRef.current);
    try{recorderRef.current?.stop()}catch{}
    recorderRef.current=null;
    streamRef.current?.getTracks().forEach(t=>t.stop());
    streamRef.current=null;
    audioContextRef.current?.close().catch(()=>{});
    audioContextRef.current=null;analyserRef.current=null;
  }

  const ensureMicrophone=async()=>{
    if(streamRef.current)return streamRef.current;
    const stream=await navigator.mediaDevices.getUserMedia({
      audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},
      video:false
    });
    streamRef.current=stream;
    const ctx=new AudioContext();
    const source=ctx.createMediaStreamSource(stream);
    const analyser=ctx.createAnalyser();analyser.fftSize=1024;analyser.smoothingTimeConstant=.25;
    source.connect(analyser);audioContextRef.current=ctx;analyserRef.current=analyser;
    return stream;
  };

  const playProviderVoice=useCallback(async(text:string,nextEmotion:Emotion)=>{
    if(!child)return;
    const blob=await api.speakVoice({
      text,language:child.language,voiceId:providerVoiceByGender(child.voice_gender)
    });
    const url=URL.createObjectURL(blob);
    try{
      await new Promise<void>((resolve,reject)=>{
        const audio=new Audio(url);
        audio.onended=()=>resolve();audio.onerror=()=>reject(new Error('Could not play Kiddo voice.'));
        audio.play().catch(reject);
      });
    }finally{URL.revokeObjectURL(url)}
  },[child]);

  const playVoice=useCallback(async(text:string,nextEmotion:Emotion)=>{
    if(!text.trim()||!child)return;
    setEmotion(nextEmotion);setSpeaking(true);speakingRef.current=true;setListening(false);setStatus('Kiddo is talking…');
    setLiveReply(text);
    try{
      if(supportsLocalTts(child.language)){
        await playLocalSpeech(text,child.voice_id||voiceForGender(child.voice_gender),nextEmotion);
      }else{
        await playProviderVoice(text,nextEmotion);
      }
    }finally{
      setSpeaking(false);speakingRef.current=false;
    }
  },[child,playProviderVoice]);

  const queueSpeech=useCallback((text:string,nextEmotion:Emotion)=>{
    speechQueueRef.current=speechQueueRef.current
      .then(()=>playVoice(text,nextEmotion))
      .catch(error=>{setError(String(error?.message||error));});
    return speechQueueRef.current;
  },[playVoice]);

  const playGeneratedMusic=useCallback(async(id:string)=>{
    setPlayingMusic(true);setSpeaking(true);speakingRef.current=true;setListening(false);setEmotion('excited');setStatus('Playing your song…');
    const audio=new Audio('/api/media/'+id+'/file');
    try{
      await new Promise<void>((resolve,reject)=>{
        audio.onended=()=>resolve();audio.onerror=()=>reject(new Error('Could not play the saved song.'));
        audio.play().catch(reject);
      });
    }finally{setPlayingMusic(false);setSpeaking(false);speakingRef.current=false}
  },[]);

  const handleSavedAction=useCallback(async(action:SavedAction)=>{
    if(!action)return;
    if(action.kind==='show_image'){
      setGalleryImages([]);
      setDisplayImage('/api/media/'+action.id+'/file?v='+Date.now());
      setEmotion('proud');setStatus(action.title);
      return;
    }
    if(action.kind==='show_gallery'){
      setDisplayImage('');
      setGalleryImages(action.items);
      setEmotion('proud');setStatus('Here are your saved pictures');
      return;
    }
    if(action.kind==='play_audio'){
      await playGeneratedMusic(action.id);
      return;
    }
    if(action.kind==='read_story'){
      const chunks=storyChunks(action.text);
      for(let i=0;i<chunks.length;i++){
        const nextEmotion:Emotion=i===chunks.length-1?'sleepy':i%3===1?'happy':'calm';
        await playVoice(chunks[i],nextEmotion);
      }
    }
  },[playGeneratedMusic,playVoice]);

  const pollCreation=useCallback(async(item:{id:string;type:'image'|'audio';status:string})=>{
    setCreation(item);
    setStatus(item.type==='image'?'Drawing in the background…':'Producing your song…');
    let state=item.status;
    for(let i=0;i<180;i++){
      if(state==='ready')break;
      if(state==='failed')throw new Error('That creation did not finish. Your credits were refunded.');
      await new Promise(r=>setTimeout(r,1000));
      const r=await api.mediaStatus(item.id);state=r.media.status;
      setCreation({...item,status:state});
    }
    if(state!=='ready')return;
    if(item.type==='image'){
      setDisplayImage('/api/media/'+item.id+'/file?v='+Date.now());
      setEmotion('proud');setStatus('Our picture is ready!');
      if(voiceSessionRef.current)await playVoice('Look! Our picture is ready. What do you think?','proud');
    }else if(voiceSessionRef.current){
      await playVoice('Our song is ready. Listen to this!','excited');
      await playGeneratedMusic(item.id);
    }else setStatus('Your song is ready in Creations.');
  },[playGeneratedMusic,playVoice]);

  const transcribe=useCallback(async(blob:Blob)=>{
    if(!child)return'';
    try{
      setStatus('Understanding you…');
      const local=await transcribeLocalAudio(blob,child.language);
      if(local)return local;
    }catch{}
    const remote=await api.transcribeVoice(blob);
    return remote.transcript.trim();
  },[child]);

  const startListeningCycle=useCallback(async()=>{
    if(!voiceSessionRef.current||busyRef.current||speakingRef.current||!voiceAllowed)return;
    try{
      const stream=await ensureMicrophone();
      const analyser=analyserRef.current;if(!analyser)return;
      if(audioContextRef.current?.state==='suspended')await audioContextRef.current.resume();
      chunksRef.current=[];
      const mime=['audio/webm;codecs=opus','audio/webm','audio/mp4'].find(t=>MediaRecorder.isTypeSupported(t))||'';
      const recorder=new MediaRecorder(stream,mime?{mimeType:mime}:undefined);
      recorderRef.current=recorder;
      let speechStarted=false;let lastVoice=Date.now();const started=Date.now();
      recorder.ondataavailable=e=>{if(e.data.size)chunksRef.current.push(e.data)};
      recorder.onstart=()=>{setListening(true);setStatus('Listening…');setEmotion('curious');setLiveTranscript('')};
      recorder.onstop=async()=>{
        setListening(false);
        if(rafRef.current)cancelAnimationFrame(rafRef.current);
        if(!voiceSessionRef.current)return;
        if(!speechStarted||chunksRef.current.length===0){setTimeout(()=>void startListeningCycle(),180);return}
        const blob=new Blob(chunksRef.current,{type:recorder.mimeType||'audio/webm'});
        try{
          setThinking(true);busyRef.current=true;setEmotion('thinking');
          const transcript=(await transcribe(blob)).trim();setLiveTranscript(transcript);
          if(!transcript){setThinking(false);busyRef.current=false;setTimeout(()=>void startListeningCycle(),220);return}
          await handleTranscriptRef.current(transcript);
        }catch(e:any){
          setError(e.message);setThinking(false);busyRef.current=false;setEmotion('worried');
          setTimeout(()=>void startListeningCycle(),450);
        }
      };
      recorder.start(220);
      const data=new Uint8Array(analyser.fftSize);
      const watch=()=>{
        if(recorder.state!=='recording')return;
        analyser.getByteTimeDomainData(data);
        let sum=0;for(const value of data){const x=(value-128)/128;sum+=x*x}
        const rms=Math.sqrt(sum/data.length);
        if(rms>.032){speechStarted=true;lastVoice=Date.now()}
        const now=Date.now();
        if((speechStarted&&now-lastVoice>720)||(now-started>11000&&!speechStarted)){recorder.stop();return}
        rafRef.current=requestAnimationFrame(watch);
      };
      watch();
    }catch(e:any){
      setError(e.message||'Microphone permission is required.');
      voiceSessionRef.current=false;setVoiceActive(false);setListening(false);
    }
  },[transcribe,voiceAllowed]);

  const handleOrchestratedTurn=useCallback(async(value:string)=>{
    if(!childId)return;
    setThinking(true);busyRef.current=true;setStatus('Kiddo is thinking…');setEmotion('thinking');
    const r=await api.chat({childId,conversationId,message:value,mode:'chat'});
    setConversationId(r.conversationId);
    setData(d=>d?{...d,user:{...d.user,credits:r.credits}}:d);
    setMessages(m=>[...m,{role:'user',content:value},{role:'assistant',content:r.reply,emotion:r.emotion}]);
    setThinking(false);busyRef.current=false;

    if(r.savedAction){
      await queueSpeech(r.reply,r.emotion);
      await handleSavedAction(r.savedAction);
      return;
    }

    const segments=r.segments?.length?r.segments:[{text:r.reply,emotion:r.emotion}];
    for(const segment of segments)await queueSpeech(segment.text,segment.emotion);
    await speechQueueRef.current;
    if(r.creation)await pollCreation(r.creation);
    else if(r.creationError){
      setError(r.creationError);
      await playVoice('I could not start that creation just now, but we can keep talking.','calm');
    }
  },[childId,conversationId,handleSavedAction,playVoice,pollCreation,queueSpeech]);

  const handleStreamingTurn=useCallback(async(value:string)=>{
    if(!childId)return;
    setThinking(true);busyRef.current=true;setStatus('Kiddo is thinking…');setEmotion('thinking');
    setLiveReply('');
    setMessages(m=>[...m,{role:'user',content:value}]);
    let fullReply='';
    let doneConversation=conversationId;
    let savedAction:SavedAction=null;
    let streamError='';

    await api.streamChat({childId,conversationId,message:value},event=>{
      if(event.type==='ready'){
        setStatus('Kiddo heard you…');
      }else if(event.type==='sentence'){
        setThinking(false);busyRef.current=false;
        fullReply+=(fullReply?' ':'')+event.text;
        setLiveReply(fullReply);setEmotion(event.emotion||'idle');
        void queueSpeech(event.text,event.emotion||'idle');
      }else if(event.type==='saved'){
        doneConversation=event.conversationId||doneConversation;
        fullReply=event.reply||fullReply;
        savedAction=event.savedAction||null;
        setThinking(false);busyRef.current=false;
        setData(d=>d?{...d,user:{...d.user,credits:event.credits}}:d);
        void queueSpeech(event.reply,event.emotion||'happy');
      }else if(event.type==='done'){
        doneConversation=event.conversationId||doneConversation;
        setData(d=>d&&typeof event.credits==='number'?{...d,user:{...d.user,credits:event.credits}}:d);
        if(event.reply)fullReply=event.reply;
      }else if(event.type==='error'){
        streamError=event.error||'Kiddo had trouble answering.';
      }
    });

    if(streamError)throw new Error(streamError);
    if(doneConversation)setConversationId(doneConversation);
    await speechQueueRef.current;
    if(savedAction)await handleSavedAction(savedAction);
    if(fullReply)setMessages(m=>[...m,{role:'assistant',content:fullReply,emotion}]);
  },[childId,conversationId,emotion,handleSavedAction,queueSpeech]);

  const handleTranscriptRef=useRef<(value:string)=>Promise<void>>(async()=>{});
  const handleTranscript=useCallback(async(value:string)=>{
    if(!childId)return;
    setError('');setLiveReply('');
    try{
      if(creativeRequest(value))await handleOrchestratedTurn(value);
      else await handleStreamingTurn(value);
      setStatus('Ready for you…');
    }catch(e:any){
      setThinking(false);busyRef.current=false;setError(e.message);setEmotion('worried');
      try{await playVoice('I had trouble with that. Please try again.','calm')}catch{}
    }finally{
      setThinking(false);busyRef.current=false;
      if(voiceSessionRef.current)setTimeout(()=>void startListeningCycle(),220);
    }
  },[childId,handleOrchestratedTurn,handleStreamingTurn,playVoice,startListeningCycle]);
  useEffect(()=>{handleTranscriptRef.current=handleTranscript},[handleTranscript]);

  const startVoice=async()=>{
    if(!voiceAllowed){setError('Voice has been disabled in Parent Controls.');return}
    setError('');voiceSessionRef.current=true;setVoiceActive(true);
    await startListeningCycle();
  };
  const stopVoice=()=>{
    voiceSessionRef.current=false;setVoiceActive(false);setListening(false);setStatus('Conversation paused');
    try{recorderRef.current?.stop()}catch{}
  };

  if(!data)return <AppShell><div className="loading">Loading Kiddo…</div></AppShell>;
  if(!data.children.length)return <AppShell><div className="empty-state"><CompanionAvatar emotion="curious"/><h2>Ask a parent to add your profile first</h2></div></AppShell>;

  return <AppShell><div className="buddy-page">
    <div className="buddy-top">
      <select value={childId} onChange={e=>{stopVoice();setChildId(e.target.value);setConversationId(undefined);setMessages([]);setDisplayImage('');setGalleryImages([])}}>{data.children.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
      <span className="credit-pill"><Sparkles size={15}/>{data.user.credits}</span>
    </div>

    <section className="buddy-stage">
      <div className="buddy-visual">
        {galleryImages.length
          ? <div className="creation-gallery"><div className="creation-gallery-grid">{galleryImages.map(item=><button key={item.id} onClick={()=>{setGalleryImages([]);setDisplayImage('/api/media/'+item.id+'/file?v='+Date.now());setStatus(item.title)}}><img src={'/api/media/'+item.id+'/file'} alt={item.title}/><span>{item.title}</span></button>)}</div><button className="gallery-back" onClick={()=>setGalleryImages([])}>Back to my buddy</button></div>
          : displayImage
            ? <div className="creation-display"><img src={displayImage} alt="Kiddo creation"/><button onClick={()=>setDisplayImage('')}>Back to my buddy</button></div>
            : <CompanionAvatar emotion={listening?'curious':thinking?'thinking':emotion} name="Kiddo" variant={child?.avatar_choice} listening={listening} speaking={speaking||playingMusic}/>}
      </div>
      <div className="buddy-status">
        <b>{status}</b>
        {liveTranscript&&<span className="heard">“{liveTranscript}”</span>}
        {liveReply&&<span className="said"><Volume2 size={16}/>{liveReply}</span>}
      </div>
      {creation&&creation.status!=='ready'&&<div className="creation-progress">{creation.type==='image'?'🎨 Drawing while we talk…':'🎵 Producing our song while we talk…'}</div>}
      {error&&<div className="notice error buddy-error">{error}</div>}
      <div className="buddy-control">
        {voiceActive
          ? <button className="end-voice" onClick={stopVoice}><PhoneOff/>Pause</button>
          : <button className="start-voice" onClick={startVoice}><Mic2/>Talk to Kiddo</button>}
      </div>
    </section>

    <section className="buddy-history">
      {messages.slice(-6).map((m,i)=><div key={m.id||i} className={m.role}><b>{m.role==='assistant'?'Kiddo':'You'}</b><span>{m.content}</span></div>)}
    </section>
  </div></AppShell>;
}
