import { useEffect,useMemo,useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Image, MessageCircle, Mic2, Music2, ShieldCheck, Sparkles } from 'lucide-react';
import AppShell from '../components/AppShell';
import CompanionAvatar from '../components/CompanionAvatar';
import { api } from '../lib/api';
import type { Conversation,MediaItem,SessionData } from '../lib/types';

export default function Dashboard(){
  const n=useNavigate();
  const[data,setData]=useState<SessionData|null>(null);
  const[convs,setConvs]=useState<Conversation[]>([]);
  const[media,setMedia]=useState<MediaItem[]>([]);
  const[selected,setSelected]=useState('');
  const[error,setError]=useState('');
  useEffect(()=>{Promise.all([api.me(),api.conversations(),api.media()]).then(([me,c,m])=>{setData(me);setConvs(c.conversations);setMedia(m.media);setSelected(me.children[0]?.id||'')}).catch(e=>{if(/sign in|session/i.test(e.message))n('/login');else setError(e.message)})},[]);
  const child=useMemo(()=>data?.children.find(c=>c.id===selected)||data?.children[0],[data,selected]);
  if(!data)return <AppShell><div className="loading">{error||'Loading your family space…'}</div></AppShell>;
  const open=(mode:string)=>n('/chat?mode='+mode+(child?'&child='+child.id:''));

  return <AppShell><div className="dashboard-page">
    <section className="dashboard-hero">
      <div className="dashboard-copy"><span className="eyebrow">Family home</span><h1>{child?'Ready for '+child.name+'?':'Meet your Kiddo companion'}</h1><p>{child?'Tap Talk and the companion will listen, answer out loud and keep the conversation going.':'Create a child profile in Parent Controls to begin.'}</p>
        <div className="dashboard-primary"><button className="talk-now" onClick={()=>child?open('talk'):n('/parent')}><Mic2/> {child?'Start talking':'Add child profile'}</button><button className="btn ghost" onClick={()=>n('/parent')}><ShieldCheck/>Parent controls</button></div>
        {data.children.length>1&&<div className="child-switch">{data.children.map(c=><button key={c.id} className={selected===c.id?'active':''} onClick={()=>setSelected(c.id)}>{c.name}</button>)}</div>}
      </div>
      <div className="dashboard-companion"><CompanionAvatar emotion="happy" variant={child?.avatar_choice} name={child?.name?child.name+"'s Kiddo":'Kiddo'}/><div className="credit-pill"><Sparkles size={16}/><b>{data.user.credits}</b> credits</div></div>
    </section>

    <section className="action-grid">
      <button onClick={()=>open('talk')} disabled={!child}><MessageCircle/><span><b>Talk</b><small>Hands-free conversation</small></span></button>
      <button onClick={()=>open('story')} disabled={!child}><BookOpen/><span><b>Story</b><small>Tell it with voice</small></span></button>
      <button onClick={()=>open('image')} disabled={!child}><Image/><span><b>Picture</b><small>Describe it out loud</small></span></button>
      <button onClick={()=>open('music')} disabled={!child}><Music2/><span><b>Music</b><small>Say what to create</small></span></button>
    </section>

    <div className="dashboard-columns">
      <section className="dashboard-panel"><div className="section-head"><h2>Recent conversations</h2><button onClick={()=>open('talk')}>Talk now</button></div>{convs.length?<div className="activity-list">{convs.slice(0,6).map(c=><button key={c.id} onClick={()=>n('/chat?conversation='+c.id)}><span>{c.mode==='story'?'📚':'💬'}</span><div><b>{c.title}</b><small>{c.child_name} · {new Date(c.updated_at).toLocaleDateString()}</small></div></button>)}</div>:<div className="empty">The first conversation will appear here.</div>}</section>
      <section className="dashboard-panel"><div className="section-head"><h2>Latest creations</h2><button onClick={()=>n('/library')}>Library</button></div>{media.length?<div className="dashboard-media">{media.slice(0,6).map(m=><div key={m.id}><span>{m.type==='image'?'🎨':'🎵'}</span><b>{m.title}</b><small>{m.status}</small></div>)}</div>:<div className="empty">Pictures and music will appear here.</div>}</section>
    </div>
  </div></AppShell>;
}
