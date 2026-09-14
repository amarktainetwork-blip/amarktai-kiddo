import { useEffect,useMemo,useState } from 'react';
import { useLocation,useNavigate } from 'react-router-dom';
import { Library, Mic2, ShieldCheck, Sparkles } from 'lucide-react';
import AppShell from '../components/AppShell';
import CompanionAvatar from '../components/CompanionAvatar';
import { api } from '../lib/api';
import { prewarmLocalVoice } from '../lib/localVoice';
import type { Conversation,MediaItem,SessionData } from '../lib/types';

export default function Dashboard(){
  const n=useNavigate();
  const loc=useLocation();
  const[data,setData]=useState<SessionData|null>(null);
  const[convs,setConvs]=useState<Conversation[]>([]);
  const[media,setMedia]=useState<MediaItem[]>([]);
  const[selected,setSelected]=useState('');
  const[error,setError]=useState('');

  useEffect(()=>{
    void prewarmLocalVoice();
    Promise.all([api.me(),api.conversations(),api.media()]).then(([me,c,m])=>{
      setData(me);setConvs(c.conversations);setMedia(m.media);
      const first=me.children[0]?.id||'';
      setSelected(first);
      const pwa=new URLSearchParams(loc.search).get('source')==='pwa';
      const phone=window.matchMedia('(max-width: 640px)').matches;
      if(first&&(pwa||phone))n('/chat?child='+first,{replace:true});
    }).catch(e=>{
      if(/sign in|session/i.test(e.message))n('/login');
      else setError(e.message);
    });
  },[]);

  const child=useMemo(()=>data?.children.find(c=>c.id===selected)||data?.children[0],[data,selected]);
  if(!data)return <AppShell><div className="loading">{error||'Loading your family space…'}</div></AppShell>;

  return <AppShell><div className="dashboard-page">
    <section className="dashboard-hero">
      <div className="dashboard-copy">
        <span className="eyebrow">Family home</span>
        <h1>{child?'Ready for '+child.name+'?':'Meet your Kiddo buddy'}</h1>
        <p>{child?'The child only needs to talk. Kiddo works out whether to chat, tell a story, create a picture, make music or bring back something already saved.':'Create a child profile in Parent Controls to begin.'}</p>
        <div className="dashboard-primary">
          <button className="talk-now" onClick={()=>child?n('/chat?child='+child.id):n('/parent')}><Mic2/>{child?'Talk to Kiddo':'Add child profile'}</button>
          <button className="btn ghost" onClick={()=>n('/library')}><Library/>Creations</button>
          <button className="btn ghost" onClick={()=>n('/parent')}><ShieldCheck/>Parent controls</button>
        </div>
        {data.children.length>1&&<div className="child-switch">{data.children.map(c=><button key={c.id} className={selected===c.id?'active':''} onClick={()=>setSelected(c.id)}>{c.name}</button>)}</div>}
      </div>
      <div className="dashboard-companion">
        <CompanionAvatar emotion="happy" variant={child?.avatar_choice} name={child?.name?child.name+"'s Kiddo":'Kiddo'}/>
        <div className="credit-pill"><Sparkles size={16}/><b>{data.user.credits}</b> credits</div>
      </div>
    </section>

    <div className="dashboard-columns">
      <section className="dashboard-panel">
        <div className="section-head"><h2>Recent conversations</h2><button onClick={()=>child&&n('/chat?child='+child.id)}>Talk now</button></div>
        {convs.length?<div className="activity-list">{convs.slice(0,6).map(c=><button key={c.id} onClick={()=>n('/chat?conversation='+c.id)}><span>{c.mode==='story'?'📚':'💬'}</span><div><b>{c.title}</b><small>{c.child_name} · {new Date(c.updated_at).toLocaleDateString()}</small></div></button>)}</div>:<div className="empty">The first conversation will appear here.</div>}
      </section>
      <section className="dashboard-panel">
        <div className="section-head"><h2>Saved creations</h2><button onClick={()=>n('/library')}>Open library</button></div>
        {media.length?<div className="dashboard-media">{media.slice(0,6).map(m=><div key={m.id}><span>{m.type==='image'?'🎨':'🎵'}</span><b>{m.title}</b><small>{m.status}</small></div>)}</div>:<div className="empty">Stories, pictures and songs will appear here as they are created.</div>}
      </section>
    </div>
  </div></AppShell>;
}
