import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { BookOpen, Home as HomeIcon, LogIn, MessageCircle, Music2, Palette, RotateCcw, Settings2, ShieldCheck, Sparkles, UserPlus, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import type { WorldZone } from '../components/KiddoWorld';

const KiddoWorld=lazy(()=>import('../components/KiddoWorld'));
import { api } from '../lib/api';
import type { SessionData } from '../lib/types';
import '../world.css';

const zoneCopy:Record<WorldZone,{title:string;eyebrow:string;copy:string;action:string;emoji:string}>={
  home:{title:'Kiddo World',eyebrow:'Your adventure starts here',copy:'Pick a place, explore the islands and create something amazing with Kiddo.',action:'Choose a place',emoji:'✨'},
  story:{title:'Story Treehouse',eyebrow:'Stories live up in the trees',copy:'Build adventures, bedtime stories and recurring characters you can come back to.',action:'Make a story',emoji:'📚'},
  talk:{title:'Talk Portal',eyebrow:'Ask anything',copy:'Chat naturally with Kiddo, ask questions, share ideas and keep exploring while Kiddo creates.',action:'Talk to Kiddo',emoji:'💬'},
  music:{title:'Music Studio',eyebrow:'Make some noise',copy:'Create original songs, beats and musical ideas that match the child and their age.',action:'Make music',emoji:'🎵'},
  art:{title:'Art Studio',eyebrow:'Turn ideas into pictures',copy:'Create colourful art from the conversation and keep every finished piece in the family library.',action:'Create art',emoji:'🎨'}
};

const zones:Array<{id:WorldZone;label:string;icon:any;className:string}>=[
  {id:'story',label:'Story',icon:BookOpen,className:'story'},
  {id:'talk',label:'Talk',icon:MessageCircle,className:'talk'},
  {id:'music',label:'Music',icon:Music2,className:'music'},
  {id:'art',label:'Art',icon:Palette,className:'art'}
];

export default function Home(){
  const navigate=useNavigate();
  const[active,setActive]=useState<WorldZone>('home');
  const[parentOpen,setParentOpen]=useState(false);
  const[session,setSession]=useState<SessionData|null>(null);
  const[quality,setQuality]=useState<'low'|'high'>('high');

  useEffect(()=>{
    api.me().then(setSession).catch(()=>{});
    const coarse=window.matchMedia('(max-width: 760px)').matches;
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setQuality(coarse||reduced?'low':'high');
  },[]);

  const detail=zoneCopy[active];
  const childId=session?.children?.[0]?.id;
  const startZone=()=>{
    if(active==='home')return;
    if(childId)navigate('/chat?child='+childId+'&world='+active);
    else if(session)navigate('/dashboard');
    else navigate('/register');
  };

  const worldStatus=useMemo(()=>session?.children?.length
    ? 'Welcome back, '+session.children[0].name
    : 'No login needed to explore',[session]);

  return <div className="kiddo-world-page">
    <div className="world-canvas-wrap">
      <Suspense fallback={<div className="world-loading"><Sparkles/><b>Opening Kiddo World…</b></div>}>
        <KiddoWorld active={active} onSelect={setActive} quality={quality}/>
      </Suspense>
    </div>

    <header className="world-topbar">
      <button className="world-brand" onClick={()=>setActive('home')} aria-label="Kiddo World home">
        <span className="world-brand-mark"><Sparkles/></span>
        <span><small>Amarktai</small><b>Kiddo</b></span>
      </button>
      <div className="world-title">
        <span>{detail.eyebrow}</span>
        <strong>{detail.title}</strong>
      </div>
      <button className="parents-entry" onClick={()=>setParentOpen(true)}><Users/>For parents</button>
    </header>

    <div className="world-welcome">
      <span className="world-status">{worldStatus}</span>
      <h1>{active==='home'?'What should we make today?':detail.title}</h1>
      <p>{detail.copy}</p>
      {active!=='home'&&<button className={'zone-primary '+active} onClick={startZone}>{detail.emoji} {detail.action}</button>}
    </div>

    <nav className="world-zone-dock" aria-label="Kiddo World places">
      {zones.map(({id,label,icon:Icon,className})=>
        <button key={id} className={'zone-chip '+className+(active===id?' active':'')} onClick={()=>setActive(id)}>
          <span><Icon/></span><b>{label}</b>
        </button>
      )}
      <button className={'zone-chip home'+(active==='home'?' active':'')} onClick={()=>setActive('home')}>
        <span><HomeIcon/></span><b>Home</b>
      </button>
    </nav>

    <div className="world-hint"><RotateCcw/>Drag your view with the places below · tap a building to visit</div>

    {parentOpen&&<div className="parent-menu-backdrop" onClick={()=>setParentOpen(false)}>
      <aside className="parent-world-menu" onClick={e=>e.stopPropagation()}>
        <button className="parent-menu-close" onClick={()=>setParentOpen(false)} aria-label="Close parent menu">×</button>
        <div className="parent-menu-head"><ShieldCheck/><div><span>Grown-ups only</span><h2>Parent space</h2></div></div>
        <p>Kiddo World stays simple for children. Family settings, safety and account controls live here.</p>
        <div className="parent-menu-actions">
          {session
            ? <Link to="/parent"><Settings2/>Parent controls</Link>
            : <Link to="/login"><LogIn/>Parent sign in</Link>}
          {!session&&<Link to="/register"><UserPlus/>Create family account</Link>}
          {session&&<Link to="/dashboard"><HomeIcon/>Family dashboard</Link>}
          <Link to="/for-parents"><Users/>How Kiddo works for parents</Link>
          <Link to="/safety"><ShieldCheck/>Safety & privacy</Link>
        </div>
        <div className="parent-menu-foot">
          <span>English · Afrikaans · isiZulu</span>
          <small>Parent-managed by design</small>
        </div>
      </aside>
    </div>}

    <div className="rotate-phone">
      <div className="rotate-device"><span>★</span></div>
      <h2>Turn your phone sideways</h2>
      <p>Kiddo World is made for adventures in landscape.</p>
    </div>
  </div>;
}
