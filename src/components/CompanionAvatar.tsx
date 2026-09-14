import type { CSSProperties } from 'react';
import type { Emotion } from '../lib/types';

type Props={
  emotion?:Emotion;
  name?:string;
  size?:'sm'|'md'|'lg';
  speaking?:boolean;
  listening?:boolean;
  variant?:string;
  showLabel?:boolean;
};

type Palette={a:string;b:string;accent:string;cheek:string;mark:'star'|'leaf'|'moon'|'bubble'|'pixel'|'sun'};
const palettes:Record<string,Palette>={
  nova:{a:'#8d7af7',b:'#69d7cf',accent:'#fff19f',cheek:'#ffb8d3',mark:'star'},
  sprout:{a:'#74d79b',b:'#bfe883',accent:'#efffb1',cheek:'#ffc7ae',mark:'leaf'},
  comet:{a:'#7297ff',b:'#ffad72',accent:'#ffe49e',cheek:'#ffc2cf',mark:'moon'},
  bubbles:{a:'#f39cd4',b:'#86ddf6',accent:'#fff0fa',cheek:'#ffc0df',mark:'bubble'},
  pixel:{a:'#7d82f9',b:'#bd8af3',accent:'#a8f5dc',cheek:'#ffc1e1',mark:'pixel'},
  lumi:{a:'#ffb372',b:'#ffe07b',accent:'#fff7ba',cheek:'#ffbeb0',mark:'sun'}
};

const eyes:Record<Emotion,'open'|'happy'|'wide'|'wink'|'side'|'sleepy'|'sad'>={
  happy:'happy',excited:'wide',curious:'side',thinking:'side',proud:'happy',calm:'sleepy',
  sad:'sad',worried:'wide',surprised:'wide',playful:'wink',sleepy:'sleepy',idle:'open'
};
const mouths:Record<Emotion,'smile'|'open'|'tiny'|'sad'|'o'>={
  happy:'smile',excited:'open',curious:'tiny',thinking:'tiny',proud:'smile',calm:'smile',
  sad:'sad',worried:'tiny',surprised:'o',playful:'smile',sleepy:'tiny',idle:'smile'
};

function BuddyMark({kind}:{kind:Palette['mark']}){
  if(kind==='leaf')return <path d="M145 62c16-24 42-27 54-8-22 2-37 12-47 34z" fill="var(--buddy-accent)"/>;
  if(kind==='moon')return <path d="M181 58c-12 16-6 34 11 42-26 4-45-15-40-38 3-15 15-27 29-31-4 8-4 18 0 27z" fill="var(--buddy-accent)"/>;
  if(kind==='bubble')return <><circle cx="174" cy="61" r="12" fill="none" stroke="var(--buddy-accent)" strokeWidth="5"/><circle cx="202" cy="44" r="6" fill="var(--buddy-accent)"/></>;
  if(kind==='pixel')return <><rect x="163" y="50" width="17" height="17" rx="4" fill="var(--buddy-accent)"/><rect x="187" y="63" width="10" height="10" rx="3" fill="var(--buddy-accent)"/></>;
  if(kind==='sun')return <><circle cx="177" cy="62" r="12" fill="var(--buddy-accent)"/><path d="M177 39v-10M177 95v-10M154 62h-10M210 62h-10M160 45l-8-8M202 87l-8-8M194 45l8-8M152 87l8-8" stroke="var(--buddy-accent)" strokeWidth="4" strokeLinecap="round"/></>;
  return <path d="M177 41l7 16 17 2-13 11 4 17-15-9-15 9 4-17-13-11 17-2z" fill="var(--buddy-accent)"/>;
}

function Eye({x,kind,mirror=false}:{x:number;kind:string;mirror?:boolean}){
  if(kind==='happy')return <path d={`M${x-14} 126 Q${x} 111 ${x+14} 126`} fill="none" stroke="#fff" strokeWidth="8" strokeLinecap="round"/>;
  if(kind==='sleepy')return <path d={`M${x-13} 126 Q${x} 120 ${x+13} 126`} fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round"/>;
  if(kind==='wink'&&mirror)return <path d={`M${x-13} 126 Q${x} 116 ${x+13} 126`} fill="none" stroke="#fff" strokeWidth="8" strokeLinecap="round"/>;
  if(kind==='sad')return <><ellipse cx={x} cy="127" rx="13" ry="16" fill="#fff"/><circle cx={x} cy="132" r="5" fill="#4c4678"/></>;
  const wide=kind==='wide';
  const side=kind==='side';
  return <><ellipse cx={x} cy="126" rx={wide?15:13} ry={wide?18:16} fill="#fff"/><circle cx={x+(side?(mirror?-5:5):(mirror?-2:2))} cy="129" r="5.5" fill="#4c4678"/><circle cx={x+(mirror?-5:5)} cy="122" r="2.5" fill="#fff"/></>;
}

