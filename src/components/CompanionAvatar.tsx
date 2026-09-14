import type { CSSProperties } from 'react';
import type { Emotion } from '../lib/types';

type Props={emotion?:Emotion;name?:string;size?:'sm'|'md'|'lg';speaking?:boolean;listening?:boolean;variant?:string};
type Palette={a:string;b:string;accent:string;cheek:string;mark:'star'|'leaf'|'comet'|'bubble'|'pixel'|'sun'};

const palettes:Record<string,Palette>={
  nova:{a:'#7569ff',b:'#4fd9cf',accent:'#fff0a5',cheek:'#ff9fcf',mark:'star'},
  sprout:{a:'#52d58d',b:'#b8e66d',accent:'#efffb3',cheek:'#ffc1a8',mark:'leaf'},
  comet:{a:'#5d7fff',b:'#ff9a69',accent:'#ffe19b',cheek:'#ffb2c8',mark:'comet'},
  bubbles:{a:'#ef7bc8',b:'#72ddff',accent:'#ffe4f7',cheek:'#ffb2d8',mark:'bubble'},
  pixel:{a:'#596dff',b:'#a97cff',accent:'#9bf1dc',cheek:'#ffb6d9',mark:'pixel'},
  lumi:{a:'#ffa05f',b:'#ffdc6f',accent:'#fff7ba',cheek:'#ffb4a5',mark:'sun'}
};

const mood:Record<Emotion,{eye:'open'|'soft'|'wide'|'wink'|'down';mouth:'smile'|'open'|'small'|'sad'|'o';brow:'up'|'flat'|'down';tilt:number}>={
  happy:{eye:'open',mouth:'smile',brow:'flat',tilt:0},
  excited:{eye:'wide',mouth:'open',brow:'up',tilt:-2},
  curious:{eye:'open',mouth:'small',brow:'up',tilt:3},
  thinking:{eye:'soft',mouth:'small',brow:'down',tilt:2},
  proud:{eye:'soft',mouth:'smile',brow:'up',tilt:-2},
  calm:{eye:'soft',mouth:'smile',brow:'flat',tilt:0},
  sad:{eye:'down',mouth:'sad',brow:'down',tilt:2},
  worried:{eye:'wide',mouth:'sad',brow:'up',tilt:2},
  surprised:{eye:'wide',mouth:'o',brow:'up',tilt:0},
  playful:{eye:'wink',mouth:'smile',brow:'up',tilt:-4},
  sleepy:{eye:'soft',mouth:'small',brow:'flat',tilt:1},
  idle:{eye:'open',mouth:'smile',brow:'flat',tilt:0}
};

function Mark({kind}:{kind:Palette['mark']}){
  if(kind==='leaf')return <path d="M146 53c17-19 34-20 43-6-17 2-28 9-36 24z" fill="var(--avatar-accent)"/>;
  if(kind==='comet')return <><path d="M153 48l24 9-20 14z" fill="var(--avatar-accent)"/><path d="M177 57l25-14" stroke="var(--avatar-accent)" strokeWidth="6" strokeLinecap="round"/></>;
  if(kind==='bubble')return <><circle cx="169" cy="53" r="10" fill="none" stroke="var(--avatar-accent)" strokeWidth="5"/><circle cx="190" cy="42" r="5" fill="var(--avatar-accent)"/></>;
  if(kind==='pixel')return <><rect x="158" y="45" width="14" height="14" rx="3" fill="var(--avatar-accent)"/><rect x="177" y="57" width="9" height="9" rx="2" fill="var(--avatar-accent)"/></>;
  if(kind==='sun')return <><circle cx="169" cy="54" r="9" fill="var(--avatar-accent)"/><path d="M169 36v-9M169 81v-9M151 54h-9M196 54h-9M156 41l-7-7M189 74l-7-7M182 41l7-7M149 74l7-7" stroke="var(--avatar-accent)" strokeWidth="4" strokeLinecap="round"/></>;
  return <path d="M169 38l5 11 12 1-9 8 3 12-11-6-11 6 3-12-9-8 12-1z" fill="var(--avatar-accent)"/>;
}

function Eye({x,type,mirror=false}:{x:number;type:string;mirror?:boolean}){
  if(type==='soft')return <path d={`M${x-13} 113 Q${x} 103 ${x+13} 113`} fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round"/>;
  if(type==='down')return <><ellipse cx={x} cy="115" rx="11" ry="14" fill="#fff"/><circle cx={x+(mirror?-2:2)} cy="120" r="5" fill="#24304f"/></>;
  if(type==='wink'&&mirror)return <path d={`M${x-12} 115 Q${x} 106 ${x+12} 115`} fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round"/>;
  return <><ellipse cx={x} cy="114" rx={type==='wide'?14:12} ry={type==='wide'?17:15} fill="#fff"/><circle cx={x+(mirror?-2:2)} cy="116" r="5" fill="#24304f"/><circle cx={x+(mirror?-5:5)} cy="111" r="2.5" fill="#fff"/></>;
}

