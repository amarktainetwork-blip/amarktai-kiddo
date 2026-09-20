import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent } from 'react';
import { ArrowLeft, BookOpen, Brush, LogIn, LogOut, MessageCircle, Music2, ShieldCheck, Sparkles, UserPlus, Users, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import type { SessionData } from '../lib/types';
import '../world.css';

type Zone='story'|'talk'|'music'|'art';

const zones:Record<Zone,{title:string;copy:string;icon:any;className:string}>={
  story:{title:'Story Treehouse',copy:'A magical place for adventures, bedtime stories and favourite characters.',icon:BookOpen,className:'story'},
  talk:{title:'Talk Cave',copy:'A cosy place to ask questions, tell Kiddo about your day and explore big ideas.',icon:MessageCircle,className:'talk'},
  music:{title:'Music Studio',copy:'A colourful studio for songs, beats and musical adventures made for you.',icon:Music2,className:'music'},
  art:{title:'Art Studio',copy:'A bright creative space where ideas turn into pictures and imaginative worlds.',icon:Brush,className:'art'}
};

export default function Home(){
  const[session,setSession]=useState<SessionData|null>(null);
  const[parentOpen,setParentOpen]=useState(false);
  const[active,setActive]=useState<Zone|null>(null);
  const stageRef=useRef<HTMLDivElement>(null);
  const[tilt,setTilt]=useState({x:0,y:0});

  useEffect(()=>{api.me().then(setSession).catch(()=>{});},[]);

  const greeting=useMemo(()=>{
    if(session?.children?.length)return `Welcome back, ${session.children[0].name}`;
    return 'Explore Kiddo World';
  },[session]);

  const move=(e:PointerEvent<HTMLDivElement>)=>{
    if(!stageRef.current||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const r=stageRef.current.getBoundingClientRect();
    setTilt({x:(e.clientX-r.left)/r.width-.5,y:(e.clientY-r.top)/r.height-.5});
  };

  const reset=()=>setTilt({x:0,y:0});
  const logout=async()=>{
    await api.logout().catch(()=>{});
    setSession(null);
    setParentOpen(false);
  };

  return <main className="premium-world">
    <div
      ref={stageRef}
      className={active?`premium-stage focus-${active}`:'premium-stage'}
      onPointerMove={move}
      onPointerLeave={reset}
      style={{'--px':tilt.x,'--py':tilt.y} as CSSProperties}
    >
      <img className="premium-world-art" src="/world/kiddo-world-premium.webp" alt="Kiddo World with a story treehouse, talk cave, music studio and art studio on magical floating islands"/>
      <div className="premium-sunwash"/>
      <div className="premium-cloud-haze haze-one"/>
      <div className="premium-cloud-haze haze-two"/>
      <div className="premium-sparkles" aria-hidden="true">{Array.from({length:18},(_,i)=><i key={i}/>)}</div>

      <button className="world-parent-button" onClick={()=>setParentOpen(true)}>
        <Users/><span>For parents</span>
      </button>

      {(Object.keys(zones) as Zone[]).map(id=>{
        const z=zones[id]; const Icon=z.icon;
        return <button
          key={id}
          className={`world-hotspot hotspot-${id}`}
          onClick={()=>setActive(id)}
          aria-label={`Explore ${z.title}`}
        >
          <span className="hotspot-ring"/>
          <span className="hotspot-label"><Icon/><b>{z.title}</b></span>
        </button>;
      })}

      <div className="world-greeting"><Sparkles/><span>{greeting}</span></div>

      {active&&<section className={`zone-focus-card ${zones[active].className}`}>
        <button className="zone-back" onClick={()=>setActive(null)}><ArrowLeft/>Back to world</button>
        <div className="zone-focus-icon">{(() => {const Icon=zones[active].icon; return <Icon/>;})()}</div>
        <span className="zone-eyebrow">Explore Kiddo World</span>
        <h2>{zones[active].title}</h2>
        <p>{zones[active].copy}</p>
        <small>We’re perfecting the world first. Kiddo’s animated companion and the new child experience are the next phases.</small>
      </section>}

      {parentOpen&&<div className="parent-world-backdrop" onClick={()=>setParentOpen(false)}>
        <aside className="parent-world-panel" onClick={e=>e.stopPropagation()}>
          <button className="parent-close" onClick={()=>setParentOpen(false)} aria-label="Close"><X/></button>
          <div className="parent-panel-icon"><ShieldCheck/></div>
          <span className="parent-eyebrow">Grown-ups only</span>
          <h2>Parent space</h2>
          <p>Parents manage the family account, safety settings and child profiles. Children stay inside Kiddo World.</p>
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
            <span>Parent controls and the new family dashboard arrive in Phase 3.</span>
          </div>
        </aside>
      </div>}
    </div>

    <div className="rotate-world">
      <div className="rotate-phone-icon"><span>★</span></div>
      <h1>Turn your phone sideways</h1>
      <p>Kiddo World is an adventure made for landscape.</p>
    </div>
  </main>;
}
