import { useEffect,useMemo,useState } from 'react';
import { BookOpen,Image,Music2,RefreshCw,Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { api } from '../lib/api';
import type { Conversation,MediaItem } from '../lib/types';

export default function Library(){
  const n=useNavigate();
  const[items,setItems]=useState<MediaItem[]>([]);
  const[stories,setStories]=useState<Conversation[]>([]);
  const[filter,setFilter]=useState<'all'|'story'|'image'|'audio'>('all');
  const[error,setError]=useState('');

  const load=()=>Promise.all([api.media(),api.conversations()])
    .then(([m,c])=>{setItems(m.media);setStories(c.conversations.filter(x=>x.mode==='story'))})
    .catch(e=>setError(e.message));
  useEffect(()=>{void load()},[]);

  const refresh=async(item:MediaItem)=>{try{await api.mediaStatus(item.id);await load()}catch(e:any){setError(e.message)}};
  const remove=async(id:string)=>{if(!confirm('Delete this creation?'))return;await api.deleteMedia(id);await load()};

  const mediaVisible=useMemo(()=>items.filter(i=>filter==='all'||filter===i.type),[items,filter]);
  const storyVisible=filter==='all'||filter==='story'?stories:[];

  return <AppShell><div className="page">
    <div className="page-head">
      <div><span className="eyebrow">Family creations</span><h1>Library</h1><p>Stories, pictures and songs stay here so Kiddo can bring them back without generating them again.</p></div>
      <div className="filter-tabs">
        <button className={filter==='all'?'active':''} onClick={()=>setFilter('all')}>All</button>
        <button className={filter==='story'?'active':''} onClick={()=>setFilter('story')}><BookOpen/>Stories</button>
        <button className={filter==='image'?'active':''} onClick={()=>setFilter('image')}><Image/>Pictures</button>
        <button className={filter==='audio'?'active':''} onClick={()=>setFilter('audio')}><Music2/>Music</button>
      </div>
    </div>

    {error&&<div className="notice error">{error}</div>}
    <div className="library-grid">
      {storyVisible.map(story=><article className="library-card story-card" key={story.id}>
        <div className="story-preview"><BookOpen/><span>Saved story</span></div>
        <div className="library-meta"><div><b>{story.title}</b><p>{story.child_name} can ask Kiddo to read this story again at any time.</p><small>{new Date(story.updated_at).toLocaleString()}</small></div><button className="btn ghost" onClick={()=>n('/chat?conversation='+story.id)}>Open</button></div>
      </article>)}

      {mediaVisible.map(item=><article className="library-card" key={item.id}>
        <div className="media-preview">{item.status==='ready'
          ?(item.type==='image'?<img src={`/api/media/${item.id}/file`} alt={item.title}/>:<audio controls preload="metadata" src={`/api/media/${item.id}/file`}/>)
          :<div className="media-state"><span>{item.status==='failed'?'⚠️':'✨'}</span><b>{item.status==='failed'?'Generation failed':'Creating your idea…'}</b>{item.status!=='failed'&&<button className="btn ghost" onClick={()=>refresh(item)}><RefreshCw/>Check now</button>}</div>}
        </div>
        <div className="library-meta"><div><b>{item.title}</b><p>{item.prompt}</p><small>{new Date(item.created_at).toLocaleString()}</small>{item.error_message&&<small className="danger">{item.error_message}</small>}</div><button className="icon-btn" onClick={()=>remove(item.id)}><Trash2/></button></div>
      </article>)}

      {!storyVisible.length&&!mediaVisible.length&&<div className="empty">Nothing here yet. Talk to Kiddo and create something together.</div>}
    </div>
  </div></AppShell>;
}
