import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, Brush, LogIn, LogOut, MessageCircle, Music2, ShieldCheck, Sparkles, UserPlus, Users, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import KiddoWorld, { type WorldZone } from '../components/KiddoWorld';
import { api } from '../lib/api';
import type { SessionData } from '../lib/types';
import '../world.css';

type ZoneInfo={title:string;short:string;copy:string;icon:any;className:string};

const zones:Record<Exclude<WorldZone,'home'>,ZoneInfo>={
  story:{title:'Story Treehouse',short:'Story',copy:'Climb into a warm treehouse made for adventures, bedtime stories and favourite characters.',icon:BookOpen,className:'story'},
  talk:{title:'Talk Cave',short:'Talk',copy:'A cosy sunset cave for questions, ideas and talking about your day.',icon:MessageCircle,className:'talk'},
  music:{title:'Music Studio',short:'Music',copy:'A bright studio for songs, beats and musical adventures.',icon:Music2,className:'music'},
  art:{title:'Art Studio',short:'Art',copy:'A colourful creative island where ideas become pictures and worlds.',icon:Brush,className:'art'}
};

export default function Home(){
  const[session,setSession]=useState<SessionData|null>(null);
  const[parentOpen,setParentOpen]=useState(false);
  const[active,setActive]=useState<WorldZone>('home');
  const[quality,setQuality]=useState<'low'|'high'>('high');

  useEffect(()=>{
    api.me().then(setSession).catch(()=>{});
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const narrow=window.matchMedia('(max-width: 900px)').matches;
    if(reduced||narrow)setQuality('low');
  },[]);

  const greeting=useMemo(()=>{
    if(session?.children?.length)return `Welcome back, ${session.children[0].name}`;
    return 'Explore Kiddo World';
  },[session]);

  const logout=async()=>{
    await api.logout().catch(()=>{});
    setSession(null);
    setParentOpen(false);
  };

  const activeInfo=active==='home'?null:zones[active];

  return <main className="world-shell">
    <div className="world-scene">
      <KiddoWorld active={active} onSelect={setActive} quality={quality}/>
      <div className="world-vignette" aria-hidden="true"/>
      <div className="world-sky-glow" aria-hidden="true"/>
    </div>

    <header className="world-header">
      <div className="world-logo" aria-label="Kiddo">
        <span className="world-logo-word">Kid<span>d</span>o</span>
        <small>What shall we make today?</small>
      </div>
      <button className="world-parent-button" onClick={()=>setParentOpen(true)}>
        <Users/><span>For parents</span>
      </button>
    </header>

    <div className="world-greeting"><Sparkles/><span>{greeting}</span></div>

    {activeInfo&&<section className={`world-zone-card ${activeInfo.className}`}>
      <button className="world-zone-back" onClick={()=>setActive('home')}><ArrowLeft/>World</button>
      <span className="world-zone-kicker">You found</span>
      <h2>{activeInfo.title}</h2>
      <p>{activeInfo.copy}</p>
      <div className="world-zone-status"><Sparkles/>Explore the world now · Kiddo joins next</div>
    </section>}

    <nav className="world-dock" aria-label="Explore Kiddo World">
      {(Object.keys(zones) as Array<Exclude<WorldZone,'home'>>).map(id=>{
        const z=zones[id]; const Icon=z.icon;
        return <button key={id} className={`world-dock-item ${z.className} ${active===id?'active':''}`} onClick={()=>setActive(id)}>
          <span><Icon/></span><b>{z.short}</b>
        </button>;
      })}
      <button className={`world-dock-item home ${active==='home'?'active':''}`} onClick={()=>setActive('home')}>
        <span><Sparkles/></span><b>Home</b>
      </button>
    </nav>

    <div className="world-hint">Move around the world · tap a place to fly closer</div>

    {parentOpen&&<div className="parent-world-backdrop" onClick={()=>setParentOpen(false)}>
      <aside className="parent-world-panel" onClick={e=>e.stopPropagation()}>
        <button className="parent-close" onClick={()=>setParentOpen(false)} aria-label="Close"><X/></button>
        <div className="parent-panel-icon"><ShieldCheck/></div>
        <span className="parent-eyebrow">Grown-ups only</span>
        <h2>Parent space</h2>
        <p>Parents manage the family account and safety settings. Children stay inside Kiddo World.</p>
        <div className="parent-panel-actions">
          {session
            ? <>
                <div className="parent-signed-in"><ShieldCheck/><span><small>Signed in as</small><b>{session.user.email}</b></span></div>
                <button type="button" onClick={logout}><LogOut/>Sign out</button>
              </>
            : <>
                <Link to="/login"><LogIn/>Parent sign in</Link>
                <Link to="/register"><UserPlus/>Create family account</Link>
              </>}
        </div>
        <div className="parent-panel-foot">
          <b>English · Afrikaans · isiZulu</b>
          <span>Parent-managed by design</span>
        </div>
      </aside>
    </div>}

    <div className="rotate-world">
      <div className="rotate-phone-icon"><span>★</span></div>
      <h1>Turn your phone sideways</h1>
      <p>Kiddo World is made to explore in landscape.</p>
    </div>
  </main>;
}