function Mouth({type,speaking}:{type:string;speaking:boolean}){
  if(speaking||type==='open')return <g className="mascot-mouth mascot-mouth-open"><ellipse cx="128" cy="156" rx="18" ry="15" fill="#592b5b"/><path d="M116 161q12 9 24 0" stroke="#ff9ecb" strokeWidth="5" strokeLinecap="round"/></g>;
  if(type==='sad')return <path className="mascot-mouth" d="M111 164 Q128 148 145 164" fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round"/>;
  if(type==='o')return <circle className="mascot-mouth" cx="128" cy="157" r="10" fill="#592b5b"/>;
  if(type==='small')return <path className="mascot-mouth" d="M120 157h16" stroke="#fff" strokeWidth="6" strokeLinecap="round"/>;
  return <path className="mascot-mouth" d="M108 151 Q128 173 148 151" fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round"/>;
}

export default function CompanionAvatar({emotion='idle',name='Kiddo',size='lg',speaking=false,listening=false,variant='nova'}:Props){
  const palette=palettes[variant]||palettes.nova;
  const face=mood[emotion]||mood.idle;
  const px=size==='sm'?82:size==='md'?168:320;
  const state=listening?'listening':speaking?'speaking':emotion==='idle'?'ready':emotion;
  const style={'--avatar-a':palette.a,'--avatar-b':palette.b,'--avatar-accent':palette.accent,'--avatar-cheek':palette.cheek,width:px} as CSSProperties;
  return <div className={'kiddo-mascot '+(speaking?'speaking ':'')+(listening?'listening ':'')+'emotion-'+emotion} style={style} aria-label={name+' is '+state}>
    <div className="mascot-aura"><i/><i/></div>
    <svg viewBox="0 0 256 256" role="img" aria-hidden="true" style={{transform:`rotate(${face.tilt}deg)`}}>
      <defs><linearGradient id={'body-'+variant} x1="0" x2="1" y1="0" y2="1"><stop stopColor={palette.a}/><stop offset="1" stopColor={palette.b}/></linearGradient></defs>
      <path className="mascot-arm left" d="M62 145c-26 4-34 22-24 33 9 10 27 2 39-16" fill="none" stroke={palette.a} strokeWidth="18" strokeLinecap="round"/>
      <path className="mascot-arm right" d="M194 145c26 4 34 22 24 33-9 10-27 2-39-16" fill="none" stroke={palette.b} strokeWidth="18" strokeLinecap="round"/>
      <path className="mascot-body" d="M128 35c56 0 89 37 89 92 0 56-30 95-89 95s-89-39-89-95c0-55 33-92 89-92z" fill={'url(#body-'+variant+')'}/>
      <path d="M65 83c19-37 106-54 143 2-23-20-48-27-80-27-24 0-45 7-63 25z" fill="#ffffff22"/>
      <Mark kind={palette.mark}/>
      <path d="M86 91q13-10 26-2" stroke="#ffffffaa" strokeWidth="5" strokeLinecap="round" fill="none" transform={face.brow==='up'?'rotate(-8 99 91)':face.brow==='down'?'rotate(8 99 91)':undefined}/>
      <path d="M144 89q13-10 26 2" stroke="#ffffffaa" strokeWidth="5" strokeLinecap="round" fill="none" transform={face.brow==='up'?'rotate(8 157 91)':face.brow==='down'?'rotate(-8 157 91)':undefined}/>
      <Eye x={99} type={face.eye}/><Eye x={157} type={face.eye} mirror/>
      <ellipse cx="80" cy="144" rx="14" ry="7" fill="var(--avatar-cheek)" opacity=".5"/><ellipse cx="176" cy="144" rx="14" ry="7" fill="var(--avatar-cheek)" opacity=".5"/>
      <Mouth type={face.mouth} speaking={speaking}/>
      <path d="M91 205q37 18 74 0" stroke="#ffffff22" strokeWidth="5" strokeLinecap="round" fill="none"/>
    </svg>
    <div className="mascot-sound"><i/><i/><i/><i/><i/></div>
    <div className="mascot-label"><span/>{name} · {state}</div>
  </div>;
}
