import { useCallback,useEffect,useMemo,useRef,useState } from 'react';
import { useLocation,useNavigate } from 'react-router-dom';
import { Mic2,PhoneOff,Sparkles,Volume2 } from 'lucide-react';
import AppShell from '../components/AppShell';
import CompanionAvatar from '../components/CompanionAvatar';
import { api } from '../lib/api';
import type { Child,Emotion,Message,SessionData } from '../lib/types';

const voiceByAvatar:Record<string,string>={
  nova:'aurora',sprout:'eve',comet:'cosmo',bubbles:'carina',pixel:'altair',lumi:'ara'
};
const rateByEmotion:Record<Emotion,number>={
  happy:1.02,excited:1.08,curious:1.0,thinking:.96,proud:1.0,calm:.92,
  sad:.9,worried:.94,surprised:1.06,playful:1.07,sleepy:.86,idle:1
};

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
  const[playingMusic,setPlayingMusic]=useState(false);

  useEffect(()=>{busyRef.current=thinking},[thinking]);
  useEffect(()=>{speakingRef.current=speaking},[speaking]);

  useEffect(()=>{
    void api.lockParent().catch(()=>{});
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
  const mediaAllowed=data?.childSettings?.media_enabled!==false;

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

  const playVoice=useCallback(async(text:string,nextEmotion:Emotion)=>{
    if(!text.trim()||!child)return;
    setEmotion(nextEmotion);setSpeaking(true);speakingRef.current=true;setListening(false);setStatus('Kiddo is talking…');
    setLiveReply(text);
    const blob=await api.speakVoice({text,language:child.language,voiceId:voiceByAvatar[child.avatar_choice]||'aurora'});
    const url=URL.createObjectURL(blob);
    try{
      await new Promise<void>((resolve,reject)=>{
        const audio=new Audio(url);
        audio.playbackRate=rateByEmotion[nextEmotion]||1;
        audio.onended=()=>resolve();audio.onerror=()=>reject(new Error('Could not play Kiddo voice.'));
        audio.play().catch(reject);
      });
    }finally{
      URL.revokeObjectURL(url);setSpeaking(false);speakingRef.current=false;
    }
  },[child]);

  const playGeneratedMusic=useCallback(async(id:string)=>{
    setPlayingMusic(true);setSpeaking(true);speakingRef.current=true;setListening(false);setEmotion('excited');setStatus('Playing your new song…');
    const audio=new Audio('/api/media/'+id+'/file');
    try{
      await new Promise<void>((resolve,reject)=>{audio.onended=()=>resolve();audio.onerror=()=>reject(new Error('Could not play the new song.'));audio.play().catch(reject)});
    }finally{setPlayingMusic(false);setSpeaking(false);speakingRef.current=false}
  },[]);

  const pollCreation=useCallback(async(item:{id:string;type:'image'|'audio';status:string})=>{
    setCreation(item);
    setStatus(item.type==='image'?'Making your picture…':'Making your song…');
    let state=item.status;
    for(let i=0;i<150;i++){
      if(state==='ready')break;
      if(state==='failed')throw new Error('That creation did not finish. Your credits were refunded.');
      await new Promise(r=>setTimeout(r,900));
      const r=await api.mediaStatus(item.id);state=r.media.status;
      setCreation({...item,status:state});
    }
    if(state!=='ready')return;
    if(item.type==='image'){
      setDisplayImage('/api/media/'+item.id+'/file?v='+Date.now());
      setEmotion('proud');setStatus('Your picture is ready!');
      if(voiceSessionRef.current)await playVoice('Look! Our picture is ready. What do you think?','proud');
    }else if(voiceSessionRef.current){
      await playVoice('Our song is ready! Listen to this!','excited');
      await playGeneratedMusic(item.id);
    }else{
      setStatus('Your song is ready in Creations.');
    }
  },[playGeneratedMusic,playVoice]);

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
      recorder.onstart=()=>{setListening(true);setStatus('Listening…');setEmotion('curious');setLiveTranscript('');setDisplayImage('')};
      recorder.onstop=async()=>{
        setListening(false);
        if(rafRef.current)cancelAnimationFrame(rafRef.current);
        if(!voiceSessionRef.current)return;
        if(!speechStarted||chunksRef.current.length===0){setTimeout(()=>void startListeningCycle(),250);return}
        const blob=new Blob(chunksRef.current,{type:recorder.mimeType||'audio/webm'});
        try{
          setThinking(true);busyRef.current=true;setEmotion('thinking');setStatus('Understanding you…');
          const tr=await api.transcribeVoice(blob);
          const transcript=tr.transcript.trim();setLiveTranscript(transcript);
          if(!transcript){setThinking(false);busyRef.current=false;setTimeout(()=>void startListeningCycle(),250);return}
          await handleTranscriptRef.current(transcript);
        }catch(e:any){
          setError(e.message);setThinking(false);busyRef.current=false;setEmotion('worried');
          setTimeout(()=>void startListeningCycle(),500);
        }
      };
      recorder.start(250);
      const data=new Uint8Array(analyser.fftSize);
      const watch=()=>{
        if(recorder.state!=='recording')return;
        analyser.getByteTimeDomainData(data);
        let sum=0;for(const value of data){const x=(value-128)/128;sum+=x*x}
        const rms=Math.sqrt(sum/data.length);
        if(rms>.035){speechStarted=true;lastVoice=Date.now()}
        const now=Date.now();
        if((speechStarted&&now-lastVoice>950)||(now-started>12000&&!speechStarted)){
          recorder.stop();return;
        }
        rafRef.current=requestAnimationFrame(watch);
      };
      watch();
    }catch(e:any){
      setError(e.message||'Microphone permission is required.');
      voiceSessionRef.current=false;setVoiceActive(false);setListening(false);
    }
  },[voiceAllowed]);

  const handleTranscriptRef=useRef<(value:string)=>Promise<void>>(async()=>{});
  const handleTranscript=useCallback(async(value:string)=>{
    if(!childId)return;
    setThinking(true);busyRef.current=true;setError('');setLiveReply('');setStatus('Kiddo is thinking…');setEmotion('thinking');
    setMessages(m=>[...m,{role:'user',content:value}]);
    try{
      const r=await api.chat({childId,conversationId,message:value,mode:'chat'});
      setConversationId(r.conversationId);
      setMessages(m=>[...m,{role:'assistant',content:r.reply,emotion:r.emotion}]);
      setData(d=>d?{...d,user:{...d.user,credits:r.credits}}:d);
      setThinking(false);busyRef.current=false;
      const segments=r.segments?.length?r.segments:[{text:r.reply,emotion:r.emotion}];
      for(const segment of segments)await playVoice(segment.text,segment.emotion);
      if(r.creation)await pollCreation(r.creation);
      else if(r.creationError){setError(r.creationError);await playVoice('I could not start that creation just now, but we can keep talking.','calm')}
      setStatus('Ready for you…');
    }catch(e:any){
      setThinking(false);busyRef.current=false;setError(e.message);setEmotion('worried');
      try{await playVoice('I had trouble with that. Please try again.','calm')}catch{}
    }finally{
      setThinking(false);busyRef.current=false;
      if(voiceSessionRef.current)setTimeout(()=>void startListeningCycle(),350);
    }
  },[childId,conversationId,playVoice,pollCreation,startListeningCycle,thinking]);
  useEffect(()=>{handleTranscriptRef.current=handleTranscript},[handleTranscript]);

  const startVoice=async()=>{
    if(!voiceAllowed){setError('Voice has been disabled in Parent Controls.');return}
    setError('');voiceSessionRef.current=true;setVoiceActive(true);
    await startListeningCycle();
  };
  const stopVoice=()=>{voiceSessionRef.current=false;setVoiceActive(false);setListening(false);setStatus('Conversation paused');try{recorderRef.current?.stop()}catch{}};

  if(!data)return <AppShell><div className="loading">Loading Kiddo…</div></AppShell>;
  if(!data.children.length)return <AppShell><div className="empty-state"><CompanionAvatar emotion="curious"/><h2>Ask a parent to add your profile first</h2></div></AppShell>;

  return <AppShell><div className="buddy-page">
    <div className="buddy-top">
      <select value={childId} onChange={e=>{stopVoice();setChildId(e.target.value);setConversationId(undefined);setMessages([]);setDisplayImage('')}}>{data.children.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
      <span className="credit-pill"><Sparkles size={15}/>{data.user.credits}</span>
    </div>

    <section className="buddy-stage">
      <div className="buddy-visual">
        {displayImage
          ? <div className="creation-display"><img src={displayImage} alt="Kiddo creation"/><button onClick={()=>setDisplayImage('')}>Back to my buddy</button></div>
          : <CompanionAvatar emotion={listening?'curious':thinking?'thinking':emotion} name="Kiddo" variant={child?.avatar_choice} listening={listening} speaking={speaking||playingMusic}/>}
      </div>
      <div className="buddy-status"><b>{status}</b>{liveTranscript&&<span className="heard">You: “{liveTranscript}”</span>}{liveReply&&<span className="said"><Volume2 size={16}/> {liveReply}</span>}</div>
      {creation&&creation.status!=='ready'&&<div className="creation-progress">{creation.type==='image'?'🎨 Drawing in the background…':'🎵 Producing your song in the background…'}</div>}
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