function Mouth({kind,speaking}:{kind:string;speaking:boolean}){
  if(speaking||kind==='open')return <g className="buddy-mouth"><ellipse cx="128" cy="174" rx="18" ry="14" fill="#5e356d"/><path d="M116 180q12 8 24 0" stroke="#ffadd2" strokeWidth="5" strokeLinecap="round"/></g>;
  if(kind==='sad')return <path className="buddy-mouth" d="M113 181 Q128 166 143 181" fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round"/>;
  if(kind==='o')return <circle className="buddy-mouth" cx="128" cy="174" r="10" fill="#5e356d"/>;
  if(kind==='tiny')return <path className="buddy-mouth" d="M120 174h16" stroke="#fff" strokeWidth="6" strokeLinecap="round"/>;
  return <path className="buddy-mouth" d="M109 167 Q128 187 147 167" fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round"/>;
}

export default function CompanionAvatar({
  emotion='idle',name='Kiddo',size='lg',speaking=false,listening=false,variant='nova',showLabel=true
}:Props){
  const p=palettes[variant]||palettes.nova;
  const px=size==='sm'?88:size==='md'?180:330;
  const state=listening?'listening':speaking?'speaking':emotion==='idle'?'ready':emotion;
  const style={
    '--buddy-a':p.a,'--buddy-b':p.b,'--buddy-accent':p.accent,'--buddy-cheek':p.cheek,width:px
  } as CSSProperties;

  return <div className={`buddy-avatar emotion-${emotion} ${speaking?'is-speaking ':''}${listening?'is-listening ':''}`} style={style} aria-label={name+' is '+state}>
    <div className="buddy-halo"><i/><i/></div>
    <svg viewBox="0 0 256 256" role="img" aria-hidden="true">
      <defs>
        <linearGradient id={'buddy-'+variant} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor={p.a}/><stop offset="1" stopColor={p.b}/>
        </linearGradient>
      </defs>
      <path className="buddy-shadow" d="M71 213c25 22 89 29 117 1-12 25-36 37-61 37-26 0-49-13-56-38z" fill="#1d204022" />
      <path className="buddy-arm buddy-arm-left" d="M57 152c-24 5-31 25-17 36 10 8 26-1 37-19" fill="none" stroke={p.a} strokeWidth="17" strokeLinecap="round"/>
      <path className="buddy-arm buddy-arm-right" d="M199 152c24 5 31 25 17 36-10 8-26-1-37-19" fill="none" stroke={p.b} strokeWidth="17" strokeLinecap="round"/>
      <path className="buddy-body" d="M128 37c62 0 101 43 101 106 0 65-38 105-101 105S27 208 27 143C27 80 66 37 128 37z" fill={'url(#buddy-'+variant+')'}/>
      <path d="M55 96c21-38 113-55 157 1-29-18-56-25-84-25-29 0-51 7-73 24z" fill="#ffffff31"/>
      <BuddyMark kind={p.mark}/>
      <Eye x={93} kind={eyes[emotion]}/><Eye x={163} kind={eyes[emotion]} mirror/>
      <ellipse cx="70" cy="160" rx="15" ry="7" fill="var(--buddy-cheek)" opacity=".58"/>
      <ellipse cx="186" cy="160" rx="15" ry="7" fill="var(--buddy-cheek)" opacity=".58"/>
      <Mouth kind={mouths[emotion]} speaking={speaking}/>
      {emotion==='worried'&&<path d="M190 105q8 10 0 20q-8-10 0-20z" fill="#b9efff"/>}
      {emotion==='excited'&&<g fill="var(--buddy-accent)"><circle cx="52" cy="70" r="5"/><circle cx="213" cy="91" r="4"/><path d="M217 54l4 9 10 1-8 7 3 10-9-5-9 5 3-10-8-7 10-1z"/></g>}
      {emotion==='thinking'&&<g fill="#ffffffcc"><circle cx="205" cy="86" r="6"/><circle cx="220" cy="69" r="9"/><circle cx="239" cy="47" r="12"/></g>}
      {emotion==='sleepy'&&<g fill="#fff"><text x="195" y="86" fontSize="18" fontWeight="800">z</text><text x="216" y="62" fontSize="24" fontWeight="800">z</text></g>}
    </svg>
    <div className="buddy-audio-bars"><i/><i/><i/><i/><i/></div>
    {showLabel&&<div className="buddy-avatar-label"><span/>{name} · {state}</div>}
  </div>;
}
